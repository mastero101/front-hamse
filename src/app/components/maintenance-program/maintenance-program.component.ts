import { Component, OnInit, Input } from '@angular/core';
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
  @Input() scheduleId: string | null = null;

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

  constructor(
    private activityService: ActivityService,
    private scheduleService: ScheduleService
  ) { }

  ngOnInit(): void {
    if (this.scheduleId) {
      this.loadScheduleData(this.scheduleId);
    } else {
      // Si no hay scheduleId, cargar actividades genéricas sin estado persistido
      this.loadGenericProgramActivities();
      console.warn('No se proporcionó scheduleId. Se cargaron actividades genéricas sin estado.');
    }
  }

  // Método para cargar actividades genéricas (sin estado de schedule)
  loadGenericProgramActivities(): void {
    this.isLoading = true;
    this.activityService.getActivities(1, 100, 'program').subscribe({
      next: (response: PaginatedActivitiesResponse) => {
        this.activities = response.data.map((serviceActivity: ServiceActivity) => ({
          id: serviceActivity.id,
          name: serviceActivity.name,
          checkedWeeks: [], // Inicializa checkedWeeks vacío
          frequency: serviceActivity.frequency,
          expectedDuration: serviceActivity.expectedDuration,
          category: serviceActivity.category
        }));
        console.log('Actividades de PROGRAMA genéricas cargadas:', this.activities.length);
        console.log('Datos de las actividades:', this.activities);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar actividades de PROGRAMA genéricas:', error);
        this.isLoading = false;
      }
    });
  }

  // Nuevo método para cargar datos del schedule, incluyendo estados de actividad
  loadScheduleData(scheduleId: string): void {
    this.isLoading = true;
    this.scheduleService.getSchedule(scheduleId).subscribe({
      next: (schedule: Schedule) => {
        if (schedule && schedule.Activities) {
          this.activities = schedule.Activities.map((backendActivity: any) => {
            return {
              id: backendActivity.id,
              name: backendActivity.name,
              checkedWeeks: backendActivity.checkedWeeks || backendActivity.programStates || [],
              frequency: backendActivity.frequency,
              expectedDuration: backendActivity.expectedDuration,
              category: backendActivity.category || 'program',
            };
          });
          console.log(`Actividades cargadas para el schedule ${scheduleId}:`, this.activities.length);
        } else {
          console.warn(`Schedule ${scheduleId} cargado pero no contiene actividades o la estructura no es la esperada. Cargando actividades genéricas.`);
          this.loadGenericProgramActivities();
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error(`Error al cargar el schedule ${scheduleId}:`, error);
        this.isLoading = false;
        this.loadGenericProgramActivities();
      }
    });
  }


  // Método para guardar el estado actual del programa (checkedWeeks de todas las actividades)
  saveProgramState(): void {
    console.log('[MaintenanceProgramComponent] saveProgramState called.');
    console.log('[MaintenanceProgramComponent] Current scheduleId:', this.scheduleId);
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

    if (!this.scheduleId) {
      // --- CREAR NUEVO SCHEDULE ---
      console.log('No scheduleId found, attempting to create a new schedule.');
      const newScheduleData: Omit<Schedule, 'id' | 'progress'> = {
        startDate: new Date().toISOString().split('T')[0], // Formato YYYY-MM-DD
        endDate: new Date(new Date().getFullYear(), 11, 31).toISOString().split('T')[0], // Fin del año actual
        type: 'weekly', // Asumiendo 'weekly' para el programa de mantenimiento
        status: 'in_progress',
        assignedTo: 'placeholder_user_id', // Reemplazar con el ID del usuario real
        Activities: activitiesToSave as any[] // Enviamos las actividades con sus estados
      };

      console.log('Payload for creating schedule:', JSON.stringify(newScheduleData, null, 2));

      this.scheduleService.createSchedule(newScheduleData).subscribe({
        next: (createdSchedule) => {
          console.log('New schedule created successfully:', createdSchedule);
          if (createdSchedule && createdSchedule.id) {
            this.scheduleId = createdSchedule.id; // Actualizamos el scheduleId en el componente
            alert('Nuevo programa guardado exitosamente con ID: ' + this.scheduleId);
          } else {
            console.error('Schedule created but ID is missing in the response.');
            alert('Programa creado, pero hubo un problema al obtener su ID. Por favor, recargue la página o intente de nuevo.');
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error creating new schedule:', error);
          const errorMessage = error.response?.data?.message || error.message || 'Error desconocido al crear el programa.';
          alert(`Error al crear el nuevo programa: ${errorMessage}`);
          this.isLoading = false;
        }
      });
    } else {
      // --- ACTUALIZAR SCHEDULE EXISTENTE ---
      console.log(`Updating existing schedule with ID: ${this.scheduleId}`);
      const scheduleUpdatePayload: Partial<Schedule> = {
        Activities: activitiesToSave as any[]
      };

      console.log('Payload for updating schedule (scheduleUpdatePayload):', JSON.stringify(scheduleUpdatePayload, null, 2));

      this.scheduleService.updateSchedule(this.scheduleId, scheduleUpdatePayload).subscribe({
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
      checked => checked.month === month.name && checked.week === week
    );
  }

  toggleWeek(activity: ProgramActivity, month: Month, week: number): void {
    const index = activity.checkedWeeks.findIndex(
      checked => checked.month === month.name && checked.week === week
    );
  
    if (index === -1) {
      activity.checkedWeeks.push({ month: month.name, week, state: 'verified' });
    } else {
      const currentState = activity.checkedWeeks[index].state;
      if (currentState === 'verified') {
        activity.checkedWeeks[index].state = 'notApplicable';
      } else if (currentState === 'notApplicable') {
        activity.checkedWeeks.splice(index, 1); 
      }
    }
  }

  getWeekState(activity: ProgramActivity, month: Month, week: number): string {
    const checkState = activity.checkedWeeks.find(
      checked => checked.month === month.name && checked.week === week
    );
    return checkState ? checkState.state : 'unchecked';
  }
}
