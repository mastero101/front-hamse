import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class AdminGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean {
    const user = this.authService.currentUserValue;
    if (user && user.role === 'admin') {
      return true;
    }
    // Redirigir a la página principal si no es admin
    this.router.navigate(['/calendario-preventivo']);
    return false;
  }
} 