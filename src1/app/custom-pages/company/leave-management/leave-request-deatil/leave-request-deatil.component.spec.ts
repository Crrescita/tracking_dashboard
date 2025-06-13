import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LeaveRequestDeatilComponent } from './leave-request-deatil.component';

describe('LeaveRequestDeatilComponent', () => {
  let component: LeaveRequestDeatilComponent;
  let fixture: ComponentFixture<LeaveRequestDeatilComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeaveRequestDeatilComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LeaveRequestDeatilComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
