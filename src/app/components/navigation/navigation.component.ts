import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthModalComponent } from '../auth-modal/auth-modal.component';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navigation',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, AuthModalComponent],
  templateUrl: './navigation.component.html',
  styleUrl: './navigation.component.scss'
})
export class NavigationComponent {
  navItems = [
    { path: 'calendario-preventivo', label: 'Calendario Preventivo', icon: 'calendar', active: true },
    { path: 'programa-mantenimiento', label: 'Programa de mantenimiento', icon: 'wrench' },
    { path: 'reportes', label: 'Reportes e dependencias', icon: 'file-text' },
    { path: 'fichas', label: 'Fichas de requerimientos', icon: 'clipboard' },
    { path: 'grupo', label: 'Grupo de estaciones', icon: 'users' },
    { path: 'configuracion', label: 'Configuración', icon: 'cog' }
  ];

  showAuthModal = false;
  showRegisterModal = false;

  constructor(public authService: AuthService) {}

  get isAdmin(): boolean {
    return this.authService.currentUserValue?.role === 'admin';
  }

  openRegisterModal() {
    this.showRegisterModal = true;
  }

  logout() {
    this.authService.logout();
  }
}
