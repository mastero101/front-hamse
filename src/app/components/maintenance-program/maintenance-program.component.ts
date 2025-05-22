import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivityService, PaginatedActivitiesResponse, Activity as ServiceActivity } from '../../services/activity.service';
import { ScheduleService, Schedule } from '../../services/schedule.service';

interface Month {
  name: string;
  weeks: number[];
}

interface CheckState {
  month: string;
  week: number;
  state: 'unchecked' | 'verified' | 'notApplicable';
}

interface ProgramActivity {
  id: string;
  name: string;
  checkedWeeks: CheckState[];
  frequency?: string;
  expectedDuration?: number;
  category?: string;
}

@Component({
  selector: 'app-maintenance-program',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './maintenance-program.component.html',
  styleUrl: './maintenance-program.component.scss'
})
export class MaintenanceProgramComponent implements OnInit {
  // @Input() scheduleId: string | null = null; // Eliminamos el Input

  months: Month[] = [
    { name: 'Enero', weeks: [1, 2, 3, 4] },
    { name: 'Febrero', weeks: [1, 2, 3, 4] },
    { name: 'Marzo', weeks: [1, 2, 3, 4] },
    { name: 'Abril', weeks: [1, 2, 3, 4] },
    { name: 'Mayo', weeks: [1, 2, 3, 4] },
    { name: 'Junio', weeks: [1, 2, 3, 4] },
    { name: 'Julio', weeks: [1, 2, 3, 4] },
    { name: 'Agosto', weeks: [1, 2, 3, 4] },
    { name: 'Septiembre', weeks: [1, 2, 3, 4] },
    { name: 'Octubre', weeks: [1, 2, 3, 4] },
    { name: 'Noviembre', weeks: [1, 2, 3, 4] },
    { name: 'Diciembre', weeks: [1, 2, 3, 4] }
  ];

  activities: ProgramActivity[] = [];
  isLoading: boolean = false;
  currentProgramScheduleId: string | null = null; // Nueva propiedad para almacenar el ID del schedule del programa

  constructor(
    private activityService: ActivityService,
    private scheduleService: ScheduleService
  ) { }

  ngOnInit(): void {
    // Modificamos ngOnInit para cargar el schedule del programa anual
    this.loadProgramScheduleForCurrentYear();
  }

  // Método para cargar actividades genéricas (sin estado de schedule)
  loadGenericProgramActivities(): void {
    this.isLoading = true;
    this.activityService.getActivities(1, 100, 'program').subscribe({
      next: (response: PaginatedActivitiesResponse) => {
        this.activities = response.data.map((serviceActivity: ServiceActivity) => ({
          id: serviceActivity.id,
          name: serviceActivity.name,
          checkedWeeks: [],
          frequency: serviceActivity.frequency,
          expectedDuration: serviceActivity.expectedDuration,
          category: serviceActivity.category
        }));
        console.log('Actividades de PROGRAMA genéricas cargadas:', this.activities.length);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar actividades de PROGRAMA genéricas:', error);
        this.isLoading = false;
      }
    });
  }

  // Nuevo método para cargar el schedule del programa para el año actual
  loadProgramScheduleForCurrentYear(): void {
    this.isLoading = true;
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);
    const endOfYear = new Date(currentYear, 11, 31);

    this.scheduleService.getSchedules().subscribe({
      next: (schedules: Schedule[]) => {
        // Buscar un schedule de tipo 'weekly' que cubra el año actual
        const programSchedule = schedules.find(schedule => {
          const scheduleStartDate = new Date(schedule.startDate);
          const scheduleEndDate = new Date(schedule.endDate);
          // Normalizar fechas para comparación
          scheduleStartDate.setHours(0, 0, 0, 0);
          scheduleEndDate.setHours(23, 59, 59, 999);
          startOfYear.setHours(0, 0, 0, 0);
          endOfYear.setHours(23, 59, 59, 999);

          // Consideramos un schedule como el del programa si es 'weekly' y su rango de fechas
          // se superpone significativamente o cubre el año actual.
          // Una comprobación simple es si el inicio del schedule es antes o igual al fin del año
          // y el fin del schedule es después o igual al inicio del año.
          // También verificamos que sea de tipo 'weekly' (asumiendo que el programa es semanal)
          return schedule.type === 'weekly' &&
                 scheduleStartDate <= endOfYear &&
                 scheduleEndDate >= startOfYear;
        });

        if (programSchedule) {
          console.log(`Schedule de programa ${programSchedule.id} encontrado para ${currentYear}.`);
          this.currentProgramScheduleId = programSchedule.id;
          this.populateActivitiesFromSchedule(programSchedule);
        } else {
          console.warn(`No se encontró un schedule de programa para ${currentYear}. Cargando actividades genéricas y preparando para crear uno.`);
          this.currentProgramScheduleId = null; // Asegurarse de que no hay ID si no se encontró
          this.loadGenericProgramActivities(); // Cargar actividades base para permitir la creación
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al buscar schedules:', error);
        this.currentProgramScheduleId = null;
        this.loadGenericProgramActivities(); // Fallback a actividades genéricas en caso de error
        this.isLoading = false;
      }
    });
  }

  // Método para poblar las actividades del componente con los datos de un schedule específico
  populateActivitiesFromSchedule(schedule: Schedule): void {
    if (schedule && schedule.Activities) {
      // Mapear las actividades del schedule a la estructura local ProgramActivity
      this.activities = schedule.Activities.map((backendActivity: any) => {
        // Asegurarse de que checkedWeeks/programStates sea un array, incluso si es null/undefined
        const checkedWeeks = Array.isArray(backendActivity.checkedWeeks) ? backendActivity.checkedWeeks :
                             Array.isArray(backendActivity.programStates) ? backendActivity.programStates : [];
        return {
          id: backendActivity.id,
          name: backendActivity.name,
          checkedWeeks: checkedWeeks,
          frequency: backendActivity.frequency,
          expectedDuration: backendActivity.expectedDuration,
          category: backendActivity.category || 'program',
        };
      });
      console.log(`Actividades cargadas desde el schedule ${schedule.id}:`, this.activities.length);
    } else {
      console.warn(`El schedule ${schedule.id} no contiene actividades o la estructura no es la esperada.`);
      this.loadGenericProgramActivities(); // Fallback si el schedule encontrado está vacío o mal formado
    }
  }


  // Método para guardar el estado actual del programa (checkedWeeks de todas las actividades)
  saveProgramState(): void {
    console.log('[MaintenanceProgramComponent] saveProgramState called.');
    console.log('[MaintenanceProgramComponent] Current programScheduleId:', this.currentProgramScheduleId);
    console.log('[MaintenanceProgramComponent] Current isLoading:', this.isLoading);

    if (!this.activities || this.activities.length === 0) {
      console.warn('No hay actividades para guardar.');
      alert('No hay cambios en las actividades para guardar.');
      return;
    }

    this.isLoading = true;

    const activitiesToSave = this.activities.map(activity => ({
      id: activity.id,
      name: activity.name,
      checkedWeeks: activity.checkedWeeks,
      frequency: activity.frequency,
      expectedDuration: activity.expectedDuration,
      category: activity.category
    }));

    if (!this.currentProgramScheduleId) {
      // --- CREAR NUEVO SCHEDULE DE PROGRAMA ---
      console.log('No programScheduleId found, attempting to create a new program schedule for the current year.');
      const currentYear = new Date().getFullYear();
      const startOfYear = new Date(currentYear, 0, 1);
      const endOfYear = new Date(currentYear, 11, 31);

      const newScheduleData: Omit<Schedule, 'id' | 'progress'> = {
        startDate: startOfYear.toISOString().split('T')[0], // Formato YYYY-MM-DD
        endDate: endOfYear.toISOString().split('T')[0], // Fin del año actual
        type: 'weekly', // Asumiendo 'weekly' para el programa de mantenimiento
        status: 'in_progress',
        assignedTo: 'placeholder_user_id', // Reemplazar con el ID del usuario real
        activities: activitiesToSave as any[] // Enviamos las actividades con sus estados iniciales
      };

      console.log('Payload for creating program schedule:', JSON.stringify(newScheduleData, null, 2));

      this.scheduleService.createSchedule(newScheduleData).subscribe({
        next: (createdSchedule) => {
          console.log('New program schedule created successfully:', createdSchedule);
          if (createdSchedule && createdSchedule.id) {
            this.currentProgramScheduleId = createdSchedule.id; // Actualizamos el ID en el componente
            alert('Nuevo programa guardado exitosamente con ID: ' + this.currentProgramScheduleId);
          } else {
            console.error('Schedule created but ID is missing in the response.');
            alert('Programa creado, pero hubo un problema al obtener su ID. Por favor, recargue la página o intente de nuevo.');
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error creating new program schedule:', error);
          const errorMessage = error.response?.data?.message || error.message || 'Error desconocido al crear el programa.';
          alert(`Error al crear el nuevo programa: ${errorMessage}`);
          this.isLoading = false;
        }
      });
    } else {
      // --- ACTUALIZAR SCHEDULE DE PROGRAMA EXISTENTE ---
      console.log(`Updating existing program schedule with ID: ${this.currentProgramScheduleId}`);
      // El backend espera un objeto Schedule parcial para la actualización
      const scheduleUpdatePayload: Partial<Schedule> = {
        Activities: activitiesToSave as any[] // Enviamos la lista completa de actividades con sus estados actualizados
      };

      console.log('Payload for updating program schedule:', JSON.stringify(scheduleUpdatePayload, null, 2));

      this.scheduleService.updateSchedule(this.currentProgramScheduleId, scheduleUpdatePayload).subscribe({
        next: (updatedSchedule) => {
          console.log('Estado del programa guardado exitosamente. Respuesta del backend:', updatedSchedule);
          alert('Cambios guardados exitosamente.');
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error al guardar el estado del programa:', error);
          const errorMessage = error.response?.data?.message || error.message || 'Error desconocido al guardar cambios.';
          alert(`Error al guardar los cambios: ${errorMessage}`);
          this.isLoading = false;
        }
      });
    }
  }

  isWeekChecked(activity: ProgramActivity, month: Month, week: number): boolean {
    return activity.checkedWeeks.some(
      checked => checked.month === month.name && checked.week === week && checked.state === 'verified'
    );
  }

  toggleWeek(activity: ProgramActivity, month: Month, week: number): void {
    const index = activity.checkedWeeks.findIndex(
      checked => checked.month === month.name && checked.week === week
    );

    if (index === -1) {
      // Si no existe, añadir con estado 'verified'
      activity.checkedWeeks.push({ month: month.name, week, state: 'verified' });
    } else {
      const currentState = activity.checkedWeeks[index].state;
      if (currentState === 'verified') {
        // Si está 'verified', cambiar a 'notApplicable'
        activity.checkedWeeks[index].state = 'notApplicable';
      } else if (currentState === 'notApplicable') {
        // Si está 'notApplicable', eliminar (volver a 'unchecked')
        activity.checkedWeeks.splice(index, 1);
      } else {
        // Si está 'unchecked' (index === -1, ya manejado arriba), o cualquier otro estado,
        // este else if no se ejecutará. La lógica actual solo alterna entre verified, notApplicable y unchecked (eliminando).
      }
    }
  }

  getWeekState(activity: ProgramActivity, month: Month, week: number): string {
    const checkState = activity.checkedWeeks.find(
      checked => checked.month === month.name && checked.week === week
    );
    // Devuelve el estado encontrado o 'unchecked' si no existe
    return checkState ? checkState.state : 'unchecked';
  }
}
