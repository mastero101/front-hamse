import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MaintenanceCalendarComponent } from './components/maintenance-calendar/maintenance-calendar.component';
import { NavigationComponent } from './components/navigation/navigation.component';
import { WhatsappChatBubbleComponent } from './components/whatsapp-chat-bubble/whatsapp-chat-bubble.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    MaintenanceCalendarComponent,
    NavigationComponent,
    WhatsappChatBubbleComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'interfaz-hamse';
}