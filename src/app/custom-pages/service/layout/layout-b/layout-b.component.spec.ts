import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LayoutBComponent } from './layout-b.component';

describe('LayoutBComponent', () => {
  let component: LayoutBComponent;
  let fixture: ComponentFixture<LayoutBComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LayoutBComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LayoutBComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
