import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AboutSectionthreeComponent } from './about-sectionthree.component';

describe('AboutSectionthreeComponent', () => {
  let component: AboutSectionthreeComponent;
  let fixture: ComponentFixture<AboutSectionthreeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AboutSectionthreeComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AboutSectionthreeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
