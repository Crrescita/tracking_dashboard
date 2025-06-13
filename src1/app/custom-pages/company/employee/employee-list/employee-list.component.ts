import { Component, OnInit, ViewChild } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { ApiService } from "../../../../core/services/api.service";
import { ToastrService } from "ngx-toastr";
import { PageChangedEvent } from "ngx-bootstrap/pagination";
import Swal from "sweetalert2";
import { ModalDirective } from "ngx-bootstrap/modal";
import { cloneDeep } from "lodash";
import { ActivatedRoute, Router } from "@angular/router";
import { ExcelService } from "../../../../core/services/excel.service";
import * as XLSX from "xlsx";

@Component({
  selector: "app-employee-list",

  templateUrl: "./employee-list.component.html",
  styleUrl: "./employee-list.component.scss",
})
export class EmployeeListComponent implements OnInit {
  breadCrumbItems!: Array<{}>;
  spinnerStatus: boolean = false;

  employeeData: any = [];
  employeeDataList: any = [];
  filteredemployeeData: any = [];

  company_id: any;

  currentPage: number = 1;
  currentItemsPerPage = 10;
  itemsPerPageOptions = [10, 20, 30, 50];
  endItem: any;

  // filter
  selectedStatus: string = "";
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
    empCount: 0,
    dateCount: 0,
    selectedDateRangeCount: 0,
  };

  formGroup!: FormGroup;
    selectedDateRange: any;

  @ViewChild("showModal", { static: false }) showModal?: ModalDirective;
  @ViewChild("deleteRecordModal", { static: false })
  deleteRecordModal?: ModalDirective;
  deleteId: any;

  checkedValGet: any[] = [];
  masterSelected!: boolean;

  constructor(
    private formBuilder: FormBuilder,
    private api: ApiService,
    private ExcelService: ExcelService,
    public toastService: ToastrService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  exportData() {
    this.ExcelService.createSampleExcel(this.departments, this.designations);
  }

  ngOnInit(): void {
    this.breadCrumbItems = [
      { label: "Employee Management", active: true },
      { label: "Employees", active: true },
    ];
    // this.initializeForm();

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

       if (params["selectedDateRange"]) {
        const dateRange = params["selectedDateRange"].split(",");
        if (dateRange.length > 0) {
          this.selectedDateRange = {
            from: new Date(dateRange[0]),
            to: dateRange[1] ? new Date(dateRange[1]) : null,
          };
        }
      }

      // After initializing, you might want to call filterData and updatePaginatedData
      this.filterdata();
      this.updatePaginatedData();
    });

    if (this.company_id) {
      this.getemployeeData();
      this.getDepartment();
      this.getDesignation();
      this.getBranch();
    }
  }

  onFileChange(event: any) {
    const target: DataTransfer = <DataTransfer>event.target;
    if (target.files.length !== 1) throw new Error("Cannot use multiple files");
    const reader: FileReader = new FileReader();

    reader.onload = (e: any) => {
      const bstr: string = e.target.result;
      const wb: XLSX.WorkBook = XLSX.read(bstr, { type: "binary" });
      const wsname: string = wb.SheetNames[0];
      const ws: XLSX.WorkSheet = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

      this.populateForm(data);
    };

    reader.readAsBinaryString(target.files[0]);
  }

  populateForm(data: any[]) {
    const headers = data[0]; // Assume first row contains headers
    const excelData = data.slice(1); // Skip headers

    excelData.forEach((row) => {
      this.formGroup.patchValue({
        name: row[0], // Assuming the name is the first column
        address: row[1],
        dob: row[2],
        emp_id: row[3],
        email: row[4],
        mobile: row[5],
        status: row[6],
        gender: row[7],
        state: row[8],
        city: row[9],
        zip_code: row[10],
        designation: row[11],
        department: row[12],
        joining_date: row[13],
        password: row[14],
        confirmPassword: row[15],
      });
    });
  }

  // passwordMatchValidator(formGroup: FormGroup) {
  //   const password = formGroup.get('password')?.value;
  //   const confirmPassword = formGroup.get('confirmPassword')?.value;

  //   return password === confirmPassword ? null : { mismatch: true };
  // }

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

  getemployeeData() {
    this.toggleSpinner(true);
    const url = `employees?company_id=${this.company_id}`;
    this.api.getwithoutid(url).subscribe(
      (res: any) => {
        this.toggleSpinner(false);
        if (res && res.status) {
          this.employeeDataList = res.data || [];
          this.filterdata();
        } else {
          this.employeeData = [];
          this.employeeDataList = [];
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

  setStatus(id: number, event: Event) {
    const inputElement = event.target as HTMLInputElement;
    const newStatus = inputElement.checked ? "active" : "inactive";

    const formData = new FormData();
    formData.append("status", newStatus);
    formData.append("company_id", this.company_id);

    this.toggleSpinner(true);

    this.api.put(`employees`, id, formData).subscribe(
      (res: any) => this.handleStatusChangeResponse(res),
      (error) => this.handleError(error)
    );
  }

  toggleSpinner(isLoading: boolean) {
    this.spinnerStatus = isLoading;
  }

  handleStatusChangeResponse(res: any) {
    this.toggleSpinner(false);
    if (res["status"] === true) {
      this.toastService.success("Data Saved Successfully!!");
      this.getemployeeData();
    } else {
      this.toastService.error(res["message"]);
    }
  }

  // Delete
  removeItem(id: any) {
    this.deleteId = id;
    this.deleteRecordModal?.show();
  }

  deleteData(id?: any) {
    this.toggleSpinner(true);
    this.deleteRecordModal?.hide();

    if (id) {
      this.api.deleteWithId("employees", id).subscribe(
        (res: any) => this.handleResponse(res),
        (error) => this.handleError(error)
      );
    }

    const idsToDelete = this.checkedValGet;
    if (idsToDelete && idsToDelete.length > 0) {
      this.api
        .post("employees-delete-multiple", { ids: idsToDelete })
        .subscribe(
          (res: any) => this.handleResponse(res),
          (error) => this.handleError(error)
        );
    }
  }

  handleResponse(res: any) {
    this.toggleSpinner(false);
    if (res["status"] === true) {
      this.toastService.success("Employee Data Delete Successfully!!");
      this.getemployeeData();
      // this.showModal?.hide();
    } else {
      this.toastService.error(res["message"]);
    }
  }

  handleError(error: any) {
    this.toggleSpinner(false);
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
    const sortedArray = [...this.employeeData]; // Create a new array
    sortedArray.sort((a, b) => {
      const res = this.compare(a[column], b[column]);
      return this.direction === "asc" ? res : -res;
    });
    this.employeeData = sortedArray;
  }
  compare(v1: string | number, v2: string | number) {
    return v1 < v2 ? -1 : v1 > v2 ? 1 : 0;
  }

  term: any;
  // filterdata and paginatuon

  onItemsPerPageChange() {
    this.currentPage = 1;
    this.updatePaginatedData();
  }

  filterdata() {
    let filteredData = this.employeeDataList;

    // Reset filter counts
    this.filterCounts.termCount = 0;
    this.filterCounts.branchCount = 0;
    this.filterCounts.designationCount = 0;
    this.filterCounts.departmentCount = 0;
    this.filterCounts.statusCount = 0;
    this.filterCounts.empCount = 0;
    this.filterCounts.selectedDateRangeCount = 0;
    

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

    // Filter by selected branch
    if (this.selectedBranch.length > 0) {
      filteredData = filteredData.filter((el: any) =>
        this.selectedBranch
          .map((d) => d.toLowerCase())
          .includes(el.branch_name.toLowerCase())
      );
      this.filterCounts.branchCount = 1;
    }

    // Filter by selected departments
    if (this.selectedDepartments.length > 0) {
      filteredData = filteredData.filter((el: any) =>
        this.selectedDepartments
          .map((d) => d.toLowerCase())
          .includes(el.department_name.toLowerCase())
      );
      this.filterCounts.departmentCount = 1;
    }

    // Filter by selected designations
    if (this.selectedDesignations && this.selectedDesignations.length > 0) {
      filteredData = filteredData.filter((el: any) =>
        this.selectedDesignations
          .map((d) => d.toLowerCase())
          .includes(el.designation_name.toLowerCase())
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
        (el: any) => el.checkin_status === this.selectedStatus
      );
      this.filterCounts.statusCount = 1;
    }

      if (this.selectedDateRange) {
      let fromDateStr = "";
      let toDateStr = "";

      if (this.selectedDateRange.from) {
        fromDateStr = this.formatDateWithoutTime(
          new Date(this.selectedDateRange.from)
        );
      }

      if (this.selectedDateRange.to) {
        toDateStr = this.formatDateWithoutTime(
          new Date(this.selectedDateRange.to)
        );
      }

      filteredData = filteredData.filter((el: any) => {
        const fromDate = this.formatDateWithoutTime(new Date(el.created_at));
        const toDate = this.formatDateWithoutTime(new Date(el.created_at));

        if (fromDateStr && !toDateStr) {
          return fromDate == fromDateStr;
        } else if (fromDateStr && toDateStr) {
          return (
            (fromDate >= fromDateStr && fromDate <= toDateStr) ||
            (toDate >= fromDateStr && toDate <= toDateStr) ||
            (fromDate <= fromDateStr && toDate >= toDateStr)
          );
        }

        return true;
      });
      this.filterCounts.selectedDateRangeCount = 1;
    }

    // Update filtered data
    this.filteredemployeeData = filteredData;

    // If no data is found, reset to the first page
    if (
      this.term ||
      this.selectedBranch.length ||
      this.selectedDepartments.length ||
      this.selectedDesignations.length ||
      this.selectedEmp.length ||
      this.selectedStatus
    ) {
      if (this.filteredemployeeData.length === 0) {
        this.currentPage = 1; // Reset to page 1 if no results after search
      }
    }

    // Update paginated data based on current page
    this.updatePaginatedData();
  }
  pageChanged(event: PageChangedEvent) {
    this.currentPage = event.page;
    this.updatePaginatedData();
  }
    formatDateWithoutTime(date: Date): string {
    const localDate = new Date(
      date.getTime() - date.getTimezoneOffset() * 60000
    ); // Adjust for time zone
    return localDate.toISOString().split("T")[0]; // YYYY-MM-DD
  }

  updatePaginatedData(): void {
    // Calculate start and end indices based on current page
    const startItem = (this.currentPage - 1) * this.currentItemsPerPage;
    const endItem = this.currentPage * this.currentItemsPerPage;

    // If start index is greater than or equal to filtered data length, reset to page 1
    if (
      this.term ||
      this.selectedBranch.length ||
      this.selectedDepartments.length ||
      this.selectedDesignations.length ||
      this.selectedEmp.length ||
      this.selectedStatus ||
      this.selectedDateRange
    ) {
      if (startItem >= this.filteredemployeeData.length) {
        this.currentPage = 1; // Reset to page 1
      }
    }

    const newStartItem = (this.currentPage - 1) * this.currentItemsPerPage;
    const newEndItem = this.currentPage * this.currentItemsPerPage;

    // Slice the filtered data based on current page
    this.employeeData = cloneDeep(
      this.filteredemployeeData.slice(newStartItem, newEndItem)
    );

    let formattedDateRange = "";
    if (this.selectedDateRange) {
      const fromDate = this.formatDateWithoutTime(
        new Date(this.selectedDateRange.from)
      );
      const toDate = this.selectedDateRange.to
        ? this.formatDateWithoutTime(new Date(this.selectedDateRange.to))
        : "";
      formattedDateRange = `${fromDate},${toDate}`; // Comma-separated range
    }

    // Update no result display
    this.updateNoResultDisplay();

    // Ensure selected values are retained in the query params
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
        selectedDateRange: formattedDateRange,
      },
      queryParamsHandling: "merge", // Merge with existing query params
    });
  }

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
    this.selectedEmp = [];
    this.selectedStatus = ""; // Clear selected status
    this.employeeData = this.employeeDataList; // Reset data to the original list
     (this.selectedDateRange = ""),

    // Update filtered data and pagination
    this.filterdata(); // Reapply filters with reset values

    // Clear query params from the URL
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        term: null,
        selectedBranch: null,
        selectedDepartments: null,
        selectedDesignations: null,
        selectedEmp: null,
        selectedStatus: null,
         selectedDateRange: null,
        page: 1, // Reset to first page
        itemsPerPage: this.currentItemsPerPage, // Keep items per page intact
      },
      queryParamsHandling: "merge", // Merge with existing query params
    });
  }

  get totalFilterCount(): number {
    return (
      this.filterCounts.termCount +
      this.filterCounts.branchCount +
      this.filterCounts.designationCount +
      this.filterCounts.departmentCount +
      this.filterCounts.statusCount +
      this.filterCounts.empCount +
      this.filterCounts.selectedDateRangeCount
    );
  }

  // filterdata() {
  //   if (this.term) {
  //     this.employeeData = this.employeeDataList.filter(
  //       (el: any) =>
  //         el.name.toLowerCase().includes(this.term.toLowerCase()) ||
  //         el.mobile.toLowerCase().includes(this.term.toLowerCase()) ||
  //         el.email.toLowerCase().includes(this.term.toLowerCase()) ||
  //         el.designation.toLowerCase().includes(this.term.toLowerCase()) ||
  //         el.department.toLowerCase().includes(this.term.toLowerCase()) ||
  //         el.employee_id.toLowerCase().includes(this.term.toLowerCase())
  //     );
  //   } else {
  //     this.employeeData = this.employeeDataList;
  //   }
  //   // noResultElement
  //   this.updateNoResultDisplay();
  // }

  // no result
  updateNoResultDisplay() {
    const noResultElement = document.querySelector(".noresult") as HTMLElement;
    const paginationElement = document.getElementById(
      "pagination-element"
    ) as HTMLElement;
    if (this.employeeData.length === 0) {
      noResultElement.style.display = "block";
      paginationElement.classList.add("d-none");
    } else {
      noResultElement.style.display = "none";
      paginationElement.classList.remove("d-none");
    }
  }

  // Select Checkbox value Get
  onCheckboxChange(e: any) {
    var checkedVal: any[] = [];
    var result;
    for (var i = 0; i < this.employeeData.length; i++) {
      if (this.employeeData[i].states == true) {
        result = this.employeeData[i].id;
        checkedVal.push(result);
      }
    }
    this.checkedValGet = checkedVal;
    checkedVal.length > 0
      ? document.getElementById("remove-actions")?.classList.remove("d-none")
      : document.getElementById("remove-actions")?.classList.add("d-none");
  }

  // The master checkbox will check/ uncheck all items
  checkUncheckAll(ev: any) {
    this.employeeData = this.employeeData.map((x: { states: any }) => ({
      ...x,
      states: ev.target.checked,
    }));

    var checkedVal: any[] = [];
    var result;
    for (var i = 0; i < this.employeeData.length; i++) {
      if (this.employeeData[i].states == true) {
        result = this.employeeData[i].id;
        checkedVal.push(result);
      }
    }

    this.checkedValGet = checkedVal;

    checkedVal.length > 0
      ? document.getElementById("remove-actions")?.classList.remove("d-none")
      : document.getElementById("remove-actions")?.classList.add("d-none");
  }
}
