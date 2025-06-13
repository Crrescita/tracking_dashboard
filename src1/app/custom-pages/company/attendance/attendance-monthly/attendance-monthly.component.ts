import { ExcelService } from "./../../../../core/services/excel.service";
import { Component, OnInit, Input } from "@angular/core";
import { ApiService } from "../../../../core/services/api.service";
import { BsDatepickerConfig } from "ngx-bootstrap/datepicker";
import { Subject } from "rxjs";
import { debounceTime, filter } from "rxjs/operators";
import { PageChangedEvent } from "ngx-bootstrap/pagination";
import { cloneDeep } from "lodash";
// import * as XLSX from "xlsx";
import * as XLSX from "xlsx-js-style";
import { Router, ActivatedRoute } from "@angular/router";
import * as ExcelJS from "exceljs";
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
  branch: any[] = [];
  selectedBranch: any[] = [];
  selectedStatus: string = "";
  departments: any[] = [];
  selectedEmp: any[] = [];
  selectedDepartments: any[] = [];
  selectedDesignations: any[] = [];
  designations: any[] = [];

  filterCounts = {
    termCount: 0,
    branchCount: 0,
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
      this.selectedBranch = params["selectedBranch"]
        ? params["selectedBranch"].split(",")
        : [];
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
    this.filterCounts.branchCount = 0;
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
      this.selectedBranch.length ||
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
      this.selectedBranch.length ||
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
        selectedBranch: this.selectedBranch.join(","),
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
    // Create a new workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Attendance");

    // Get the month and year for the filename
    const date = new Date(this.selectedDate);
    const month = date.toLocaleString("default", { month: "long" });
    const year = date.getFullYear();
    const filename = `Attendance_${month}_${year}.xlsx`;

    // Prepare the header row with Name, Mobile, and dates
    const uniqueDates: any[] = Array.from(
      new Set(
        this.filteredAttendanceData.flatMap((employee: any) =>
          employee.attendance.map((record: any) => record.date)
        )
      )
    ).sort();
    // Sort dates if needed

    // Initialize worksheet data with header row
    const header = [
      "Name",
      "Department",
      "Mobile",
      "Total Present",
      "Total Absent",
      "Total Leave",
      "Total Holidays",
      ...uniqueDates,
    ];

    // worksheet.addRow(header);
    const headerRow = worksheet.addRow(header);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true }; // Make header cells bold
    });

    // Add each employee's data to worksheet rows
    this.filteredAttendanceData.forEach((employee: any) => {
      const row = [
        employee.name,
        employee.department,
        employee.mobile,
        employee.totals.totalPresent,
        employee.totals.totalAbsent,
        employee.totals.totalLeave,
        employee.totals.totalHolidays,
      ];

      uniqueDates.forEach((date) => {
        const record = employee.attendance.find((r: any) => r.date == date);
        row.push(record ? record.attendance_status : "");
      });

      const dataRow = worksheet.addRow(row);

      // Make the first 6 columns (Name, Mobile, etc.) bold
      for (let i = 1; i <= 6; i++) {
        const cell = dataRow.getCell(i);
        cell.font = { bold: true };
      }
    });

    // Apply column widths for better readability
    worksheet.columns = [
      { width: 20 }, // Name column width
      { width: 15 }, // Mobile column width
      { width: 15 }, // Total Present
      { width: 15 }, // Total Absent
      { width: 15 }, // Total Leave
      { width: 15 }, // Total Holidays
      ...uniqueDates.map(() => ({ width: 12 })), // Date columns width
    ];

    // Apply borders, colors, and conditional formatting
    worksheet.eachRow({ includeEmpty: true }, (row, rowIndex) => {
      row.eachCell({ includeEmpty: true }, (cell, colIndex) => {
        // Apply borders
        cell.border = {
          top: { style: "thin", color: { argb: "000000" } },
          left: { style: "thin", color: { argb: "000000" } },
          bottom: { style: "thin", color: { argb: "000000" } },
          right: { style: "thin", color: { argb: "000000" } },
        };

        // Apply colors (conditional formatting)
        if (rowIndex > 0 && colIndex >= 6) {
          // Skip header and fixed columns
          if (cell.value === "Absent") {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFFF0000" }, // Red fill for Absent
            };
            cell.font = { color: { argb: "FFFFFFFF" } }; // White text for "Absent"
          } else if (cell.value === "Present") {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "38b738" }, // Green fill for Present
            };
            cell.font = { color: { argb: "FFFFFFFF" } }; // White text for "Present"
          }
        }
      });
    });

    // Freeze the first 6 columns (up to "Total Holidays") and the header row
    worksheet.views = [
      {
        state: "frozen",
        xSplit: 6, // Freeze first 6 columns
        ySplit: 1, // Freeze header row
        // topLeftCell: "A1", // Freeze starting from top-left cell
      },
    ];

    // Write the workbook to an Excel file
    workbook.xlsx.writeBuffer().then((buffer) => {
      const blob = new Blob([buffer], { type: "application/octet-stream" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
    });
  }

  exportTableToExcel2(): void {
    // Create a new workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Attendance");

    // Get the month and year for the filename
    const date = new Date(this.selectedDate);
    const month = date.toLocaleString("default", { month: "long" });
    const year = date.getFullYear();
    const filename = `Attendance_${month}_${year}.xlsx`;

    // Prepare the header row with Name, Mobile, and dates
    const uniqueDates = Array.from(
      new Set(
        this.filteredAttendanceData.flatMap((employee: any) =>
          employee.attendance.map((record: any) => record.date)
        )
      )
    ).sort(); // Sort dates if needed

    // Initialize worksheet data with header row
    const header = [
      "Name",
      "Department",
      "Total Present",
      "Total Absent",
      "Total Leave",
      "Total Holidays",
      "On Time",
      "Early",
      "Late",
      "Avg. Check-in Time",
      "Avg. Check-out Time",
      "Avg. Working Hours",
      "Total Working Hours",
      // ...uniqueDates,
    ];

    // worksheet.addRow(header);
    const headerRow = worksheet.addRow(header);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true }; // Make header cells bold
    });

    // Add each employee's data to worksheet rows
    this.filteredAttendanceData.forEach((employee: any) => {
      const row = [
        employee.name,
        employee.department,
        employee.totals.totalPresent,
        employee.totals.totalAbsent,
        employee.totals.totalLeave,
        employee.totals.totalHolidays,
        employee.totals.totalOntime,
        employee.totals.totalEarly,
        employee.totals.totalLate,
        employee.totals.avgCheckInTime,
        employee.totals.avgCheckOutTime,
        employee.totals.avgWorkHours,
        employee.totals.totalWorkHours,
      ];

      // uniqueDates.forEach((date) => {
      //   const record = employee.attendance.find((r: any) => r.date == date);
      //   row.push(record ? record.attendance_status : "");
      // });

      const dataRow = worksheet.addRow(row);

      // Make the first 6 columns (Name, Mobile, etc.) bold
      for (let i = 1; i <= 6; i++) {
        const cell = dataRow.getCell(i);
        cell.font = { bold: true };
      }
    });

    // Apply column widths for better readability
    worksheet.columns = [
      { width: 20 }, // Name column width
      { width: 15 }, // Mobile column width
      { width: 15 }, // Total Present
      { width: 15 }, // Total Absent
      { width: 15 }, // Total Leave
      { width: 15 }, // Total Holidays
      { width: 15 }, // Total Holidays
      { width: 15 }, // Total Holidays
      { width: 15 }, // Total Holidays
      { width: 15 }, // Total Holidays
      { width: 15 }, // Total Holidays
      { width: 15 }, // Total Holidays
      { width: 15 }, // Total Holidays
    ];

    // Write the workbook to an Excel file
    workbook.xlsx.writeBuffer().then((buffer) => {
      const blob = new Blob([buffer], { type: "application/octet-stream" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
    });
  }

  // new

  async fetchAddresses(
    minLat: number,
    minLong: number,
    maxLat: number,
    maxLong: number
  ) {
    let minCheckInAddress = "";
    let maxCheckOutAddress = "";

    if (minLong != 0 && minLat != 0) {
      minCheckInAddress = await this.geocodeCoordinates(minLong, minLat); // Await Promise
    }

    if (maxLong != 0 && maxLat != 0) {
      maxCheckOutAddress = await this.geocodeCoordinates(maxLong, maxLat); // Await Promise
    }

    return { minCheckInAddress, maxCheckOutAddress };
  }

  async exportTableToExcelAddress() {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Attendance");

    // Get month and year for the filename
    const date = new Date(this.selectedDate);
    const month = date.toLocaleString("default", { month: "long" });
    const year = date.getFullYear();
    const filename = `Attendance_${month}_${year}.xlsx`;

    // Prepare header rows
    const headerRow1 = [
      "Name",
      "Mobile",
      "Total Present",
      "Total Absent",
      "Total Leave",
      "Total Holidays",
    ];
    const headerRow2 = ["", "", "", "", "", ""]; // Placeholder for merged cells

    const uniqueDates = Array.from(
      new Set(
        this.filteredAttendanceData.flatMap((employee: any) =>
          employee.attendance.map((record: any) => record.date)
        )
      )
    ).sort();

    // Add dynamic columns for each unique date
    uniqueDates.forEach((date) => {
      headerRow1.push(date as string, "", "", "", "");
      headerRow2.push(
        "Total Distance",
        "Check-In Time",
        "Check-In Address",
        "Check-Out Time",
        "Check-Out Address"
      );
    });

    // Add header rows
    worksheet.addRow(headerRow1);
    worksheet.addRow(headerRow2);

    // Merge date header cells (row 1)
    let colIndex = 7;
    uniqueDates.forEach(() => {
      worksheet.mergeCells(1, colIndex, 1, colIndex + 4);
      colIndex += 5;
    });

    // Style the header rows
    [worksheet.getRow(1), worksheet.getRow(2)].forEach((row) => {
      row.eachCell((cell) => {
        cell.font = { bold: true, size: 12 };
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFC0C0C0" }, // Light gray
        };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
    });

    // Add employee data rows
    for (const employee of this.filteredAttendanceData) {
      // Base row data
      const baseRow = [
        employee.name,
        employee.mobile,
        employee.totals.totalPresent,
        employee.totals.totalAbsent,
        employee.totals.totalLeave,
        employee.totals.totalHolidays,
      ];

      // Rows to store data under each date
      const rowData: any[] = [...baseRow];

      for (const date of uniqueDates) {
        const record = employee.attendance.find((r: any) => r.date === date);

        let totalDistance = "0 km";
        let lastCheckInTime = "-";
        let lastCheckOutTime = "-";
        let checkInAddress = "-";
        let checkOutAddress = "-";

        if (record) {
          totalDistance = record.totalDistance
            ? `${new Intl.NumberFormat("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }).format(record.totalDistance)} km`
            : "0 km";

          lastCheckInTime = record.last_check_in_time || "-";
          lastCheckOutTime = record.last_check_out_time || "-";

          if (
            record.min_lat_check_in !== "0" &&
            record.min_long_check_in !== "0"
          ) {
            const addresses = await this.fetchAddresses(
              parseFloat(record.min_lat_check_in),
              parseFloat(record.min_long_check_in),
              parseFloat(record.max_lat_check_out),
              parseFloat(record.max_long_check_out)
            );
            checkInAddress = addresses.minCheckInAddress || "-";
            checkOutAddress = addresses.maxCheckOutAddress || "-";
            const data = {
              employeeId: employee.id,
              lat_check_in: record.min_lat_check_in,
              long_check_in: record.min_long_check_in,
              lat_check_out: record.max_lat_check_out,
              long_check_out: record.max_long_check_out,
              checkInAddress,
              checkOutAddress,
              date,
            };
            console.log(data);
            this.api.post("setCheckAddress", data).subscribe((res: any) => {
              console.log(res);
            });
          }
        }

        rowData.push(
          totalDistance,
          lastCheckInTime,
          checkInAddress,
          lastCheckOutTime,
          checkOutAddress
        );
      }

      // Add row to worksheet
      const newRow = worksheet.addRow(rowData);

      // Apply borders to the row
      newRow.eachCell((cell) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
    }

    // Set column widths
    worksheet.columns = [
      { width: 20 }, // Name
      { width: 15 }, // Mobile
      { width: 15 }, // Total Present
      { width: 15 }, // Total Absent
      { width: 15 }, // Total Leave
      { width: 15 }, // Total Holidays
      ...uniqueDates.flatMap(() => [
        { width: 15 },
        { width: 15 },
        { width: 25 },
        { width: 15 },
        { width: 25 },
      ]),
    ];

    // Freeze panes
    worksheet.views = [
      {
        state: "frozen",
        xSplit: 6,
        ySplit: 2,
      },
    ];

    // Save and trigger download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/octet-stream" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  }

  // Geocode using latitude and longitude
  geocodeCoordinates(lng: number, lat: number): Promise<string> {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=pk.eyJ1IjoiZ3VyamVldHYyIiwiYSI6ImNseWxiN3o5cDEzd3UyaXM0cmU3cm0zNnMifQ._-UTYeqo8cq1cH8vYy9Www`;

    return fetch(url)
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            `Error fetching geocode data: ${response.statusText}`
          );
        }
        return response.json();
      })
      .then((data) => {
        if (data.features && data.features.length > 0) {
          return data.features[0].place_name;
        } else {
          console.warn("No valid address found for coordinates:", lng, lat);
          return "";
        }
      })
      .catch((error) => {
        console.error("Error fetching address:", error);
        return "";
      });
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
    this.selectedBranch = [];
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
        selectedBranch: null,
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
      this.filterCounts.branchCount +
      this.filterCounts.designationCount +
      this.filterCounts.departmentCount +
      this.filterCounts.statusCount +
      this.filterCounts.dateCount +
      this.filterCounts.empCount
    );
  }
}
