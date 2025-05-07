import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, from } from 'rxjs';
import { tap } from 'rxjs/operators';
import axios from '../config/axios.config';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = '/auth';
  private currentUserSubject: BehaviorSubject<any>;
  public currentUser: Observable<any>;

  constructor() {
    this.currentUserSubject = new BehaviorSubject<any>(
      JSON.parse(localStorage.getItem('currentUser') || 'null')
    );
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue() {
    return this.currentUserSubject.value;
  }

  signup(username: string, email: string, password: string, isAdmin: boolean = false): Observable<any> {
    const currentUser = this.currentUserValue;
    
    if (!currentUser?.accessToken || currentUser?.role !== 'admin') {
      return new Observable(subscriber => {
        subscriber.error({
          response: {
            data: {
              message: 'Se requieren permisos de administrador para realizar registros.'
            }
          }
        });
      });
    }

    return from(axios.post(`${this.apiUrl}/signup`, {
      username,
      email,
      password,
      role: isAdmin ? 'admin' : 'user'
    })).pipe(
      tap({
        next: (response) => {
          if (response.data?.status === 'success') {
            console.log('Usuario registrado exitosamente');
          }
        },
        error: (error) => {
          console.error('Error completo:', error);
          console.error('Headers de la petición:', error.config?.headers);
        }
      })
    );
  }

  signin(username: string, password: string): Observable<any> {
    return from(axios.post(`${this.apiUrl}/signin`, {
      username,
      password
    })).pipe(
      tap(response => {
        if (response.data.status === 'success' && response.data.data) {
          const userData = response.data.data;
          localStorage.setItem('currentUser', JSON.stringify(userData));
          // Guardar el accessToken por separado
          if (userData.accessToken) {
            localStorage.setItem('token', userData.accessToken);
          }
          this.currentUserSubject.next(userData);
        }
      })
    );
  }

  changePassword(currentPassword: string, newPassword: string): Observable<any> {
    return from(axios.post(`${this.apiUrl}/change-password`, {
      currentPassword,
      newPassword
    }));
  }

  logout() {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    this.currentUserSubject.next(null);
    window.location.reload();
  }
}