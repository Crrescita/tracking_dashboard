import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdvanceDetailComponent } from './advance-detail.component';

describe('AdvanceDetailComponent', () => {
  let component: AdvanceDetailComponent;
  let fixture: ComponentFixture<AdvanceDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdvanceDetailComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AdvanceDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
