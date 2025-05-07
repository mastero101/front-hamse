import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-reminders-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reminders-modal.component.html',
  styleUrl: './reminders-modal.component.scss'
})
export class RemindersModalComponent {
  @Input() isVisible: boolean = false;
  @Output() close = new EventEmitter<void>();

  reminderTitle: string = 'Realizar COA';
  reminderButtonText: string = 'Ver COA en soluciones HAMSE';
  reminderDeadline: string = 'Limite: 30 de junio 2025';
  reminderDetails: string = 'Realiza tu trámite COA con nosotros, obten puntos adicionales de fidelidad y descuentos';
  // Cambia este enlace por el real
  externalLink: string = 'https://soluciones.hamse.com.mx/coa';

  constructor() { }

  closeModal(): void {
    this.close.emit();
  }

  onActionClick(): void {
    window.open(this.externalLink, '_blank');
    // Opcional: puedes decidir si cerrar el modal después de hacer clic en el botón de acción
    // this.closeModal();
  }
}
