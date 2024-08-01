import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddProductImageComponent } from './add-product-image.component';

describe('AddProductImageComponent', () => {
  let component: AddProductImageComponent;
  let fixture: ComponentFixture<AddProductImageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddProductImageComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AddProductImageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
