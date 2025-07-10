import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivityService, Activity } from '../../services/activity.service';
import { AuditLogService, AuditLog } from '../../services/audit-log.service';
import { FormsModule } from '@angular/forms';

interface ActivityWithActive extends Activity {
  active: boolean;
}

@Component({
  selector: 'app-settings-activities',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings-activities.component.html',
  styleUrl: './settings-activities.component.scss'
})
export class SettingsActivitiesComponent implements OnInit {
  activities: ActivityWithActive[] = [];
  isLoading = false;

  
  auditLogs: AuditLog[] = [];
  isLoadingLogs = false;

  filtros = {
    userName: '',
    action: '',
    from: '',
    to: ''
  };

  constructor(
    private activityService: ActivityService,
    private auditLogService: AuditLogService
  ) {}

  ngOnInit() {
    this.isLoading = true;
    this.activityService.getActivities(1, 100, '').subscribe({
      next: (res: any) => {
        this.activities = (res.data || []).map((a: any, i: number) => ({
          ...a,
          active: typeof a.active === 'boolean' ? a.active : i % 2 === 0 // alterna para pruebas
        }));
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });

    this.cargarLogs();
  }

  cargarLogs() {
    this.isLoadingLogs = true;
    const params: any = {};
    if (this.filtros.action) params.action = this.filtros.action;
    if (this.filtros.from) params.from = this.filtros.from;
    if (this.filtros.to) params.to = this.filtros.to;
    this.auditLogService.getAuditLogs(params).subscribe({
      next: (logs) => {
        // Filtro de usuario por nombre en frontend
        this.auditLogs = this.filtros.userName
          ? logs.filter(log => log.userName?.toLowerCase().includes(this.filtros.userName.toLowerCase()))
          : logs;
        this.isLoadingLogs = false;
      },
      error: () => {
        this.isLoadingLogs = false;
      }
    });
  }

  filtrarLogs() {
    this.cargarLogs();
  }

  limpiarFiltros() {
    this.filtros = { userName: '', action: '', from: '', to: '' };
    this.cargarLogs();
  }

  toggleActive(activity: any) {
    activity.active = !activity.active;
    // Aquí podrías llamar al backend para guardar el cambio
    // Por ahora solo cambia en frontend
  }
} 