import { Component, OnInit } from "@angular/core";

import { PageChangedEvent } from "ngx-bootstrap/pagination";
import { BsDatepickerConfig } from "ngx-bootstrap/datepicker";
import { Subject } from "rxjs";
import { debounceTime } from "rxjs/operators";
import { cloneDeep } from "lodash";
import { ActivatedRoute, Router } from "@angular/router";
// import * as XLSX from "xlsx";
// import * as XLSX from "xlsx-js-style";
import * as ExcelJS from "exceljs";
import { ApiService } from '../../../../core/services/api.service';

@Component({
  selector: 'app-payroll-list',
  templateUrl: './payroll-list.component.html',
  styleUrl: './payroll-list.component.scss'
})
export class PayrollListComponent {
  bsConfig?: Partial<BsDatepickerConfig>;
  private dateChangeSubject = new Subject<Date>();
  breadCrumbItems!: Array<{}>;
  company_id: any;
  spinnerStatus: boolean = false;

  selectedDate: Date = new Date();
  formattedDate: any;

  payrollData: any = [];
  payrollDataList: any = [];
  filteredAttendanceData: any = [];
  endItem: any;

  checkInDetails: any[] = [];
  totalDuration: any;
  attendanceCount: any;

  currentPage: number = 1;
  currentItemsPerPage = 10;
  itemsPerPageOptions = [10, 20, 30, 50];

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

  branch: any[] = [];
  selectedBranch: any[] = [];
  departments: any[] = [];
  selectedDepartments: any[] = [];
  selectedDesignations: any[] = [];
  selectedEmp: any[] = [];
  designations: any[] = [];

  filterCounts = {
    termCount: 0,
    branchCount: 0,
    designationCount: 0,
    departmentCount: 0,
    statusCount: 0,
    statusCheckCount: 0,
    statusCheckInCount: 0,
    dateCount: 0,
    empCount: 0,
  };

  company_logo: any;

  constructor(
    private api: ApiService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.bsConfig = {
      minMode: "month",
      dateInputFormat: "MMM , YYYY",
      showWeekNumbers: false,
    };
  }

  // filter
  selectedStatus: string = "All";
  selectedCheckStatus: string = "All";
  selectedCheckInStatus: string = "All";

  ngOnInit(): void {
    this.breadCrumbItems = [
      { label: "Dashboard" },
      { label: "Payroll", active: true },
    ];

    const data = localStorage.getItem("currentUser");

    if (data) {
      const user = JSON.parse(data);
      this.company_id = user.id;
      this.company_logo = user.logo;
    }

    // Check for query parameters and update state accordingly
    this.route.queryParams.subscribe((params) => {
      this.currentPage = +params["page"] || 1;
      this.currentItemsPerPage = +params["itemsPerPage"] || 10;
      this.term = params["term"] || "";
      this.selectedBranch = params["selectedBranch"]
        ? params["selectedBranch"].split(",")
        : [];
      this.selectedDepartments = params["selectedDepartments"]
        ? params["selectedDepartments"].split(",")
        : [];
      this.selectedDesignations = params["selectedDesignations"]
        ? params["selectedDesignations"].split(",")
        : [];
      this.selectedStatus = params["selectedStatus"] || null;
      this.selectedCheckStatus = params["selectedCheckStatus"] || null;
      this.selectedCheckInStatus = params["selectedCheckInStatus"] || null;
      this.selectedEmp = params["selectedEmp"]
        ? params["selectedEmp"].split(",")
        : [];

      if (params["date"]) {
        this.selectedDate = new Date(params["date"]);
      } else {
        this.selectedDate = new Date();
      }
      this.formattedDate = this.formatDate(this.selectedDate);
      const today = new Date();
      const isSameDay =
        today.getFullYear() === this.selectedDate.getFullYear() &&
        today.getMonth() === this.selectedDate.getMonth() &&
        today.getDate() === this.selectedDate.getDate();

      // Update the filter count based on the date comparison
      this.filterCounts.dateCount = isSameDay ? 0 : 1;
      this.filterdata();
      this.updatePaginatedData();
    });

    this.dateChangeSubject.pipe(debounceTime(300)).subscribe((newDate) => {
      this.handleDateChange(newDate);
    });

    if (this.company_id) {
      this.getAttendance();
      this.getDepartment();
      this.getDesignation();
      this.getBranch();
    }
  }

  getBranch() {
    this.toggleSpinner(true);
    this.api
      .getwithoutid(`branch?status=active&company_id=${this.company_id}`)
      .subscribe(
        (res: any) => {
          this.toggleSpinner(false);
          if (res && res.status) {
            this.branch = res.data;
          } else {
            this.branch = [];
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
    this.getAttendance();
  }

  formatDate(date: Date): string {
    if (!date) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    // return `${year}-${month}-${day}`;
    return `${year}-${month}`;
  }

  toggleSpinner(isLoading: boolean) {
    this.spinnerStatus = isLoading;
  }

  getAttendance() {
    this.toggleSpinner(true);
    const url = `payroll?month=${this.formattedDate}`;
    this.api.getwithoutid(url).subscribe(
      (res: any) => {
        this.toggleSpinner(false);
        if (res && res.status) {
          // this.payrollData = res.data || [];
          this.payrollDataList = res.data || [];
          // this.attendanceCount = res.attendanceCount || [];
          this.filterdata();
          // this.payrollData = cloneDeep(this.payrollDataList.slice(0, 10));
        } else {
          this.payrollData = [];
          this.payrollDataList = [];
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

  payslipData:any
  //
  updatePaySlipData(data: any) {
    this.payslipData = data
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
    const sortedArray = [...this.payrollData]; // Create a new array
    sortedArray.sort((a, b) => {
      const res = this.compare(a[column], b[column]);
      return this.direction === "asc" ? res : -res;
    });
    this.payrollData = sortedArray;
  }
  compare(v1: string | number, v2: string | number) {
    return v1 < v2 ? -1 : v1 > v2 ? 1 : 0;
  }

  term: any;

  // filterdata
  filterdata() {
    let filteredData = this.payrollDataList;

    if (this.selectedStatus == null) {
      this.selectedStatus = "";
    }
    if (this.selectedCheckStatus == null) {
      this.selectedCheckStatus = "";
    }

    if (this.selectedCheckInStatus == null) {
      this.selectedCheckInStatus = "";
    }

    // Reset filter counts
    this.filterCounts.termCount = 0;
    this.filterCounts.branchCount = 0;
    this.filterCounts.designationCount = 0;
    this.filterCounts.departmentCount = 0;
    this.filterCounts.statusCount = 0;
    this.filterCounts.statusCheckCount = 0;
    this.filterCounts.statusCheckInCount = 0;
    this.filterCounts.empCount = 0;

    // Filter by term
    if (this.term) {
      filteredData = filteredData.filter(
        (el: any) =>
          el.name.toLowerCase().includes(this.term.toLowerCase()) ||
          el.mobile.toLowerCase().includes(this.term.toLowerCase()) ||
          el.email.toLowerCase().includes(this.term.toLowerCase()) ||
          el.employee_id.toLowerCase().includes(this.term.toLowerCase()) ||
          el.designation.toLowerCase().includes(this.term.toLowerCase()) ||
          el.department.toLowerCase().includes(this.term.toLowerCase())
        // el.branch.toLowerCase().includes(this.term.toLowerCase())
      );
      this.filterCounts.termCount = 1;
    }

    if (this.selectedBranch.length > 0) {
      filteredData = filteredData.filter((el: any) =>
        this.selectedBranch
          .map((d) => d.toLowerCase())
          .includes(el.branch.toLowerCase())
      );
      this.filterCounts.branchCount = 1;
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

    if (this.selectedEmp && this.selectedEmp.length > 0) {
      filteredData = filteredData.filter((el: any) =>
        this.selectedEmp
          .map((d) => d.toLowerCase())
          .includes(el.name.toLowerCase())
      );
      this.filterCounts.empCount = 1;
    }

    // Filter by selected status
    if (this.selectedStatus) {
      filteredData = filteredData.filter(
        (el: any) => el.attendance_status === this.selectedStatus
      );
      this.filterCounts.statusCount = 1;
    }

    if (this.selectedCheckStatus) {
      filteredData = filteredData.filter(
        (el: any) => el.checkin_status === this.selectedCheckStatus
      );
      this.filterCounts.statusCheckCount = 1;
    }

    if (this.selectedCheckInStatus) {
      filteredData = filteredData.filter(
        (el: any) => el.latestCheckInStatus === this.selectedCheckInStatus
      );

      this.filterCounts.statusCheckInCount = 1;
    }

    // Update filtered data
    this.filteredAttendanceData = filteredData;

    if (
      this.term ||
      this.selectedBranch.length ||
      this.selectedDepartments.length ||
      this.selectedDesignations.length ||
      this.selectedEmp.length ||
      this.selectedStatus ||
      this.selectedCheckStatus ||
      this.selectedCheckInStatus
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
      this.selectedBranch.length ||
      this.selectedDepartments.length ||
      this.selectedDesignations.length ||
      this.selectedEmp.length ||
      this.selectedStatus ||
      this.selectedCheckStatus ||
      this.selectedCheckInStatus
    ) {
      if (startItem >= this.filteredAttendanceData.length) {
        this.currentPage = 1;
      }
    }

    const newStartItem = (this.currentPage - 1) * this.currentItemsPerPage;
    const newEndItem = this.currentPage * this.currentItemsPerPage;

    this.payrollData = cloneDeep(
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
        selectedBranch: this.selectedBranch.join(","),
        selectedDepartments: this.selectedDepartments.join(","),
        selectedDesignations: this.selectedDesignations.join(","),
        selectedEmp: this.selectedEmp.join(","),
        selectedStatus: this.selectedStatus,
        selectedCheckStatus: this.selectedCheckStatus,
        selectedCheckInStatus: this.selectedCheckInStatus,

        date: this.formattedDate,
      },
      queryParamsHandling: "merge",
    });
  }

  pageChanged(event: PageChangedEvent) {
    this.currentPage = event.page;
    this.updatePaginatedData();
  }
  onItemsPerPageChange() {
    this.currentPage = 1;
    this.updatePaginatedData();
  }

  reset() {
    // Clear filters
    this.term = "";
    this.selectedBranch = [];
    this.selectedDepartments = [];
    this.selectedDesignations = [];
    this.selectedStatus = "";
    this.selectedCheckStatus = "";
    this.selectedCheckInStatus = "";
    this.payrollData = this.payrollDataList;
    this.selectedEmp = [];
    this.selectedDate = new Date();
    this.formattedDate = this.formatDate(this.selectedDate);

    this.filterdata();

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        term: null,
        selectedBranch: null,
        selectedDepartments: null,
        selectedDesignations: null,
        selectedStatus: null,
        selectedCheckStatus: null,
        selectedCheckInStatus: null,
        selectedEmp: null,
        page: 1,
        itemsPerPage: this.currentItemsPerPage,
        date: this.formattedDate,
      },
      queryParamsHandling: "merge",
    });

    this.getAttendance();
  }

  get totalFilterCount(): number {
    return (
      this.filterCounts.termCount +
      this.filterCounts.branchCount +
      this.filterCounts.designationCount +
      this.filterCounts.departmentCount +
      this.filterCounts.statusCount +
      this.filterCounts.statusCheckCount +
      this.filterCounts.statusCheckInCount +
      this.filterCounts.dateCount +
      this.filterCounts.empCount
    );
  }

  // no result
  updateNoResultDisplay() {
    const noResultElement = document.querySelector(".noresult") as HTMLElement;
    const paginationElement = document.getElementById(
      "pagination-element"
    ) as HTMLElement;
    if (this.payrollData.length === 0) {
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

  // exportTableToExcel(): void {
  //   const workbook: XLSX.WorkBook = { SheetNames: [], Sheets: {} };

  //   const date = new Date(this.selectedDate);
  //   const day = String(date.getDate()).padStart(2, "0");
  //   const month = date.toLocaleString("default", { month: "long" });
  //   const year = date.getFullYear();
  //   const formattedDate = `${year}-${String(date.getMonth() + 1).padStart(
  //     2,
  //     "0"
  //   )}-${day}`;
  //   const filename = `Attendance_${formattedDate}.xlsx`;

  //   const uniqueDates = Array.from(
  //     new Set(this.filteredAttendanceData.map((employee: any) => employee.date))
  //   ).sort();

  //   const worksheetData: any[][] = [
  //     [
  //       "Name",
  //       "Mobile",
  //       "Date",
  //       "Check-In Time",
  //       "Check-Out Time",
  //       "Arrival Status",
  //       "Time Difference",
  //       "Attendance Status",
  //     ],
  //   ];

  //   // Add each employee's data to worksheet rows
  //   this.filteredAttendanceData.forEach((employee: any) => {
  //     // For each date, add a row with the desired fields
  //     uniqueDates.forEach((date) => {
  //       if (employee.date === date) {
  //         worksheetData.push([
  //           employee.name,
  //           employee.mobile,
  //           employee.date,
  //           employee.latestCheckInTime || "",
  //           employee.latestCheckOutTime || "",
  //           employee.checkin_status,
  //           employee.timeDifference,
  //           employee.attendance_status,
  //         ]);
  //       }
  //     });
  //   });

  //   const worksheet: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(worksheetData);

  //   // Apply conditional formatting for "Absent" attendance status
  //   worksheetData.forEach((row, rowIndex) => {
  //     if (rowIndex === 0) return; // Skip header row
  //     const attendanceStatus = row[7]; // Index 7 is "Attendance Status" column

  //     if (attendanceStatus === "Absent") {
  //       const cellAddress = XLSX.utils.encode_cell({ r: rowIndex, c: 7 }); // Column 8 (Attendance Status)
  //       worksheet[cellAddress] = {
  //         ...worksheet[cellAddress],
  //         s: {
  //           fill: {
  //             fgColor: { rgb: "FF0000" }, // Red background for "Absent"
  //           },
  //         },
  //       };
  //     }
  //   });

  //   // Add the worksheet to the workbook and export it
  //   workbook.SheetNames.push("Attendance Report");
  //   workbook.Sheets["Attendance Report"] = worksheet;

  //   // Export the workbook to an Excel file
  //   XLSX.writeFile(workbook, filename);
  // }

  exportTableToExcel(): void {
    const workbook = new ExcelJS.Workbook(); // Create a new workbook
    const worksheet = workbook.addWorksheet("Attendance Report"); // Add a worksheet

    // Format the selected date
    const date = new Date(this.selectedDate);
    const day = String(date.getDate()).padStart(2, "0");
    const month = date.toLocaleString("default", { month: "long" });
    const year = date.getFullYear();
    const formattedDate = `${year}-${String(date.getMonth() + 1).padStart(
      2,
      "0"
    )}-${day}`;
    const filename = `Attendance_${formattedDate}.xlsx`;

    // Header row
    const header = [
      "Name",
      "Mobile",
      "Date",
      "Check-In Time",
      "Check-Out Time",
      "Arrival Status",
      "Time Difference",
      "Attendance Status",
    ];
    const headerRow = worksheet.addRow(header);

    // Make the header row bold
    headerRow.eachCell((cell) => {
      cell.font = { bold: true };
    });

    // Add employee data rows
    this.filteredAttendanceData.forEach((employee: any) => {
      const row = worksheet.addRow([
        employee.name,
        employee.mobile,
        employee.date,
        employee.latestCheckInTime || "",
        employee.latestCheckOutTime || "",
        employee.checkin_status,
        employee.timeDifference,
        employee.attendance_status,
      ]);

      // Make the "Name" column (first column) bold
      row.getCell(1).font = { bold: true };

      // Apply background color and white font for "Absent" and "Present"
      const statusCell = row.getCell(8); // Attendance Status column
      if (statusCell.value === "Absent") {
        statusCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFF0000" }, // Red background
        };
        statusCell.font = { color: { argb: "FFFFFFFF" } }; // White text
      } else if (statusCell.value === "Present") {
        statusCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF38b738" }, // Green background
        };
        statusCell.font = { color: { argb: "FFFFFFFF" } }; // White text
      }
    });

    // Set column widths
    worksheet.columns = [
      { width: 20 }, // Name
      { width: 15 }, // Mobile
      { width: 15 }, // Date
      { width: 20 }, // Check-In Time
      { width: 20 }, // Check-Out Time
      { width: 20 }, // Arrival Status
      { width: 20 }, // Time Difference
      { width: 20 }, // Attendance Status
    ];

    // Add borders to all cells
    worksheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
    });

    // Export the workbook to an Excel file
    workbook.xlsx.writeBuffer().then((data) => {
      const blob = new Blob([data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      anchor.click();
      window.URL.revokeObjectURL(url);
    });
  }


  printModal(): void {
    const modalContent = document.getElementById('invoice')?.innerHTML;
    console.log(modalContent)
    if (modalContent) {
      const printWindow = window.open('', '', 'width=800,height=600');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Payslip</title>
              <style>
                body {
                  font-family: Arial, sans-serif;
                  margin: 0;
                  padding: 20px;
                }
                .modal-dialog {
                  margin: auto;
                  max-width: 800px;
                }
              </style>
            </head>
            <body>
              ${modalContent}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      }
    }
  }
}
