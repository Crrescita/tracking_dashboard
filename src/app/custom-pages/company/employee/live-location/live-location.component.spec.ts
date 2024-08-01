import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LiveLocationComponent } from './live-location.component';

describe('LiveLocationComponent', () => {
  let component: LiveLocationComponent;
  let fixture: ComponentFixture<LiveLocationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LiveLocationComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LiveLocationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
