import { Component } from '@angular/core';
import { ApiService } from '../../../../core/services/api.service';
import { ToastrService } from 'ngx-toastr';
import { FormBuilder } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';

@Component({
  selector: 'app-task-detail',
  templateUrl: './task-detail.component.html',
  styleUrl: './task-detail.component.scss'
})
export class TaskDetailComponent {
  breadCrumbItems!: Array<{}>;
  id:any
  taskDetail:any;
  spinnerStatus: boolean = false;
  selectedEmpIds: number[] = [];

  constructor(  private api: ApiService,
    public toastService: ToastrService,
    private formBuilder: FormBuilder,
    private router: Router,private route:ActivatedRoute,private location: Location){}
  ngOnInit(): void {
    this.breadCrumbItems = [
      { label: "Assign Task" },
      { label: "Task Detail", active: true },
    ];
    this.route.params.subscribe((params) => {
      this.id = params["id"] ? Number(params["id"]) : null;
    });
  
    if (this.id) {
      this.getTaskDetail();
    } 
  }

  toggleSpinner(isLoading: boolean) {
    this.spinnerStatus = isLoading;
    // this.saveButtonActive = !isLoading;
    // this.submitted = isLoading;
  }

  getTaskDetail() {
    this.toggleSpinner(true);
    const url = `assignTask?id=${this.id}`;
    this.api.getwithoutid(url).subscribe(
      (res: any) => {
        if (res && res.status) {
          this.toggleSpinner(false);
          this.taskDetail= res.data[0] || [];
        } else {
         
          // this.taskDetail= [];
          this.handleError("Unexpected response format");
        }
      },
      (error) => {
        this.toggleSpinner(false);
        this.handleError(
          error.message || "An error occurred while fetching data"
        );
      }
    );
  }

  handleError(error: any) {
    this.toggleSpinner(false);
  }

  toggleSelection(empId: number, event: any) {
    const isChecked = event.target['checked'] as HTMLElement

    if (isChecked) {
      // Add employee ID if checked
      if (!this.selectedEmpIds.includes(empId)) {
        this.selectedEmpIds.push(empId)
      }
    } else {
      // Remove employee ID if unchecked
      this.selectedEmpIds = this.selectedEmpIds.filter(id => id !== empId);
    }
  }


  sendReminder() {
    if (this.selectedEmpIds.length > 0) {
      this.toggleSpinner(true);
      const payload = { emp_ids: this.selectedEmpIds, task_id: this.id };
  
      this.api.post('sendReminder', payload).subscribe(
        (res: any) => {
          this.toggleSpinner(false);
          if (res.status === true) {
            this.toastService.success(res.message);
            this.selectedEmpIds = [];
  
            // Force change detection (only if needed)
            setTimeout(() => {
              this.selectedEmpIds = [...this.selectedEmpIds]; 
            }, 0);
          } else {
            this.toastService.error(res.message);
          }
        },
        (error) => {
          console.error("Error sending reminder:", error);
        }
      );
    } else {
      alert("Please select at least one employee.");
    }
  }
  
  

  goBack(): void {
    this.location.back();
  }
}
