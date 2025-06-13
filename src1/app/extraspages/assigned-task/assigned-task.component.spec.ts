import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssignedTaskComponent } from './assigned-task.component';

describe('AssignedTaskComponent', () => {
  let component: AssignedTaskComponent;
  let fixture: ComponentFixture<AssignedTaskComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssignedTaskComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AssignedTaskComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
