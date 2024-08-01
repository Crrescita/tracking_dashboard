import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddLayoutBComponent } from './add-layout-b.component';

describe('AddLayoutBComponent', () => {
  let component: AddLayoutBComponent;
  let fixture: ComponentFixture<AddLayoutBComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddLayoutBComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AddLayoutBComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
