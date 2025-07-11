import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MaintenanceCalendarComponent } from './components/maintenance-calendar/maintenance-calendar.component';
import { NavigationComponent } from './components/navigation/navigation.component';
import { WhatsappChatBubbleComponent } from './components/whatsapp-chat-bubble/whatsapp-chat-bubble.component';
import { RemindersModalComponent } from './components/reminders-modal/reminders-modal.component';
import { AuthService } from './services/auth.service';
import { Subscription } from 'rxjs';
import { NotificationService } from './services/notification.service';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { CustomSnackbarComponent } from './components/custom-snackbar/custom-snackbar.component';
import { AuthModalComponent } from './components/auth-modal/auth-modal.component';
import { UserRequirementService } from './services/user-requirement.service';
import { SettingsService } from './services/settings.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    MaintenanceCalendarComponent,
    NavigationComponent,
    WhatsappChatBubbleComponent,
    RemindersModalComponent,
    MatSnackBarModule,
    CustomSnackbarComponent,
    AuthModalComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'interfaz-hamse';
  showRemindersModal = false;
  showAuthModalForLogin = false;
  private currentUserSubscription: Subscription | undefined;

  // Para edición del modal de recordatorios
  isAdmin = false;
  editMode = false;
  tempAnnouncement: any = {};
  loadingSave = false;
  loadingImage = false;
  imageUploadError = '';

  // Datos editables del recordatorio
  reminderTitle = 'Realizar COA';
  reminderButtonText = 'Ver COA en soluciones HAMSE';
  reminderDeadline = 'Limite: 30 de junio 2025';
  reminderDetails = 'Realiza tu trámite COA con nosotros, obten puntos adicionales de fidelidad y descuentos';
  externalLink = 'https://soluciones.hamse.com.mx/coa';
  reminderImage = '../../../assets/images/HAMSE_Cedula_Operacion.png';

  constructor(
    private authService: AuthService,
    private userRequirementService: UserRequirementService,
    private notificationService: NotificationService,
    private settingsService: SettingsService
  ) {
    sessionStorage.removeItem('remindersModalShownThisSession');
  }

  ngOnInit(): void {
    this.currentUserSubscription = this.authService.currentUser.subscribe(user => {
      this.isAdmin = (user?.role || '').toLowerCase() === 'admin';
      if (user) {
        this.showAuthModalForLogin = false;
        if (!sessionStorage.getItem('remindersModalShownThisSession')) {
          setTimeout(() => {
            this.showRemindersModal = true;
            sessionStorage.setItem('remindersModalShownThisSession', 'true');
          }, 500);
        }
      } else {
        this.showRemindersModal = false;
        this.showAuthModalForLogin = true;
        sessionStorage.removeItem('remindersModalShownThisSession');
      }
    });
    this.checkReminders();
    const reminderKeys = [
      { key: 'reminderTitle', prop: 'reminderTitle' },
      { key: 'reminderImage', prop: 'reminderImage' },
      { key: 'reminderButtonText', prop: 'reminderButtonText' },
      { key: 'reminderDeadline', prop: 'reminderDeadline' },
      { key: 'reminderDetails', prop: 'reminderDetails' },
      { key: 'reminderLink', prop: 'externalLink' }
    ];
    reminderKeys.forEach(({ key, prop }) => {
      this.settingsService.getSettingByKey(key).subscribe({
        next: (res) => {
          if (res && res.value) {
            (this as any)[prop] = res.value;
          }
        }
      });
    });
  }

  onStartEditAnnouncement() {
    this.editMode = true;
    this.tempAnnouncement = {
      title: this.reminderTitle,
      image: this.reminderImage,
      buttonText: this.reminderButtonText,
      deadline: this.reminderDeadline,
      details: this.reminderDetails,
      link: this.externalLink
    };
  }

  onSaveAnnouncement() {
    this.loadingSave = true;
    const updates = [
      { key: 'reminderTitle', value: this.tempAnnouncement.title },
      { key: 'reminderImage', value: this.tempAnnouncement.image },
      { key: 'reminderButtonText', value: this.tempAnnouncement.buttonText },
      { key: 'reminderDeadline', value: this.tempAnnouncement.deadline },
      { key: 'reminderDetails', value: this.tempAnnouncement.details },
      { key: 'reminderLink', value: this.tempAnnouncement.link }
    ];
    let completed = 0;
    updates.forEach(update => {
      this.settingsService.updateSettingByKey(update.key, update.value).subscribe({
        next: () => {
          completed++;
          if (completed === updates.length) {
            // Actualizar los valores locales
            this.reminderTitle = this.tempAnnouncement.title;
            this.reminderImage = this.tempAnnouncement.image;
            this.reminderButtonText = this.tempAnnouncement.buttonText;
            this.reminderDeadline = this.tempAnnouncement.deadline;
            this.reminderDetails = this.tempAnnouncement.details;
            this.externalLink = this.tempAnnouncement.link;
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

  onCancelEditAnnouncement() {
    this.editMode = false;
  }

  onImageFileSelected(file: File) {
    this.loadingImage = true;
    // Aquí deberías subir la imagen a S3 o backend y luego asignar la URL:
    // Simulación de subida exitosa:
    setTimeout(() => {
      // this.tempAnnouncement.image = 'URL_DE_LA_IMAGEN_SUBIDA';
      this.loadingImage = false;
      this.imageUploadError = '';
    }, 1500);
    // Si hay error:
    // this.imageUploadError = 'Error al subir imagen';
  }

  onAnnouncementImageSelected(file: File) {
    if (file) {
      this.loadingImage = true;
      this.imageUploadError = '';
      this.settingsService.uploadImage(file).subscribe({
        next: (res) => {
          console.log('[UPLOAD] Respuesta del backend:', res);
          if (res && res.url) {
            this.tempAnnouncement.image = res.url;
          } else {
            this.imageUploadError = 'No se pudo obtener la URL de la imagen.';
          }
          this.loadingImage = false;
        },
        error: (err) => {
          console.error('[UPLOAD] Error al subir la imagen:', err);
          this.imageUploadError = 'Error al subir la imagen.';
          this.loadingImage = false;
        }
      });
    }
  }

  ngOnDestroy(): void {
    if (this.currentUserSubscription) {
      this.currentUserSubscription.unsubscribe();
    }
  }

  closeRemindersModal(): void {
    this.showRemindersModal = false;
  }

  checkReminders() {
    this.userRequirementService.getAllUserRequirements().subscribe((response: any) => {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      const diasAdelante = 3;
      const proximos: { title: string, date: string }[] = [];

      const reqs = Array.isArray(response.data) ? response.data : [];
      reqs.forEach((req: any) => {
        const reminderDates = req.userRequirement?.reminderDates || [];
        reminderDates.forEach((fecha: string) => {
          const reminderDate = new Date(fecha);
          reminderDate.setHours(0, 0, 0, 0);
          const diff = (reminderDate.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24);
          if (diff >= 0 && diff <= diasAdelante) {
            proximos.push({
              title: req.title,
              date: reminderDate.toLocaleDateString()
            });
          }
        });
      });

      if (proximos.length > 0) {
        // Ordenar por fecha ascendente (más próximos primero)
        proximos.sort((a, b) => {
          const da = new Date(a.date).getTime();
          const db = new Date(b.date).getTime();
          return da - db;
        });
        const mensaje = `<b>Recordatorios próximos:</b><br><br>` + proximos
          .map(reminder => {
            const fecha = new Date(reminder.date);
            fecha.setHours(0, 0, 0, 0);
            const esHoy = fecha.getTime() === hoy.getTime();
            const fechaHtml = esHoy
              ? `<span style='color:#ff1744;font-weight:bold'>${this.formatearFecha(reminder.date)}</span> <span style='color:#ff1744;font-size:1.3em;'>⚠️</span>`
              : `<span style='color:#ff1744;font-weight:bold'>${this.formatearFecha(reminder.date)}</span>`;
            const icono = esHoy
              ? '⚠️'
              : "<span style='color:#43a047;font-size:1.2em;'>●</span>";
            return `${icono} \"${reminder.title}\" para el ${fechaHtml}`;
          })
          .join('<br>');
        this.notificationService.showCustom(mensaje);
      } else {
        this.notificationService.show('No tienes recordatorios próximos.');
      }
    });
  }

  formatearFecha(fecha: string): string {
    const d = new Date(fecha);
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const anio = d.getFullYear();
    return `${dia}/${mes}/${anio}`;
  }
}