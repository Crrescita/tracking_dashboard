import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LeaveRecordComponent } from './leave-record.component';

describe('LeaveRecordComponent', () => {
  let component: LeaveRecordComponent;
  let fixture: ComponentFixture<LeaveRecordComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeaveRecordComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LeaveRecordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
