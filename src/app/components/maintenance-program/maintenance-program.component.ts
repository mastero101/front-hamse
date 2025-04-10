import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Month {
  name: string;
  weeks: number[];
}

interface CheckState {
  month: string;
  week: number;
  state: 'unchecked' | 'verified' | 'notApplicable';
}

interface Activity {
  id: number;
  name: string;
  checkedWeeks: CheckState[];
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
    { name: 'Enero', weeks: [1, 2, 3,4] },
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

  activities: Activity[] = [
    {
      id: 1,
      name: 'PRUEBA DE VÁLVULAS SHUT-OFF DE DISPENSARIOS ( TODAS )',
      checkedWeeks: []
    },
    {
      id: 2,
      name: 'VERIFICACIÓN DE VÁLVULAS DE CORTE RÁPIDO EN MANGUERAS',
      checkedWeeks: []
    },
    {
      id: 3,
      name: 'VERIFICACIÓN DE FUGAS DE COMBUSTIBLE, AIRE Y AGUA',
      checkedWeeks: []
    },
    {
      id: 4,
      name: 'LIMPIEZA DE SONDAS Y SUS FLOTADORES ( ACTA DE HECHOS)',
      checkedWeeks: []
    },
    {
      id: 5,
      name: 'VERIFICACIÓN DE SUMINISTRO DE AGUA Y AIRE',
      checkedWeeks: []
    },
    {
      id: 6,
      name: 'VERIFICACIÓN DE SANITARIOS',
      checkedWeeks: []
    },
    {
      id: 7,
      name: 'VERIFICACIÓN Y LIMPIEZA DE TERMINALES Y PEDESTALES',
      checkedWeeks: []
    },
    {
      id: 8,
      name: 'VERIFICACIÓN DE CAJAS DE CONEXIÓN A PRUEBA DE EXPLOSIÓN',
      checkedWeeks: []
    },
    {
      id: 9,
      name: 'VERIFICACIÓN DE TUBERÍAS CONDUIT CEDULA 40',
      checkedWeeks: []
    },
    {
      id: 10,
      name: 'COPLES FLEXIBLES A PRUEBA DE EXPLOSIÓN ( TODOS )',
      checkedWeeks: []
    },
    {
      id: 11,
      name: 'PRUEBA GENERAL DE PAROS DE EMERGENCIA ( TODOS )(ACTA DE HECHOS)',
      checkedWeeks: []
    },
    {
      id: 12,
      name: 'REVISIÓN Y ARITADO DE EXTINTORES ( TODOS )',
      checkedWeeks: []
    },
    {
      id: 13,
      name: 'LIMPIEZA DE SONDAS Y SUS FLOTADORES ( ACTA DE HECHOS)',
      checkedWeeks: []
    },
    {
      id: 14,
      name: 'VERIFICACIÓN DE CONTENEDORES DE MOTOBOMBAS Y ACCESORIOS',
      checkedWeeks: []
    },
    {
      id: 15,
      name: 'VERIFICACIÓN DE ACCESORIOS DE TANQUES',
      checkedWeeks: []
    },
    {
      id: 16,
      name: 'VERIFICACIÓN DE TUBERÍAS DE COMBUSTIBLES EN GENERAL',
      checkedWeeks: []
    }
  ];

  constructor() { }

  ngOnInit(): void { }

  isWeekChecked(activity: Activity, month: Month, week: number): boolean {
    return activity.checkedWeeks.some(
      checked => checked.month === month.name && checked.week === week
    );
  }

  toggleWeek(activity: Activity, month: Month, week: number): void {
    const index = activity.checkedWeeks.findIndex(
      checked => checked.month === month.name && checked.week === week
    );
  
    if (index === -1) {
      // Si no existe, agregar como verificado
      activity.checkedWeeks.push({ month: month.name, week, state: 'verified' });
    } else {
      const currentState = activity.checkedWeeks[index].state;
      if (currentState === 'verified') {
        activity.checkedWeeks[index].state = 'notApplicable';
      } else if (currentState === 'notApplicable') {
        activity.checkedWeeks.splice(index, 1); // Volver a sin revisar
      }
    }
  }

  getWeekState(activity: Activity, month: Month, week: number): string {
    const checkState = activity.checkedWeeks.find(
      checked => checked.month === month.name && checked.week === week
    );
    return checkState ? checkState.state : 'unchecked';
  }
}
