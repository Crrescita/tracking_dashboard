import { Component, OnInit } from "@angular/core";
import { ApiService } from "../../../../core/services/api.service";
import { PageChangedEvent } from "ngx-bootstrap/pagination";
import { BsDatepickerConfig } from "ngx-bootstrap/datepicker";
import { Subject } from "rxjs";
import { debounceTime } from "rxjs/operators";

@Component({
  selector: "app-attendance-list",
  templateUrl: "./attendance-list.component.html",
  styleUrl: "./attendance-list.component.scss",
})
export class AttendanceListComponent implements OnInit {
  bsConfig?: Partial<BsDatepickerConfig>;
  private dateChangeSubject = new Subject<Date>();
  breadCrumbItems!: Array<{}>;
  company_id: any;
  spinnerStatus: boolean = false;

  selectedDate: Date = new Date();
  formattedDate: any;

  attendanceData: any = [];
  attendanceDataList: any = [];
  endItem: any;

  checkInDetails: any[] = [];
  totalDuration: any;
  attendanceCount: any;

  constructor(private api: ApiService) {
    this.bsConfig = {
      maxDate: new Date(),
      showWeekNumbers: false,
      dateInputFormat: "DD/MM/YYYY",
    };
  }

  ngOnInit(): void {
    this.breadCrumbItems = [
      { label: "Attendance" },
      { label: "Employee", active: true },
    ];

    this.selectedDate = new Date();

    if (this.selectedDate) {
      this.formattedDate = this.formatDate(this.selectedDate);
    }

    const data = localStorage.getItem("currentUser");

    if (data) {
      const user = JSON.parse(data);
      this.company_id = user.id;
    }

    if (this.company_id) {
      this.getAttendance();
    }

    // Subscribe to the date change subject
    this.dateChangeSubject.pipe(debounceTime(300)).subscribe((newDate) => {
      this.handleDateChange(newDate);
    });
  }

  onDateChange(newDate: Date): void {
    this.dateChangeSubject.next(newDate);
  }

  handleDateChange(newDate: Date): void {
    // if (newDate && newDate !== this.selectedDate) {

    this.selectedDate = newDate;
    this.formattedDate = this.formatDate(newDate);
    this.getAttendance();

    // }
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

  getAttendance() {
    this.toggleSpinner(true);
    const url = `getAttendence?company_id=${this.company_id}&date=${this.formattedDate}`;
    this.api.getwithoutid(url).subscribe(
      (res: any) => {
        this.toggleSpinner(false);
        if (res && res.status) {
          this.attendanceData = res.data || [];
          this.attendanceDataList = res.data || [];
          this.attendanceCount = res.attendenceCount || [];

          // this.updatePagination();
          // this.updateDisplayedItems();
        } else {
          this.attendanceData = [];
          this.attendanceDataList = [];
          this.attendanceCount = [];
          this.toggleSpinner(false);
        }
      },
      (error) => {
        this.handleError(
          error.message || "An error occurred while fetching data"
        );
      }
    );
  }

  handleError(error: any) {
    this.toggleSpinner(false);
  }

  //
  updateCheckInDetal(data: any, duration: any) {
    this.totalDuration = duration;
    this.checkInDetails = data;
  }

  // table

  // Sort Data
  direction: any = "asc";
  onSort(column: any) {
    if (this.direction == "asc") {
      this.direction = "desc";
    } else {
      this.direction = "asc";
    }
    const sortedArray = [...this.attendanceData]; // Create a new array
    sortedArray.sort((a, b) => {
      const res = this.compare(a[column], b[column]);
      return this.direction === "asc" ? res : -res;
    });
    this.attendanceData = sortedArray;
  }
  compare(v1: string | number, v2: string | number) {
    return v1 < v2 ? -1 : v1 > v2 ? 1 : 0;
  }

  pageChanged(event: PageChangedEvent): void {
    const startItem = (event.page - 1) * event.itemsPerPage;
    this.endItem = event.page * event.itemsPerPage;
    this.attendanceData = this.attendanceDataList.slice(
      startItem,
      this.endItem
    );
  }
  term: any;

  // filterdata
  filterdata() {
    if (this.term) {
      this.attendanceData = this.attendanceDataList.filter(
        (el: any) =>
          el.name.toLowerCase().includes(this.term.toLowerCase()) ||
          el.mobile.toLowerCase().includes(this.term.toLowerCase()) ||
          el.email.toLowerCase().includes(this.term.toLowerCase()) ||
          el.employee_id.toLowerCase().includes(this.term.toLowerCase()) ||
          el.checkin_status.toLowerCase().includes(this.term.toLowerCase())
      );
    } else {
      this.attendanceData = this.attendanceDataList;
    }
    // noResultElement
    this.updateNoResultDisplay();
  }

  // no result
  updateNoResultDisplay() {
    const noResultElement = document.querySelector(".noresult") as HTMLElement;
    const paginationElement = document.getElementById(
      "pagination-element"
    ) as HTMLElement;
    if (this.term && this.attendanceData.length === 0) {
      noResultElement.style.display = "block";
      paginationElement.classList.add("d-none");
    } else {
      noResultElement.style.display = "none";
      paginationElement.classList.remove("d-none");
    }
  }

  formatTime(time: string | null): string {
    if (!time) {
      return "-";
    }

    // Assuming time format is "HH:mm:ss" or similar
    const [hour, minute, second] = time.split(":");
    const period = +hour >= 12 ? "PM" : "AM";
    const formattedHour = +hour % 12 || 12; // Convert hour to 12-hour format

    return `${formattedHour}:${minute}:${second} ${period} `;
  }
}
