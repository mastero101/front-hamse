import { Component, OnInit } from '@angular/core';
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

  ngOnInit() {
    this.setCurrentWeek();
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
    }
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
