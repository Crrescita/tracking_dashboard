import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ToastrService } from 'ngx-toastr';
import { ActivatedRoute } from '@angular/router';
import Swal from 'sweetalert2';
@Component({
  selector: 'app-assigned-task',
  templateUrl: './assigned-task.component.html',
  styleUrl: './assigned-task.component.scss'
})
export class AssignedTaskComponent {
  formGroup!: FormGroup;
  submitted: boolean = false;
  spinnerStatus: boolean = false;
  saveButtonActive: boolean = true;
  task_id:any;
  emp_id:any;
  taskData:any;
  employeeDetail:any;
  empTask:any;
  commentText: string = ""; 
  constructor(private formBuilder: FormBuilder, private api: ApiService, public toastService: ToastrService,    private route: ActivatedRoute){

  }

  ngOnInit(): void {
    this.formGroup = this.formBuilder.group({
      status: ["",[Validators.required]],
    });
    this.route.params.subscribe((params) => {
      this.task_id = params["task_id"] ? params["task_id"] : null;
      this.emp_id = params["emp_id"] ? Number(params["emp_id"]) : null;
    });
  
    if (this.task_id) {
      this.getAssignedTask();
    }
    
    if (this.emp_id) {
      this.getemployeeData();
    }

   
  }

  empTaskStatus(id:any) {
    this.toggleSpinner(true);
    const url = `empTaskStatus?task_id=${id}&emp_id=${this.emp_id}`;
    this.api.getwithoutid(url).subscribe(
      (res: any) => {
        if (res && res.status) {
          this.toggleSpinner(false);
          this.empTask = res.data[0] || [];
        } else {
          this.empTask = [];
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

  getAssignedTask() {
    this.toggleSpinner(true);
    const url = `empAssignTask?task_id=${this.task_id}`;
    this.api.getwithoutid(url).subscribe(
      (res: any) => {
        if (res && res.status) {
          this.toggleSpinner(false);
          this.taskData = res.data[0] || [];
          this.empTaskStatus(this.taskData.id);
        } else {
          this.taskData = [];
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

  getemployeeData() {
    this.toggleSpinner(true);
    this.api.get("employeesDetails", this.emp_id).subscribe(
      (res: any) => {
        if (res && res.status) {
          this.toggleSpinner(false);
          this.employeeDetail = res.data[0];
        } else {
          this.handleError("Unexpected response format");
        }
      },
      (error) => {
        this.handleError(
          error.message || "An error occurred while fetching data"
        );
      }
    );
  }

  get f() {
    return this.formGroup.controls;
  }

  toggleSpinner(isLoading: boolean) {
    this.spinnerStatus = isLoading;
    this.saveButtonActive = !isLoading;
    this.submitted = isLoading;
  }

  onSubmit() {
    // if (this.formGroup.valid) {
      this.toggleSpinner(true);
      const formData = this.createFormData();
     
        this.add(formData);
    // } else {
    //   this.formGroup.markAllAsTouched();
    // }
  }

  // createFormData() {
  //   const formData = {
  //     task_id:this.taskData?.id,
  //     status:"In-Progress",
  //     emp_ids:this.emp_id
  //   };
  //   return formData;
  // }
  createFormData() {
    return {
      task_id: this.taskData?.id,
      status: this.empTask?.status === "In-Progress" ? "Completed" : "In-Progress",
      emp_ids: this.emp_id
    };
  }

  submitComment() {
    if (!this.commentText.trim()) return;

    const commentData = {
      task_id: this.taskData?.id,
      emp_ids: this.emp_id,
      comment: {
        text: this.commentText,     
        timestamp: new Date().toISOString()
      },
      status: "In-Progress"
    };

    this.add(commentData);
this.commentText = ""
    // this.taskService.addComment(commentData).subscribe((response) => {
    //   if (response.status) {
    //     this.commentText = ""; // Clear input after submitting
    //   }
    // });
  }

  add(formData: any) {
    this.api.post("updateTaskStatus", formData).subscribe(
      (res: any) => this.handleResponse(res),
      (error) => this.handleError(error)
    );
  }

  handleResponse(res: any) {
    this.toggleSpinner(false);
    if (res["status"] === true) {
      this.formGroup.reset();
      this.toastService.success(res.message);
      this.getAssignedTask()
    } else {
      this.toastService.error(res["message"]);
    }
  }

  handleError(error: any) {
    this.toggleSpinner(false);
  }


  confirm() {
    Swal.fire({
      title: 'Are you sure?',
      text: 'You won\'t be able to revert this!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: 'rgb(3, 142, 220)',
      cancelButtonColor: 'rgb(243, 78, 78)',
      confirmButtonText: 'Yes, Completed!',
      cancelButtonText: 'No, cancel!',
    }).then(result => {
      if (result.value) {
       this.onSubmit()
        // Swal.fire({ title: 'Deleted!', text: 'Your file has been deleted.', confirmButtonColor: 'rgb(3, 142, 220)', icon: 'success', });
      } else if (
        // Read more about handling dismissals
        result.dismiss === Swal.DismissReason.cancel
      ) {
        // Swal.fire({
        //   title: 'Cancelled',
        //   text: 'Your imaginary file is safe :)',
        //   icon: 'error',
        //   confirmButtonColor: 'rgb(3, 142, 220)',
        //   showCancelButton: true,
        // })
      }
    });
  }
}
