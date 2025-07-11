import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivityService, Activity } from '../../services/activity.service';
import { AuditLogService, AuditLog } from '../../services/audit-log.service';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

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

  expandedLogs = new Set<number>();

  isAdmin = false;
  mesesEliminar = 2;
  mostrarConfirmacion = false;
  isEliminandoLogs = false;

  constructor(
    private activityService: ActivityService,
    private auditLogService: AuditLogService,
    private authService: AuthService
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

    // Validar admin igual que navigation
    this.isAdmin = this.authService.currentUserValue?.role === 'admin';
    this.cargarLogs();
  }

  cargarLogs() {
    this.isLoadingLogs = true;
    const params: any = {};
    // Agregar logs para depuración
    console.log('[BITÁCORA] Filtros antes de formatear:', this.filtros);
    if (this.filtros.from) {
      params.from = this.formatDateISO(this.filtros.from);
      console.log('[BITÁCORA] Fecha desde (formateada):', params.from);
    }
    if (this.filtros.to) {
      params.to = this.formatDateISO(this.filtros.to);
      console.log('[BITÁCORA] Fecha hasta (formateada):', params.to);
    }
    this.auditLogService.getAuditLogs(params).subscribe({
      next: (logs) => {
        let filtered = logs;
        // Filtro de usuario
        if (this.filtros.userName) {
          filtered = filtered.filter(log =>
            log.userName?.toLowerCase().includes(this.filtros.userName.toLowerCase())
          );
        }
        // Filtro de acción (soporta sufijos)
        if (this.filtros.action) {
          filtered = filtered.filter(log =>
            log.action?.startsWith(this.filtros.action)
          );
        }
        this.auditLogs = filtered;
        this.isLoadingLogs = false;
        console.log('[BITÁCORA] Logs filtrados:', this.auditLogs);
      },
      error: () => {
        this.isLoadingLogs = false;
      }
    });
  }

  filtrarLogs() {
    // Agregar log para depuración
    console.log('[BITÁCORA] Ejecutando filtrarLogs con filtros:', this.filtros);
    this.cargarLogs();
  }

  limpiarFiltros() {
    this.filtros = { userName: '', action: '', from: '', to: '' };
    this.cargarLogs();
  }

  toggleActive(activity: any) {
    activity.active = !activity.active;
  }

  toggleExpandLog(index: number) {
    if (this.expandedLogs.has(index)) {
      this.expandedLogs.delete(index);
    } else {
      this.expandedLogs.add(index);
    }
  }

  isLogExpanded(index: number): boolean {
    return this.expandedLogs.has(index);
  }

  confirmarEliminarLogs() {
    this.mostrarConfirmacion = true;
  }

  eliminarLogs() {
    this.isEliminandoLogs = true;
    this.auditLogService.cleanupOldLogs(this.mesesEliminar).subscribe({
      next: (res) => {
        alert(res.message || 'Logs eliminados correctamente');
        this.mostrarConfirmacion = false;
        this.cargarLogs();
      },
      error: (err) => {
        alert('Error al eliminar logs: ' + (err?.error?.message || ''));
        this.mostrarConfirmacion = false;
      },
      complete: () => {
        this.isEliminandoLogs = false;
      }
    });
  }

  // Función auxiliar para formatear la fecha
  private formatDateISO(dateStr: string): string {
    if (!dateStr) return '';
    // Si ya es formato YYYY-MM-DD, regresa igual
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
    // Si es MM/DD/YYYY o DD/MM/YYYY, intenta parsear
    const parts = dateStr.split(/[\/\-]/);
    if (parts.length === 3) {
      // Si el año es primero
      if (parts[0].length === 4) {
        return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
      }
      // Si el año es último (DD/MM/YYYY o MM/DD/YYYY)
      if (parts[2].length === 4) {
        // Asume MM/DD/YYYY (por input type date en navegadores en inglés)
        return `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
      }
    }
    // Último recurso: usar Date
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toISOString().split('T')[0];
    }
    return dateStr;
  }
} 