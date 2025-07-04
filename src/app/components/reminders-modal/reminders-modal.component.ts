import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-reminders-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reminders-modal.component.html',
  styleUrl: './reminders-modal.component.scss'
})
export class RemindersModalComponent {
  @Input() isVisible: boolean = false;
  @Output() close = new EventEmitter<void>();

  @Input() reminderTitle: string = 'Realizar COA';
  @Input() reminderButtonText: string = 'Ver COA en soluciones HAMSE';
  @Input() reminderDeadline: string = 'Limite: 30 de junio 2025';
  @Input() reminderDetails: string = 'Realiza tu trámite COA con nosotros, obten puntos adicionales de fidelidad y descuentos';
  @Input() externalLink: string = 'https://soluciones.hamse.com.mx/coa';
  @Input() reminderImage: string = '../../../assets/images/HAMSE_Cedula_Operacion.png';

  // Inputs para edición
  @Input() isAdmin: boolean = false;
  @Input() editMode: boolean = false;
  @Input() tempAnnouncement: any;
  @Input() loadingSave: boolean = false;
  @Input() loadingImage: boolean = false;
  @Input() imageUploadError: string = '';

  // Outputs para acciones de edición
  @Output() startEditAnnouncement = new EventEmitter<void>();
  @Output() saveAnnouncement = new EventEmitter<void>();
  @Output() cancelEditAnnouncement = new EventEmitter<void>();
  @Output() imageFileSelected = new EventEmitter<File>();

  constructor() { }

  closeModal(): void {
    this.close.emit();
  }

  onActionClick(): void {
    window.open(this.externalLink, '_blank');
    // Opcional: puedes decidir si cerrar el modal después de hacer clic en el botón de acción
    // this.closeModal();
  }

  setFallback(event: Event, fallbackUrl: string) {
    const img = event.target as HTMLImageElement | null;
    if (img) {
      img.src = fallbackUrl;
    }
  }

  onImageFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.imageFileSelected.emit(input.files[0]);
    }
  }
}
