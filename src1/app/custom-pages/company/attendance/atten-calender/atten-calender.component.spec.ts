import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AttenCalenderComponent } from './atten-calender.component';

describe('AttenCalenderComponent', () => {
  let component: AttenCalenderComponent;
  let fixture: ComponentFixture<AttenCalenderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AttenCalenderComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AttenCalenderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
