import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CustomSnackbarComponent } from '../components/custom-snackbar/custom-snackbar.component';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  constructor(private snackBar: MatSnackBar) {}

  show(message: string) {
    console.log('Snackbar debería mostrar:', message);
    this.snackBar.open(message, 'Cerrar', {
      // duration: 15000,
      horizontalPosition: 'right',
      verticalPosition: 'top'
    });
  }

  showHtml(message: string) {
    this.snackBar.open(message.replace(/\n/g, '<br>'), 'Cerrar', {
      // duration: 15000,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: 'snackbar-html'
    });
  }

  showCustom(message: string) {
    this.snackBar.openFromComponent(CustomSnackbarComponent, {
      data: message,
      // duration: 15000,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: 'snackbar-html'
    });
  }
} 
