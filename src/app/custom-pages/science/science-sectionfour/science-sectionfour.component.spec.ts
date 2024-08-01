import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScienceSectionfourComponent } from './science-sectionfour.component';

describe('ScienceSectionfourComponent', () => {
  let component: ScienceSectionfourComponent;
  let fixture: ComponentFixture<ScienceSectionfourComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScienceSectionfourComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ScienceSectionfourComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
