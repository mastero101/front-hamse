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
  activities?: Activity[]; // This might need to be BackendActivity from the component if used here
  User?: {
    id: string;
    username: string;
  };
  // Add Activities if it's part of the main Schedule type from backend
  Activities?: Activity[]; // Or use BackendActivity if defined globally/imported
}

// Define the interface for the status update payload
// Define the type for a single status update (if not already defined)
export interface ActivityStatusUpdate { // <-- Asegúrate que esta interfaz exista y sea exportada si es necesario
  activityId: string;
  state: string;
  notes?: string; // Optional notes
}

// Define the type for the payload object the backend expects
export interface ActivityStatusPayload { // <-- Define esta interfaz
  statuses: ActivityStatusUpdate[];
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

  // --- Added Method ---
  // Cambia el tipo del segundo parámetro de ActivityStatusUpdate[] a ActivityStatusPayload
  updateActivityStatuses(scheduleId: string, payload: ActivityStatusPayload): Observable<any> { // <-- Firma corregida
    const token = localStorage.getItem('token');
    const url = `${this.endpoint}/${scheduleId}/statuses`;
    console.log(`Sending PUT request to ${url} with payload:`, payload); // Log opcional
    return new Observable(subscriber => {
      // Ahora 'payload' ya tiene la estructura { statuses: [...] } que espera axios.put
      axios.put(url, payload, { // <-- Pasa el objeto payload directamente
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
        .then(response => subscriber.next(response.data))
        .catch(error => subscriber.error(error))
        .finally(() => subscriber.complete());
    });
  }
  // --- End Method ---
}