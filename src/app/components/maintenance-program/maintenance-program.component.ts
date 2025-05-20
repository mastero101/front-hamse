import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivityService, PaginatedActivitiesResponse, Activity as ServiceActivity } from '../../services/activity.service'; // Renombramos Activity importada

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

  constructor(private activityService: ActivityService) { }

  ngOnInit(): void {
    this.loadProgramActivities();
  }

  loadProgramActivities(): void {
    this.isLoading = true;
    // El servicio ahora debería recibir actividades filtradas por 'program' desde el backend
    this.activityService.getActivities(1, 100, 'program').subscribe({
      next: (response: PaginatedActivitiesResponse) => {
        const allFetchedActivities = response.data.map((serviceActivity: ServiceActivity) => {
          return {
            id: serviceActivity.id,
            name: serviceActivity.name,
            checkedWeeks: [], // Inicializa checkedWeeks vacío
            frequency: serviceActivity.frequency,
            expectedDuration: serviceActivity.expectedDuration,
            category: serviceActivity.category
          };
        });

        // Ya no debería ser necesario el filtro en el cliente si el backend funciona como se espera.
        // Si aún se necesita por alguna razón, se puede descomentar, pero idealmente el backend maneja esto.
        // this.activities = allFetchedActivities.filter(activity => activity.category === 'program');
        this.activities = allFetchedActivities; // Asumimos que el backend ya filtró

        // Este log es útil para confirmar cuántas actividades de 'program' se cargaron.
        console.log('Actividades de PROGRAMA cargadas:', this.activities.length);
        
        // Opcional: Advertencia si, a pesar de todo, llegan actividades de otra categoría
        // Esto solo sería relevante si el backend NO estuviera filtrando correctamente.
        const nonProgramActivities = this.activities.filter(act => act.category !== 'program').length;
        if (nonProgramActivities > 0) {
          console.warn(`ADVERTENCIA: Se encontraron ${nonProgramActivities} actividades que no son de categoría 'program' después de la carga inicial. Esto podría indicar un problema en el filtro del backend.`);
        }

        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar actividades de PROGRAMA:', error);
        this.isLoading = false;
      }
    });
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
