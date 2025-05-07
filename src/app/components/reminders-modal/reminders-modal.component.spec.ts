import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RemindersModalComponent } from './reminders-modal.component';

describe('RemindersModalComponent', () => {
  let component: RemindersModalComponent;
  let fixture: ComponentFixture<RemindersModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RemindersModalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RemindersModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
