import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CustomSnackbarComponent } from '../components/custom-snackbar/custom-snackbar.component';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  constructor(private snackBar: MatSnackBar) {}

  // Método específico para recordatorios próximos
  showUpcomingReminders(reminders: {title: string, date: string}[]) {
    // Verifica que reminders sea un array válido
    if (!Array.isArray(reminders)) {
      console.error('Los recordatorios deben ser un array', reminders);
      return;
    }

    this.snackBar.openFromComponent(CustomSnackbarComponent, {
      data: {
        type: 'reminders-list',
        reminders: reminders.map(r => ({
          title: r.title,
          date: r.date // La fecha se normalizará en el componente
        }))
      },
      panelClass: ['snackbar-reminder'],
      duration: 0 // El usuario debe cerrar manualmente
    });
  }

  // Método para recordatorios individuales
  showReminder(title: string, message: string, rawDate: string) {
    this.snackBar.openFromComponent(CustomSnackbarComponent, {
      data: {
        type: 'single-reminder',
        title: title,
        message: message,
        date: rawDate
      },
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: ['snackbar-reminder'],
      duration: 0 // El usuario debe cerrar manualmente
    });
  }

  // Método genérico para mostrar texto simple
  show(message: string) {
    this.snackBar.open(message, 'Cerrar', {
      duration: 0, // El usuario debe cerrar manualmente
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: ['snackbar-default']
    });
  }

  // Método para HTML básico
  showHtml(message: string) {
    this.snackBar.openFromComponent(CustomSnackbarComponent, {
      data: {
        type: 'html-notification',
        title: 'Notificación',
        message: message.replace(/\n/g, '<br>'),
        date: new Date()
      },
      duration: 0, // El usuario debe cerrar manualmente
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: ['snackbar-html']
    });
  }

  // Método para contenido personalizado
  showCustom(content: string) {
    this.snackBar.openFromComponent(CustomSnackbarComponent, {
      data: {
        type: 'custom-content',
        content: content
      },
      duration: 0, // El usuario debe cerrar manualmente
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: ['snackbar-html']
    });
  }
}