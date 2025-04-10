import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MaintenanceProgramComponent } from './maintenance-program.component';

describe('MaintenanceProgramComponent', () => {
  let component: MaintenanceProgramComponent;
  let fixture: ComponentFixture<MaintenanceProgramComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MaintenanceProgramComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MaintenanceProgramComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
