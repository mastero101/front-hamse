import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RemindersModalComponent } from '../reminders-modal/reminders-modal.component';
import { SettingsService } from '../../services/settings.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-preventive-maintenance',
  standalone: true,
  imports: [CommonModule, RemindersModalComponent],
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

  // Variables para el anuncio
  showAnnouncementModal = false;
  announcementTitle = '¡Nuevo Servicio Disponible!';
  announcementImage = '../../../assets/images/HAMSE_Cedula_Operacion.png';
  announcementButtonText = 'Más información';
  announcementDeadline = 'Vigente hasta el 31 de julio 2024';
  announcementDetails = 'Descubre nuestro nuevo servicio de mantenimiento preventivo con beneficios exclusivos.';
  announcementLink = 'https://www.hamse.mx/public/contacto/';

  // --- Edición de anuncio ---
  isAdmin = false;
  editMode = false;
  tempAnnouncement = {
    title: '',
    image: '',
    buttonText: '',
    deadline: '',
    details: '',
    link: ''
  };
  loadingSave = false;
  loadingImage = false;
  imageUploadError = '';

  constructor(
    private settingsService: SettingsService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.checkAdminStatus();
    // Cargar los valores del backend
    const keys = [
      { key: 'announcementTitle', prop: 'announcementTitle' },
      { key: 'announcementImage', prop: 'announcementImage' },
      { key: 'announcementButtonText', prop: 'announcementButtonText' },
      { key: 'announcementDeadline', prop: 'announcementDeadline' },
      { key: 'announcementDetails', prop: 'announcementDetails' },
      { key: 'announcementLink', prop: 'announcementLink' }
    ];
    keys.forEach(({ key, prop }) => {
      this.settingsService.getSettingByKey(key).subscribe({
        next: (res) => {
          if (res && res.value) {
            (this as any)[prop] = res.value;
          }
        },
        error: () => {
          // Si no existe, se mantiene el valor por defecto
        }
      });
    });
    setTimeout(() => {
      this.showAnnouncementModal = true;
    }, 300); // Pequeño delay para evitar parpadeo
  }

  checkAdminStatus(): void {
    const currentUser = this.authService.currentUserValue;
    this.isAdmin = currentUser?.role === 'admin';
  }

  closeAnnouncementModal(): void {
    this.showAnnouncementModal = false;
  }

  startEditAnnouncement(): void {
    this.editMode = true;
    this.tempAnnouncement = {
      title: this.announcementTitle,
      image: this.announcementImage,
      buttonText: this.announcementButtonText,
      deadline: this.announcementDeadline,
      details: this.announcementDetails,
      link: this.announcementLink
    };
  }

  cancelEditAnnouncement(): void {
    this.editMode = false;
  }

  saveAnnouncement(): void {
    this.loadingSave = true;
    const updates = [
      { key: 'announcementTitle', value: this.tempAnnouncement.title },
      { key: 'announcementImage', value: this.tempAnnouncement.image },
      { key: 'announcementButtonText', value: this.tempAnnouncement.buttonText },
      { key: 'announcementDeadline', value: this.tempAnnouncement.deadline },
      { key: 'announcementDetails', value: this.tempAnnouncement.details },
      { key: 'announcementLink', value: this.tempAnnouncement.link }
    ];
    let completed = 0;
    updates.forEach(update => {
      this.settingsService.updateSettingByKey(update.key, update.value).subscribe({
        next: () => {
          completed++;
          if (completed === updates.length) {
            // Actualizar los valores locales
            this.announcementTitle = this.tempAnnouncement.title;
            this.announcementImage = this.tempAnnouncement.image;
            this.announcementButtonText = this.tempAnnouncement.buttonText;
            this.announcementDeadline = this.tempAnnouncement.deadline;
            this.announcementDetails = this.tempAnnouncement.details;
            this.announcementLink = this.tempAnnouncement.link;
            this.editMode = false;
            this.loadingSave = false;
          }
        },
        error: () => {
          this.loadingSave = false;
          // Aquí podrías mostrar un mensaje de error
        }
      });
    });
  }

  onAnnouncementImageSelected(file: File) {
    this.loadingImage = true;
    this.imageUploadError = '';
    this.settingsService.uploadImage(file).subscribe({
      next: (res) => {
        if (res && res.url) {
          this.tempAnnouncement.image = res.url;
        } else {
          this.imageUploadError = 'No se pudo obtener la URL de la imagen.';
        }
        this.loadingImage = false;
      },
      error: (err) => {
        this.imageUploadError = 'Error al subir la imagen.';
        this.loadingImage = false;
      }
    });
  }
}
