import { ExcelService } from "./../../../../core/services/excel.service";
import { Component, OnInit, Input } from "@angular/core";
import { ApiService } from "../../../../core/services/api.service";
import { BsDatepickerConfig } from "ngx-bootstrap/datepicker";
import { Subject } from "rxjs";
import { debounceTime, filter } from "rxjs/operators";
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
  filteredAttendanceData: any = [];
  endItem: any;

  selectedDate: Date = new Date();
  formattedDate: any;
  company_id: any;
  daysInMonth: any;

  currentPage: number = 1;
  currentItemsPerPage = 10;
  itemsPerPageOptions = [10, 20, 30, 50];
  term: any;

  // filter
  selectedStatus: string = "";
  departments: any[] = [];
  selectedEmp: any[] = [];
  selectedDepartments: any[] = [];
  selectedDesignations: any[] = [];
  designations: any[] = [];

  filterCounts = {
    termCount: 0,
    designationCount: 0,
    departmentCount: 0,
    statusCount: 0,
    dateCount: 0,
    empCount: 0,
  };

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

    this.selectedDate = new Date();

    // if (this.selectedDate) {
    //   this.formattedDate = this.formatDate(this.selectedDate);
    // }

    const data = localStorage.getItem("currentUser");

    if (data) {
      const user = JSON.parse(data);
      this.company_id = user.id;
    }

    this.route.queryParams.subscribe((params) => {
      this.currentPage = +params["page"] || 1;
      this.currentItemsPerPage = +params["itemsPerPage"] || 10;
      this.term = params["term"] || "";
      this.selectedDepartments = params["selectedDepartments"]
        ? params["selectedDepartments"].split(",")
        : [];
      this.selectedDesignations = params["selectedDesignations"]
        ? params["selectedDesignations"].split(",")
        : [];
      this.selectedEmp = params["selectedEmp"]
        ? params["selectedEmp"].split(",")
        : [];
      this.selectedStatus = params["selectedStatus"] || null;

      if (params["date"]) {
        this.selectedDate = new Date(params["date"]);
      } else {
        this.selectedDate = new Date();
      }
      this.formattedDate = this.formatDate(this.selectedDate);
      const today = new Date();
      const isSameDay =
        today.getFullYear() === this.selectedDate.getFullYear() &&
        today.getMonth() === this.selectedDate.getMonth();
      // Update the filter count based on the date comparison
      this.filterCounts.dateCount = isSameDay ? 0 : 1;

      this.filterdata();
      this.updatePaginatedData();
    });

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
    const today = new Date();
    const isSameDay =
      today.getFullYear() === newDate.getFullYear() &&
      today.getMonth() === newDate.getMonth();

    this.filterCounts.dateCount = isSameDay ? 0 : 1;

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        date: this.formattedDate,
      },
      queryParamsHandling: "merge",
    });
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
          this.attendanceMonthyDataList = res.data || [];
          this.daysInMonth = res.daysInMonth;

          // Apply filters if any exist
          this.filterdata();
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
    let filteredData = this.attendanceMonthyDataList;

    // Reset filter counts
    this.filterCounts.termCount = 0;
    this.filterCounts.designationCount = 0;
    this.filterCounts.departmentCount = 0;
    this.filterCounts.statusCount = 0;
    this.filterCounts.empCount = 0;

    // Filter by term
    if (this.term) {
      filteredData = filteredData.filter(
        (el: any) =>
          el.name.toLowerCase().includes(this.term.toLowerCase()) ||
          el.mobile.toLowerCase().includes(this.term.toLowerCase()) ||
          el.email.toLowerCase().includes(this.term.toLowerCase()) ||
          el.employee_id.toLowerCase().includes(this.term.toLowerCase())
      );
      this.filterCounts.termCount = 1;
    }

    // Filter by selected departments
    if (this.selectedDepartments.length > 0) {
      filteredData = filteredData.filter((el: any) =>
        this.selectedDepartments
          .map((d) => d.toLowerCase())
          .includes(el.department.toLowerCase())
      );
      this.filterCounts.departmentCount = 1;
    }

    // Filter by selected designations
    if (this.selectedDesignations && this.selectedDesignations.length > 0) {
      filteredData = filteredData.filter((el: any) =>
        this.selectedDesignations
          .map((d) => d.toLowerCase())
          .includes(el.designation.toLowerCase())
      );
      this.filterCounts.designationCount = 1;
    }

    // Filter by selected status
    if (this.selectedStatus) {
      filteredData = filteredData.filter(
        (el: any) => el.checkin_status === this.selectedStatus
      );
      this.filterCounts.statusCount = 1;
    }

    if (this.selectedEmp && this.selectedEmp.length > 0) {
      filteredData = filteredData.filter((el: any) =>
        this.selectedEmp
          .map((d) => d.toLowerCase())
          .includes(el.name.toLowerCase())
      );
      this.filterCounts.empCount = 1;
    }

    // Update filtered data
    this.filteredAttendanceData = filteredData;

    if (
      this.term ||
      this.selectedDepartments.length ||
      this.selectedDesignations.length ||
      this.selectedEmp.length ||
      this.selectedStatus
    ) {
      if (this.filteredAttendanceData.length === 0) {
        this.currentPage = 1;
      }
    }

    this.updatePaginatedData();
  }

  updatePaginatedData(): void {
    const startItem = (this.currentPage - 1) * this.currentItemsPerPage;
    const endItem = this.currentPage * this.currentItemsPerPage;

    if (
      this.term ||
      this.selectedDepartments.length ||
      this.selectedDesignations.length ||
      this.selectedEmp.length ||
      this.selectedStatus
    ) {
      if (startItem >= this.filteredAttendanceData.length) {
        this.currentPage = 1;
      }
    }

    const newStartItem = (this.currentPage - 1) * this.currentItemsPerPage;
    const newEndItem = this.currentPage * this.currentItemsPerPage;

    this.attendanceMonthyData = cloneDeep(
      this.filteredAttendanceData.slice(newStartItem, newEndItem)
    );

    // Update no result display
    this.updateNoResultDisplay();

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        page: this.currentPage,
        itemsPerPage: this.currentItemsPerPage,
        term: this.term,
        selectedDepartments: this.selectedDepartments.join(","),
        selectedDesignations: this.selectedDesignations.join(","),
        selectedEmp: this.selectedEmp.join(","),
        selectedStatus: this.selectedStatus,
        date: this.formattedDate,
      },
      queryParamsHandling: "merge",
    });
  }

  pageChanged(event: PageChangedEvent) {
    this.currentPage = event.page;
    this.updatePaginatedData();
  }

  updateNoResultDisplay() {
    const noResultElement = document.querySelector(".noresult") as HTMLElement;
    const paginationElement = document.getElementById(
      "pagination-element"
    ) as HTMLElement;
    if (this.attendanceMonthyData.length === 0) {
      noResultElement.style.display = "block";
      paginationElement.classList.add("d-none");
    } else {
      noResultElement.style.display = "none";
      paginationElement.classList.remove("d-none");
    }
  }

  onItemsPerPageChange() {
    this.currentPage = 1;
    this.updatePaginatedData();
  }

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
          // "Time Difference",
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
          // record.timeDifference,
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
    // Clear filters
    this.term = "";
    this.selectedDepartments = [];
    this.selectedDesignations = [];
    this.selectedStatus = "";
    this.selectedEmp = [];
    this.attendanceMonthyData = this.attendanceMonthyDataList;

    this.selectedDate = new Date();
    this.formattedDate = this.formatDate(this.selectedDate);

    this.filterdata();

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        term: null,
        selectedDepartments: null,
        selectedDesignations: null,
        selectedStatus: null,
        selectedEmp: null,
        page: 1,
        itemsPerPage: this.currentItemsPerPage,
        date: this.formattedDate,
      },
      queryParamsHandling: "merge",
    });

    this.getMonthlyCalenderData();
  }

  get totalFilterCount(): number {
    return (
      this.filterCounts.termCount +
      this.filterCounts.designationCount +
      this.filterCounts.departmentCount +
      this.filterCounts.statusCount +
      this.filterCounts.dateCount +
      this.filterCounts.empCount
    );
  }
}
