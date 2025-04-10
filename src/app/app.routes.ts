import { Routes } from '@angular/router';
import { MaintenanceCalendarComponent } from './components/maintenance-calendar/maintenance-calendar.component';
import { MaintenanceProgramComponent } from './components/maintenance-program/maintenance-program.component';

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
        path: '',
        redirectTo: 'calendario-preventivo',
        pathMatch: 'full'
    }
];
