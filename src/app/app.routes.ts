import { Routes } from '@angular/router';
import { MaintenanceCalendarComponent } from './components/maintenance-calendar/maintenance-calendar.component';
import { MaintenanceProgramComponent } from './components/maintenance-program/maintenance-program.component';
import { DependencyReportsComponent } from './components/dependency-reports/dependency-reports.component';

export const routes: Routes = [
    {
        path: 'calendario-preventivo',
        component: MaintenanceCalendarComponent
    },
    {
        path: 'programa-mantenimiento',
        component: MaintenanceProgramComponent
    },
    {
        path: 'reportes-dependencias',
        component: DependencyReportsComponent
    },
    {
        path: '',
        redirectTo: 'calendario-preventivo',
        pathMatch: 'full'
    }
];
