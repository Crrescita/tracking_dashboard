import { ExcelService } from "./../../../../core/services/excel.service";
import { Component, OnInit } from "@angular/core";
import { ApiService } from "../../../../core/services/api.service";
import { BsDatepickerConfig } from "ngx-bootstrap/datepicker";
import { Subject } from "rxjs";
import { debounceTime } from "rxjs/operators";
import { PageChangedEvent } from "ngx-bootstrap/pagination";
import { cloneDeep } from "lodash";
import * as XLSX from "xlsx";

@Component({
  selector: "app-attendance-monthly",
  templateUrl: "./attendance-monthly.component.html",
  styleUrl: "./attendance-monthly.component.scss",
})
export class AttendanceMonthlyComponent implements OnInit {
  bsConfig?: Partial<BsDatepickerConfig>;
  private dateChangeSubject = new Subject<Date>();
  breadCrumbItems!: Array<{}>;
  spinnerStatus: boolean = false;
  attendanceMonthyData: any = [];
  attendanceMonthyDataList: any = [];
  endItem: any;

  selectedDate: Date = new Date();
  formattedDate: any;
  company_id: any;
  daysInMonth: any;

  currentItemsPerPage = 10; // Default items per page
  itemsPerPageOptions = [10, 20, 30, 50];
  term: any;

  constructor(private api: ApiService, private excelService: ExcelService) {
    this.bsConfig = {
      minMode: "month",
      dateInputFormat: "MMM , YYYY",
      showWeekNumbers: false,
    };
  }

  ngOnInit(): void {
    this.breadCrumbItems = [
      { label: "Employee Management" },
      { label: "Attendance", active: true },
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
      this.getMonthlyCalenderData();
    }
  }

  onDateChange(newDate: Date): void {
    this.dateChangeSubject.next(newDate);
  }

  handleDateChange(newDate: Date): void {
    this.selectedDate = newDate;
    this.formattedDate = this.formatDate(newDate);
    this.getMonthlyCalenderData();
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
    const url = `getEmployeeMonthlyAttendance?company_id=${this.company_id}&date=${this.formattedDate}`;
    this.api.getwithoutid(url).subscribe(
      (res: any) => {
        this.toggleSpinner(false);
        if (res && res.status) {
          this.attendanceMonthyData = res.data || [];
          this.attendanceMonthyDataList = res.data || [];
          this.daysInMonth = res.daysInMonth;
          this.pageChanged({ page: 1, itemsPerPage: this.currentItemsPerPage });
          // this.attendanceMonthyData = cloneDeep(
          //   this.attendanceMonthyDataList.slice(0, 10)
          // );
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

  // filterdata
  filterdata() {
    if (this.term) {
      this.attendanceMonthyData = this.attendanceMonthyDataList.filter(
        (el: any) =>
          el.name.toLowerCase().includes(this.term.toLowerCase()) ||
          el.employee_id.toLowerCase().includes(this.term.toLowerCase())
      );
    } else {
      this.attendanceMonthyData = this.attendanceMonthyDataList;
    }
    // noResultElement
    this.updateNoResultDisplay();
  }

  updateNoResultDisplay() {
    const noResultElement = document.querySelector(".noresult") as HTMLElement;
    const paginationElement = document.getElementById(
      "pagination-element"
    ) as HTMLElement;
    if (this.term && this.attendanceMonthyData.length === 0) {
      noResultElement.style.display = "block";
      paginationElement.classList.add("d-none");
    } else {
      noResultElement.style.display = "none";
      paginationElement.classList.remove("d-none");
    }
  }

  pageChanged(event: PageChangedEvent): void {
    const startItem = (event.page - 1) * event.itemsPerPage;
    this.endItem = event.page * event.itemsPerPage;
    this.attendanceMonthyData = this.attendanceMonthyDataList.slice(
      startItem,
      this.endItem
    );
  }

  onItemsPerPageChange(event: any): void {
    this.currentItemsPerPage = +event.target.value; // Convert to number
    this.pageChanged({ page: 1, itemsPerPage: this.currentItemsPerPage });
  }

  //
  // exportTableToExcel(): void {
  //   const tableElement = document.querySelector("table");
  //   const worksheet: XLSX.WorkSheet = XLSX.utils.table_to_sheet(tableElement);
  //   const workbook: XLSX.WorkBook = {
  //     Sheets: { Sheet1: worksheet },
  //     SheetNames: ["Sheet1"],
  //   };
  //   XLSX.writeFile(workbook, "AttendanceData.xlsx");
  // }

  exportTableToExcel(): void {
    // Select the table element
    const tableElement = document.querySelector("table");

    // Generate the worksheet from the table
    const worksheet: XLSX.WorkSheet = XLSX.utils.table_to_sheet(tableElement);

    // Create a new workbook and add the worksheet
    const workbook: XLSX.WorkBook = {
      Sheets: { Sheet1: worksheet },
      SheetNames: ["Sheet1"],
    };

    // Get the month and year for the header and filename
    const date = new Date(this.selectedDate);
    const month = date.toLocaleString("default", { month: "long" });
    const year = date.getFullYear();
    const headerText = `Attendance Report - ${month} ${year}`;

    // Insert the header into the worksheet
    worksheet["A1"] = { v: headerText, t: "s" }; // Custom header
    XLSX.utils.sheet_add_aoa(worksheet, [[headerText]], { origin: "A1" });

    // Update the filename to include the month and year
    const filename = `Attendance_${month}_${year}.xlsx`;

    // Write the workbook to a file
    XLSX.writeFile(workbook, filename);
  }

  timeLineData: any;
  setModalData(data: any) {
    this.timeLineData = data;
  }

  formatTime(time: string): string {
    // Assuming time format is "HH:mm:ss" or similar
    const [hour, minute, second] = time.split(":");
    const period = +hour >= 12 ? "PM" : "AM";
    const formattedHour = +hour % 12 || 12; // Convert hour to 12-hour format

    return `${formattedHour}:${minute} ${period}`;
  }
}
