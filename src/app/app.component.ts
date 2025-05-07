import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MaintenanceCalendarComponent } from './components/maintenance-calendar/maintenance-calendar.component';
import { NavigationComponent } from './components/navigation/navigation.component';
import { WhatsappChatBubbleComponent } from './components/whatsapp-chat-bubble/whatsapp-chat-bubble.component';
import { RemindersModalComponent } from './components/reminders-modal/reminders-modal.component';
import { AuthService } from './services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    MaintenanceCalendarComponent,
    NavigationComponent,
    WhatsappChatBubbleComponent,
    RemindersModalComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'interfaz-hamse';
  showRemindersModal = false;
  private currentUserSubscription: Subscription | undefined;

  constructor(private authService: AuthService) {
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
  }

  ngOnDestroy(): void {
    if (this.currentUserSubscription) {
      this.currentUserSubscription.unsubscribe();
    }
  }

  closeRemindersModal(): void {
    this.showRemindersModal = false;
  }
}