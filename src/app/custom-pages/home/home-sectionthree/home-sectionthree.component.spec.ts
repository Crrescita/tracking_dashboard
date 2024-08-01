import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HomeSectionthreeComponent } from './home-sectionthree.component';

describe('HomeSectionthreeComponent', () => {
  let component: HomeSectionthreeComponent;
  let fixture: ComponentFixture<HomeSectionthreeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeSectionthreeComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(HomeSectionthreeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
