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
    { path: 'reportes-dependencias', label: 'Reportes a dependencias', icon: 'file-text' },
    { path: 'servicios', label: 'Productos y Servicios', icon: 'clipboard' },
    { path: 'mantenimiento-preventivo', label: 'Soluciones Hamse', icon: 'book' },
    { path: 'configuracion-actividades', label: 'Bitacora', icon: 'cog', adminOnly: true },
    { 
    externalUrl: 'https://www.hamse.mx/main_app/', 
    label: 'Portal Embarques', 
    icon: 'https://fontawesome.com/icons/truck-moving?f=classic&s=solid', 
    isExternal: true 
    }
  ];

  showAuthModal = false;
  showRegisterModal = false;

  constructor(public authService: AuthService) {}

  get isAdmin(): boolean {
    return this.authService.currentUserValue?.role === 'admin';
  }

  get visibleNavItems() {
    return this.navItems.filter(item => !item.adminOnly || this.isAdmin);
  }

  openRegisterModal() {
    this.showRegisterModal = true;
  }

  logout() {
    this.authService.logout();
  }

  setFallback(event: Event, fallbackUrl: string) {
    const img = event.target as HTMLImageElement | null;
    if (img) {
      img.src = fallbackUrl;
    }
  }
}
