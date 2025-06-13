import { Component } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-task-list',

  templateUrl: './task-list.component.html',
  styleUrl: './task-list.component.scss'
})
export class TaskListComponent {
  emp_id:any;

  spinnerStatus: boolean = false;
emptask: any[] = []; 

  constructor(private api:ApiService, private route:ActivatedRoute){}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.emp_id = params["emp_id"] ? Number(params["emp_id"]) : null;
    });

    if(this.emp_id){
      this.getTaskList()
    }
    
  }

    toggleSpinner(isLoading: boolean) {
    this.spinnerStatus = isLoading;
    
  }

   getTaskList() {
    this.toggleSpinner(true);
    const url = `task-list/${this.emp_id}`;
    this.api.getwithoutid(url).subscribe(
      (res: any) => {
        if (res && res.status) {
          this.toggleSpinner(false);

          this.emptask= res.data
          console.log(res.data);
          // this.taskData = res.data[0] || [];
          // this.empTaskStatus(this.taskData.id);
        } else {
          // this.taskData = [];
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

  getStatusCount(status: string): number {
  return this.emptask?.filter(task => task.status === status).length || 0;
}

getOverdueCount(): number {
  return this.emptask?.filter(task => task.isOverdue).length || 0;
}


/**
 * Return the single CSS class for the icon.
 */
getStatusIcon(item: any): string {
  if (item.isOverdue) {
    return 'ri-error-warning-line';
  }
  switch (item.status) {
    case 'To-Do':           return 'ri-checkbox-blank-circle-line';
    case 'In-Progress':     return 'ri-loader-2-line';
    case 'Pending-Review':  return 'ri-time-line';
    case 'Completed':       return 'ri-checkbox-circle-line';
    case 'On-Hold':         return 'ri-pause-circle-line';
    case 'Cancelled':       return 'ri-close-circle-line';
    default:                return 'ri-question-line';
  }
}

/**
 * Return the single CSS class for the background.
 */
getStatusBg(item: any): string {
  if (item.isOverdue) {
    return 'bg-gradient-danger';
  }
  switch (item.status) {
    case 'To-Do':           return 'bg-gradient-secondary';
    case 'In-Progress':     return 'bg-gradient-primary';
    case 'Pending-Review':  return 'bg-gradient-warning';
    case 'Completed':       return 'bg-gradient-success';
    case 'On-Hold':         return 'bg-gradient-info';
    case 'Cancelled':       return 'bg-gradient-dark';
    default:                return '';
  }
}


}
