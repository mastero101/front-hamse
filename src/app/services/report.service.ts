import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import axios from '../config/axios.config';

export interface Report {
  id: string;
  title: string;
  type: 'weekly' | 'monthly' | 'custom';
  periodStart: Date;
  periodEnd: Date;
  summary?: string;
  completionRate: number;
  generatedBy: string;
  generatedAt: Date;
  data: {
    schedules: {
      id: string;
      progress: number;
      activities: {
        name: string;
        status: string;
      }[];
    }[];
  };
}

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private endpoint = '/reports';

  constructor() {}

  getAllReports(): Observable<Report[]> {
    return new Observable(subscriber => {
      axios.get(this.endpoint)
        .then(response => subscriber.next(response.data.data))
        .catch(error => subscriber.error(error))
        .finally(() => subscriber.complete());
    });
  }

  getReportById(id: string): Observable<Report> {
    return new Observable(subscriber => {
      axios.get(`${this.endpoint}/${id}`)
        .then(response => subscriber.next(response.data.data))
        .catch(error => subscriber.error(error))
        .finally(() => subscriber.complete());
    });
  }

  generateReport(reportData: {
    type: 'weekly' | 'monthly' | 'custom';
    periodStart: Date;
    periodEnd: Date;
    title?: string;
  }): Observable<Report> {
    return new Observable(subscriber => {
      axios.post(`${this.endpoint}/generate`, reportData)
        .then(response => subscriber.next(response.data.data))
        .catch(error => subscriber.error(error))
        .finally(() => subscriber.complete());
    });
  }

  deleteReport(id: string): Observable<void> {
    return new Observable(subscriber => {
      axios.delete(`${this.endpoint}/${id}`)
        .then(() => subscriber.next())
        .catch(error => subscriber.error(error))
        .finally(() => subscriber.complete());
    });
  }
}