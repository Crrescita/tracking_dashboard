import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AboutSectionsevenComponent } from './about-sectionseven.component';

describe('AboutSectionsevenComponent', () => {
  let component: AboutSectionsevenComponent;
  let fixture: ComponentFixture<AboutSectionsevenComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AboutSectionsevenComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AboutSectionsevenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
