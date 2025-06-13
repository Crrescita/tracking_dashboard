import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmpDocsComponent } from './emp-docs.component';

describe('EmpDocsComponent', () => {
  let component: EmpDocsComponent;
  let fixture: ComponentFixture<EmpDocsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmpDocsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EmpDocsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
