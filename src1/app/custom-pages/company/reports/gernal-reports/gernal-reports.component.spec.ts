import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GernalReportsComponent } from './gernal-reports.component';

describe('GernalReportsComponent', () => {
  let component: GernalReportsComponent;
  let fixture: ComponentFixture<GernalReportsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GernalReportsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(GernalReportsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
