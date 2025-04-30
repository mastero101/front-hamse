import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivityService, Activity } from '../../services/activity.service';
import { ScheduleService, Schedule } from '../../services/schedule.service'; // Asumiendo que Schedule tiene la estructura necesaria

// Define el tipo para los estados locales
type ActivityStatus = 'sin_revision' | 'verificado' | 'no_aplica';

// Define una interfaz local que extiende la Activity base y añade el status local
interface CalendarActivity extends Activity {
  status: ActivityStatus;
}

interface BackendActivityStatus {
  
  Statuses?: { 
    state: string;
  }[]; 
  ActivitySchedule?: {

  };
}

// Extiende la interfaz Activity base con la información de estado del backend
interface BackendActivity extends Activity, BackendActivityStatus {}

// Interfaz para el Schedule detallado como viene del backend
interface DetailedSchedule extends Schedule {
  Activities: BackendActivity[]; 
}


interface CalendarDay {
  day: number;
  completed: boolean;
  isToday: boolean;
  disabled: boolean;
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
  currentMonth = 'Febrero'; // Considera hacerlo dinámico
  weekDayNames = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];
  weekDays: Date[] = [];
  currentView: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'weekly'; 
  currentWeekStart: Date = new Date();
  currentWeekEnd: Date = new Date();
  selectedDate: Date = new Date(); 

  calendarDays: CalendarDay[] = []; 

  activities: CalendarActivity[] = []; 
  currentScheduleId: string | null = null;
  isLoadingActivities = false;
  isLoadingSchedule = false;
  private currentScheduleHasActivities: boolean = false; 

  constructor(
    private activityService: ActivityService,
    private scheduleService: ScheduleService
  ) {}

  ngOnInit() {
    if (this.checkAuthentication()) {
      this.setCurrentWeek(this.selectedDate); 
      // 1. Carga la lista base de actividades (sin estados específicos)
      this.loadBaseActivities().then(() => {
        // 2. Una vez cargadas las actividades base, busca y carga el schedule para la fecha actual
        this.loadScheduleForDate(this.selectedDate);
      }).catch(error => {
        console.error("Error en la inicialización:", error);
      });
    }
  }

  // Carga la lista de todas las actividades disponibles (sin estado específico del schedule)
  async loadBaseActivities(): Promise<void> {
    this.isLoadingActivities = true;
    return new Promise((resolve, reject) => {
      this.activityService.getActivities().subscribe({
        next: (baseActivities) => {
          // Inicializa el array local con estado por defecto
          this.activities = baseActivities.map(activity => ({
            ...activity,
            status: 'sin_revision' as ActivityStatus, // Estado inicial por defecto
          }));
          this.isLoadingActivities = false;
          console.log('Actividades base cargadas:', this.activities.length);
          resolve();
        },
        error: (error) => {
          console.error('Error al cargar actividades base:', error);
          this.isLoadingActivities = false;
          reject(error);
        }
      });
    });
  }

  // Busca el Schedule que corresponde a una fecha dada y carga sus detalles
  loadScheduleForDate(date: Date) {
    this.isLoadingSchedule = true;
    this.selectedDate = date; // Actualiza la fecha seleccionada
    console.log(`Buscando schedule para la fecha: ${date.toDateString()}`);

    this.scheduleService.getSchedules().subscribe({
      next: (schedules) => {
        const targetSchedule = schedules.find(schedule => {
          const startDate = new Date(schedule.startDate);
          const endDate = new Date(schedule.endDate);
          startDate.setHours(0, 0, 0, 0); // Normalizar inicio del día
          endDate.setHours(23, 59, 59, 999); // Normalizar fin del día
          const checkDate = new Date(date);
          checkDate.setHours(12, 0, 0, 0);

          return startDate <= checkDate && endDate >= checkDate;
        });

        if (targetSchedule) {
          console.log(`Schedule encontrado: ${targetSchedule.id}`);
          this.currentScheduleId = targetSchedule.id;
          this.fetchAndUpdateScheduleDetails(targetSchedule.id);
        } else {
          console.warn(`No se encontró un schedule para la fecha: ${date.toDateString()}`);
          this.createNewSchedule(date);
        }
      },
      error: (error) => {
        console.error('Error al buscar schedules:', error);
        this.currentScheduleId = null;
        this.resetActivityStatuses();
        this.isLoadingSchedule = false;
      }
    });
  }

  private createNewSchedule(date: Date) {
    this.isLoadingSchedule = true;
    const startDate = new Date(date);
    // Ajusta la lógica para definir startDate y endDate según tu vista (semanal en este caso)
    const dayOfWeek = startDate.getDay();
    const firstDayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    startDate.setDate(startDate.getDate() + firstDayOffset);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    endDate.setHours(23, 59, 59, 999);

    const newScheduleData = {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      type: this.mapViewTypeToScheduleType(this.currentView),
      status: 'in_progress' as 'in_progress' | 'pending' | 'completed',
      assignedTo: this.getCurrentUserId(),
      activities: this.activities.map(activity => ({
        ...activity,
        Statuses: [{ state: 'pending' }]
      }))
    };

    console.log('Intentando crear nuevo schedule con datos:', newScheduleData);

    this.scheduleService.createSchedule(newScheduleData).subscribe({
      next: (createdSchedule) => {
        console.log('Nuevo schedule creado:', createdSchedule);
        this.currentScheduleId = createdSchedule.id;
        // Una vez creado, carga sus detalles (que incluirán las actividades base con estado inicial)
        this.fetchAndUpdateScheduleDetails(createdSchedule.id);
        // isLoadingSchedule se pondrá en false dentro de fetchAndUpdateScheduleDetails
      },
      error: (error) => {
        console.error('Error al crear nuevo schedule:', error);
        alert('No se pudo crear un nuevo horario para esta semana. Por favor, inténtelo de nuevo más tarde.');
        this.resetActivityStatuses(); // Resetea si falla la creación
        this.currentScheduleId = null;
        this.isLoadingSchedule = false; // Finaliza la carga en caso de error
      }
    });
  }

  private mapViewTypeToScheduleType(viewType: 'daily' | 'weekly' | 'monthly' | 'yearly'): 'weekly' | 'monthly' {
    switch (viewType) {
      case 'daily':
      case 'weekly':
        return 'weekly';
      case 'monthly':
      case 'yearly':
        return 'monthly';
      default:
        return 'weekly';
    }
  }

  // Obtiene los detalles de un Schedule específico por ID
  fetchAndUpdateScheduleDetails(scheduleId: string) {
    console.log(`Obteniendo detalles para schedule: ${scheduleId}`);
    this.currentScheduleHasActivities = false; // <-- Resetear la bandera al iniciar la carga
    // Use 'as any' to bypass the type check as a workaround
    (this.scheduleService.getSchedule(scheduleId) as any).subscribe({
      next: (detailedSchedule: DetailedSchedule) => { // Keep the explicit type here for clarity within the handler
        console.log('Detalles del schedule recibidos:', detailedSchedule);
        // Basic check to see if the received data looks like DetailedSchedule at runtime
        if (detailedSchedule && detailedSchedule.Activities) {
            this.completionPercentage = detailedSchedule.progress || 0; // Usa el progreso del schedule
            if (detailedSchedule.Activities.length > 0) {
              // Actualiza los estados de las actividades locales con los del schedule
              this.updateActivitiesFromSchedule(detailedSchedule.Activities);
              this.currentScheduleHasActivities = true; // <-- Marcar que sí tiene actividades
            } else {
              console.warn('El schedule detallado no contiene actividades.');
              this.resetActivityStatuses(); // Resetea estados locales si no hay actividades
              // this.currentScheduleHasActivities sigue siendo false
            }
        } else {
            // Handle cases where the data might not be DetailedSchedule despite the cast
            console.error('Error: La data recibida de getSchedule no tiene la estructura esperada (DetailedSchedule).', detailedSchedule);
            this.currentScheduleId = null;
            this.resetActivityStatuses();
            // this.currentScheduleHasActivities sigue siendo false
        }
        this.isLoadingSchedule = false;
      },
      error: (error: any) => { // It's good practice to type the error parameter too
        console.error(`Error al obtener detalles del schedule ${scheduleId}:`, error);
        this.currentScheduleId = null; // Resetea ID si falla la carga
        this.resetActivityStatuses(); // Resetea estados locales
        this.currentScheduleHasActivities = false; // <-- Asegurar que es false en caso de error
        this.isLoadingSchedule = false;
      }
    });
  }

  // Actualiza el estado de las actividades locales basado en la data del backend
  updateActivitiesFromSchedule(backendActivities: BackendActivity[]) {
    console.log('Actualizando estados desde backendActivities:', backendActivities);
    this.activities = this.activities.map(localActivity => {
      const backendActivity = backendActivities.find(ba => ba.id === localActivity.id);
      let newStatus: ActivityStatus = 'sin_revision'; // Por defecto

      if (backendActivity) {
        const backendState = backendActivity.Statuses?.[0]?.state;

        if (backendState) {
          newStatus = this.mapBackendStatusToLocal(backendState);
        } else {
          // Ajusta la lógica de advertencia si es necesario
          const hasStatusesArray = backendActivity.hasOwnProperty('Statuses') && Array.isArray(backendActivity.Statuses);
          const hasStateInFirstStatus = hasStatusesArray && backendActivity.Statuses!.length > 0 && backendActivity.Statuses![0].hasOwnProperty('state');

          if (!hasStateInFirstStatus) {
             console.warn(`No se encontró 'state' en el primer elemento de 'Statuses' para la actividad ${localActivity.id} en la respuesta del backend. Se mantendrá 'sin_revision'. Backend data:`, backendActivity);
          }
           newStatus = 'sin_revision';
        }
      } else {
         console.warn(`La actividad local ${localActivity.id} (${localActivity.name}) no se encontró en las actividades del schedule ${this.currentScheduleId}. Se mantendrá 'sin_revision'.`);
         newStatus = 'sin_revision';
      }

      return {
        ...localActivity,
        status: newStatus
      };
    });
    console.log('Estados de actividad locales actualizados:', this.activities);
  }

  // Resetea todos los estados locales a 'sin_revision'
  resetActivityStatuses() {
    console.log('Reseteando estados de actividad locales a sin_revision.');
    this.activities = this.activities.map(activity => ({
      ...activity,
      status: 'sin_revision'
    }));
    this.completionPercentage = 0; // Resetea porcentaje también
  }

  // Mapea el estado string del backend al tipo local ActivityStatus
  mapBackendStatusToLocal(backendStatus: string): ActivityStatus {
    switch (backendStatus?.toLowerCase()) {
      case 'completed':
      case 'verified':
        return 'verificado';
      case 'not_applicable':
        return 'no_aplica';
      case 'pending':
      case 'in_progress':
      default:
        return 'sin_revision';
    }
  }

  // Mapea el estado local ActivityStatus al string esperado por el backend para guardar
  mapLocalStatusToApi(localStatus: ActivityStatus): string {
    switch (localStatus) {
      case 'verificado':
        return 'completed';
      case 'no_aplica':
        return 'not_applicable';
      case 'sin_revision':
      default:
        return 'pending';
    }
  }

  private checkAuthentication(): boolean {
    const token = localStorage.getItem('token');
    return !!token;
  }

  private getCurrentUserId(): string {
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
      try {
        const userData = JSON.parse(currentUser);
        return userData.id || '';
      } catch (e) {
        console.error("Error parsing currentUser from localStorage", e);
        return '';
      }
    }
    return '';
  }

  // Modificado para aceptar una fecha y cargar el schedule correspondiente
  setCurrentWeek(refDate: Date) {
    const today = new Date(refDate); // Usa la fecha de referencia
    const dayOfWeek = today.getDay(); // 0 = Domingo, 1 = Lunes, ...
    const firstDayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    this.currentWeekStart = new Date(today.setDate(today.getDate() + firstDayOffset));
    this.currentWeekStart.setHours(0, 0, 0, 0);

    this.currentWeekEnd = new Date(this.currentWeekStart);
    this.currentWeekEnd.setDate(this.currentWeekStart.getDate() + 6);
    this.currentWeekEnd.setHours(23, 59, 59, 999);

    this.setWeekDays();
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

  // Lógica para cambiar de semana
  previousWeek() {
    const newDate = new Date(this.currentWeekStart);
    newDate.setDate(this.currentWeekStart.getDate() - 7);
    this.setCurrentWeek(newDate); // Recalcula la semana
    this.loadScheduleForDate(this.currentWeekStart); // Carga el schedule para el inicio de la nueva semana
  }

  nextWeek() {
    const newDate = new Date(this.currentWeekStart);
    newDate.setDate(this.currentWeekStart.getDate() + 7);
    this.setCurrentWeek(newDate); // Recalcula la semana
    this.loadScheduleForDate(this.currentWeekStart); // Carga el schedule para el inicio de la nueva semana
  }

  // Lógica para seleccionar un día (si implementas vista diaria o selección en calendario)
  selectDate(date: Date) {
      this.selectedDate = date;
      this.loadScheduleForDate(date);
  }

  saveActivities() {
    if (!this.checkAuthentication()) return;
    if (!this.currentScheduleId) {
      console.error('No hay un horario actual seleccionado para guardar.');
      // Podrías intentar crear uno o mostrar un error más claro al usuario
      alert('Error: No hay un horario cargado para guardar los cambios.'); // Mensaje más claro
      return;
    }

    if (!this.currentScheduleHasActivities) {
        console.log(`[DEBUG] saveActivities: currentScheduleHasActivities es false. Cancelando guardado para schedule ${this.currentScheduleId}.`);
        console.warn(`Intento de guardar cancelado: El schedule actual (${this.currentScheduleId}) no tiene actividades asociadas en el backend.`);
        alert('No se pueden guardar los cambios porque este horario no tiene actividades asignadas.');
        return; 
    }
    
    console.log(`Guardando estados para Schedule ID: ${this.currentScheduleId}`);

    const activityUpdates = this.activities.map(activity => ({
      activityId: activity.id,
      state: this.mapLocalStatusToApi(activity.status),
    }));

    console.log('Payload de actualización de estados:', activityUpdates);

    const payload = { statuses: activityUpdates };

    this.scheduleService.updateActivityStatuses(this.currentScheduleId!, payload).subscribe({
        next: (response) => {
            console.log('Estados de actividad actualizados con éxito:', response);
            // Update local data based on the response (e.g., progress, specific activity statuses)
            if (response.data && response.data.progress !== undefined) {
                this.completionPercentage = response.data.progress;
            }
            // Optionally re-sync local activity statuses from response.data.Activities
            if (response.data && response.data.Activities) {
               this.updateActivitiesFromSchedule(response.data.Activities);
            }
        },
        error: (error) => {
            console.error('Error al actualizar estados de actividad:', error);
        }
    });
  }

  toggleActivityStatus(activity: CalendarActivity) {
    if (!this.currentScheduleId) {
        console.warn("No se puede cambiar el estado: no hay un schedule cargado.");
        alert("Carga o selecciona una fecha con horario antes de cambiar estados."); 
        return; 
    }

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
    console.log(`Actividad ${activity.id} cambió estado de ${oldStatus} a ${activity.status}`);
  }

  // --- Métodos de vista y UI (sin cambios mayores necesarios) ---
  isToday(date: Date): boolean {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  }

  isDayCompleted(date: Date): boolean {
    return false;
  }

  changeView(view: 'daily' | 'weekly' | 'monthly' | 'yearly') {
      this.currentView = view;
      if (view === 'weekly') {
          this.setCurrentWeek(this.selectedDate);
      }
  }

  getViewTitle(): string {
    switch(this.currentView) {
        case 'daily': return `Actividades para ${this.selectedDate.toLocaleDateString()}`;
        case 'weekly': return `Actividades Semanales (${this.currentWeekStart.toLocaleDateString()} - ${this.currentWeekEnd.toLocaleDateString()})`;
        case 'monthly': return `Actividades Mensuales (${this.currentMonth})`;
        case 'yearly': return 'Resumen Anual';
        default: return 'Actividades';
      }
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
  }
}