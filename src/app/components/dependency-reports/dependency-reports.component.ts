import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { RequirementService, Requirement } from '../../services/requirement.service';

@Component({
  selector: 'app-dependency-reports',
  standalone: true,
  imports: [CommonModule],
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
  selectedReminderDate: Date | null = null;
  calendarDays: { day: number, month: number, year: number, isCurrentMonth: boolean, isSelected: boolean, isToday: boolean }[] = [];
  dayLabels = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];

  constructor(
    private sanitizer: DomSanitizer,
    private requirementService: RequirementService // Asegurarse de que RequirementService está inyectado
  ) {}

  ngOnInit() {
    this.loadRequirements(this.selectedTab);
    // Inicializar el calendario al mes actual por si se abre directamente
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
      next: (response: any) => { // Change type to any to access data property
        this.currentRequirements = response.data; // Assign the data array
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
    if (videoUrl) {
      this.currentVideoUrl = videoUrl;
      this.isVideModalVisible = true;
    } else {
      console.warn('No video URL provided for annotations.');
    }
  }

  closeVideoModal() {
    this.isVideModalVisible = false;
    this.currentVideoUrl = '';
  }

  // Métodos para el modal de Calendario
  openCalendarModal(requirement: any) {
    this.currentRequirementForReminder = requirement;
    this.calendarViewDate = new Date(); // Siempre abrir en el mes actual
    this.selectedReminderDate = null; // Limpiar selección previa
    this.generateCalendarDays(this.calendarViewDate);
    this.isCalendarModalVisible = true;
  }

  closeCalendarModal() {
    this.isCalendarModalVisible = false;
    this.currentRequirementForReminder = null;
    this.selectedReminderDate = null;
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
      const isSelected = this.selectedReminderDate ?
        (this.selectedReminderDate.getFullYear() === year &&
         this.selectedReminderDate.getMonth() === month &&
         this.selectedReminderDate.getDate() === day) : false;
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
    if (!dayObj.isCurrentMonth) return; // No permitir seleccionar días de otros meses por ahora

    this.selectedReminderDate = new Date(dayObj.year, dayObj.month, dayObj.day);
    // Regenerar días para reflejar la selección
    this.generateCalendarDays(this.calendarViewDate);
  }

  saveReminder() {
    if (this.selectedReminderDate && this.currentRequirementForReminder) {
      console.log('Recordatorio guardado para:', this.currentRequirementForReminder.title);
      console.log('Fecha seleccionada:', this.selectedReminderDate.toLocaleDateString());
      // Aquí iría la lógica para guardar el recordatorio (e.g., enviar a un backend)
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


}
