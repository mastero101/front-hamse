import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface CalendarDay {
  day: number;
  completed: boolean;
  isToday: boolean;
  disabled: boolean;
}

type ActivityStatus = 'sin_revision' | 'verificado' | 'no_aplica';

interface Activity {
  id: number;
  name: string;
  status: ActivityStatus;
}

@Component({
  selector: 'app-maintenance-calendar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './maintenance-calendar.component.html',
  styleUrl: './maintenance-calendar.component.scss'
})
export class MaintenanceCalendarComponent {
  completionPercentage = 0;
  currentMonth = 'Febrero';
  weekDays = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];
  
  calendarDays: CalendarDay[] = Array.from({ length: 28 }, (_, i) => ({
    day: i + 1,
    completed: i + 1 <= 21,
    isToday: i + 1 === 24,
    disabled: i + 1 >= 25
  }));

  activities: Activity[] = [
    { id: 1, name: 'VERIFICACIÓN DE VÁLVULAS DE CORTE RÁPIDO EN MANGUERAS', status: 'sin_revision' },
    { id: 2, name: 'SEÑALAMIENTOS RESTRICTIVOS Y PREVENTIVOS', status: 'sin_revision' },
    { id: 3, name: 'SISTEMA DE TRATAMIENTO DE AGUAS RESIDUALES', status: 'sin_revision' },
    { id: 4, name: 'VERIFICACIÓN DEL COMPRESOR', status: 'sin_revision' },
    { id: 5, name: 'BITÁCORA DE OPERACIÓN Y MANTENIMIENTO', status: 'sin_revision' },
    { id: 6, name: 'VERIFICACIÓN DE PISTOLAS DE DESPACHO', status: 'sin_revision' },
    { id: 7, name: 'LIMPIEZA DE TRAMPA DE COMBUSTIBLE', status: 'sin_revision' }
  ];

  toggleActivityStatus(activity: Activity) {
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
    this.updateCompletionPercentage();
  }

  private updateCompletionPercentage() {
    const verifiedActivities = this.activities.filter(a => a.status === 'verificado').length;
    this.completionPercentage = Math.round((verifiedActivities / this.activities.length) * 100);
  }
}
