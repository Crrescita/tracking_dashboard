import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeeThankyouComponent } from './employee-thankyou.component';

describe('EmployeeThankyouComponent', () => {
  let component: EmployeeThankyouComponent;
  let fixture: ComponentFixture<EmployeeThankyouComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeeThankyouComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EmployeeThankyouComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
