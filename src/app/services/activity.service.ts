import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import axios from '../config/axios.config';

export interface Activity {
  id: string;
  name: string;
  description?: string;
  category?: string;
  area?: string;
  frequency?: string;
  expectedDuration: number;
  priority: 'low' | 'medium' | 'high';
}

export interface PaginatedActivitiesResponse {
  data: Activity[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable({
  providedIn: 'root'
})
export class ActivityService {
  private endpoint = '/activities';

  constructor() {}

  getActivities(page: number = 1, limit: number = 10, category?: string): Observable<PaginatedActivitiesResponse> {
    // const token = localStorage.getItem('token'); // Eliminado: el interceptor de Axios maneja la autorización
    return new Observable(subscriber => {
      const params: any = { 
        page,
        limit
      };
      if (category) {
        params.category = category;
      }

      axios.get(this.endpoint, {
        // headers: { // Eliminado: el interceptor de Axios maneja la autorización, Content-Type no es necesario para GET
        //   'Authorization': `Bearer ${token}`,
        //   'Content-Type': 'application/json'
        // },
        params: params
      })
        .then(response => {
          // Ajuste para la estructura de respuesta del backend:
          // { success: true, message: "...", data: { totalItems, items, totalPages, currentPage } }
          if (response.data && response.data.success === true && response.data.data && typeof response.data.data.totalItems !== 'undefined') {
            const backendData = response.data.data;
            const paginatedResponse: PaginatedActivitiesResponse = {
              data: backendData.items, // Array de actividades
              total: backendData.totalItems,
              page: backendData.currentPage,
              limit: limit, // El 'limit' que se pasó a la función
              totalPages: backendData.totalPages
            };
            subscriber.next(paginatedResponse);
          } else if (response.data && response.data.data && response.data.pagination) { // Estructura alternativa
            const paginatedData: PaginatedActivitiesResponse = {
              data: response.data.data,
              total: response.data.pagination.totalItems,
              page: response.data.pagination.currentPage,
              limit: response.data.pagination.pageSize,
              totalPages: response.data.pagination.totalPages
            };
            subscriber.next(paginatedData);
          } else if (response.data && Array.isArray(response.data.data) && response.data.total !== undefined) { // Otra estructura común
            const totalPages = Math.ceil(response.data.total / (response.data.limit || limit));
            const paginatedData: PaginatedActivitiesResponse = {
              data: response.data.data,
              total: response.data.total,
              page: response.data.page || page,
              limit: response.data.limit || limit,
              totalPages: totalPages
            };
            subscriber.next(paginatedData);
          }
          else {
            console.warn('La respuesta de getActivities no tiene la estructura esperada para paginación.');
            subscriber.next({ data: response.data?.data?.items || response.data?.data || [], total: 0, page: 1, limit: limit, totalPages: 0 });
          }
        })
        .catch(error => subscriber.error(error))
        .finally(() => subscriber.complete());
    });
  }

  getActivity(id: string): Observable<Activity> {
    return new Observable(subscriber => {
      axios.get(`${this.endpoint}/${id}`) // Asumimos que esta ruta también está protegida y el interceptor actuará
        .then(response => subscriber.next(response.data.data))
        .catch(error => subscriber.error(error))
        .finally(() => subscriber.complete());
    });
  }

  createActivity(activity: Omit<Activity, 'id'>): Observable<Activity> {
    // const token = localStorage.getItem('token'); // Eliminado
    return new Observable(subscriber => {
      axios.post(this.endpoint, activity, {
        // headers: { // Eliminado: el interceptor maneja Authorization, Axios maneja Content-Type para objetos JSON
        //   'Authorization': `Bearer ${token}`,
        //   'Content-Type': 'application/json'
        // }
      })
        .then(response => subscriber.next(response.data.data))
        .catch(error => subscriber.error(error))
        .finally(() => subscriber.complete());
    });
  }

  updateActivity(id: string, activity: Partial<Activity>): Observable<Activity> {
    // const token = localStorage.getItem('token'); // Eliminado
    return new Observable(subscriber => {
      axios.put(`${this.endpoint}/${id}`, activity, {
        // headers: { // Eliminado
        //   'Authorization': `Bearer ${token}`,
        //   'Content-Type': 'application/json'
        // }
      })
        .then(response => subscriber.next(response.data.data))
        .catch(error => subscriber.error(error))
        .finally(() => subscriber.complete());
    });
  }

  deleteActivity(id: string): Observable<void> {
    // const token = localStorage.getItem('token'); // Eliminado
    return new Observable(subscriber => {
      axios.delete(`${this.endpoint}/${id}`, { // El interceptor manejará la cabecera de Authorization
        // headers: { // Eliminado
        //   'Authorization': `Bearer ${token}`
        // }
      })
        .then(() => subscriber.next())
        .catch(error => subscriber.error(error))
        .finally(() => subscriber.complete());
    });
  }
}