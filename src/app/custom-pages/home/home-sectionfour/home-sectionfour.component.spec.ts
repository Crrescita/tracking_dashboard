import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HomeSectionfourComponent } from './home-sectionfour.component';

describe('HomeSectionfourComponent', () => {
  let component: HomeSectionfourComponent;
  let fixture: ComponentFixture<HomeSectionfourComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeSectionfourComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(HomeSectionfourComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
