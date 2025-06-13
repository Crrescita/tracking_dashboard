import { Component, OnInit } from "@angular/core";
import { ApiService } from "../../../../core/services/api.service";
import { PageChangedEvent } from "ngx-bootstrap/pagination";
import { Router, ActivatedRoute } from "@angular/router";
import { cloneDeep } from "lodash";

@Component({
  selector: "app-leave-record",
  templateUrl: "./leave-record.component.html",
  styleUrl: "./leave-record.component.scss",
})
export class LeaveRecordComponent implements OnInit {
  breadCrumbItems!: Array<{}>;

  leaveRecordData: any = [];
  leaveRecordDataList: any = [];
  filteredLeaveRecordData: any = [];

  company_id: any;
  endItem: any;

  submitted: boolean = false;
  spinnerStatus: boolean = false;
  saveButtonActive: boolean = true;

  currentItemsPerPage = 10; // Default items per page
  itemsPerPageOptions = [10, 20, 30, 50];
  term: any;

  currentPage: number = 1;

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
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.breadCrumbItems = [
      { label: "Leave Management" },
      { label: "Leave Record", active: true },
    ];

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

      this.filterdata();
      this.updatePaginatedData();
    });

    const data = localStorage.getItem("currentUser");

    if (data) {
      const user = JSON.parse(data);
      this.company_id = user.id;
    }

    if (this.company_id) {
      this.getLeaveRecord();
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

  toggleSpinner(isLoading: boolean) {
    this.spinnerStatus = isLoading;
    this.saveButtonActive = !isLoading;
    this.submitted = isLoading;
  }

  getLeaveRecord() {
    this.toggleSpinner(true);
    const url = `leaveRecord?company_id=${this.company_id}`;
    this.api.getwithoutid(url).subscribe(
      (res: any) => {
        if (res && res.status) {
          this.toggleSpinner(false);
          // this.leaveRecordData = res.data || [];
          this.leaveRecordDataList = res.data || [];
          // this.pageChanged({ page: 1, itemsPerPage: this.currentItemsPerPage });
          this.filterdata();
        } else {
          this.leaveRecordData = [];
          this.leaveRecordDataList = [];
          this.handleError("Unexpected response format");
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

  handleError(error: any) {
    this.toggleSpinner(false);
  }

  // Sort Data
  direction: any = "asc";
  onSort(column: any) {
    if (this.direction == "asc") {
      this.direction = "desc";
    } else {
      this.direction = "asc";
    }
    const sortedArray = [...this.leaveRecordData]; // Create a new array
    sortedArray.sort((a, b) => {
      const res = this.compare(a[column], b[column]);
      return this.direction === "asc" ? res : -res;
    });
    this.leaveRecordData = sortedArray;
  }
  compare(v1: string | number, v2: string | number) {
    return v1 < v2 ? -1 : v1 > v2 ? 1 : 0;
  }

  // filterdata

  filterdata() {
    let filteredData = this.leaveRecordDataList;

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
          el.employee_id.toLowerCase().includes(this.term.toLowerCase())
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
    this.filteredLeaveRecordData = filteredData;

    if (
      this.term ||
      this.selectedBranch.length ||
      this.selectedDepartments.length ||
      this.selectedDesignations.length ||
      this.selectedEmp.length ||
      this.selectedStatus
    ) {
      if (this.filteredLeaveRecordData.length === 0) {
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
      if (startItem >= this.filteredLeaveRecordData.length) {
        this.currentPage = 1;
      }
    }

    const newStartItem = (this.currentPage - 1) * this.currentItemsPerPage;
    const newEndItem = this.currentPage * this.currentItemsPerPage;

    this.leaveRecordData = cloneDeep(
      this.filteredLeaveRecordData.slice(newStartItem, newEndItem)
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

  // no result
  updateNoResultDisplay() {
    const noResultElement = document.querySelector(".noresult") as HTMLElement;
    const paginationElement = document.getElementById(
      "pagination-element"
    ) as HTMLElement;
    if (this.leaveRecordData.length === 0) {
      noResultElement.style.display = "block";
      paginationElement.classList.add("d-none");
    } else {
      noResultElement.style.display = "none";
      paginationElement.classList.remove("d-none");
    }
  }

  // onItemsPerPageChange(event: any): void {
  //   this.currentItemsPerPage = +event.target.value; // Convert to number
  //   this.pageChanged({ page: 1, itemsPerPage: this.currentItemsPerPage });
  // }

  reset() {
    // Clear filters
    this.term = "";
    this.selectedBranch = [];
    this.selectedDepartments = [];
    this.selectedDesignations = [];
    this.selectedStatus = "";
    this.selectedEmp = [];
    this.leaveRecordData = this.leaveRecordDataList;

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
      },
      queryParamsHandling: "merge",
    });

    this.getLeaveRecord();
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
}
