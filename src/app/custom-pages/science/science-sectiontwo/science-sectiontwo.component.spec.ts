import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScienceSectiontwoComponent } from './science-sectiontwo.component';

describe('ScienceSectiontwoComponent', () => {
  let component: ScienceSectiontwoComponent;
  let fixture: ComponentFixture<ScienceSectiontwoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScienceSectiontwoComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ScienceSectiontwoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
