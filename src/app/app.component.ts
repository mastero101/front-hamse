import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MaintenanceCalendarComponent } from './components/maintenance-calendar/maintenance-calendar.component';
import { NavigationComponent } from './components/navigation/navigation.component';
import { WhatsappChatBubbleComponent } from './components/whatsapp-chat-bubble/whatsapp-chat-bubble.component';
import { RemindersModalComponent } from './components/reminders-modal/reminders-modal.component';
import { AuthService } from './services/auth.service';
import { Subscription } from 'rxjs';
import { RequirementService, Requirement } from './services/requirement.service';
import { NotificationService } from './services/notification.service';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { CustomSnackbarComponent } from './components/custom-snackbar/custom-snackbar.component';

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
    CustomSnackbarComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'interfaz-hamse';
  showRemindersModal = false;
  private currentUserSubscription: Subscription | undefined;

  constructor(
    private authService: AuthService,
    private requirementService: RequirementService,
    private notificationService: NotificationService
  ) {
    sessionStorage.removeItem('remindersModalShownThisSession');
  }

  ngOnInit(): void {
    this.currentUserSubscription = this.authService.currentUser.subscribe(user => {
      if (user) {
        if (!sessionStorage.getItem('remindersModalShownThisSession')) {
          setTimeout(() => {
            this.showRemindersModal = true;
            sessionStorage.setItem('remindersModalShownThisSession', 'true');
          }, 500);
        }
      } else {
        this.showRemindersModal = false;
        sessionStorage.removeItem('remindersModalShownThisSession');
      }
    });

    this.checkReminders();
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
    this.requirementService.getRequirements('').subscribe((requirements: any) => {
      console.log('Respuesta de requirements:', requirements);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      const diasAdelante = 3;
      const proximos: { title: string, date: string }[] = [];

      const reqs: Requirement[] = Array.isArray(requirements.data) ? requirements.data : [];
      reqs.forEach((req: Requirement) => {
        if (Array.isArray(req.reminderDates)) {
          req.reminderDates.forEach((fecha: string) => {
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
        }
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
            return `${icono} "${reminder.title}" para el ${fechaHtml}`;
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