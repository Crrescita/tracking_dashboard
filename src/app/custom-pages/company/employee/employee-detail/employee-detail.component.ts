import { Component } from "@angular/core";
import { FormBuilder, FormGroup, UntypedFormGroup } from "@angular/forms";
import { BsDatepickerConfig } from "ngx-bootstrap/datepicker";
import { Router, ActivatedRoute } from "@angular/router";
import { ApiService } from "../../../../core/services/api.service";

@Component({
  selector: "app-employee-detail",
  templateUrl: "./employee-detail.component.html",
  styleUrl: "./employee-detail.component.scss",
})
export class EmployeeDetailComponent {
  // bread crumb items
  breadCrumbItems!: Array<{}>;
  fieldTextType!: boolean;
  fieldTextType1!: boolean;
  fieldTextType2!: boolean;
  bsConfig?: Partial<BsDatepickerConfig>;

  formGroups: FormGroup[] = [];
  educationForm!: FormGroup;
  currentTab: any;

  urlId: number | null = null;

  employeeDetail: any;

  submitted: boolean = false;
  spinnerStatus: boolean = false;
  saveButtonActive: boolean = true;

  selectedDate: Date = new Date();
  formattedDate: any;

  checkIndetails: any = {};
  formattedTotalTime: any;

  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private api: ApiService
  ) {
    this.route.queryParams.subscribe((params) => {
      this.currentTab = params["tab"] || "personalDetails";
    });
  }

  ngOnInit(): void {
    /**
     * BreadCrumb
     */
    this.breadCrumbItems = [
      { label: "Pages", active: true },
      { label: "Profile Settings", active: true },
    ];

    this.selectedDate = new Date();

    if (this.selectedDate) {
      this.formattedDate = this.formatDate(this.selectedDate);
    }

    this.route.params.subscribe((params) => {
      this.urlId = params["id"] ? Number(params["id"]) : null;
    });

    if (this.urlId) {
      this.getemployeeData();
      // this.getCheckInDetail();
    }
  }

  formatDate(date: Date): string {
    if (!date) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  toggleSpinner(isLoading: boolean) {
    this.spinnerStatus = isLoading;
    this.saveButtonActive = !isLoading;
    this.submitted = isLoading;
  }

  getemployeeData() {
    this.toggleSpinner(true);
    this.api.get("employees", this.urlId).subscribe(
      (res: any) => {
        if (res && res.status) {
          this.toggleSpinner(false);
          this.employeeDetail = res.data[0];
          this.getCheckInDetail();
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

  getCheckInDetail() {
    this.toggleSpinner(true);
    this.api
      .getwithoutid(
        `checkInDetail?emp_id=${this.urlId}&company_id=${this.employeeDetail.company_id}&date=${this.formattedDate}`
      )
      .subscribe(
        (res: any) => {
          this.toggleSpinner(false);
          if (res && res.status) {
            this.checkIndetails = res.data;
            this.formattedTotalTime = this.calculateTotalTimeForAll();
            console.log(this.formattedTotalTime);
            // if (
            //   this.checkIndetails.check_in_time &&
            //   this.checkIndetails.check_out_time
            // ) {
            //   this.formattedTotalTime = this.calculateTotalTime(
            //     this.checkIndetails.check_in_time,
            //     this.checkIndetails.check_out_time
            //   );

            // }
          } else {
            this.checkIndetails = null;
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

  /**
   * Default Select2
   */

  // Change Tab Content
  changeTab(tab: string) {
    this.currentTab = tab;
  }

  /**
   * Password Hide/Show
   */
  toggleFieldTextType() {
    this.fieldTextType = !this.fieldTextType;
  }
  toggleFieldTextType1() {
    this.fieldTextType1 = !this.fieldTextType1;
  }
  toggleFieldTextType2() {
    this.fieldTextType2 = !this.fieldTextType2;
  }

  // add Form
  addForm() {
    const formGroupClone = this.formBuilder.group(this.educationForm.value);
    this.formGroups.push(formGroupClone);
  }

  // Delete Form
  deleteForm(id: any) {
    this.formGroups.splice(id, 1);
  }

  calculateTimeDifference(checkInTime: string, checkOutTime: string): number {
    const [checkInHour, checkInMinute, checkInSecond] = checkInTime
      .split(":")
      .map(Number);
    const [checkOutHour, checkOutMinute, checkOutSecond] = checkOutTime
      .split(":")
      .map(Number);

    const checkInDate = new Date();
    checkInDate.setHours(checkInHour, checkInMinute, checkInSecond);

    const checkOutDate = new Date();
    checkOutDate.setHours(checkOutHour, checkOutMinute, checkOutSecond);

    // Difference in milliseconds
    const diffInMs = checkOutDate.getTime() - checkInDate.getTime();

    // Convert to minutes
    return Math.max(0, Math.floor(diffInMs / 60000)); // Avoid negative minutes
  }

  calculateTotalTimeForAll(): string {
    if (!this.checkIndetails || this.checkIndetails.length === 0) {
      return "No check-in/check-out data available";
    }

    let totalMinutes = 0;

    // Iterate through the data and calculate total time
    for (const entry of this.checkIndetails) {
      if (entry.check_in_time && entry.check_out_time) {
        totalMinutes += this.calculateTimeDifference(
          entry.check_in_time,
          entry.check_out_time
        );
      }
    }

    // Convert total minutes to hours and minutes
    const totalHours = Math.floor(totalMinutes / 60);
    const remainingMinutes = totalMinutes % 60;

    return `${totalHours}h ${remainingMinutes}m`;
  }

  calculateTotalTime(checkInTime: string, checkOutTime: string): string {
    const [checkInHour, checkInMinute] = checkInTime.split(":").map(Number);
    const [checkOutHour, checkOutMinute] = checkOutTime.split(":").map(Number);

    const checkInDate = new Date();
    checkInDate.setHours(checkInHour, checkInMinute, 0);

    const checkOutDate = new Date();
    checkOutDate.setHours(checkOutHour, checkOutMinute, 0);

    const diffInMs = checkOutDate.getTime() - checkInDate.getTime();
    const diffInMinutes = Math.floor(diffInMs / 60000);

    const hours = Math.floor(diffInMinutes / 60);
    const minutes = diffInMinutes % 60;

    return `${hours}h ${minutes}m`;
  }

  formatTime(time: string | null): string {
    if (!time) {
      return "Invalid time";
    }

    // Assuming time format is "HH:mm:ss" or similar
    const [hour, minute, second] = time.split(":");
    const period = +hour >= 12 ? "PM" : "AM";
    const formattedHour = +hour % 12 || 12; // Convert hour to 12-hour format

    return `${formattedHour}:${minute} ${period}`;
  }
}
