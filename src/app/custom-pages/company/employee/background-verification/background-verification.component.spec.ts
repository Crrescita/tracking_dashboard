import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BackgroundVerificationComponent } from './background-verification.component';

describe('BackgroundVerificationComponent', () => {
  let component: BackgroundVerificationComponent;
  let fixture: ComponentFixture<BackgroundVerificationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BackgroundVerificationComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(BackgroundVerificationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
