import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HomeSectiontwoComponent } from './home-sectiontwo.component';

describe('HomeSectiontwoComponent', () => {
  let component: HomeSectiontwoComponent;
  let fixture: ComponentFixture<HomeSectiontwoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeSectiontwoComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(HomeSectiontwoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
