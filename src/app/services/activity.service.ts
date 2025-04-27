import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import axios from '../config/axios.config';

export interface Activity {
  id: string;
  name: string;
  description?: string;
  frequency: 'weekly' | 'monthly';
  expectedDuration: number;
  category?: string;
  priority: 'low' | 'medium' | 'high';
}

@Injectable({
  providedIn: 'root'
})
export class ActivityService {
  private endpoint = '/activities';

  constructor() {}

  getActivities(): Observable<Activity[]> {
    const token = localStorage.getItem('token');
    return new Observable(subscriber => {
      axios.get(this.endpoint, {
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

  getActivity(id: string): Observable<Activity> {
    return new Observable(subscriber => {
      axios.get(`${this.endpoint}/${id}`)
        .then(response => subscriber.next(response.data.data))
        .catch(error => subscriber.error(error))
        .finally(() => subscriber.complete());
    });
  }

  createActivity(activity: Omit<Activity, 'id'>): Observable<Activity> {
    const token = localStorage.getItem('token');
    return new Observable(subscriber => {
      axios.post(this.endpoint, activity, {
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

  updateActivity(id: string, activity: Partial<Activity>): Observable<Activity> {
    const token = localStorage.getItem('token');
    return new Observable(subscriber => {
      axios.put(`${this.endpoint}/${id}`, activity, {
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

  deleteActivity(id: string): Observable<void> {
    const token = localStorage.getItem('token'); // Asegúrate de obtener el token si es necesario
    return new Observable(subscriber => {
      axios.delete(`${this.endpoint}/${id}`, { // Añadir config con headers si es necesario
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
        .then(() => subscriber.next())
        .catch(error => subscriber.error(error))
        .finally(() => subscriber.complete());
    });
  }
}