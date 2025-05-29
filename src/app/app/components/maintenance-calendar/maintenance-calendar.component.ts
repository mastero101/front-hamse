import { Component, OnInit } from '@angular/core';
import { ActivityService } from '../../../services/activity.service';
import { ScheduleService } from '../../../services/schedule.service';

@Component({
  selector: 'app-maintenance-calendar',
  templateUrl: './maintenance-calendar.component.html',
  styleUrls: ['./maintenance-calendar.component.css']
})
export class MaintenanceCalendarComponent implements OnInit {
  private currentScheduleHasActivities = false;

  // Propiedad para controlar la visibilidad del modal de selección de periodo
  showPeriodModal = false;

  constructor(private activityService: ActivityService, private scheduleService: ScheduleService) {}

  ngOnInit() {
    // ... existing code ...
  }

  // Método para manejar el botón 'Indicar periodo'
  openPeriodSelector(): void {
    console.log('Botón "Indicar periodo" clickeado.');
    // Mostrar el modal
    this.showPeriodModal = true;

    // La lógica para obtener la fecha seleccionada se moverá a processPeriodSelection
    // La lógica de actualización de la vista también estará en processPeriodSelection
  }

  // Método para cerrar el modal de selección de periodo
  closePeriodModal(): void {
    this.showPeriodModal = false;
  }

  // Método para procesar la fecha/periodo seleccionado del modal
  processPeriodSelection(): void {
    // TODO: Obtener la fecha seleccionada desde los campos del modal (o del datepicker)
    // Por ahora, usamos la fecha de ejemplo
    const selectedPeriodDate = new Date(2024, 9, 15); // Ejemplo: 15 de octubre de 2024
    console.log('Fecha seleccionada (procesando):', selectedPeriodDate);

    // Actualizar la vista según el tipo de vista actual
    switch (this.currentView) {
      case 'daily':
        this.loadScheduleForDate(selectedPeriodDate);
        break;
      case 'weekly':
        this.setCurrentWeek(selectedPeriodDate);
        this.loadScheduleForDate(this.currentWeekStart);
        break;
      case 'monthly':
        this.selectMonth(selectedPeriodDate.toLocaleDateString('es-ES', { month: 'long' }));
        break;
      // La vista 'yearly' no tiene este botón, pero si lo tuviera, la lógica iría aquí.
      // case 'yearly':
      //   const selectedYearStart = new Date(selectedPeriodDate.getFullYear(), 0, 1);
      //   this.loadScheduleForDate(selectedYearStart);
      //   break;
    }

    // Cerrar el modal después de procesar la selección
    this.closePeriodModal();
  }
} 