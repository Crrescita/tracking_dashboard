import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HomeSectiononeComponent } from './home-sectionone.component';

describe('HomeSectiononeComponent', () => {
  let component: HomeSectiononeComponent;
  let fixture: ComponentFixture<HomeSectiononeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeSectiononeComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(HomeSectiononeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
