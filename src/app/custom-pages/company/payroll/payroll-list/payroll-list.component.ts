import { Component, OnInit, ViewChild } from '@angular/core';
import {
  FormGroup,
  FormArray,
  FormBuilder,
  Validators,
  AbstractControl,
} from "@angular/forms";
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
import { SalaryInvoiceComponent } from '../../employee/salary/salary-invoice/salary-invoice.component';

@Component({
  selector: 'app-payroll-list',
  templateUrl: './payroll-list.component.html',
  styleUrl: './payroll-list.component.scss'
})
export class PayrollListComponent {
  bsConfig?: Partial<BsDatepickerConfig>;
  @ViewChild(SalaryInvoiceComponent) salaryInvoiceComponent!: SalaryInvoiceComponent;  
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

  

  branch: any[] = [];
  selectedBranch: any[] = [];
  departments: any[] = [];
  selectedDepartments: any[] = [];
  selectedDesignations: any[] = [];
  selectedEmp: any[] = [];
  designations: any[] = [];
  showFinalizedPayroll: boolean = true;

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
  emp_id: any;
  isModalOpen: boolean = false;
  selectedEmployees: any[] = []; 

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
      // this.getAttendance();
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

  // getAttendance() {
  //   this.toggleSpinner(true);
  //   const url = `payroll?month=${this.formattedDate}`;
  //   this.api.getwithoutid(url).subscribe(
  //     (res: any) => {
  //       this.toggleSpinner(false);
  //       if (res && res.status) {
  //         if(res.payroll_finalized == 1){
 
  //     if (Array.isArray(res.data)) {
  //       this.payrollDataList = res.data.map((item:any) => {
  //         return {
  //           ...item,
  //           earning: typeof item.earning === "string" ? JSON.parse(item.earning) : item.earning,
  //           deduction: typeof item.deduction === "string" ? JSON.parse(item.deduction) : item.deduction,
  //           employeer_ctc: typeof item.employeer_ctc === "string" ? JSON.parse(item.employeer_ctc) : item.employeer_ctc
  //         };
  //       });
  //     } else {
  //       this.payrollDataList = [];
  //       console.error("Unexpected data format: res.data is not an array");
  //     }

  //         // this.payslipData = data; 
  //         // this.payrollDataList = res.data || [];
  //         // this.attendanceCount = res.attendanceCount || [];
  //         this.filterdata();
  //         // this.payrollData = cloneDeep(this.payrollDataList.slice(0, 10));
  //         }
  //         else{
  //           console.log(res.data)
  //           // setTimeout(() => {
            
         
  //           //   if (pendingPayroll) {
  //           //     this.openSalaryInvoice(pendingPayroll);
  //           //   }
  //           // }, 1000); // Simulating API delay
  //         }
          
    
       
  //       } else {
  //         this.payrollData = [];
  //         this.payrollDataList = [];
  //         this.attendanceCount = [];
  //         this.toggleSpinner(false);
  //       }
  //     },
  //     (error) => {
  //       this.handleError(
  //         error.message || "An error occurred while fetching data"
  //       );
  //     }
  //   );
  // }


  // getAttendance() {
  //   this.toggleSpinner(true);
  //   const url = `payroll?month=${this.formattedDate}`;
  //   this.api.getwithoutid(url).subscribe(
  //     (res: any) => {
  //       this.toggleSpinner(false);
  //       if (res && res.status) {
  //         if (res.payroll_finalized == 1) {
  //           if (Array.isArray(res.data)) {
  //             this.payrollDataList = res.data.map((item: any) => {
  //               return {
  //                 ...item,
  //                 earning: typeof item.earning === "string" ? JSON.parse(item.earning) : item.earning,
  //                 deduction: typeof item.deduction === "string" ? JSON.parse(item.deduction) : item.deduction,
  //                 employeer_ctc: typeof item.employeer_ctc === "string" ? JSON.parse(item.employeer_ctc) : item.employeer_ctc
  //               };
  //             });
  //           } else {
  //             this.payrollDataList = [];
  //             console.error("Unexpected data format: res.data is not an array");
  //           }
  //           this.filterdata();
  //         } else {
  //           console.log("Payroll not finalized employees:", res.data);
  
          
  //           this.payrollDataList = res.data.map((item: any) => {
  //             return {
  //               ...item,
  //               earning: typeof item.earning === "string" ? JSON.parse(item.earning) : item.earning,
  //               deduction: typeof item.deduction === "string" ? JSON.parse(item.deduction) : item.deduction,
  //               employeer_ctc: typeof item.employeer_ctc === "string" ? JSON.parse(item.employeer_ctc) : item.employeer_ctc
  //             };
  //           });
  
           
  //           this.payrollDataList.forEach((emp:any) => {
  //             if (emp.payroll_finalized === 0) {
  //               this.openSalaryInvoice(emp);
  //             }
  //           });
  //         }
  //       } else {
  //         this.payrollData = [];
  //         this.payrollDataList = [];
  //         this.attendanceCount = [];
  //         this.toggleSpinner(false);
  //       }
  //     },
  //     (error) => {
  //       this.handleError(error.message || "An error occurred while fetching data");
  //     }
  //   );
  // }


  getAttendance() {
    this.toggleSpinner(true);
    const url = `payroll?month=${this.formattedDate}`;
    this.api.getwithoutid(url).subscribe(
      (res: any) => {
        this.toggleSpinner(false);
        if (res && res.status) {
          const processPayrollData = (data: any) => {
            const empEarnings = JSON.parse(data.emp_earning || "[]");
            const empDeductions = JSON.parse(data.emp_deduction || "[]");
            const empEmployerCTC = JSON.parse(data.emp_employeer_ctc || "{}");
  
            const earningTotal = empEarnings.reduce((sum: number, e: any) => sum + e.amount, 0);
            const deductionsTotal = empDeductions.reduce((sum: number, e: any) => sum + e.amount, 0);
            const totalAmount = Math.round(earningTotal - deductionsTotal);
  
            const empSalaryData = {
              earn: earningTotal,
              deductionsTotal,
              totalAmount,
              netSalary: data.emp_salary,
            };
  
            return {
              ...data,
              earning: typeof data.earning === "string" ? JSON.parse(data.earning) : data.earning,
              deduction: typeof data.deduction === "string" ? JSON.parse(data.deduction) : data.deduction,
              employeer_ctc: typeof data.employeer_ctc === "string" ? JSON.parse(data.employeer_ctc) : data.employeer_ctc,
              empSalaryData, // Add empSalaryData here
            };
          };
  
          if (Array.isArray(res.data)) {
            this.payrollDataList = res.data.map(processPayrollData);
            this.filterdata();
          } else {
            this.payrollDataList = [];
            console.error("Unexpected data format: res.data is not an array");
          }
  
          if (res.payroll_finalized === 0) {
            this.payrollDataList.forEach((emp: any) => {
              if (emp.payroll_finalized === 0) {
                this.openSalaryInvoice(emp);
              }
            });
          }
        } else {
          this.payrollData = [];
          this.payrollDataList = [];
          this.attendanceCount = [];
        }
      },
      (error) => {
        this.handleError(error.message || "An error occurred while fetching data");
      }
    );
  }
  
  

  handleError(error: any) {
    this.toggleSpinner(false);
  }

  payslipData:any
  //
  updatePaySlipData(data: any) {
    data.earning = typeof data.earning === "string" ? JSON.parse(data.earning) : data.earning;
    data.deduction = typeof data.deduction === "string" ? JSON.parse(data.deduction) : data.deduction;
    data.employeer_ctc = typeof data.employeer_ctc === "string" ? JSON.parse(data.employeer_ctc) : data.employeer_ctc;
    this.payslipData = data
    console.log( this.payslipData)
  }

  // getMaxLength(earnings: any[], deductions: any[]): number[] {
  //   const maxLength = Math.max(earnings?.length || 0, deductions?.length || 0);
  //   return Array.from({ length: maxLength }, (_, i) => i);
  // }
  getParsedArray(data: string | any[]): any[] {
    try {
      return typeof data === 'string' ? JSON.parse(data) : Array.isArray(data) ? data : [];
    } catch (error) {
      console.error("Error parsing JSON data:", error);
      return [];
    }
  }

  getMaxLength(earnings: any[], deductions: any[]): number[] {
    // Ensure that both earnings and deductions are not null or undefined
    const safeEarnings = earnings || [];
    const safeDeductions = deductions || [];
    // const safeEarnings = this.getParsedArray(earnings);
    // const safeDeductions = this.getParsedArray(deductions);

    const maxLength = Math.max(safeEarnings.length, safeDeductions.length);
    
    // Pad shorter array with nulls if necessary
    if (safeEarnings.length < maxLength) {
      safeEarnings.push(...Array(maxLength - safeEarnings.length).fill(null));
    }
    
    if (safeDeductions.length < maxLength) {
      safeDeductions.push(...Array(maxLength - safeDeductions.length).fill(null));
    }
  
    // Return an array of indexes up to the max length
    return Array.from({ length: maxLength }, (_, i) => i);
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

    if (this.showFinalizedPayroll) {
      filteredData = filteredData.filter((el: any) => el.payroll_finalized === 1);
    }else{
      filteredData = filteredData.filter((el: any) => el.payroll_finalized === 0);
    }

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

  //  togglebtn(event: any) {
  //   var followbtn = event.target.closest(".custom-toggle");
  //   if (followbtn.classList.contains("active")) {
  //     followbtn.classList.remove("active");
  //     this.showFinalizedPayroll = false;
  //   } else {
  //     followbtn.classList.add("active");
  //     this.showFinalizedPayroll = true;
  //   }

  //   this.filterdata();
  // }
  togglebtn(event: any) {
    this.showFinalizedPayroll = !this.showFinalizedPayroll;
    this.filterdata();
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


 

  convertNumberToWords(num: any): string {
    if (num === null || num === undefined || isNaN(num)) {
      return 'Invalid amount';
    }
  
    const a = [
      '', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
      'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen',
      'eighteen', 'nineteen'
    ];
    const b = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
    const scales = ['thousand', 'lakh', 'crore'];
  
    if (num === 0) return 'Zero';
  
    let words = '';
  
    // Ensure the number is converted to a string and split for decimals
    const numStr = num.toString();
    const [integerPart, decimalPart] = numStr.split('.');
  
    const numberToWords = (n: number): string => {
      let word = '';
      if (n < 20) {
        word = a[n];
      } else if (n < 100) {
        word = b[Math.floor(n / 10)] + (n % 10 ? ' ' + a[n % 10] : '');
      } else if (n < 1000) {
        word = a[Math.floor(n / 100)] + ' hundred' + (n % 100 ? ' and ' + numberToWords(n % 100) : '');
      } else {
        for (let i = 0, divisor = 1000; i < scales.length; i++, divisor *= 100) {
          if (n < divisor * 100) {
            word = numberToWords(Math.floor(n / divisor)) + ' ' + scales[i] +
              (n % divisor ? ' ' + numberToWords(n % divisor) : '');
            break;
          }
        }
      }
      return word;
    };
  
    // Convert integer part to words
    words = numberToWords(parseInt(integerPart, 10));
  
    // Add decimal part if available
    if (decimalPart) {
      words += ` and ${numberToWords(parseInt(decimalPart, 10))} paise`;
    }
  
    // Capitalize the first letter
    return words.charAt(0).toUpperCase() + words.slice(1);
  }
  
  // openSalaryInvoice(data: any) {

  //   console.log(data)

  //   this.totalAmount = Math.round(this.earningTotal - this.deductionsTotal);

  //   this.emp_id = data.emp_id;
  //   // this.showsalaryInvoice.show();

  //   const data = {
  //     earn: this.earningTotal,
  //     deductionsTotal: this.deductionsTotal,
  //     totalAmount: this.totalAmount,
  //     netSalary: data.emp_salary,
  //   };
  //   this.empSalaryData = data

  //   // this.salaryDataFetched.emit(data);
  // }

  empSalaryData:any
  totalAmount:any
  deductionsTotal:any
  earningTotal:any
  openSalaryInvoice(data: any) {
    this.isModalOpen = true;
    this.emp_id = data.emp_id
  
    const empEarnings = JSON.parse(data.emp_earning || "[]");
    const empDeductions = JSON.parse(data.emp_deduction || "[]");
    const empEmployerCTC = JSON.parse(data.emp_employeer_ctc || "{}");
  
    this.earningTotal = empEarnings.reduce((sum: number, item: any) => sum + item.amount, 0);
    

    this.deductionsTotal = empDeductions.reduce((sum: number, item: any) => sum + item.amount, 0);
  

    this.totalAmount = Math.round(this.earningTotal - this.deductionsTotal);
  
    this.empSalaryData = {
      earn: this.earningTotal,
      deductionsTotal: this.deductionsTotal,
      totalAmount: this.totalAmount,
      netSalary: data.emp_salary,
    };
  }
  updatePayrollData(eventData: any): void {

    this.payrollData = this.payrollData.map((emp:any) => {
      if (emp.emp_id === eventData.emp_id) {
        // console.log(eventData)
        return { ...emp, salaryInvoiceData: eventData };
      }
      return emp;
    });
  
    // console.log("Updated Payroll Data:", this.payrollData);
  }


  toggleSelection(employee: any, event: any) {
    if (event.target.checked) {
      this.selectedEmployees.push(employee);
    } else {
      this.selectedEmployees = this.selectedEmployees.filter(emp => emp !== employee);
    }
  }
  
  onSubmitAll() {
    if (this.selectedEmployees.length === 0) {
      // this.toastService.error("Please select at least one employee.");
      return;
    }
    console.log(this.selectedEmployees)
    this.selectedEmployees.forEach(employee => {
      this.submitForEmployee(employee);
    });
  }



  // emp_id: this.urlId,
  // paid_days:this.presentDays,
  // net_pay :this.totalAmount,
  // payslip_for_month:this.formattedDate,
  // salary: this.f["salary"].value,
  // // earning: this.f["breakup"].value,
  // earning:  JSON.stringify((this.formGroup.get("breakup") as FormArray).getRawValue()),
  // deduction:  JSON.stringify((this.formGroup.get("deductions") as FormArray).getRawValue()),
  // earning_amount:this.earningTotal.toFixed(2),
  // deduction_amount:this.deductionsTotal.toFixed(2),
  // employeer_ctc: JSON.stringify({
  //   totalEarning: this.earningTotal,
  //   employeerPfAmount:this.employeerPfAmount,
  //   employeerEsiAmount: this.employeerEsiAmount,
  //   totalctc: this.totalctc
  //  })
  

//   deduction
// : 
// "[{\"name\":\"PF\",\"calculationType\":\"percentage\",\"formula\":\"(Basic * 12) / 100\",\"amount\":693,\"nameReadonly\":true},{\"name\":\"ESI\",\"calculationType\":\"none\",\"formula\":\"\",\"amount\":0,\"nameReadonly\":true},{\"name\":\"TDS\",\"calculationType\":\"none\",\"formula\":\"\",\"amount\":0,\"nameReadonly\":true}]"
// deduction_amount
// : 
// "693.00"
// earning
// : 
// "[{\"name\":\"Basic\",\"calculationType\":\"custom\",\"formula\":\"29830\",\"amount\":5774,\"nameReadonly\":true},{\"name\":\"HRA\",\"calculationType\":\"default\",\"formula\":\"Basic / 2\",\"amount\":2887,\"nameReadonly\":true},{\"name\":\"Travel Allowance\",\"calculationType\":\"custom\",\"formula\":\"3200\",\"amount\":3200,\"nameReadonly\":true},{\"name\":\"Special Allowance\",\"calculationType\":\"default\",\"formula\":\"Net_Salary -  Basic - HRA - Travel_Allowance\",\"amount\":0,\"nameReadonly\":true}]"
// earning_amount
// : 
// "11861.00"
// emp_id
// : 
// 38
// employeer_ctc
// : 
// "{\"totalEarning\":11861,\"employeerPfAmount\":693,\"employeerEsiAmount\":0,\"totalctc\":12554}"
// net_pay
// : 
// 11168
// paid_days
// : 
// 6
// payslip_for_month
// : 
// "2025-01"
// salary
// : 
// 9629
submitForEmployee(employee: any) {
  console.log("Submitting for Employee:", employee);

  if (this.salaryInvoiceComponent) {
    // Ensure employee data exists before using it
    if (!employee.salaryInvoiceData) {
      console.warn("No salaryInvoiceData found for employee:", employee);
      return;
    }
console.log(employee.salaryInvoiceData)
console.log(employee.salaryInvoiceData.totalamount, employee.salaryInvoiceData.paidDays)
    // Assign values
    this.salaryInvoiceComponent.urlId = employee.emp_id;
    this.salaryInvoiceComponent.presentDays = employee.salaryInvoiceData.paidDays || 0;
    this.salaryInvoiceComponent.totalAmount = employee.salaryInvoiceData.totalamount || 0;
    this.salaryInvoiceComponent.formattedDate = employee.salaryInvoiceData.invoiceOfMonth || new Date();
console.log(JSON.stringify(employee.salaryInvoiceData.deductions.value))
    // Ensure form fields are updated
    // this.salaryInvoiceComponent.formGroup.patchValue({
    //   // net_pay: employee.emp_salary || 0,
    //   salary: employee.salaryInvoiceData.salary || "", // Fix missing salary
    //   breakup:  JSON.stringify(employee.salaryInvoiceData.breakup.value) || [],
    //   deductions: JSON.stringify(employee.salaryInvoiceData.deductions.value) || []
    // });
      // Ensure form fields are updated except FormArray
      // this.salaryInvoiceComponent.formGroup.patchValue({
      //   net_pay: employee.emp_salary || 0,
      //   salary: employee.salaryInvoiceData.salary || "", // Fix missing salary
      // });

      this.salaryInvoiceComponent.formGroup.patchValue({
        salary: employee.salaryInvoiceData.salary || "",
      });
  
      // Get FormArray references
      const breakupArray = this.salaryInvoiceComponent.formGroup.get("breakup") as FormArray;
      const deductionsArray = this.salaryInvoiceComponent.formGroup.get("deductions") as FormArray;
  
      // Clear previous data before adding new ones
      breakupArray.clear();
      deductionsArray.clear();
  
      // Populate `breakup`
      if (Array.isArray(employee.salaryInvoiceData.breakup.value) && employee.salaryInvoiceData.breakup.value.length > 0) {
        employee.salaryInvoiceData.breakup.value.forEach((earning: any) => {
          breakupArray.push(this.salaryInvoiceComponent.formBuilder.group({
            name: earning.name || '',
            amount: earning.amount || 0,
            calculationType: earning.calculationType || '',
            formula: earning.formula || '',
          }));
        });
      }
  
      // Populate `deductions`
      if (Array.isArray(employee.salaryInvoiceData.deductions.value) && employee.salaryInvoiceData.deductions.value.length > 0) {
        employee.salaryInvoiceData.deductions.value.forEach((deduction: any) => {
          deductionsArray.push(this.salaryInvoiceComponent.formBuilder.group({
            name: deduction.name || '',
            amount: deduction.amount || 0,
            calculationType: deduction.calculationType || '',
            formula: deduction.formula || '',
          }));
        });
      }

    // **Ensure calculation is done before submission**
    this.salaryInvoiceComponent.calculateTotalAmount();

    // Log final data before submission
    console.log("Final Form Data for Employee:", this.salaryInvoiceComponent.createFormData());

    // Call child's submit method
    this.salaryInvoiceComponent.onSubmit();
  }
}



  

//   submitForEmployee(employee: any) {
//   if (this.salaryInvoiceComponent) {
//     // Set employee data in the child component
//     this.salaryInvoiceComponent.urlId = employee.emp_id;
//     this.salaryInvoiceComponent.presentDays = employee.paid_days || 0;
//     this.salaryInvoiceComponent.totalAmount = employee.net_pay || 0;
//     this.salaryInvoiceComponent.formattedDate = employee.payslip_for_month || new Date();
    
//     // Populate form fields
//     this.salaryInvoiceComponent.formGroup.patchValue({
//       salary: employee.emp_salary || 0,
//       breakup: employee.earning_breakup || [],
//       deductions: employee.deduction_breakup || []
//     });

//     // Ensure FormArrays are properly set
//     const breakupArray = this.salaryInvoiceComponent.formGroup.get("breakup") as FormArray;
//     const deductionsArray = this.salaryInvoiceComponent.formGroup.get("deductions") as FormArray;

//     breakupArray.clear();
//     deductionsArray.clear();

//     // Add earnings to the form and stringify it for the final submission
//     if (employee.earning_breakup) {
//       employee.earning_breakup.forEach((earning: any) => {
//         breakupArray.push(this.salaryInvoiceComponent.formBuilder.group(earning));
//       });
//     }

//     // Add deductions to the form and stringify it for the final submission
//     if (employee.deduction_breakup) {
//       employee.deduction_breakup.forEach((deduction: any) => {
//         deductionsArray.push(this.salaryInvoiceComponent.formBuilder.group(deduction));
//       });
//     }

//     // Prepare the final data to emit, stringify the earning and deduction arrays
//     const dataToEmit = {
//       emp_id: this.salaryInvoiceComponent.urlId,
//       invoiceOfMonth: this.salaryInvoiceComponent.formattedDate,
//       totalAdv: this.salaryInvoiceComponent.totalAdvBal,
//       paidDays: this.salaryInvoiceComponent.presentDays,
//       totalamount: this.salaryInvoiceComponent.totalAmount,
//       earnTotal: this.salaryInvoiceComponent.earningTotal,
//       deductionsTotal: this.salaryInvoiceComponent.deductionsTotal,
//       totalctc: this.salaryInvoiceComponent.totalctc,
//       // Stringify the earning and deduction arrays before emitting
//       earning: JSON.stringify(this.salaryInvoiceComponent.formGroup.get('breakup')?.getRawValue()),
//       deduction: JSON.stringify(this.salaryInvoiceComponent.formGroup.get('deductions')?.getRawValue())
//     };

//     // Log final data before submission for debugging
//     console.log("Final Form Data for Employee:", dataToEmit);

//     // Emit the data
//     this.salaryInvoiceComponent.salaryInvoiceData.emit(dataToEmit);

//     // Now call the child's onSubmit() to submit the data
//     this.salaryInvoiceComponent.onSubmit();
//   }
// }

}
