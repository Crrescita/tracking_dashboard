import { ExcelService } from "./../../../../core/services/excel.service";
import { Component, OnInit, Input } from "@angular/core";
import { ApiService } from "../../../../core/services/api.service";
import { BsDatepickerConfig } from "ngx-bootstrap/datepicker";
import { Subject } from "rxjs";
import { debounceTime } from "rxjs/operators";
import { PageChangedEvent } from "ngx-bootstrap/pagination";
import { cloneDeep } from "lodash";
import * as XLSX from "xlsx";
import { Router, ActivatedRoute } from "@angular/router";

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

  currentPage: number = 1;
  // @Input() currentPage: number = 1;

  currentItemsPerPage = 10; // Default items per page
  itemsPerPageOptions = [10, 20, 30, 50];
  term: any;

  // filter
  selectedStatus: string = "";
  departments: any[] = [];
  selectedDepartments: any[] = [];
  selectedDesignations: any[] = [];
  designations: any[] = [];

  constructor(
    private api: ApiService,
    private excelService: ExcelService,
    private router: Router,
    private route: ActivatedRoute
  ) {
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

    // this.route.queryParams.subscribe((params) => {
    //   if (params["page"]) {
    //     this.currentPage = +params["page"]; // Convert to number
    //     console.log(this.currentPage);
    //   } else {
    //     this.currentPage = 1;
    //     // Update URL with default page (1)
    //     this.router.navigate([], {
    //       queryParams: { page: this.currentPage },
    //       queryParamsHandling: "merge",
    //     });
    //   }
    // });
    this.route.queryParams.subscribe((params) => {
      this.currentPage = params["page"] ? +params["page"] : 1;
    });
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
      this.getDepartment();
      this.getDesignation();
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
          this.pageChanged({
            page: this.currentPage,
            itemsPerPage: this.currentItemsPerPage,
          });
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
  // filterdata() {
  //   if (this.term) {
  //     this.attendanceMonthyData = this.attendanceMonthyDataList.filter(
  //       (el: any) =>
  //         el.name.toLowerCase().includes(this.term.toLowerCase()) ||
  //         el.employee_id.toLowerCase().includes(this.term.toLowerCase())
  //     );
  //   } else {
  //     this.attendanceMonthyData = this.attendanceMonthyDataList;
  //   }
  //   // noResultElement

  //   this.updateNoResultDisplay();
  // }

  filterdata() {
    let filteredData = this.attendanceMonthyDataList;

    // Convert selected designations to lowercase
    const selectedDesignationsLower = this.selectedDesignations
      ? this.selectedDesignations.map((d: string) => d.toLowerCase())
      : [];
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

    this.attendanceMonthyData = filteredData;

    // Update no result display
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
    this.currentPage = event.page;

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page: this.currentPage },
      queryParamsHandling: "merge",
    });
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

  // exportTableToExcel(): void {
  //   // Select the table element
  //   const tableElement = document.querySelector("table");

  //   // Generate the worksheet from the table
  //   const worksheet: XLSX.WorkSheet = XLSX.utils.table_to_sheet(tableElement);

  //   // Create a new workbook and add the worksheet
  //   const workbook: XLSX.WorkBook = {
  //     Sheets: { Sheet1: worksheet },
  //     SheetNames: ["Sheet1"],
  //   };

  //   // Get the month and year for the header and filename
  //   const date = new Date(this.selectedDate);
  //   const month = date.toLocaleString("default", { month: "long" });
  //   const year = date.getFullYear();
  //   const headerText = `Attendance Report - ${month} ${year}`;

  //   // Insert the header into the worksheet
  //   worksheet["A1"] = { v: headerText, t: "s" }; // Custom header
  //   XLSX.utils.sheet_add_aoa(worksheet, [[headerText]], { origin: "A1" });

  //   // Update the filename to include the month and year
  //   const filename = `Attendance_${month}_${year}.xlsx`;

  //   // Write the workbook to a file
  //   XLSX.writeFile(workbook, filename);
  // }

  // exportTableToExcel(): void {
  //   // Create a new workbook
  //   const workbook: XLSX.WorkBook = { SheetNames: [], Sheets: {} };

  //   // Get the month and year for the filename
  //   const date = new Date(this.selectedDate);
  //   const month = date.toLocaleString("default", { month: "long" });
  //   const year = date.getFullYear();
  //   const filename = `Attendance_${month}_${year}.xlsx`;

  //   // Loop through each employee in the attendance data
  //   this.attendanceMonthyData.forEach((employee: any, index: any) => {
  //     // Create a new worksheet for the employee
  //     const worksheetData = [
  //       ["ID", "Name", "Mobile", "Email", "Designation", "Employee ID"],
  //       [
  //         employee.id,
  //         employee.name,
  //         employee.mobile,
  //         employee.email,
  //         employee.designation,
  //         employee.employee_id,
  //       ],
  //       [],
  //       [
  //         "Date",
  //         "Check-in Status",
  //         "Attendance Status",
  //         "Time Difference",
  //         "Total Duration",
  //         "Check-in Time",
  //         "Check-out Time",
  //       ],
  //     ];

  //     // Add attendance data to the worksheet
  //     employee.attendance.forEach((record: any) => {
  //       worksheetData.push([
  //         record.date,
  //         record.checkin_status,
  //         record.attendance_status,
  //         record.timeDifference,
  //         record.totalDuration,
  //         record.last_check_in_time,
  //         record.last_check_out_time,
  //       ]);
  //     });

  //     // Create the worksheet and add it to the workbook
  //     const worksheet: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(worksheetData);
  //     const sheetName = employee.name
  //       ? employee.name.replace(/[^a-zA-Z0-9]/g, "")
  //       : `Employee${index + 1}`;
  //     workbook.SheetNames.push(sheetName);
  //     workbook.Sheets[sheetName] = worksheet;
  //   });

  //   // Write the workbook to an Excel file
  //   XLSX.writeFile(workbook, filename);
  // }

  exportTableToExcel(): void {
    // Create a new workbook
    const workbook: XLSX.WorkBook = { SheetNames: [], Sheets: {} };

    // Get the month and year for the filename
    const date = new Date(this.selectedDate);
    const month = date.toLocaleString("default", { month: "long" });
    const year = date.getFullYear();
    const filename = `Attendance_${month}_${year}.xlsx`;

    // Track names to ensure uniqueness
    const usedSheetNames: { [key: string]: number } = {};

    // Loop through each employee in the attendance data
    this.attendanceMonthyData.forEach((employee: any, index: any) => {
      // Create a new worksheet for the employee
      const worksheetData = [
        ["ID", "Name", "Mobile", "Email", "Designation", "Employee ID"],
        [
          employee.id,
          employee.name,
          employee.mobile,
          employee.email,
          employee.designation,
          employee.employee_id,
        ],
        [],
        [
          "Date",
          "Check-in Status",
          "Attendance Status",
          "Time Difference",
          "Total Duration",
          "Check-in Time",
          "Check-out Time",
        ],
      ];

      // Add attendance data to the worksheet
      employee.attendance.forEach((record: any) => {
        worksheetData.push([
          record.date,
          record.checkin_status,
          record.attendance_status,
          record.timeDifference,
          record.totalDuration,
          record.last_check_in_time,
          record.last_check_out_time,
        ]);
      });

      // Generate a unique sheet name
      let sheetName = employee.name
        ? employee.name.replace(/[^a-zA-Z0-9]/g, "")
        : `Employee${index + 1}`;

      // Check if the sheet name has been used before
      if (usedSheetNames[sheetName]) {
        usedSheetNames[sheetName] += 1;
        sheetName += `_${usedSheetNames[sheetName]}`;
      } else {
        usedSheetNames[sheetName] = 1;
      }

      // Create the worksheet and add it to the workbook
      const worksheet: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(worksheetData);
      workbook.SheetNames.push(sheetName);
      workbook.Sheets[sheetName] = worksheet;
    });

    // Write the workbook to an Excel file
    XLSX.writeFile(workbook, filename);
  }

  timeLineData: any;
  setModalData(data: any, userName: any, userImage: any) {
    this.timeLineData = { ...data, userName, userImage };
  }

  formatTime(time: string): string {
    // Assuming time format is "HH:mm:ss" or similar
    const [hour, minute, second] = time.split(":");
    const period = +hour >= 12 ? "PM" : "AM";
    const formattedHour = +hour % 12 || 12; // Convert hour to 12-hour format

    return `${formattedHour}:${minute} ${period}`;
  }

  // filter
  openEnd() {
    document.getElementById("courseFilters")?.classList.add("show");
    document.querySelector(".backdrop3")?.classList.add("show");
  }

  closeoffcanvas() {
    document.getElementById("courseFilters")?.classList.remove("show");
    document.querySelector(".backdrop3")?.classList.remove("show");
  }

  reset() {
    this.term = "";
    this.selectedDepartments = [];
    this.selectedDesignations = [];
    this.attendanceMonthyData = this.attendanceMonthyDataList;
  }
}
