import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AttendanceMonthlyComponent } from './attendance-monthly.component';

describe('AttendanceMonthlyComponent', () => {
  let component: AttendanceMonthlyComponent;
  let fixture: ComponentFixture<AttendanceMonthlyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AttendanceMonthlyComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AttendanceMonthlyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
