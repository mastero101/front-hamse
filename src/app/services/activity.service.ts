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
    return new Observable(subscriber => {
      axios.get(this.endpoint)
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
    return new Observable(subscriber => {
      axios.post(this.endpoint, activity)
        .then(response => subscriber.next(response.data.data))
        .catch(error => subscriber.error(error))
        .finally(() => subscriber.complete());
    });
  }

  updateActivity(id: string, activity: Partial<Activity>): Observable<Activity> {
    return new Observable(subscriber => {
      axios.put(`${this.endpoint}/${id}`, activity)
        .then(response => subscriber.next(response.data.data))
        .catch(error => subscriber.error(error))
        .finally(() => subscriber.complete());
    });
  }

  deleteActivity(id: string): Observable<void> {
    return new Observable(subscriber => {
      axios.delete(`${this.endpoint}/${id}`)
        .then(() => subscriber.next())
        .catch(error => subscriber.error(error))
        .finally(() => subscriber.complete());
    });
  }
}