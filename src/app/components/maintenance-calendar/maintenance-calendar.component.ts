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

// --- Interfaces para la data del Backend ---
// Ajusta estas interfaces según la estructura exacta que devuelve tu API GET /schedules/:id

// Interfaz para una Actividad como viene del backend dentro de un Schedule detallado
// Asume que el estado viene en una propiedad 'state' dentro de un objeto 'Status'
// o directamente en la tabla de unión 'ActivitySchedule'. ¡Ajusta según tu caso!
interface BackendActivityStatus {
  // Opción 1: Si el estado viene de la tabla Status asociada a Activity
  // Status?: { // <-- Comentado o eliminado si no se usa
  //   state: string;
  // };
  Statuses?: { // <-- Cambiado a plural y es un array
    state: string; // 'completed', 'pending', 'not_applicable', etc.
    // otros campos de Status si los necesitas...
  }[]; // <-- Indicando que es un array
  // Opción 2: Si el estado viene de la tabla de unión (ej. ActivitySchedule)
  ActivitySchedule?: {
    // status: string; // <-- Comentado o eliminado si no se usa
     // otros campos de la tabla de unión si los necesitas...
  };
   // Opción 3: Si el estado viene directamente en el objeto Activity (menos común en M:N con estado)
   // status?: string;
}

// Extiende la interfaz Activity base con la información de estado del backend
interface BackendActivity extends Activity, BackendActivityStatus {}

// Interfaz para el Schedule detallado como viene del backend
interface DetailedSchedule extends Schedule {
  Activities: BackendActivity[]; // Usa la interfaz que incluye el estado
}
// --- Fin Interfaces Backend ---


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
  currentView: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'weekly'; // Default a semanal
  currentWeekStart: Date = new Date();
  currentWeekEnd: Date = new Date();
  selectedDate: Date = new Date(); // Para rastrear la fecha seleccionada

  calendarDays: CalendarDay[] = []; // Se calculará dinámicamente

  activities: CalendarActivity[] = []; // Usa la interfaz local con status
  currentScheduleId: string | null = null; // <-- Remove 'private' modifier
  isLoadingActivities = false;
  isLoadingSchedule = false;

  constructor(
    private activityService: ActivityService,
    private scheduleService: ScheduleService
  ) {}

  ngOnInit() {
    if (this.checkAuthentication()) {
      this.setCurrentWeek(this.selectedDate); // Inicializa la semana actual
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
          // Asegúrate que las fechas se comparan correctamente (ignorar hora si es necesario)
          const startDate = new Date(schedule.startDate);
          const endDate = new Date(schedule.endDate);
          startDate.setHours(0, 0, 0, 0); // Normalizar inicio del día
          endDate.setHours(23, 59, 59, 999); // Normalizar fin del día
          const checkDate = new Date(date);
          checkDate.setHours(12, 0, 0, 0); // Usar mediodía para evitar problemas de zona horaria/DST

          return startDate <= checkDate && endDate >= checkDate;
        });

        if (targetSchedule) {
          console.log(`Schedule encontrado: ${targetSchedule.id}`);
          this.currentScheduleId = targetSchedule.id;
          // Si encontramos un schedule, pedimos sus detalles (incluyendo estados de actividad)
          this.fetchAndUpdateScheduleDetails(targetSchedule.id);
        } else {
          console.warn(`No se encontró un schedule para la fecha: ${date.toDateString()}`);
          this.currentScheduleId = null;
          this.completionPercentage = 0;
          // Resetea los estados de las actividades locales a 'sin_revision'
          this.resetActivityStatuses();
          this.isLoadingSchedule = false;
          // Considera si quieres crear un schedule aquí automáticamente o mostrar un mensaje
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

  // Obtiene los detalles de un Schedule específico por ID
  fetchAndUpdateScheduleDetails(scheduleId: string) {
    console.log(`Obteniendo detalles para schedule: ${scheduleId}`);
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
            } else {
              console.warn('El schedule detallado no contiene actividades.');
              this.resetActivityStatuses(); // Resetea estados locales si no hay actividades
            }
        } else {
            // Handle cases where the data might not be DetailedSchedule despite the cast
            console.error('Error: La data recibida de getSchedule no tiene la estructura esperada (DetailedSchedule).', detailedSchedule);
            this.currentScheduleId = null;
            this.resetActivityStatuses();
        }
        this.isLoadingSchedule = false;
      },
      error: (error: any) => { // It's good practice to type the error parameter too
        console.error(`Error al obtener detalles del schedule ${scheduleId}:`, error);
        this.currentScheduleId = null; // Resetea ID si falla la carga
        this.resetActivityStatuses(); // Resetea estados locales
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
        // *** ¡¡¡ AJUSTE IMPORTANTE AQUÍ !!! ***
        // Accede al estado desde el primer elemento del array 'Statuses'
        const backendState = backendActivity.Statuses?.[0]?.state;
        // --- Fin del ajuste ---

        if (backendState) {
          newStatus = this.mapBackendStatusToLocal(backendState);
        } else {
          // Ajusta la lógica de advertencia si es necesario
          const hasStatusesArray = backendActivity.hasOwnProperty('Statuses') && Array.isArray(backendActivity.Statuses);
          const hasStateInFirstStatus = hasStatusesArray && backendActivity.Statuses!.length > 0 && backendActivity.Statuses![0].hasOwnProperty('state');

          if (!hasStateInFirstStatus) {
             console.warn(`No se encontró 'state' en el primer elemento de 'Statuses' para la actividad ${localActivity.id} en la respuesta del backend. Se mantendrá 'sin_revision'. Backend data:`, backendActivity);
          }
           // Mantener 'sin_revision' si el estado está explícitamente ausente o es null/undefined
           newStatus = 'sin_revision';
        }
      } else {
         console.warn(`La actividad local ${localActivity.id} (${localActivity.name}) no se encontró en las actividades del schedule ${this.currentScheduleId}. Se mantendrá 'sin_revision'.`);
         // Mantener 'sin_revision' si la actividad no está en el schedule actual
         newStatus = 'sin_revision';
      }

      return {
        ...localActivity,
        status: newStatus
      };
    });
    console.log('Estados de actividad locales actualizados:', this.activities);
    // No recalcules el porcentaje aquí, usa el que viene del schedule
    // this.updateCompletionPercentage();
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
      // Ajusta los strings del backend ('completed', 'verified', etc.) según tu API
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

  // REVOYER ESTA DEFINICION // <-- Mantenga esta definición o borrarlo, su elección
  // Mapea el estado local ActivityStatus al string esperado por el backend para guardar
  mapLocalStatusToApi(localStatus: ActivityStatus): string { // O el tipo exacto que espera tu backend: 'pending' | 'completed' | 'not_applicable'
    switch (localStatus) {
      case 'verificado':
        return 'completed'; // Ajusta 'completed' si tu backend espera otro string
      case 'no_aplica':
        return 'not_applicable'; // Ajusta 'not_applicable' si tu backend espera otro string
      case 'sin_revision':
      default:
        return 'pending'; // Ajusta 'pending' si tu backend espera otro string
    }
  }

  // --- Métodos existentes (revisar y adaptar si es necesario) ---

  private checkAuthentication(): boolean {
    // ... (código existente) ...
    // Asegúrate que este método sigue siendo válido
    const token = localStorage.getItem('token');
    return !!token; // Simplificado, añade lógica más robusta si es necesario
  }

  private getCurrentUserId(): string {
    // ... (código existente) ...
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
    const firstDayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Ajusta para que Lunes sea el primer día

    this.currentWeekStart = new Date(today.setDate(today.getDate() + firstDayOffset));
    this.currentWeekStart.setHours(0, 0, 0, 0); // Normaliza inicio

    this.currentWeekEnd = new Date(this.currentWeekStart);
    this.currentWeekEnd.setDate(this.currentWeekStart.getDate() + 6);
    this.currentWeekEnd.setHours(23, 59, 59, 999); // Normaliza fin

    this.setWeekDays(); // Actualiza los días mostrados en la vista semanal
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
      // Podrías querer cambiar la vista a 'daily' aquí si tienes esa vista
      // this.currentView = 'daily';
  }


  // --- Lógica de Guardado ---
  // REVISAR: ¿Cómo se guardan los estados? ¿Junto con el schedule o por separado?
  saveActivities() {
    if (!this.checkAuthentication()) return;
    if (!this.currentScheduleId) {
      console.error('No hay un horario actual seleccionado para guardar.');
      // Podrías intentar crear uno o mostrar un error más claro al usuario
      alert('Error: No hay un horario cargado para guardar los cambios.'); // Mensaje más claro
      return;
    }

    console.log(`Guardando estados para Schedule ID: ${this.currentScheduleId}`);

    // Opción B: Actualiza los ESTADOS de las actividades DENTRO de este schedule.
    const activityUpdates = this.activities.map(activity => ({
      activityId: activity.id,
      // *** USA LA FUNCIÓN DE MAPEO CORRECTA ***
      state: this.mapLocalStatusToApi(activity.status), // Use mapLocalStatusToApi here
      // notes: activity.notes // Incluir notas si aplica
    }));

    console.log('Guardando estados para Schedule ID:', this.currentScheduleId);
    console.log('Payload de actualización de estados:', activityUpdates);

    // *** Use this call ***
    this.scheduleService.updateActivityStatuses(this.currentScheduleId!, activityUpdates).subscribe({ // Added non-null assertion for currentScheduleId
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
            // Add success feedback to the user (e.g., toast message)
        },
        error: (error) => {
            console.error('Error al actualizar estados de actividad:', error);
            // Add error feedback to the user
        }
    });


    /* --- Comment out or remove the alternative ---
     const scheduleUpdatePayload = {
         activityStatuses: activityUpdates
     };
     this.scheduleService.updateSchedule(this.currentScheduleId, scheduleUpdatePayload).subscribe({
         // ...
     });
    */
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
    // NO actualices el porcentaje global aquí. El progreso debe venir del backend
    // o calcularse después de guardar exitosamente.
    // this.updateCompletionPercentage();
  }
  // --- END ADDED Missing Method ---


  // --- Métodos de vista y UI (sin cambios mayores necesarios) ---
  isToday(date: Date): boolean {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  }

  isDayCompleted(date: Date): boolean {
    // TODO: Implementar lógica si quieres marcar días completos en la vista semanal/mensual
    return false;
  }

  changeView(view: 'daily' | 'weekly' | 'monthly' | 'yearly') {
      this.currentView = view;
      if (view === 'weekly') {
          this.setCurrentWeek(this.selectedDate); // Asegura que la semana correcta esté seleccionada
          // No necesitas recargar el schedule aquí si ya está cargado para selectedDate
      }
      // Añadir lógica para otras vistas si es necesario
  }

  getViewTitle(): string {
    switch(this.currentView) {
        case 'daily': return `Actividades para ${this.selectedDate.toLocaleDateString()}`; // Ejemplo
        case 'weekly': return `Actividades Semanales (${this.currentWeekStart.toLocaleDateString()} - ${this.currentWeekEnd.toLocaleDateString()})`;
        case 'monthly': return `Actividades Mensuales (${this.currentMonth})`; // Asegúrate que currentMonth se actualice
        case 'yearly': return 'Resumen Anual'; // Ejemplo
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
      // Add any additional logic needed when selecting a month
  }
}
