import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScienceSectionfiveComponent } from './science-sectionfive.component';

describe('ScienceSectionfiveComponent', () => {
  let component: ScienceSectionfiveComponent;
  let fixture: ComponentFixture<ScienceSectionfiveComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScienceSectionfiveComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ScienceSectionfiveComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
