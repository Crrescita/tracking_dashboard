import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VisitlogComponent } from './visitlog.component';

describe('VisitlogComponent', () => {
  let component: VisitlogComponent;
  let fixture: ComponentFixture<VisitlogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VisitlogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(VisitlogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
