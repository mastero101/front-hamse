import { Component, Inject } from '@angular/core';
import { MAT_SNACK_BAR_DATA, MatSnackBarRef } from '@angular/material/snack-bar';

@Component({
  selector: 'app-custom-snackbar',
  standalone: true,
  template: `
    <div class="snackbar-content">
      <span [innerHTML]="data"></span>
      <button class="close-btn" aria-label="Cerrar" (click)="close()">✖</button>
    </div>
  `,
  styles: [`
    .snackbar-content {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      width: 100%;
      position: relative;
    }
    span {
      white-space: pre-line;
      font-size: 1.2rem;
      font-weight: bold;
      color: #fff;
      flex: 1;
    }
    .close-btn {
      background: transparent;
      border: none;
      color: #ffb300;
      font-size: 1.5rem;
      font-weight: bold;
      cursor: pointer;
      margin-left: 16px;
      margin-top: 2px;
      transition: color 0.2s;
    }
    .close-btn:hover {
      color: #fff;
    }
  `]
})
export class CustomSnackbarComponent {
  constructor(
    @Inject(MAT_SNACK_BAR_DATA) public data: string,
    private snackBarRef: MatSnackBarRef<CustomSnackbarComponent>
  ) {}

  close() {
    this.snackBarRef.dismiss();
  }
} 