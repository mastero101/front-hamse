import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-navigation',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navigation.component.html',
  styleUrl: './navigation.component.scss'
})
export class NavigationComponent {
  navItems = [
    { path: '/calendario', label: 'Calendario Preventivo', icon: 'calendar', active: true },
    { path: '/programa', label: 'Programa de mantenimiento', icon: 'wrench' },
    { path: '/reportes', label: 'Reportes e dependencias', icon: 'file-text' },
    { path: '/fichas', label: 'Fichas de requerimientos', icon: 'clipboard' },
    { path: '/grupo', label: 'Grupo de estaciones', icon: 'users' },
    { path: '/configuracion', label: 'Configuración', icon: 'cog' }
  ];
}
