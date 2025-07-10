import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { RequirementService, Requirement } from '../../services/requirement.service';
import { FormsModule } from '@angular/forms';
import { AuditLogService } from '../../services/audit-log.service';

@Component({
  selector: 'app-dependency-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dependency-reports.component.html',
  styleUrl: './dependency-reports.component.scss'
})
export class DependencyReportsComponent implements OnInit {
  selectedTab: string = 'PCIVIL';
  currentRequirements: any[] = [];

  isVideModalVisible: boolean = false;
  currentVideoUrl: string = '';

  // Propiedades para el modal de calendario
  isCalendarModalVisible: boolean = false;
  currentRequirementForReminder: any = null;
  calendarViewDate: Date = new Date();
  selectedReminderDates: Date[] = [];
  calendarDays: { day: number, month: number, year: number, isCurrentMonth: boolean, isSelected: boolean, isToday: boolean }[] = [];
  dayLabels = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];

  // Variables para el modal de respaldo
  isRespaldoModalVisible = false;
  respaldoNota: string = '';
  respaldoArchivo: File | null = null;
  currentRequirementForRespaldo: any = null;
  isRespaldoSaving = false;
  respaldoErrorMsg: string = '';
  respaldoSuccessMsg: string = '';

  isRespaldoViewModalVisible = false;
  respaldoViewData: { url: string, nota: string } | null = null;

  constructor(
    private sanitizer: DomSanitizer,
    private requirementService: RequirementService,
    private auditLogService: AuditLogService
  ) {}

  ngOnInit() {
    this.loadRequirements(this.selectedTab);
    this.generateCalendarDays(this.calendarViewDate);
  }

  get safeVideoUrl(): SafeResourceUrl | null { // Getter para la URL segura del video
    if (!this.currentVideoUrl) {
      return null;
    }
    return this.sanitizer.bypassSecurityTrustResourceUrl(this.currentVideoUrl);
  }

  selectTab(tab: string) {
    this.selectedTab = tab;
    this.loadRequirements(tab);
  }

  loadRequirements(dependency: string) {
    // Modificar para usar el servicio que interactúa con el backend
    this.requirementService.getRequirements(dependency).subscribe({
      next: (response: any) => {
        this.currentRequirements = response.data;
        console.log(`Requerimientos cargados para ${dependency}:`, this.currentRequirements); // Log the array
      },
      error: (error) => {
        console.error('Error cargando requerimientos desde el backend:', error);
      }
    });
  }

  // Nuevo método para actualizar el estado 'completed'
  updateRequirementStatus(requirement: Requirement, event: any) {
    const newStatus = event.target.checked;
    console.log(`Actualizando requerimiento ${requirement.id} a completed: ${newStatus}`);

    this.requirementService.updateRequirement(requirement.id, { completed: newStatus }).subscribe({
      next: (updatedRequirement) => {
        console.log('Requerimiento actualizado con éxito:', updatedRequirement);
        const index = this.currentRequirements.findIndex(req => req.id === updatedRequirement.id);
        if (index !== -1) {
          this.currentRequirements[index].completed = updatedRequirement.completed;
        }
        // REGISTRO DE AUDITORÍA
        this.registrarLogDeDependencia(requirement, newStatus);
      },
      error: (error) => {
        console.error('Error al actualizar el requerimiento:', error);
        // Revertir el estado del checkbox en caso de error
        event.target.checked = !newStatus;
        alert('Error al actualizar el estado del requerimiento.');
      }
    });
  }

  openVideoModal(videoUrl?: string) {
    if (this.hasValidVideoUrl(videoUrl)) {
      this.currentVideoUrl = videoUrl!;
      this.isVideModalVisible = true;
    } else {
      console.warn('No se proporcionó una URL de video válida para las anotaciones.');
    }
  }

  closeVideoModal() {
    this.isVideModalVisible = false;
    this.currentVideoUrl = '';
  }

  // Métodos para el modal de Calendario
  openCalendarModal(requirement: any) {
    this.currentRequirementForReminder = requirement;
    this.calendarViewDate = new Date();

    // Cargar todas las fechas guardadas
    if (Array.isArray(requirement.reminderDates)) {
      this.selectedReminderDates = requirement.reminderDates.map((dateStr: string) => new Date(dateStr));
    } else {
      this.selectedReminderDates = [];
    }

    this.generateCalendarDays(this.calendarViewDate);
    this.isCalendarModalVisible = true;
  }

  closeCalendarModal() {
    this.isCalendarModalVisible = false;
    this.currentRequirementForReminder = null;
    this.selectedReminderDates = [];
  }

  generateCalendarDays(date: Date) {
    this.calendarDays = [];
    const year = date.getFullYear();
    const month = date.getMonth(); // 0-indexed

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalizar para comparación

    // Días del mes anterior para completar la primera semana
    let startingDayOfWeek = firstDayOfMonth.getDay(); // 0 (Dom) - 6 (Sab)
    startingDayOfWeek = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1; // Ajustar para que Lunes sea 0

    const prevMonthLastDay = new Date(year, month, 0);
    for (let i = startingDayOfWeek -1 ; i >= 0; i--) {
      const day = prevMonthLastDay.getDate() - i;
      this.calendarDays.push({
        day: day,
        month: month -1 < 0 ? 11 : month -1,
        year: month -1 < 0 ? year -1 : year,
        isCurrentMonth: false,
        isSelected: false,
        isToday: false
      });
    }

    // Días del mes actual
    for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
      const currentDate = new Date(year, month, day);
      const isSelected = this.selectedReminderDates.some(
        d => d.getFullYear() === year &&
             d.getMonth() === month &&
             d.getDate() === day
      );
      const isTodayFlag = currentDate.getTime() === today.getTime();

      this.calendarDays.push({ day, month, year, isCurrentMonth: true, isSelected, isToday: isTodayFlag });
    }

    // Días del mes siguiente para completar la última semana
    const lastDayOfWeek = lastDayOfMonth.getDay(); // 0 (Dom) - 6 (Sab)
    const daysToAdd = (7 - (this.calendarDays.length % 7)) % 7;

    for (let i = 1; i <= daysToAdd; i++) {
      this.calendarDays.push({
        day: i,
        month: month + 1 > 11 ? 0 : month + 1,
        year: month + 1 > 11 ? year + 1 : year,
        isCurrentMonth: false,
        isSelected: false,
        isToday: false
      });
    }
  }

  previousMonth() {
    this.calendarViewDate.setMonth(this.calendarViewDate.getMonth() - 1);
    this.generateCalendarDays(this.calendarViewDate);
  }

  nextMonth() {
    this.calendarViewDate.setMonth(this.calendarViewDate.getMonth() + 1);
    this.generateCalendarDays(this.calendarViewDate);
  }

  selectDate(dayObj: { day: number, month: number, year: number, isCurrentMonth: boolean }) {
    if (!dayObj.isCurrentMonth) return;

    const date = new Date(dayObj.year, dayObj.month, dayObj.day);
    const index = this.selectedReminderDates.findIndex(
      d => d.getFullYear() === date.getFullYear() &&
           d.getMonth() === date.getMonth() &&
           d.getDate() === date.getDate()
    );
    if (index === -1) {
      this.selectedReminderDates.push(date);
    } else {
      this.selectedReminderDates.splice(index, 1); // Quitar si ya estaba seleccionada
    }
    this.generateCalendarDays(this.calendarViewDate);
  }

  saveReminder() {
    if (this.selectedReminderDates.length && this.currentRequirementForReminder) {
      const reminderDatesISO = this.selectedReminderDates.map(date =>
        date.toISOString().split('T')[0]
      );
      // Guarda el requerimiento en una variable temporal
      const req = this.currentRequirementForReminder;
      this.requirementService.updateRequirement(req.id, {
        reminderDates: reminderDatesISO
      }).subscribe({
        next: (updatedRequirement) => {
          console.log('Requerimiento actualizado con recordatorio:', updatedRequirement);
          // Opcional: Actualizar el requerimiento en la lista local si es necesario
          const index = this.currentRequirements.findIndex(req => req.id === updatedRequirement.id);
          if (index !== -1) {
            this.currentRequirements[index].reminderDates = updatedRequirement.reminderDates;
          }
          alert('Recordatorio guardado con éxito.');
          // REGISTRO DE AUDITORÍA
          this.registrarLogDeDependenciaRecordatorio(req, reminderDatesISO);
        },
        error: (error) => {
          console.error('Error al guardar el recordatorio:', error);
          alert('Error al guardar el recordatorio.');
        }
      });
    } else {
      console.warn('No se ha seleccionado una fecha o requerimiento.');
    }
    this.closeCalendarModal();
  }

  getMonthYearDisplay(date: Date): string {
    return date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  }

  getDependencyFullName(tabKey: string): string {
    const names: { [key: string]: string } = {
      PCIVIL: 'PROTECCIÓN CIVIL',
      ASEA: 'ASEA',
      STPS: 'SECRETARIA DEL TRABAJO Y PREVISIÓN SOCIAL',
      PROFECO: 'PROFECO',
      CNE: 'COMISION NACIONAL DE ENERGIA',
      SENER: 'Secretaría de Energía',
      PEMEX: 'PEMEX-COMERCIALIZADORA',
      'SIN-MUN': 'SINATEC - SEMARNAT / MUNICIPALES',
      SAT: 'SAT'
    };
    return names[tabKey] || tabKey;
  }

  // Método helper para verificar si un videoUrl es válido
  hasValidVideoUrl(videoUrl: string | null | undefined): boolean {
    return videoUrl !== null && videoUrl !== undefined && videoUrl.trim() !== '';
  }

  setFallback(event: Event, fallbackUrl: string) {
    const img = event.target as HTMLImageElement | null;
    if (img) {
      img.src = fallbackUrl;
    }
  }

  get providersForCurrentDependency(): { name: string, color: string }[] {
    // Extrae proveedores únicos de los requerimientos actuales
    const map = new Map<string, string>();
    for (const req of this.currentRequirements) {
      if (req.provider && req.providerColor) {
        map.set(req.provider, req.providerColor);
      }
    }
    return Array.from(map.entries()).map(([name, color]) => ({ name, color }));
  }

  filterByProvider(providerName: string) {
    // Aquí podrías filtrar los requerimientos por proveedor si lo deseas
    console.log('Filtrar por proveedor:', providerName);
    // Si quieres implementar el filtrado real, házmelo saber
  }

  openRespaldoModal(requirement: any) {
    this.currentRequirementForRespaldo = requirement;
    this.respaldoNota = '';
    this.respaldoArchivo = null;
    this.isRespaldoModalVisible = true;
  }

  closeRespaldoModal() {
    this.isRespaldoModalVisible = false;
    this.currentRequirementForRespaldo = null;
    this.respaldoNota = '';
    this.respaldoArchivo = null;
  }

  onRespaldoFileChange(event: any) {
    const file = event.target.files && event.target.files[0];
    this.respaldoArchivo = file || null;
  }

  guardarRespaldo() {
    if (!this.currentRequirementForRespaldo) return;
    this.respaldoErrorMsg = '';
    this.respaldoSuccessMsg = '';
    // Permitir nota sola, archivo solo, o ambos
    if (!this.respaldoArchivo && !this.respaldoNota.trim()) {
      this.respaldoErrorMsg = 'Debes ingresar una nota, seleccionar un archivo, o ambos.';
      return;
    }
    this.isRespaldoSaving = true;
    this.requirementService.uploadRespaldo(
      this.currentRequirementForRespaldo.id,
      this.respaldoArchivo,
      this.respaldoNota
    ).subscribe({
      next: (response) => {
        this.respaldoSuccessMsg = 'Respaldo guardado con éxito.';
        // Actualizar el requerimiento en la lista local si es necesario
        const index = this.currentRequirements.findIndex(req => req.id === this.currentRequirementForRespaldo.id);
        if (index !== -1) {
          this.currentRequirements[index].respaldo = response.respaldo;
        }
        // Limpiar campos
        this.respaldoNota = '';
        this.respaldoArchivo = null;
        setTimeout(() => {
          this.respaldoSuccessMsg = '';
          this.closeRespaldoModal();
        }, 1200);
        // REGISTRO DE AUDITORÍA
        this.registrarLogDeDependenciaRespaldo(this.currentRequirementForRespaldo, this.respaldoNota, !!this.respaldoArchivo);
      },
      error: (error) => {
        console.error('Error al guardar el respaldo:', error);
        this.respaldoErrorMsg = 'Error al guardar el respaldo. Intenta de nuevo.';
      },
      complete: () => {
        this.isRespaldoSaving = false;
      }
    });
  }

  openRespaldoViewModal(requirement: any) {
    // Asegurarse de que respaldo esté parseado
    let respaldo = requirement.respaldo;
    if (typeof respaldo === 'string') {
      try {
        respaldo = JSON.parse(respaldo);
      } catch {
        respaldo = null;
      }
    }
    // Cambia la condición: abre el modal si hay nota o url
    if ((respaldo && typeof respaldo === 'object') && (respaldo.url || respaldo.nota)) {
      this.respaldoViewData = respaldo;
      this.isRespaldoViewModalVisible = true;
    } else {
      this.respaldoViewData = null;
      this.isRespaldoViewModalVisible = false;
    }
  }

  closeRespaldoViewModal() {
    this.isRespaldoViewModalVisible = false;
    this.respaldoViewData = null;
  }

  getRespaldoObj(respaldo: any): { url?: string, nota?: string } {
    if (!respaldo) return {};
    if (typeof respaldo === 'string') {
      try {
        return JSON.parse(respaldo);
      } catch {
        return {};
      }
    }
    return respaldo;
  }

  hasRespaldoContent(respaldo: any): boolean {
    const obj = this.getRespaldoObj(respaldo);
    const url = obj.url && typeof obj.url === 'string' ? obj.url.trim() : '';
    const nota = obj.nota && typeof obj.nota === 'string' ? obj.nota.trim() : '';
    return !!(url || nota);
  }

  openProviderUrl(url: string) {
    window.open(url, '_blank');
  }

  private registrarLogDeDependencia(requirement: any, nuevoEstado: boolean) {
    let user = { id: '', name: '', role: '' };
    try {
      const userData = localStorage.getItem('currentUser');
      if (userData) {
        const parsed = JSON.parse(userData);
        user = {
          id: parsed.id || '',
          name: parsed.username || '',
          role: parsed.role || ''
        };
      }
    } catch {}
    const log = {
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      timestamp: new Date().toISOString(),
      action: 'update_requirement_status_Dependency',
      scheduleId: requirement.id || 'DEPENDENCY', // <-- nunca vacío
      activities: [
        {
          id: requirement.id,
          name: requirement.title,
          status: nuevoEstado ? 'completed' : 'not_completed'
        }
      ]
    };
    console.log('[AUDIT] Enviando log de dependencia:', log);
    this.auditLogService.createAuditLog(log).subscribe({
      next: log => console.log('[AUDIT] Respuesta backend:', log),
      error: err => console.error('[AUDIT] Error al registrar auditoría en backend:', err)
    });
  }

  private registrarLogDeDependenciaRespaldo(requirement: any, nota: string, archivoAdjunto: boolean) {
    let user = { id: '', name: '', role: '' };
    try {
      const userData = localStorage.getItem('currentUser');
      if (userData) {
        const parsed = JSON.parse(userData);
        user = {
          id: parsed.id || '',
          name: parsed.username || '',
          role: parsed.role || ''
        };
      }
    } catch {}
    const log = {
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      timestamp: new Date().toISOString(),
      action: 'upload_respaldo_Dependency',
      scheduleId: requirement.id || 'DEPENDENCY', // <-- nunca vacío
      activities: [
        {
          id: requirement.id,
          name: requirement.title,
          status: `nota: ${nota ? 'sí' : 'no'}, archivo: ${archivoAdjunto ? 'sí' : 'no'}`
        }
      ]
    };
    console.log('[AUDIT] Enviando log de respaldo:', log);
    this.auditLogService.createAuditLog(log).subscribe({
      next: log => console.log('[AUDIT] Respuesta backend:', log),
      error: err => console.error('[AUDIT] Error al registrar auditoría de respaldo:', err)
    });
  }

  private registrarLogDeDependenciaRecordatorio(requirement: any, fechas: string[]) {
    let user = { id: '', name: '', role: '' };
    try {
      const userData = localStorage.getItem('currentUser');
      if (userData) {
        const parsed = JSON.parse(userData);
        user = {
          id: parsed.id || '',
          name: parsed.username || '',
          role: parsed.role || ''
        };
      }
    } catch {}
    const log = {
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      timestamp: new Date().toISOString(),
      action: 'update_reminder_dates_Dependency',
      scheduleId: requirement.id || 'DEPENDENCY', // <-- nunca vacío
      activities: [
        {
          id: requirement.id,
          name: requirement.title,
          status: `fechas: ${fechas.join(', ')}`
        }
      ]
    };
    console.log('[AUDIT] Enviando log de recordatorio:', log);
    this.auditLogService.createAuditLog(log).subscribe({
      next: log => console.log('[AUDIT] Respuesta backend:', log),
      error: err => console.error('[AUDIT] Error al registrar auditoría de recordatorio:', err)
    });
  }

}
