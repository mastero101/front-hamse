import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { ActivityService, Activity, PaginatedActivitiesResponse } from '../../services/activity.service';
import { ScheduleService, Schedule, ActivityStatusPayload } from '../../services/schedule.service';
import { SettingsService } from '../../services/settings.service';
import { AuditLogService, AuditLog } from '../../services/audit-log.service';

type ActivityStatus = 'sin_revision' | 'verificado' | 'no_aplica';
interface CalendarActivity extends Activity { status: ActivityStatus; }
interface BackendActivity extends Activity { Statuses?: { state: string }[]; }
interface DetailedSchedule extends Schedule { Activities: BackendActivity[]; }
interface CalendarDay {
  date: Date;
  dayOfMonth: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
}

@Component({
  selector: 'app-maintenance-calendar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './maintenance-calendar.component.html',
  styleUrl: './maintenance-calendar.component.scss'
})
export class MaintenanceCalendarComponent implements OnInit {
  completionPercentage = 0;
  currentView: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'daily';
  selectedDate = new Date();
  currentMonth = this.selectedDate.toLocaleDateString('es-ES', { month: 'long' });
  currentYear = this.selectedDate.getFullYear();
  currentWeekStart = new Date();
  currentWeekEnd = new Date();
  currentMonthName = this.currentMonth;

  calendarDays: CalendarDay[] = [];
  weekDays: Date[] = [];
  activities: CalendarActivity[] = [];
  allActivities: CalendarActivity[] = [];
  months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ].map(name => ({ name, completed: false }));

  currentScheduleId: string | null = null;
  isLoadingActivities = false;
  isLoadingSchedule = false;
  private currentScheduleHasActivities = false;

  // Propiedad para controlar la visibilidad del modal de selección de periodo
  showPeriodModal = false;

  // Referencia al input de fecha en el modal
  @ViewChild('selectedDateInput') selectedDateInput!: ElementRef;

  // --- Imagen de recordatorio ---
  reminderImageUrl: string = '../../../assets/images/ASEA1_Actividad.png';
  isAdmin: boolean = false;
  editingReminderImage: boolean = false;
  loadingReminderImage: boolean = false;
  reminderImageError: string = '';

  constructor(
    private activityService: ActivityService,
    private scheduleService: ScheduleService,
    private settingsService: SettingsService,
    private auditLogService: AuditLogService
  ) {}

  ngOnInit() {
    if (!this.isAuthenticated()) return;
    this.checkAdminStatus();
    this.loadReminderImage();
    this.initCalendar();
  }

  private initCalendar() {
    this.setCurrentWeek(this.selectedDate);
    this.generateCalendarDays(this.currentYear, this.selectedDate.getMonth());
    this.loadBaseActivities()
      .then(() => this.loadScheduleForDate(this.selectedDate))
      .catch(console.error);
  }

  private isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }

  private getCurrentUserId(): string {
    try {
      const data = localStorage.getItem('currentUser');
      return data ? JSON.parse(data).id || '' : '';
    } catch {
      return '';
    }
  }

  private setCurrentWeek(refDate: Date) {
    const offset = (refDate.getDay() || 7) - 1;
    this.currentWeekStart = new Date(refDate);
    this.currentWeekStart.setDate(refDate.getDate() - offset);
    this.currentWeekStart.setHours(0, 0, 0, 0);

    this.currentWeekEnd = new Date(this.currentWeekStart);
    this.currentWeekEnd.setDate(this.currentWeekStart.getDate() + 6);
    this.setWeekDays();
  }

  private setWeekDays() {
    this.weekDays = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(this.currentWeekStart);
      date.setDate(this.currentWeekStart.getDate() + i);
      return date;
    });
  }

  previousWeek() {
    this.selectedDate = new Date(this.currentWeekStart);
    this.selectedDate.setDate(this.selectedDate.getDate() - 7);
    this.setCurrentWeek(this.selectedDate);
    this.loadScheduleForDate(this.currentWeekStart);
  }

  nextWeek() {
    this.selectedDate = new Date(this.currentWeekStart);
    this.selectedDate.setDate(this.selectedDate.getDate() + 7);
    this.setCurrentWeek(this.selectedDate);
    this.loadScheduleForDate(this.currentWeekStart);
  }

  changeView(view: typeof this.currentView) {
    this.currentView = view;
    if (view === 'weekly') this.setCurrentWeek(this.selectedDate);
    if (view === 'monthly') this.generateCalendarDays(this.currentYear, this.selectedDate.getMonth());
    this.filterActivitiesByFrequency(view);
    this.loadScheduleForDate(this.selectedDate);
  }

  private filterActivitiesByFrequency(frequency: typeof this.currentView) {
    this.activities = this.allActivities.filter(activity => {
      if (frequency === 'daily') return activity.frequency === 'daily';
      if (frequency === 'weekly') return activity.frequency === 'weekly';
      if (frequency === 'monthly') return activity.frequency === 'monthly';
      if (frequency === 'yearly') return activity.frequency === 'yearly';
      return true;
    });
    console.log('Actividades después del filtro:', this.activities);
  }

  async loadBaseActivities(): Promise<void> {
    this.isLoadingActivities = true;
    try {
      let allActivities: any[] = [];
      let currentPage = 1;
      let hasMorePages = true;

      while (hasMorePages) {
        const response = await firstValueFrom(this.activityService.getActivities(currentPage, 20, 'calendar'));
        console.log(`Cargando página ${currentPage}:`, response);
        
        if (response?.data) {
          allActivities = [...allActivities, ...response.data];
        }
        
        hasMorePages = currentPage < response.totalPages;
        currentPage++;
      }

      console.log('Total de actividades cargadas:', allActivities.length);
      this.allActivities = allActivities.map(a => ({ ...a, status: 'sin_revision' }));
      this.filterActivitiesByFrequency(this.currentView);
    } catch (error) {
      console.error('Error al cargar actividades:', error);
    } finally {
      this.isLoadingActivities = false;
    }
  }

  loadScheduleForDate(date: Date) {
    this.isLoadingSchedule = true;
    this.selectedDate = date;
    this.scheduleService.getSchedules().subscribe({
      next: schedules => {
        const match = schedules.find(s =>
          s.type === this.currentView &&
          new Date(s.startDate) <= date && new Date(s.endDate) >= date
        );
        if (match) {
          this.loadSchedule(match.id);
        } else {
          this.resetAllActivitiesStatus();
          this.createSchedule(date);
        }
      },
      error: err => {
        console.error('Error al obtener schedules:', err);
        this.resetState();
      }
    });
  }

  private createSchedule(date: Date) {
    let startDate = new Date(date);
    let endDate = new Date(date);
    let type: 'daily' | 'weekly' | 'monthly' | 'yearly' = this.currentView as any;

    if (this.currentView === 'weekly') {
      const dayOfWeek = startDate.getDay() === 0 ? 6 : startDate.getDay() - 1;
      startDate.setDate(startDate.getDate() - dayOfWeek);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
    } else if (this.currentView === 'monthly') {
      startDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
      endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
    } else if (this.currentView === 'yearly') {
      startDate = new Date(startDate.getFullYear(), 0, 1);
      endDate = new Date(startDate.getFullYear(), 11, 31);
    }
    // Para daily, startDate y endDate ya son el mismo día

    const filteredActivities = this.allActivities.filter(activity => {
      if (type === 'weekly') return activity.frequency === 'weekly';
      if (type === 'monthly') return activity.frequency === 'monthly';
      if (type === 'daily') return activity.frequency === 'daily';
      if (type === 'yearly') return activity.frequency === 'yearly';
      return true;
    });

    console.log('Creando schedule con actividades filtradas:', {
      type,
      totalActivities: this.allActivities.length,
      filteredActivities: filteredActivities.length,
      activities: filteredActivities.map(a => ({ id: a.id, name: a.name, frequency: a.frequency }))
    });

    const payload = {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      type,
      status: 'in_progress' as const,
      assignedTo: this.getCurrentUserId(),
      activities: filteredActivities.map(a => ({
        id: a.id,
        name: a.name,
        description: a.description,
        category: a.category,
        area: a.area,
        frequency: a.frequency,
        expectedDuration: a.expectedDuration,
        priority: a.priority,
        Statuses: [{ state: 'pending' }]
      }))
    };

    this.scheduleService.createSchedule(payload).subscribe({
      next: s => {
        console.log('Schedule creado exitosamente:', s);
        this.loadSchedule(s.id, true);
      },
      error: (err) => {
        console.error('Error al crear schedule:', err);
        this.resetState();
      }
    });
  }

  private loadSchedule(id: string, forceReset: boolean = false) {
    this.currentScheduleId = id;
    this.scheduleService.getSchedule(id).subscribe({
      next: (d: any) => {
        console.log('Schedule cargado:', d);
        if ('Activities' in d) {
          const detailed = d as DetailedSchedule;
          this.completionPercentage = detailed.progress || 0;
          this.currentScheduleHasActivities = (detailed.Activities?.length ?? 0) > 0;

          // No necesitamos una comprobación general de hasValidStates aquí para decidir cómo mapear.
          // Cada actividad se mapea basada en sus propios estados.

          this.activities = (detailed.Activities || [])
            .filter(a => a.frequency === this.currentView)
            .map(a => ({
              ...a,
              // Para cada actividad, usa el último estado si existe, de lo contrario, usa 'sin_revision'.
              status: (a.Statuses && a.Statuses.length > 0)
                ? this.mapBackendStatusToLocal(a.Statuses[a.Statuses.length - 1].state)
                : 'sin_revision'
            }));

          // Si después de filtrar y mapear no hay actividades, resetea.
          if (!this.activities || this.activities.length === 0) {
             console.log('No hay actividades relevantes para la vista en el schedule cargado. Reseteando.');
             this.resetAllActivitiesStatus(); // Esto limpiará y reseteará this.activities a base vacía o sin revision
          } else {
             console.log('Actividades cargadas y mapeadas:', this.activities);
             // Opcional: si quieres que allActivities refleje los estados del schedule cargado
             // this.updateActivityStatuses(detailed.Activities || []);
             // Sin embargo, si allActivities se usa como base limpia, mejor no actualizarla aquí.
          }

        } else {
           console.log('Schedule cargado no tiene el formato esperado (falta Activities). Reseteando estados.');
           this.resetState();
        }
        this.isLoadingSchedule = false;
      },
      error: (err) => {
        console.error('Error al cargar schedule:', err);
        this.resetState();
      }
    });
  }

  private resetState() {
    this.currentScheduleId = null;
    this.resetActivityStatuses();
    this.isLoadingSchedule = false;
  }

  private updateActivityStatuses(data: BackendActivity[]) {
    this.activities = this.activities.map(local => {
      const backend = data.find(b => b.id === local.id);
      const backendState = backend?.Statuses?.[0]?.state;
      return { ...local, status: this.mapBackendStatusToLocal(backendState) };
    });
  }

  private resetActivityStatuses() {
    // Reiniciar todas las actividades
    this.allActivities = this.allActivities.map(a => ({ ...a, status: 'sin_revision' }));
    this.completionPercentage = 0;
    this.currentScheduleId = null;
    this.currentScheduleHasActivities = false;
  }

  toggleActivityStatus(activity: CalendarActivity) {
    const order: ActivityStatus[] = ['sin_revision', 'verificado', 'no_aplica'];
    const next = order[(order.indexOf(activity.status) + 1) % order.length];
    activity.status = next;
    this.updateCompletionPercentage();
  }

  private updateCompletionPercentage() {
    if (!this.activities.length) {
      this.completionPercentage = 0;
      return;
    }
    const total = this.activities.length;
    const completadas = this.activities.filter(a => a.status === 'verificado' || a.status === 'no_aplica').length;
    this.completionPercentage = Math.round((completadas / total) * 100);
  }

  saveActivities() {
    if (!this.isAuthenticated() || !this.currentScheduleId || !this.currentScheduleHasActivities) {
      console.warn('No se pueden guardar actividades: ', {
        isAuthenticated: this.isAuthenticated(),
        currentScheduleId: this.currentScheduleId,
        hasActivities: this.currentScheduleHasActivities
      });
      return;
    }

    // Ahora las actividades visibles ya son las del schedule, así que puedes usar directamente:
    const activitiesToUpdate = this.activities;

    // Llamar al método de auditoría antes de enviar al backend
    const auditInfo = this.buildAuditInfo(activitiesToUpdate);
    console.log('AUDITORÍA DE GUARDADO:', auditInfo);
    this.auditLogService.createAuditLog(auditInfo).subscribe({
      next: log => console.log('Auditoría registrada en backend:', log),
      error: err => console.error('Error al registrar auditoría en backend:', err)
    });

    const payload: ActivityStatusPayload = {
      statuses: activitiesToUpdate.map(a => ({ 
        activityId: a.id, 
        state: this.mapLocalStatusToApi(a.status),
        notes: a.status === 'no_aplica' ? 'Marcado como no aplica' : undefined
      }))
    };

    console.log('Enviando actualización de estados:', payload);

    this.scheduleService.updateActivityStatuses(this.currentScheduleId, payload).subscribe({
      next: res => {
        console.log('Estados actualizados exitosamente:', res);
        this.completionPercentage = res.data?.progress ?? this.completionPercentage;
        if (res.data?.Activities) {
          this.updateActivityStatuses(res.data.Activities);
          // Actualizar el estado de las actividades en allActivities también
          this.allActivities = this.allActivities.map(activity => {
            const updatedActivity = res.data.Activities.find((a: BackendActivity) => a.id === activity.id);
            return updatedActivity ? { ...activity, status: this.mapBackendStatusToLocal(updatedActivity.Statuses?.[0]?.state) } : activity;
          });
        }
        alert('¡Actividades guardadas correctamente!');
      },
      error: err => {
        console.error('Error al guardar actividades:', err);
        alert('Error al guardar actividades. Intenta de nuevo.');
      }
    });
  }

  private mapLocalStatusToApi(status: ActivityStatus): string {
    switch (status) {
      case 'verificado':
        return 'completed';
      case 'no_aplica':
        return 'not_applicable';
      case 'sin_revision':
      default:
        return 'pending';
    }
  }

  private mapBackendStatusToLocal(status: string = ''): ActivityStatus {
    switch (status) {
      case 'completed':
        return 'verificado';
      case 'not_applicable':
        return 'no_aplica';
      case 'pending':
      default:
        return 'sin_revision';
    }
  }

  generateCalendarDays(year: number, month: number) {
    const today = new Date();
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0);
    const startOffset = (start.getDay() || 7) - 1;
    const fillStart = Array.from({ length: startOffset }, (_, i) => new Date(year, month - 1, start.getDate() - startOffset + i));
    const current = Array.from({ length: end.getDate() }, (_, i) => new Date(year, month, i + 1));
    const fillEnd = Array.from({ length: 42 - (fillStart.length + current.length) }, (_, i) => new Date(year, month + 1, i + 1));
    const allDays = [...fillStart, ...current, ...fillEnd];

    this.calendarDays = allDays.map(date => ({
      date,
      dayOfMonth: date.getDate(),
      isCurrentMonth: date.getMonth() === month,
      isToday: this.isSameDate(date, today),
      isSelected: this.isSameDate(date, this.selectedDate)
    }));
  }

  isSameDate(a: Date, b: Date) {
    return a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate();
  }

  isToday(date: Date): boolean {
    return this.isSameDate(date, new Date());
  }

  selectDayFromMonthView(day: CalendarDay) {
    this.selectedDate = day.date;
    this.generateCalendarDays(this.selectedDate.getFullYear(), this.selectedDate.getMonth());
    this.loadScheduleForDate(this.selectedDate);
  }

  selectMonth(monthName: string) {
    const monthIndex = this.months.findIndex(m => m.name === monthName);
    if (monthIndex !== -1) {
      this.selectedDate = new Date(this.currentYear, monthIndex, 1);
      this.generateCalendarDays(this.currentYear, monthIndex);
      this.currentMonthName = monthName;
      this.currentMonth = this.selectedDate.toLocaleDateString('es-ES', { month: 'long' });
      this.loadScheduleForDate(this.selectedDate);
    }
  }

  previousMonth(): void {
    this.selectedDate = new Date(this.selectedDate.getFullYear(), this.selectedDate.getMonth() - 1, 1);
    this.currentYear = this.selectedDate.getFullYear();
    this.currentMonthName = this.selectedDate.toLocaleDateString('es-ES', { month: 'long' });
    this.currentMonth = this.currentMonthName;
    this.generateCalendarDays(this.currentYear, this.selectedDate.getMonth());
    this.loadScheduleForDate(this.selectedDate);
  }

  nextMonth(): void {
    this.selectedDate = new Date(this.selectedDate.getFullYear(), this.selectedDate.getMonth() + 1, 1);
    this.currentYear = this.selectedDate.getFullYear();
    this.currentMonthName = this.selectedDate.toLocaleDateString('es-ES', { month: 'long' });
    this.currentMonth = this.currentMonthName;
    this.generateCalendarDays(this.currentYear, this.selectedDate.getMonth());
    this.loadScheduleForDate(this.selectedDate);
  }

  getViewTitle(): string {
    const opts = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' } as const;
    switch (this.currentView) {
      case 'daily':
        return `Actividades para ${this.selectedDate.toLocaleDateString('es-ES', opts)}`;
      case 'weekly':
        return `Actividades Semanales (${this.currentWeekStart.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} - ${this.currentWeekEnd.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })})`;
      case 'monthly':
        return `Actividades Mensuales (${this.selectedDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })})`;
      case 'yearly':
        return 'Resumen Anual';
      default:
        return 'Actividades';
    }
  }

  private resetAllActivitiesStatus() {
    // Limpiar allActivities
    this.allActivities = this.allActivities.map(a => ({ ...a, status: 'sin_revision' }));
    // Crear una nueva lista de activities LIMPIA
    this.activities = this.allActivities
      .filter(activity => {
        if (this.currentView === 'daily') return activity.frequency === 'daily';
        if (this.currentView === 'weekly') return activity.frequency === 'weekly';
        if (this.currentView === 'monthly') return activity.frequency === 'monthly';
        if (this.currentView === 'yearly') return activity.frequency === 'yearly';
        return true;
      })
      .map(a => ({ ...a, status: 'sin_revision' })); // <-- Esto es clave
    this.completionPercentage = 0;
    this.currentScheduleId = null;
    this.currentScheduleHasActivities = false;
  }

  printCalendar(): void {
    console.log('Activando impresión del calendario...');
    window.print();
  }

  // Método para manejar el botón 'Indicar periodo'
  openPeriodSelector(): void {
    console.log('Botón "Indicar periodo" clickeado.');
    // Mostrar el modal
    this.showPeriodModal = true;
  }

  // Método para cerrar el modal de selección de periodo
  closePeriodModal(): void {
    this.showPeriodModal = false;
  }

  // Método para procesar la fecha/periodo seleccionado del modal
  processPeriodSelection(): void {
    const selectedDateString = this.selectedDateInput.nativeElement.value;

    if (!selectedDateString) {
        console.warn('No se ha seleccionado ninguna fecha.');
        return;
    }

    const selectedPeriodDate = new Date(selectedDateString);

    console.log('Fecha seleccionada (procesando):', selectedPeriodDate);

    switch (this.currentView) {
      case 'daily':
        this.loadScheduleForDate(selectedPeriodDate);
        break;
      case 'weekly':
        this.setCurrentWeek(selectedPeriodDate);
        this.loadScheduleForDate(this.currentWeekStart);
        break;
      case 'monthly':
        const dateForMonth = new Date(selectedPeriodDate.getFullYear(), selectedPeriodDate.getMonth(), 1);
        this.selectMonth(dateForMonth.toLocaleDateString('es-ES', { month: 'long' }));
        break;
    }

    this.closePeriodModal();
  }

  setFallback(event: Event, fallbackUrl: string) {
    const img = event.target as HTMLImageElement | null;
    if (img) {
      img.src = fallbackUrl;
    }
  }

  get progressDotCx(): number {
    const angle = (this.completionPercentage / 100) * 2 * Math.PI - Math.PI / 2;
    return 60 + 50 * Math.cos(angle);
  }

  get progressDotCy(): number {
    const angle = (this.completionPercentage / 100) * 2 * Math.PI - Math.PI / 2;
    return 60 + 50 * Math.sin(angle);
  }

  checkAdminStatus() {
    try {
      const user = localStorage.getItem('currentUser');
      this.isAdmin = user ? JSON.parse(user).role === 'admin' : false;
    } catch {
      this.isAdmin = false;
    }
  }

  loadReminderImage() {
    this.settingsService.getSettingByKey('calendarReminderImage').subscribe({
      next: (res) => {
        if (res && res.value) {
          this.reminderImageUrl = res.value;
        }
      },
      error: () => {
        // Si no existe, se mantiene la imagen por defecto
      }
    });
  }

  onEditReminderImage() {
    this.editingReminderImage = true;
    this.reminderImageError = '';
  }

  onReminderImageFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.loadingReminderImage = true;
      this.reminderImageError = '';
      this.settingsService.uploadImage(file).subscribe({
        next: (res) => {
          if (res && res.url) {
            this.saveReminderImageUrl(res.url);
          } else {
            this.reminderImageError = 'No se pudo obtener la URL de la imagen.';
            this.loadingReminderImage = false;
          }
        },
        error: () => {
          this.reminderImageError = 'Error al subir la imagen.';
          this.loadingReminderImage = false;
        }
      });
    }
  }

  saveReminderImageUrl(url: string) {
    this.settingsService.updateSettingByKey('calendarReminderImage', url).subscribe({
      next: () => {
        this.reminderImageUrl = url;
        this.editingReminderImage = false;
        this.loadingReminderImage = false;
      },
      error: () => {
        this.reminderImageError = 'Error al guardar la URL de la imagen.';
        this.loadingReminderImage = false;
      }
    });
  }

  cancelEditReminderImage() {
    this.editingReminderImage = false;
    this.reminderImageError = '';
  }

  // Devuelve el objeto de auditoría
  private buildAuditInfo(activitiesToUpdate: CalendarActivity[]): AuditLog {
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
    return {
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      timestamp: new Date().toISOString(),
      action: 'update_activity_statuses_Calendar',
      scheduleId: this.currentScheduleId!,
      activities: activitiesToUpdate.map(a => ({
        id: a.id,
        name: a.name,
        status: a.status
      }))
    };
  }
}