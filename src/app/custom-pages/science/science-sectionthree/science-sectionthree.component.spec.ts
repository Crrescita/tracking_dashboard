import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScienceSectionthreeComponent } from './science-sectionthree.component';

describe('ScienceSectionthreeComponent', () => {
  let component: ScienceSectionthreeComponent;
  let fixture: ComponentFixture<ScienceSectionthreeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScienceSectionthreeComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ScienceSectionthreeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
