import { Component, OnInit } from "@angular/core";
import { ApiService } from "../../../../core/services/api.service";

@Component({
  selector: "app-gernal-reports",
  templateUrl: "./gernal-reports.component.html",
  styleUrl: "./gernal-reports.component.scss",
})
export class GernalReportsComponent implements OnInit {
  company_id: any;
  company_logo: any;
  spinnerStatus: boolean = false;
  attendanceMonthyDataList: any = [];
  daysInMonth: any;
  formattedDate: any;
  selectedDate: Date = new Date();
  attendanceMonthyData: any = [];
  constructor(private api: ApiService) {}

  ngOnInit(): void {
    const data = localStorage.getItem("currentUser");

    if (data) {
      const user = JSON.parse(data);
      this.company_id = user.id;
      this.company_logo = user.logo;
    }

    this.selectedDate = new Date();

    this.formattedDate = this.formatDate(this.selectedDate);

    if (this.company_id) {
      this.getMonthlyCalenderData();
      // this.getDepartment();
      // this.getDesignation();
      // this.getBranch();
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
  }

  getMonthlyCalenderData() {
    this.toggleSpinner(true);
    const url = `getEmployeeReport?company_id=${this.company_id}&date=${this.formattedDate}`;
    this.api.getwithoutid(url).subscribe(
      (res: any) => {
        this.toggleSpinner(false);
        if (res && res.status) {
          this.attendanceMonthyDataList = res.data || [];
          this.daysInMonth = res.daysInMonth;

          // Apply filters if any exist
          // this.filterdata();
        } else {
          this.attendanceMonthyData = [];
          this.attendanceMonthyDataList = [];
          this.toggleSpinner(false);
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

  parseDuration(duration: any) {
    const [hours, minutes, seconds] = duration.split(":").map(Number);
    return hours + minutes / 60 + seconds / 3600;
  }

  formatTime(time: string): string {
    // Assuming time format is "HH:mm:ss" or similar
    const [hour, minute, second] = time.split(":");
    const period = +hour >= 12 ? "PM" : "AM";
    const formattedHour = +hour % 12 || 12; // Convert hour to 12-hour format

    return `${formattedHour}:${minute} ${period}`;
  }

  formatDuration(duration: string): string {
    if (duration === "00:00:00") {
      return "";
    }

    const [hours, minutes, seconds] = duration.split(":").map(Number);

    let formattedTime = "";
    if (hours > 0) {
      formattedTime += `${hours} hrs `;
    }
    if (minutes > 0) {
      formattedTime += `${minutes} min `;
    }
    // if (seconds > 0) {
    //   formattedTime += `${seconds} sec`;
    // }

    return formattedTime.trim();
  }

  formatTimeStartEnd(time: string): string {
    if (!time) {
      return ""; // Return empty string or any other default value if time is invalid
    }

    // Split the time string into date and full time (HH:mm:ss)
    const [date, fullTime] = time.split(" ");
    if (!fullTime) {
      return ""; // Return empty string if fullTime is not available
    }

    // Split the time into hour, minute, and second
    const [hour, minute, second] = fullTime.split(":");

    // Determine AM or PM
    const period = +hour >= 12 ? "PM" : "AM";
    const formattedHour = +hour % 12 || 12; // Convert hour to 12-hour format

    return `${formattedHour}:${minute} ${period}`;
  }

  convertToHoursAndMinutes(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60); // Round the minutes to an integer
    return `${hours} hrs ${mins} min`;
  }
}
