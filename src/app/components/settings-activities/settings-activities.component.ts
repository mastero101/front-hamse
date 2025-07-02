import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivityService, Activity } from '../../services/activity.service';

interface ActivityWithActive extends Activity {
  active: boolean;
}

@Component({
  selector: 'app-settings-activities',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './settings-activities.component.html',
  styleUrl: './settings-activities.component.scss'
})
export class SettingsActivitiesComponent implements OnInit {
  activities: ActivityWithActive[] = [];
  isLoading = false;

  constructor(private activityService: ActivityService) {}

  ngOnInit() {
    this.isLoading = true;
    this.activityService.getActivities(1, 100, '').subscribe({
      next: (res: any) => {
        this.activities = (res.data || []).map((a: any, i: number) => ({
          ...a,
          active: typeof a.active === 'boolean' ? a.active : i % 2 === 0 // alterna para pruebas
        }));
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  toggleActive(activity: any) {
    activity.active = !activity.active;
    // Aquí podrías llamar al backend para guardar el cambio
    // Por ahora solo cambia en frontend
  }
} 