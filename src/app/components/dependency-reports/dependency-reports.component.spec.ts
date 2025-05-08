import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DependencyReportsComponent } from './dependency-reports.component';

describe('DependencyReportsComponent', () => {
  let component: DependencyReportsComponent;
  let fixture: ComponentFixture<DependencyReportsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DependencyReportsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DependencyReportsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
