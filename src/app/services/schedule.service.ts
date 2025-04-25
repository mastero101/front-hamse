import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import axios from '../config/axios.config';
import { Activity } from './activity.service';

export interface Schedule {
  id: string;
  startDate: string;
  endDate: string;
  type: 'weekly' | 'monthly';
  status: 'pending' | 'in_progress' | 'completed';
  progress: number;
  assignedTo: string;
  activities?: Activity[];
  User?: {
    id: string;
    username: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ScheduleService {
  private endpoint = '/schedules';

  constructor() {}

  getSchedules(): Observable<Schedule[]> {
    return new Observable(subscriber => {
      axios.get(this.endpoint)
        .then(response => subscriber.next(response.data.data))
        .catch(error => subscriber.error(error))
        .finally(() => subscriber.complete());
    });
  }

  getSchedule(id: string): Observable<Schedule> {
    return new Observable(subscriber => {
      axios.get(`${this.endpoint}/${id}`)
        .then(response => subscriber.next(response.data.data))
        .catch(error => subscriber.error(error))
        .finally(() => subscriber.complete());
    });
  }

  createSchedule(schedule: Omit<Schedule, 'id' | 'progress'>): Observable<Schedule> {
    const token = localStorage.getItem('token');
    return new Observable(subscriber => {
      axios.post(this.endpoint, schedule, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
        .then(response => subscriber.next(response.data.data))
        .catch(error => subscriber.error(error))
        .finally(() => subscriber.complete());
    });
  }

  updateSchedule(id: string, schedule: Partial<Schedule>): Observable<Schedule> {
    const token = localStorage.getItem('token');
    return new Observable(subscriber => {
      axios.put(`${this.endpoint}/${id}`, schedule, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
        .then(response => subscriber.next(response.data.data))
        .catch(error => subscriber.error(error))
        .finally(() => subscriber.complete());
    });
  }

  deleteSchedule(id: string): Observable<void> {
    return new Observable(subscriber => {
      axios.delete(`${this.endpoint}/${id}`)
        .then(() => subscriber.next())
        .catch(error => subscriber.error(error))
        .finally(() => subscriber.complete());
    });
  }

  updateProgress(id: string): Observable<{ progress: number }> {
    return new Observable(subscriber => {
      axios.put(`${this.endpoint}/${id}/progress`)
        .then(response => subscriber.next(response.data.data))
        .catch(error => subscriber.error(error))
        .finally(() => subscriber.complete());
    });
  }
}