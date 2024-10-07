import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExpiredLeaveComponent } from './expired-leave.component';

describe('ExpiredLeaveComponent', () => {
  let component: ExpiredLeaveComponent;
  let fixture: ComponentFixture<ExpiredLeaveComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExpiredLeaveComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ExpiredLeaveComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
