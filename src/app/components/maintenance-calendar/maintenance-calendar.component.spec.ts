import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MaintenanceCalendarComponent } from './maintenance-calendar.component';

describe('MaintenanceCalendarComponent', () => {
  let component: MaintenanceCalendarComponent;
  let fixture: ComponentFixture<MaintenanceCalendarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MaintenanceCalendarComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MaintenanceCalendarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
