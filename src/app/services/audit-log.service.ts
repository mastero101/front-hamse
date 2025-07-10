import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import axios from '../config/axios.config';

export interface AuditLog {
  id?: number;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  scheduleId: string;
  activities: any[];
  timestamp: string;
}

@Injectable({ providedIn: 'root' })
export class AuditLogService {
  private endpoint = '/audit-logs';

  constructor() {}

  createAuditLog(auditData: AuditLog): Observable<AuditLog> {
    return new Observable(subscriber => {
      axios.post(this.endpoint, auditData)
        .then(response => subscriber.next(response.data))
        .catch(error => subscriber.error(error))
        .finally(() => subscriber.complete());
    });
  }

  getAuditLogs(params?: any): Observable<AuditLog[]> {
    return new Observable(subscriber => {
      axios.get(this.endpoint, { params })
        .then(response => subscriber.next(response.data))
        .catch(error => subscriber.error(error))
        .finally(() => subscriber.complete());
    });
  }
} 