import { Routes } from '@angular/router';
import { MaintenanceCalendarComponent } from './components/maintenance-calendar/maintenance-calendar.component';
import { MaintenanceProgramComponent } from './components/maintenance-program/maintenance-program.component';
import { DependencyReportsComponent } from './components/dependency-reports/dependency-reports.component';
import { ServicesOfferedComponent } from './components/services-offered/services-offered.component';
import { PreventiveMaintenanceComponent } from './components/preventive-maintenance/preventive-maintenance.component';

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
        path: 'servicios',
        component: ServicesOfferedComponent
    },
    {
        path:'mantenimiento-preventivo',
        component: PreventiveMaintenanceComponent
    },
    {
        path: '',
        redirectTo: 'calendario-preventivo',
        pathMatch: 'full'
    }
];
