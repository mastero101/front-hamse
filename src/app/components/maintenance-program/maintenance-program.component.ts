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
  loadGenericProgramActivities(): Promise<void> {
    this.isLoading = true;
    return new Promise((resolve, reject) => {
      this.activityService.getActivities(1, 100, 'program').subscribe({
        next: (response: PaginatedActivitiesResponse) => {
          this.activities = response.data.map((serviceActivity: ServiceActivity) => ({
            id: serviceActivity.id,
            name: serviceActivity.name,
            checkedWeeks: [], // Inicializar vacío, se llenará desde el schedule si existe
            frequency: serviceActivity.frequency,
            expectedDuration: serviceActivity.expectedDuration,
            category: serviceActivity.category
          }));
          console.log('Actividades de PROGRAMA genéricas cargadas:', this.activities.length);
          this.isLoading = false; // Mover isLoading aquí para este caso
          resolve();
        },
        error: (error) => {
          console.error('Error al cargar actividades de PROGRAMA genéricas:', error);
          this.isLoading = false; // Mover isLoading aquí para este caso
          reject(error);
        }
      });
    });
  }

  // Nuevo método para cargar el schedule del programa para el año actual
  loadProgramScheduleForCurrentYear(): void {
    this.isLoading = true;
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);
    const endOfYear = new Date(currentYear, 11, 31);

    // Primero cargar actividades genéricas para mantener el orden
    this.loadGenericProgramActivities().then(() => {
      // Una vez cargadas las genéricas, buscar el schedule guardado
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

            return schedule.type === 'weekly' &&
                   scheduleStartDate <= endOfYear &&
                   scheduleEndDate >= startOfYear;
          });

          if (programSchedule) {
            console.log(`Schedule de programa ${programSchedule.id} encontrado para ${currentYear}.`);
            this.currentProgramScheduleId = programSchedule.id;
            // Luego poblar los estados desde el schedule encontrado en la lista genérica ya cargada
            this.populateActivitiesFromSchedule(programSchedule);
          } else {
            console.warn(`No se encontró un schedule de programa para ${currentYear}. Se muestran actividades genéricas.`);
            this.currentProgramScheduleId = null; // Asegurarse de que no hay ID si no se encontró
            // Las actividades genéricas ya están cargadas por loadGenericProgramActivities
          }
          this.isLoading = false; // Mover isLoading a aquí después de cargar y poblar
        },
        error: (error) => {
          console.error('Error al buscar schedules después de cargar genéricas:', error);
          this.currentProgramScheduleId = null;
          // Las actividades genéricas ya están cargadas, se mostrarán sin estados
          this.isLoading = false; // Mover isLoading a aquí en caso de error
        }
      });
    }).catch(error => {
       console.error('Error loading generic activities initially:', error);
       this.isLoading = false; // Asegurarse de que isLoading se desactiva si falla la carga genérica
    });
  }

  // Método para poblar las actividades del componente con los datos de un schedule específico
  populateActivitiesFromSchedule(schedule: Schedule): void {
    if (schedule && schedule.Activities && this.activities.length > 0) {
      // Iterar sobre las actividades del schedule y fusionar los estados
      schedule.Activities.forEach((backendActivity: any) => {
        const localActivity = this.activities.find(act => act.id === backendActivity.id);
        if (localActivity) {
          // Asegurarse de que checkedWeeks/programStates sea un array, incluso si es null/undefined
          localActivity.checkedWeeks = Array.isArray(backendActivity.checkedWeeks) ? backendActivity.checkedWeeks :
                                       Array.isArray(backendActivity.programStates) ? backendActivity.programStates : [];
        } else {
          console.warn(`Actividad con ID ${backendActivity.id} encontrada en el schedule pero no en la lista genérica. Ignorando.`);
        }
      });
      console.log(`Estados de actividades fusionados desde el schedule ${schedule.id}.`);
    } else if (this.activities.length === 0) {
       console.warn('No generic activities loaded to merge schedule states into.');
       // Esto no debería ocurrir si loadGenericProgramActivities se completó correctamente
    }
     else {
      console.warn(`El schedule ${schedule.id} no contiene actividades o la estructura no es la esperada para fusionar.`);
      // Si el schedule está vacío o mal formado, las actividades genéricas ya cargadas se mostrarán sin estados
    }
  }


  // Método para guardar el estado actual del programa (checkedWeeks de todas las actividades)
  saveProgramState(): void {
    console.log('[MaintenanceProgramComponent] saveProgramState called.');
    // Cambiar scheduleId a currentProgramScheduleId
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

    // Cambiar scheduleId a currentProgramScheduleId
    if (!this.currentProgramScheduleId) {
      console.log('No programScheduleId found, attempting to create a new schedule.');
      const newScheduleData: Omit<Schedule, 'id' | 'progress'> = {
        startDate: new Date().toISOString().split('T')[0], // Formato YYYY-MM-DD
        endDate: new Date(new Date().getFullYear(), 11, 31).toISOString().split('T')[0], // Fin del año actual
        type: 'weekly', // Asumiendo 'weekly' para el programa de mantenimiento
        status: 'in_progress',
        assignedTo: 'placeholder_user_id', // Reemplazar con el ID del usuario real
        activities: activitiesToSave as any[] // Enviamos las actividades con sus estados
      };

      console.log('Payload for creating schedule:', JSON.stringify(newScheduleData, null, 2));

      this.scheduleService.createSchedule(newScheduleData).subscribe({
        next: (createdSchedule) => {
          console.log('New schedule created successfully:', createdSchedule);
          if (createdSchedule && createdSchedule.id) {
            // Cambiar scheduleId a currentProgramScheduleId
            this.currentProgramScheduleId = createdSchedule.id; // Actualizamos el scheduleId en el componente
            // Cambiar scheduleId a currentProgramScheduleId
            alert('Nuevo programa guardado exitosamente con ID: ' + this.currentProgramScheduleId);
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
      // Cambiar scheduleId a currentProgramScheduleId
      console.log(`Updating existing schedule with ID: ${this.currentProgramScheduleId}`);
      const scheduleUpdatePayload: Partial<Schedule> = {
        activities: activitiesToSave as any[]
      };

      console.log('Payload for updating schedule (scheduleUpdatePayload):', JSON.stringify(scheduleUpdatePayload, null, 2));

      // Cambiar scheduleId a currentProgramScheduleId
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
      }
    }
  }

  getWeekState(activity: ProgramActivity, month: Month, week: number): string {
    const checkState = activity.checkedWeeks.find(
      checked => checked.month === month.name && checked.week === week
    );
    return checkState ? checkState.state : 'unchecked';
  }

  printProgram(): void {
    console.log('Activando impresión...');
    window.print();
  }

  showPeriodSelector: boolean = false;
  selectedPeriod: { startMonth: string; startWeek: number; endMonth: string; endWeek: number } | null = null;
  filteredActivities: ProgramActivity[] = [];

  togglePeriodSelector(): void {
    this.showPeriodSelector = !this.showPeriodSelector;
    if (!this.showPeriodSelector) {
      this.selectedPeriod = null;
      this.filteredActivities = [...this.activities];
    }
  }

  applyPeriodFilter(period: { startMonth: string; startWeek: number; endMonth: string; endWeek: number }): void {
    this.selectedPeriod = period;
    
    const startMonthIndex = this.months.findIndex(m => m.name === period.startMonth);
    const endMonthIndex = this.months.findIndex(m => m.name === period.endMonth);

    if (startMonthIndex === -1 || endMonthIndex === -1) return;

    this.filteredActivities = this.activities.filter(activity => {
      return activity.checkedWeeks.some(check => {
        const monthIndex = this.months.findIndex(m => m.name === check.month);
        if (monthIndex === -1) return false;

        if (monthIndex < startMonthIndex || monthIndex > endMonthIndex) return false;
        if (monthIndex === startMonthIndex && check.week < period.startWeek) return false;
        if (monthIndex === endMonthIndex && check.week > period.endWeek) return false;

        return true;
      });
    });

    this.showPeriodSelector = false;
  }

  clearPeriodFilter(): void {
    this.selectedPeriod = null;
    this.filteredActivities = [...this.activities];
  }
}
