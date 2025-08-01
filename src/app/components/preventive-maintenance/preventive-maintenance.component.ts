import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RemindersModalComponent } from '../reminders-modal/reminders-modal.component';
import { SettingsService } from '../../services/settings.service';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-preventive-maintenance',
  standalone: true,
  imports: [CommonModule, FormsModule, RemindersModalComponent],
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

  // Variables para el contenido integrado de mantenimiento preventivo
  showMaintenanceContent = true;
  maintenanceTitle = '¡Nuevo Servicio de Mantenimiento Preventivo!';
  maintenanceImage = '../../../assets/images/HAMSE_Cedula_Operacion.png';
  maintenanceButtonText = 'Más información';
  maintenanceDeadline = 'Vigente hasta el 31 de julio 2024';
  maintenanceDetails = 'Descubre nuestro nuevo servicio de mantenimiento preventivo con beneficios exclusivos.';
  maintenanceLink = 'https://www.hamse.mx/public/contacto/';

  // Variables del modal original
  showAnnouncementModal = false;
  announcementTitle = '¡Nuevo Servicio Disponible!';
  announcementImage = '../../../assets/images/HAMSE_Cedula_Operacion.png';
  announcementButtonText = 'Más información';
  announcementDeadline = 'Vigente hasta el 31 de julio 2024';
  announcementDetails = 'Descubre nuestro nuevo servicio de mantenimiento preventivo con beneficios exclusivos.';
  announcementLink = 'https://www.hamse.mx/public/contacto/';

  // 👇 Variables del formulario de contacto
  contactData = {
    name: '',
    email: '',
    phone: '',
    service: '',
    message: ''
  };
  contactSubmitting = false;
  contactSuccess = false;
  contactError = '';

  // Edición del contenido
  isAdmin = false;
  editMode = false;
  tempMaintenance = {
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

  // Variables temporales del modal original
  tempAnnouncement = {
    title: '',
    image: '',
    buttonText: '',
    deadline: '',
    details: '',
    link: ''
  };

  constructor(
    private settingsService: SettingsService,
    private authService: AuthService,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    this.checkAdminStatus();
    
    // Cargar los valores del backend para mantenimiento
    const maintenanceKeys = [
      { key: 'maintenanceTitle', prop: 'maintenanceTitle' },
      { key: 'maintenanceImage', prop: 'maintenanceImage' },
      { key: 'maintenanceButtonText', prop: 'maintenanceButtonText' },
      { key: 'maintenanceDeadline', prop: 'maintenanceDeadline' },
      { key: 'maintenanceDetails', prop: 'maintenanceDetails' },
      { key: 'maintenanceLink', prop: 'maintenanceLink' }
    ];
    
    maintenanceKeys.forEach(({ key, prop }) => {
      this.settingsService.getSettingByKey(key).subscribe({
        next: (res) => {
          if (res && res.value) {
            (this as any)[prop] = res.value;
          }
        }
      });
    });

    // Cargar los valores del backend para anuncio
    const announcementKeys = [
      { key: 'announcementTitle', prop: 'announcementTitle' },
      { key: 'announcementImage', prop: 'announcementImage' },
      { key: 'announcementButtonText', prop: 'announcementButtonText' },
      { key: 'announcementDeadline', prop: 'announcementDeadline' },
      { key: 'announcementDetails', prop: 'announcementDetails' },
      { key: 'announcementLink', prop: 'announcementLink' }
    ];
    
    announcementKeys.forEach(({ key, prop }) => {
      this.settingsService.getSettingByKey(key).subscribe({
        next: (res) => {
          if (res && res.value) {
            (this as any)[prop] = res.value;
          }
        }
      });
    });

    this.showAnnouncementModal = false;
  }

  // 👇 MÉTODOS DEL FORMULARIO DE CONTACTO
 onContactSubmit(): void {
  if (this.contactSubmitting) return;

  this.contactSubmitting = true;
  this.contactError = '';
  this.contactSuccess = false;

  const formData = new FormData();
  formData.append('name', this.contactData.name);
  formData.append('email', this.contactData.email);
  formData.append('phone', this.contactData.phone || '');
  formData.append('service', this.contactData.service || 'No especificado');
  formData.append('message', this.contactData.message);

  const self = this;
  
  // 👇 URL CORREGIDA PARA TU SERVIDOR
  const apiUrl = 'https://www.hamse.mx/public/api/contact.php';
  
  console.log('🚀 Enviando a:', apiUrl);

  fetch(apiUrl, {
    method: 'POST',
    body: formData
  })
  .then(function(response) {
    console.log('📡 Respuesta:', response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  })
  .then(function(data) {
    console.log('📦 Datos:', data);
    
    if (data.success) {
      self.contactSuccess = true;
      self.contactError = '';
      console.log('✅ Mensaje enviado exitosamente');
    } else {
      self.contactError = data.message || 'Error al enviar el mensaje';
      console.error('❌ Error del servidor:', self.contactError);
    }
    self.contactSubmitting = false;
  })
  .catch(function(error) {
    console.error('🚨 Error:', error);
    self.contactError = 'Error de conexión. Por favor, intenta nuevamente.';
    self.contactSubmitting = false;
  });
}

  resetContactForm(): void {
    this.contactData = {
      name: '',
      email: '',
      phone: '',
      service: '',
      message: ''
    };
    this.contactSuccess = false;
    this.contactError = '';
    this.contactSubmitting = false;
  }

  // 👇 RESTO DE MÉTODOS EXISTENTES
  checkAdminStatus(): void {
    const currentUser = this.authService.currentUserValue;
    this.isAdmin = currentUser?.role === 'admin';
  }

  startEditMaintenance(): void {
    this.editMode = true;
    this.tempMaintenance = {
      title: this.maintenanceTitle,
      image: this.maintenanceImage,
      buttonText: this.maintenanceButtonText,
      deadline: this.maintenanceDeadline,
      details: this.maintenanceDetails,
      link: this.maintenanceLink
    };
  }

  cancelEditMaintenance(): void {
    this.editMode = false;
  }

  saveMaintenance(): void {
    this.loadingSave = true;
    const updates = [
      { key: 'maintenanceTitle', value: this.tempMaintenance.title },
      { key: 'maintenanceImage', value: this.tempMaintenance.image },
      { key: 'maintenanceButtonText', value: this.tempMaintenance.buttonText },
      { key: 'maintenanceDeadline', value: this.tempMaintenance.deadline },
      { key: 'maintenanceDetails', value: this.tempMaintenance.details },
      { key: 'maintenanceLink', value: this.tempMaintenance.link }
    ];
    let completed = 0;
    updates.forEach(update => {
      this.settingsService.updateSettingByKey(update.key, update.value).subscribe({
        next: () => {
          completed++;
          if (completed === updates.length) {
            this.maintenanceTitle = this.tempMaintenance.title;
            this.maintenanceImage = this.tempMaintenance.image;
            this.maintenanceButtonText = this.tempMaintenance.buttonText;
            this.maintenanceDeadline = this.tempMaintenance.deadline;
            this.maintenanceDetails = this.tempMaintenance.details;
            this.maintenanceLink = this.tempMaintenance.link;
            this.editMode = false;
            this.loadingSave = false;
          }
        },
        error: () => {
          this.loadingSave = false;
        }
      });
    });
  }

  onMaintenanceImageSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.loadingImage = true;
      this.imageUploadError = '';
      this.settingsService.uploadImage(file).subscribe({
        next: (res) => {
          if (res && res.url) {
            this.tempMaintenance.image = res.url;
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

  onExternalLinkClick(): void {
    window.open(this.maintenanceLink, '_blank');
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
        }
      });
    });
  }

  onAnnouncementImageSelected(file: File): void {
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