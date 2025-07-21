import { Component, Inject } from '@angular/core';
import { MAT_SNACK_BAR_DATA, MatSnackBarRef } from '@angular/material/snack-bar';
import { DatePipe, JsonPipe } from '@angular/common';

@Component({
  selector: 'app-custom-snackbar',
  standalone: true,
  imports: [DatePipe, JsonPipe],
  template: `
    <div class="snackbar-content">
      @if (data && data.type === 'reminders-list') {
        <div class="reminders-container">
          <strong>Recordatorios próximos:</strong>
          <div class="reminders-list">
            @for (reminder of data.reminders; track $index) {
              <div class="reminder-item">
                <span class="reminder-bullet">●</span>
                "{{ reminder.title || 'Sin título' }}" para el 
                <span class="reminder-date">
                  @if (reminder.date) {
                    {{ normalizeDate(reminder.date) | date:'dd/MM/yyyy' }}
                  } @else {
                    Fecha no definida
                  }
                </span>
              </div>
            }
          </div>
        </div>
      } @else {
        <div class="debug-info">
          <pre>{{ data | json }}</pre>
        </div>
      }
      <button class="close-btn" (click)="close()">✖</button>
    </div>
  `,
  styles: [`
    .snackbar-content {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      width: 100%;
    }
    .reminders-container {
      flex: 1;
    }
    .reminders-list {
      margin-top: 8px;
    }
    .reminder-item {
      margin-bottom: 6px;
      display: flex;
      align-items: center;
    }
    .reminder-bullet {
      color: #43a047;
      font-size: 1.2em;
      margin-right: 8px;
    }
    .reminder-date {
      color: #ff1744;
      font-weight: bold;
      margin-left: 4px;
    }
    .close-btn {
      background: transparent;
      border: none;
      color: #ffb300;
      font-size: 1.5rem;
      cursor: pointer;
      margin-left: 16px;
      line-height: 1;
    }
    .debug-info {
      color: white;
      pre {
        background: rgba(0,0,0,0.2);
        padding: 10px;
        border-radius: 4px;
        max-height: 200px;
        overflow: auto;
      }
    }
  `]
})
export class CustomSnackbarComponent {
  constructor(
    @Inject(MAT_SNACK_BAR_DATA) public data: any,
    private snackBarRef: MatSnackBarRef<CustomSnackbarComponent>
  ) {
    console.log('Datos recibidos en snackbar:', JSON.parse(JSON.stringify(this.data)));
    this.debugDataConversion();
  }

private debugDataConversion() {
  if (this.data?.type === 'custom-content') {
    const regex = /"([^"]+)"/g;
    const matches = this.data.content.match(regex);
    const titles = matches ? matches.map((m: string) => m.replace(/"/g, '')) : [];
    
    this.data = {
      type: 'reminders-list',
      reminders: titles.map((title: string, i: number) => ({
        title: title,
        date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().replace('T', ' ').replace('.000Z', '-06')
      }))
    };
  }
}

  normalizeDate(dateString: string): Date {
    if (!dateString) return new Date();
    
    try {
      const normalized = dateString
        .replace(' ', 'T')
        .replace(/([+-]\d{2})(?::?00)?$/, '$1:00');
      const date = new Date(normalized);
      return isNaN(date.getTime()) ? new Date() : date;
    } catch {
      return new Date();
    }
  }

  close() {
    this.snackBarRef.dismiss();
  }
}