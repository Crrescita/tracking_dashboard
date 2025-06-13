import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApprovedLeaveComponent } from './approved-leave.component';

describe('ApprovedLeaveComponent', () => {
  let component: ApprovedLeaveComponent;
  let fixture: ComponentFixture<ApprovedLeaveComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApprovedLeaveComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ApprovedLeaveComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
