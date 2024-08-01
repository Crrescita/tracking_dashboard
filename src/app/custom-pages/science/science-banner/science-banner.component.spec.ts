import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScienceBannerComponent } from './science-banner.component';

describe('ScienceBannerComponent', () => {
  let component: ScienceBannerComponent;
  let fixture: ComponentFixture<ScienceBannerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScienceBannerComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ScienceBannerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
