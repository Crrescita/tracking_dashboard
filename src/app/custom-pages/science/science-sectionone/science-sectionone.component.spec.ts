import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScienceSectiononeComponent } from './science-sectionone.component';

describe('ScienceSectiononeComponent', () => {
  let component: ScienceSectiononeComponent;
  let fixture: ComponentFixture<ScienceSectiononeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScienceSectiononeComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ScienceSectiononeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
