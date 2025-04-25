import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivityService } from '../../services/activity.service';
import { ScheduleService } from '../../services/schedule.service';

interface CalendarDay {
  day: number;
  completed: boolean;
  isToday: boolean;
  disabled: boolean;
}

type ActivityStatus = 'sin_revision' | 'verificado' | 'no_aplica';

// Update the Activity interface to match the Schedule service requirements
interface Activity {
  id: number;
  name: string;
  status: ActivityStatus;
  frequency: 'weekly' | 'monthly'; // Remove 'daily' to match Schedule service
  expectedDuration: number;
  priority: 'low' | 'medium' | 'high';
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
  currentMonth = 'Febrero';
  weekDayNames = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];
  weekDays: Date[] = [];
  currentView: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'daily';
  currentWeekStart: Date = new Date();
  currentWeekEnd: Date = new Date();
  
  calendarDays: CalendarDay[] = Array.from({ length: 28 }, (_, i) => ({
    day: i + 1,
    completed: i + 1 <= 21,
    isToday: i + 1 === 24,
    disabled: i + 1 >= 25
  }));

  activities: Activity[] = []; // Inicializamos como un array vacío

  // Update loadActivities method
  loadActivities() {
    this.activityService.getActivities().subscribe({
      next: (activities) => {
        this.activities = activities.map(activity => ({
          id: parseInt(activity.id),
          name: activity.name,
          status: 'sin_revision' as ActivityStatus,
          frequency: activity.frequency || 'weekly',
          expectedDuration: activity.expectedDuration || 30,
          priority: activity.priority || 'high'
        }));
        this.updateCompletionPercentage();
      },
      error: (error) => {
        console.error('Error al cargar actividades:', error);
      }
    });
  }

  

  constructor(
    private activityService: ActivityService,
    private scheduleService: ScheduleService
  ) {}

  ngOnInit() {
    if (this.checkAuthentication()) {
      this.setCurrentWeek();
      this.setWeekDays();
      this.loadActivities();
      this.loadSchedules();
    }
  }

  private checkAuthentication(): boolean {
    const token = localStorage.getItem('token');
    const currentUser = localStorage.getItem('currentUser');
    
    if (!token || !currentUser) {
      console.error('Usuario no autenticado');
      return false;
    }

    // Guardar la información del usuario actual
    const userData = JSON.parse(currentUser);
    if (userData && userData.accessToken) {
      localStorage.setItem('token', userData.accessToken);
      return true;
    }

    return true;
  }

  private getCurrentUserId(): string {
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
      const userData = JSON.parse(currentUser);
      return userData.id || '';
    }
    return '';
  }

  private currentScheduleId: string = '';

  loadSchedules() {
    this.scheduleService.getSchedules().subscribe({
      next: (schedules) => {
        if (!schedules || schedules.length === 0) {
          console.error('No hay horarios disponibles en el sistema');
          // Crear un horario por defecto si no existe ninguno
          this.createDefaultSchedule();
          return;
        }

        const today = new Date();
        const currentSchedule = schedules.find(schedule => {
          const startDate = new Date(schedule.startDate);
          const endDate = new Date(schedule.endDate);
          return startDate <= today && endDate >= today;
        });

        if (currentSchedule) {
          this.currentScheduleId = currentSchedule.id;
          this.completionPercentage = currentSchedule.progress;
          if (currentSchedule.activities) {
            this.updateActivitiesFromSchedule(currentSchedule.activities);
          }
        } else {
          // Crear un nuevo horario para la semana actual
          this.createWeeklySchedule();
        }
      },
      error: (error) => {
        console.error('Error al cargar horarios:', error);
        // Intentar crear un horario por defecto en caso de error
        this.createDefaultSchedule();
      }
    });
  }

  private createWeeklySchedule() {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - today.getDay() + 1);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);

    const currentUser = localStorage.getItem('currentUser');
    const userId = currentUser ? JSON.parse(currentUser).id : '';

    const newSchedule = {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      type: 'weekly' as 'weekly' | 'monthly',
      status: 'in_progress' as 'in_progress' | 'pending' | 'completed',
      assignedTo: userId,
      activities: this.activities.map(activity => ({
        id: activity.id.toString(),
        name: activity.name,
        status: 'pending',
        frequency: activity.frequency,
        expectedDuration: activity.expectedDuration,
        priority: activity.priority
      }))
    };

    this.scheduleService.createSchedule(newSchedule).subscribe({
      next: (response) => {
        this.currentScheduleId = response.id;
        this.completionPercentage = 0;
        console.log('Nuevo horario semanal creado exitosamente');
      },
      error: (error) => {
        console.error('Error al crear el horario semanal:', error);
      }
    });
  }

  private createDefaultSchedule() {
    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + 7);

    const currentUser = localStorage.getItem('currentUser');
    const userId = currentUser ? JSON.parse(currentUser).id : '';

    const defaultSchedule = {
      startDate: today.toISOString(),
      endDate: endDate.toISOString(),
      type: 'weekly' as 'weekly' | 'monthly',
      status: 'in_progress' as 'in_progress' | 'pending' | 'completed',
      assignedTo: userId,
      activities: this.activities.map(activity => ({
        id: activity.id.toString(),
        name: activity.name,
        status: 'pending',
        frequency: activity.frequency,
        expectedDuration: activity.expectedDuration,
        priority: activity.priority
      }))
    };

    this.scheduleService.createSchedule(defaultSchedule).subscribe({
      next: (response) => {
        this.currentScheduleId = response.id;
        this.completionPercentage = 0;
        console.log('Horario por defecto creado exitosamente');
      },
      error: (error) => {
        console.error('Error al crear el horario por defecto:', error);
      }
    });
  }

  getCurrentScheduleId(): string {
    if (!this.currentScheduleId) {
      console.error('No hay un horario actual seleccionado');
      // Intentar recargar los horarios
      this.loadSchedules();
      return '';
    }
    return this.currentScheduleId;
  }

  saveActivities() {
    if (!this.checkAuthentication()) {
      return;
    }

    const currentScheduleId = this.getCurrentScheduleId();
    if (!currentScheduleId) {
      console.error('No se puede guardar: No hay un horario seleccionado');
      return;
    }

    const activitiesUpdate = this.activities.map(activity => ({
      id: activity.id.toString(),
      name: activity.name,
      status: this.mapStatusToApi(activity.status),
      frequency: activity.frequency,
      expectedDuration: activity.expectedDuration,
      priority: activity.priority
    }));

    this.scheduleService.updateSchedule(currentScheduleId, {
      activities: activitiesUpdate,
      type: 'weekly',
      status: 'in_progress',
      assignedTo: this.getCurrentUserId()
    }).subscribe({
      next: (response) => {
        this.completionPercentage = response.progress;
        console.log('Actividades actualizadas exitosamente');
      },
      error: (error) => {
        if (error.response?.status === 401) {
          console.error('Error de autenticación: Token no válido o expirado');
          localStorage.removeItem('token');
          localStorage.removeItem('currentUser');
          window.location.href = '/login';
        } else if (error.response?.status === 500) {
          console.error('Error del servidor al actualizar actividades:', error);
        } else {
          console.error('Error al actualizar actividades:', error);
        }
      }
    });
  }

  updateActivitiesFromSchedule(scheduleActivities: any[]) {
    this.activities = this.activities.map(activity => {
      const scheduleActivity = scheduleActivities.find(sa => sa.id === activity.id.toString());
      if (scheduleActivity) {
        return {
          ...activity,
          status: this.mapActivityStatus(scheduleActivity.status)
        };
      }
      return activity;
    });
  }

  mapActivityStatus(status: string): ActivityStatus {
    switch (status) {
      case 'completed':
        return 'verificado';
      case 'not_applicable':
        return 'no_aplica';
      default:
        return 'sin_revision';
    }
  }

  private mapStatusToApi(status: ActivityStatus): string {
    switch (status) {
      case 'verificado':
        return 'completed';
      case 'no_aplica':
        return 'not_applicable';
      default:
        return 'pending';
    }
  }

  // Modificar el método toggleActivityStatus existente
  toggleActivityStatus(activity: Activity) {
    const oldStatus = activity.status;
    
    switch (activity.status) {
      case 'sin_revision':
        activity.status = 'verificado';
        break;
      case 'verificado':
        activity.status = 'no_aplica';
        break;
      case 'no_aplica':
        activity.status = 'sin_revision';
        break;
    }
    
    // Ya no actualizamos inmediatamente, solo actualizamos el porcentaje local
    this.updateCompletionPercentage();
  }

  private updateCompletionPercentage() {
    const verifiedActivities = this.activities.filter(a => a.status === 'verificado').length;
    this.completionPercentage = Math.round((verifiedActivities / this.activities.length) * 100);
  }

  setWeekDays() {
    this.weekDays = [];
    const startDate = new Date(this.currentWeekStart);
    for (let i = 0; i < 7; i++) {
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + i);
      this.weekDays.push(day);
    }
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  }

  isDayCompleted(date: Date): boolean {
    // Add your logic to check if activities for this day are completed
    return false;
  }

  changeView(view: 'daily' | 'weekly' | 'monthly' | 'yearly') {
      this.currentView = view;
    
      if (view === 'weekly') {
          this.setCurrentWeek();
          this.setWeekDays();
      } else if (view === 'yearly') {
          this.setCurrentYear();
          //this.updateYearlyCompletionPercentage();
      }
  }

  setCurrentYear() {
    const today = new Date();
    this.currentMonth = today.toLocaleString('default', { month: 'long' });
  }

  getViewTitle(): string {
    switch(this.currentView) {
      case 'daily': return 'Actividades Diarias';
      case 'weekly': return 'Actividades Semanales';
      case 'monthly': return 'Actividades Mensuales';
      case 'yearly': return 'Actividades Anuales';
      default: return 'Actividades';
    }
  }

  setCurrentWeek() {
    const today = new Date();
    const first = today.getDate() - today.getDay() + 1;
    this.currentWeekStart = new Date(today.setDate(first));
    this.currentWeekEnd = new Date(today.setDate(first + 6));
  }

  previousWeek() {
    this.currentWeekStart.setDate(this.currentWeekStart.getDate() - 7);
    this.currentWeekEnd.setDate(this.currentWeekEnd.getDate() - 7);
  }

  nextWeek() {
    this.currentWeekStart.setDate(this.currentWeekStart.getDate() + 7);
    this.currentWeekEnd.setDate(this.currentWeekEnd.getDate() + 7);
  }

  months = [
      { name: 'Enero', completed: true },
      { name: 'Febrero', completed: false },
      { name: 'Marzo', completed: false },
      { name: 'Abril', completed: false },
      { name: 'Mayo', completed: false },
      { name: 'Junio', completed: false },
      { name: 'Julio', completed: false },
      { name: 'Agosto', completed: false },
      { name: 'Septiembre', completed: false },
      { name: 'Octubre', completed: false },
      { name: 'Noviembre', completed: false },
      { name: 'Diciembre', completed: false }
  ];
  
  selectMonth(monthName: string) {
      this.currentMonth = monthName;
      // Add any additional logic needed when selecting a month
  }
}
