import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AboutVisionComponent } from './about-vision.component';

describe('AboutVisionComponent', () => {
  let component: AboutVisionComponent;
  let fixture: ComponentFixture<AboutVisionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AboutVisionComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AboutVisionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
