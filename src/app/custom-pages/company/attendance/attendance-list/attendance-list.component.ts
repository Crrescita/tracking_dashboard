import { Component, OnInit } from "@angular/core";
import { ApiService } from "../../../../core/services/api.service";
import { PageChangedEvent } from "ngx-bootstrap/pagination";
import { BsDatepickerConfig } from "ngx-bootstrap/datepicker";
import { Subject } from "rxjs";
import { debounceTime } from "rxjs/operators";
import { cloneDeep } from "lodash";

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

  selectValue = [
    "Alaska",
    "Hawaii",
    "California",
    "Nevada",
    "Oregon",
    "Washington",
    "Arizona",
    "Colorado",
    "Idaho",
    "Montana",
    "Nebraska",
    "New Mexico",
    "North Dakota",
    "Utah",
    "Wyoming",
    "Alabama",
    "Arkansas",
    "Illinois",
    "Iowa",
  ];

  departments: any[] = [];
  selectedDepartments: any[] = [];
  selectedDesignations: any[] = [];
  designations: any[] = [];

  constructor(private api: ApiService) {
    this.bsConfig = {
      maxDate: new Date(),
      showWeekNumbers: false,
      dateInputFormat: "DD/MM/YYYY",
    };
  }

  // filter
  selectedStatus: string = "";

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

    // Subscribe to the date change subject
    this.dateChangeSubject.pipe(debounceTime(300)).subscribe((newDate) => {
      this.handleDateChange(newDate);
    });
    if (this.company_id) {
      this.getAttendance();
      this.getDepartment();
      this.getDesignation();
    }
  }

  getDepartment() {
    this.toggleSpinner(true);
    this.api
      .getwithoutid(`department?status=active&company_id=${this.company_id}`)
      .subscribe(
        (res: any) => {
          this.toggleSpinner(false);
          if (res && res.status) {
            this.departments = res.data;
          } else {
            this.departments = [];
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

  getDesignation() {
    this.toggleSpinner(true);
    this.api
      .getwithoutid(`designation?status=active&company_id=${this.company_id}`)
      .subscribe(
        (res: any) => {
          this.toggleSpinner(false);
          if (res && res.status) {
            this.designations = res.data;
          } else {
            this.designations = [];
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
          this.attendanceCount = res.attendanceCount || [];
          this.attendanceData = cloneDeep(this.attendanceDataList.slice(0, 10));
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
  // filterdata() {
  //   if (this.term) {
  //     this.attendanceData = this.attendanceDataList.filter(
  //       (el: any) =>
  //         el.name.toLowerCase().includes(this.term.toLowerCase()) ||
  //         el.mobile.toLowerCase().includes(this.term.toLowerCase()) ||
  //         el.email.toLowerCase().includes(this.term.toLowerCase()) ||
  //         el.employee_id.toLowerCase().includes(this.term.toLowerCase()) ||
  //         el.checkin_status.toLowerCase().includes(this.term.toLowerCase())||
  //         el.department.toLowerCase().includes(this.term.toLowerCase())
  //     );
  //   } else {
  //     this.attendanceData = this.attendanceDataList;
  //   }
  //   // noResultElement
  //   this.updateNoResultDisplay();
  // }

  filterdata() {
    let filteredData = this.attendanceDataList;

    // Convert selected designations to lowercase
    const selectedDesignationsLower = this.selectedDesignations
      ? this.selectedDesignations.map((d: string) => d.toLowerCase())
      : [];
    console.log(selectedDesignationsLower);
    const selectedDepartmentLower = this.selectedDepartments
      ? this.selectedDepartments.map((d: string) => d.toLowerCase())
      : [];

    // Filter by term
    if (this.term) {
      filteredData = filteredData.filter(
        (el: any) =>
          el.name.toLowerCase().includes(this.term.toLowerCase()) ||
          el.mobile.toLowerCase().includes(this.term.toLowerCase()) ||
          el.email.toLowerCase().includes(this.term.toLowerCase()) ||
          el.employee_id.toLowerCase().includes(this.term.toLowerCase())
      );
    }

    // Filter by selected departments
    if (selectedDepartmentLower.length > 0) {
      filteredData = filteredData.filter((el: any) =>
        selectedDepartmentLower.includes(el.department.toLowerCase())
      );
    }

    // Filter by selected designations (case-insensitive)
    if (selectedDesignationsLower.length > 0) {
      filteredData = filteredData.filter((el: any) =>
        selectedDesignationsLower.includes(el.designation.toLowerCase())
      );
    }

    // Filter by selected status
    if (this.selectedStatus) {
      filteredData = filteredData.filter(
        (el: any) => el.checkin_status === this.selectedStatus
      );
    }

    this.attendanceData = filteredData;

    // Update no result display
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

  // filter
  //  Filter Offcanvas Set
  openEnd() {
    document.getElementById("courseFilters")?.classList.add("show");
    document.querySelector(".backdrop3")?.classList.add("show");
  }

  closeoffcanvas() {
    document.getElementById("courseFilters")?.classList.remove("show");
    document.querySelector(".backdrop3")?.classList.remove("show");
  }
}
