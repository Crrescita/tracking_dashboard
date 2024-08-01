import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScienceContactFormComponent } from './science-contact-form.component';

describe('ScienceContactFormComponent', () => {
  let component: ScienceContactFormComponent;
  let fixture: ComponentFixture<ScienceContactFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScienceContactFormComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ScienceContactFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
