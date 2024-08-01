import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScienceSectionsixComponent } from './science-sectionsix.component';

describe('ScienceSectionsixComponent', () => {
  let component: ScienceSectionsixComponent;
  let fixture: ComponentFixture<ScienceSectionsixComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScienceSectionsixComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ScienceSectionsixComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
