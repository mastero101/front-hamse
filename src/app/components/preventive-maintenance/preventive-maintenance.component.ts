import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-preventive-maintenance',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './preventive-maintenance.component.html',
  styleUrl: './preventive-maintenance.component.scss'
})
export class PreventiveMaintenanceComponent implements OnInit {
  maintenanceItems: string[] = [
    '1- Instalaciones de tubería eléctrica y cableado.',
    '2- Cambio de dispensarios y programación.',
    '3- Cambio e instalación de consolas EVO, Veeder-Root, Fusión.',
    '4- Cambio e instalación de motobombas.',
    '5- Cambio de contenedores motobombas, contenedor de llenado (bocatoma).',
    '6- Cambio de láminas en techumbres y canalones.',
    '7- Cambio de LEDs en tótem y dispensarios.'
  ];

  constructor() { }

  ngOnInit(): void {
  }

}
