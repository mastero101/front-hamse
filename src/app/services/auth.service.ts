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
        if (response.data.status === 'success') {
          localStorage.setItem('currentUser', JSON.stringify(response.data.data));
          this.currentUserSubject.next(response.data.data);
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
    this.currentUserSubject.next(null);
  }
}