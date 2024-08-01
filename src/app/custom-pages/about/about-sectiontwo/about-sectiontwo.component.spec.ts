import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AboutSectiontwoComponent } from './about-sectiontwo.component';

describe('AboutSectiontwoComponent', () => {
  let component: AboutSectiontwoComponent;
  let fixture: ComponentFixture<AboutSectiontwoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AboutSectiontwoComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AboutSectiontwoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
