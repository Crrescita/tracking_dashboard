import { Component, OnInit, ViewChild } from "@angular/core";
import { PageChangedEvent } from "ngx-bootstrap/pagination";
import { ToastrService } from "ngx-toastr";
import { ModalDirective } from "ngx-bootstrap/modal";
import { FormGroup, FormBuilder, Validators } from "@angular/forms";
import { ApiService } from "../../../../core/services/api.service";
import { cloneDeep } from "lodash";
import { ActivatedRoute, Router } from "@angular/router";
import { BsDatepickerConfig } from "ngx-bootstrap/datepicker";

@Component({
  selector: "app-leave-request",
  templateUrl: "./leave-request.component.html",
  styleUrl: "./leave-request.component.scss",
})
export class LeaveRequestComponent {
  selectedDate: Date | null = null;
  selectedDateRange: any;

  bsConfig = {
    dateInputFormat: "YYYY-MM-DD",
    rangeInputFormat: "YYYY-MM-DD",
  };

  breadCrumbItems!: Array<{}>;
  submitted: boolean = false;
  spinnerStatus: boolean = false;
  saveButtonActive: boolean = true;
  masterSelected!: boolean;
  leaveRequestData: any = [];
  leaveRequestDataList: any = [];
  leaveCount: any;
  filteredLeaveReqData: any = [];
  endItem: any;

  formGroup!: FormGroup;

  id: number | null = null;

  checkedValGet: any[] = [];
  company_id: any;

  currentPage: number = 1;
  currentItemsPerPage = 10;
  itemsPerPageOptions = [10, 20, 30, 50];

  // filter
  selectedStatus: string = "";
  departments: any[] = [];
  selectedEmp: any[] = [];
  selectedDepartments: any[] = [];
  selectedDesignations: any[] = [];
  designations: any[] = [];

  employeeDataList: any = [];

  filterCounts = {
    termCount: 0,
    designationCount: 0,
    departmentCount: 0,
    statusCount: 0,
    dateCount: 0,
    empCount: 0,
    selectedDateRangeCount: 0,
  };

  @ViewChild("showModal", { static: false }) showModal?: ModalDirective;
  @ViewChild("deleteRecordModal", { static: false })
  deleteRecordModal?: ModalDirective;
  deleteId: any;

  constructor(
    private api: ApiService,
    public toastService: ToastrService,
    private formBuilder: FormBuilder,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.breadCrumbItems = [
      { label: "Leave Management" },
      { label: "Leave Request", active: true },
    ];

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

      if (params["selectedDateRange"]) {
        const dateRange = params["selectedDateRange"].split(",");
        if (dateRange.length > 0) {
          this.selectedDateRange = {
            from: new Date(dateRange[0]),
            to: dateRange[1] ? new Date(dateRange[1]) : null,
          };
        }
      }

      // this.selectedDateRange = params["selectedDateRange"] || null;
      this.filterdata();
      this.updatePaginatedData();
    });

    const data = localStorage.getItem("currentUser");

    if (data) {
      const user = JSON.parse(data);
      this.company_id = user.id;
    }

    if (this.company_id) {
      this.getLeaveRequest();
      this.getDepartment();
      this.getDesignation();
      this.getemployeeData();
    }

    this.formGroup = this.formBuilder.group({
      name: ["", [Validators.maxLength(45), Validators.required]],
      status: ["", [Validators.required]],
    });
  }

  get f() {
    return this.formGroup.controls;
  }

  toggleSpinner(isLoading: boolean) {
    this.spinnerStatus = isLoading;
    this.saveButtonActive = !isLoading;
    this.submitted = isLoading;
  }

  getemployeeData() {
    this.toggleSpinner(true);
    const url = `employees?company_id=${this.company_id}`;
    this.api.getwithoutid(url).subscribe(
      (res: any) => {
        this.toggleSpinner(false);
        if (res && res.status) {
          this.employeeDataList = res.data || [];
          // this.filterdata();
        } else {
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

  getLeaveRequest() {
    this.toggleSpinner(true);
    const url = `leaveRequest?company_id=${this.company_id}`;
    this.api.getwithoutid(url).subscribe(
      (res: any) => {
        if (res && res.status) {
          this.toggleSpinner(false);
          // this.leaveRequestData = res.data || [];
          this.leaveRequestDataList = res.data || [];
          this.leaveCount = res.leaveCount || [];
          this.filterdata();
        } else {
          this.leaveRequestData = [];
          this.leaveRequestDataList = [];
          this.leaveCount = [];
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

  setStatus(data: any, event: Event) {
    const newStatus = (event.target as HTMLSelectElement).value;
    const formData = {
      status: newStatus,
      // leave_type: data.leaveType_id,
    };

    this.toggleSpinner(true);

    this.api.put("updateleaveRequestStatus", data.id, formData).subscribe(
      (res: any) => this.handleStatusResponse(newStatus),
      (error) => this.handleError(error)
    );
  }

  handleStatusResponse(res: any) {
    this.toggleSpinner(false);
    if (res == "Approved") {
      this.toastService.success("Leave Request Approved Successfully!!");
    } else {
      this.toastService.success("The leave request has been Rejected.");
    }
    this.getLeaveRequest();
  }

  onSubmit() {
    if (this.formGroup.valid) {
      this.toggleSpinner(true);
      const formData = this.createFormData();
      if (this.id) {
        this.update(formData);
      } else {
        this.add(formData);
      }
    } else {
      this.formGroup.markAllAsTouched();
    }
  }

  createFormData() {
    const formData = {
      name: this.f["name"].value,
      status: this.f["status"].value,
    };
    return formData;
  }

  add(formData: any) {
    this.api.post("leave", formData).subscribe(
      (res: any) => this.handleResponse(res),
      (error) => this.handleError(error)
    );
  }

  update(formData: any) {
    const id = this.id as number;
    this.api.put("leave", id, formData).subscribe(
      (res: any) => this.handleResponse(res),
      (error) => this.handleError(error)
    );
  }

  onAdd() {
    this.resetForm();
    this.showModal?.show();
    var modaltitle = document.querySelector(".modal-title") as HTMLAreaElement;
    modaltitle.innerHTML = "Add leave";
    var modalbtn = document.getElementById("add-btn") as HTMLAreaElement;
    modalbtn.innerHTML = "Add";
    this.id = null;
  }

  resetForm() {
    this.formGroup.reset();
    // Set default values if necessary
    this.formGroup.patchValue({
      name: "",
      status: "",
    });
  }

  // edit
  editList(data: any) {
    this.showModal?.show();
    var modaltitle = document.querySelector(".modal-title") as HTMLAreaElement;
    modaltitle.innerHTML = "Edit leave";
    var modalbtn = document.getElementById("add-btn") as HTMLAreaElement;
    modalbtn.innerHTML = "Update";

    this.id = data.id;

    this.formGroup.patchValue({
      name: data.name,
      status: data.status,
    });
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
      this.api.deleteWithId("leave", id).subscribe(
        (res: any) => this.handleResponse(res),
        (error) => this.handleError(error)
      );
    }

    const idsToDelete = this.checkedValGet;
    if (idsToDelete && idsToDelete.length > 0) {
      this.api.post("leave-delete-multiple", { ids: idsToDelete }).subscribe(
        (res: any) => this.handleResponse(res),
        (error) => this.handleError(error)
      );
    }
  }

  handleResponse(res: any) {
    this.toggleSpinner(false);
    if (res["status"] === true) {
      this.formGroup.reset();
      this.toastService.success("Data Saved Successfully!!");
      this.getLeaveRequest();
      this.showModal?.hide();
    } else {
      this.toastService.error(res["message"]);
    }
  }

  handleError(error: any) {
    this.toggleSpinner(false);
  }

  // Select Checkbox value Get
  onCheckboxChange(e: any) {
    var checkedVal: any[] = [];
    var result;
    for (var i = 0; i < this.leaveRequestData.length; i++) {
      if (this.leaveRequestData[i].states == true) {
        result = this.leaveRequestData[i].id;
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
    this.leaveRequestData = this.leaveRequestData.map((x: { states: any }) => ({
      ...x,
      states: ev.target.checked,
    }));

    var checkedVal: any[] = [];
    var result;
    for (var i = 0; i < this.leaveRequestData.length; i++) {
      if (this.leaveRequestData[i].states == true) {
        result = this.leaveRequestData[i].id;
        checkedVal.push(result);
      }
    }

    this.checkedValGet = checkedVal;

    checkedVal.length > 0
      ? document.getElementById("remove-actions")?.classList.remove("d-none")
      : document.getElementById("remove-actions")?.classList.add("d-none");
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
    const sortedArray = [...this.leaveRequestData]; // Create a new array
    sortedArray.sort((a, b) => {
      const res = this.compare(a[column], b[column]);
      return this.direction === "asc" ? res : -res;
    });
    this.leaveRequestData = sortedArray;
  }
  compare(v1: string | number, v2: string | number) {
    return v1 < v2 ? -1 : v1 > v2 ? 1 : 0;
  }

  term: any;

  // filterdata
  filterdata() {
    let filteredData = this.leaveRequestDataList;
    if (this.selectedStatus == null) {
      this.selectedStatus = "";
    }
    // Reset filter counts
    this.filterCounts.termCount = 0;
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
        (el: any) => el.status === this.selectedStatus
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
        const fromDate = this.formatDateWithoutTime(new Date(el.from_date));
        const toDate = this.formatDateWithoutTime(new Date(el.to_date));

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
    this.filteredLeaveReqData = filteredData;

    if (
      this.term ||
      this.selectedDepartments.length ||
      this.selectedDesignations.length ||
      this.selectedEmp.length ||
      this.selectedStatus ||
      this.selectedDateRange
    ) {
      if (this.filteredLeaveReqData.length === 0) {
        this.currentPage = 1;
      }
    }

    this.updatePaginatedData();
  }

  formatDateWithoutTime(date: Date): string {
    const localDate = new Date(
      date.getTime() - date.getTimezoneOffset() * 60000
    ); // Adjust for time zone
    return localDate.toISOString().split("T")[0]; // YYYY-MM-DD
  }

  updatePaginatedData(): void {
    const startItem = (this.currentPage - 1) * this.currentItemsPerPage;
    const endItem = this.currentPage * this.currentItemsPerPage;

    if (
      this.term ||
      this.selectedDepartments.length ||
      this.selectedDesignations.length ||
      this.selectedEmp.length ||
      this.selectedStatus ||
      this.selectedDateRange
    ) {
      if (startItem >= this.filteredLeaveReqData.length) {
        this.currentPage = 1;
      }
    }

    const newStartItem = (this.currentPage - 1) * this.currentItemsPerPage;
    const newEndItem = this.currentPage * this.currentItemsPerPage;

    this.leaveRequestData = cloneDeep(
      this.filteredLeaveReqData.slice(newStartItem, newEndItem)
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
        selectedDateRange: formattedDateRange,
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
      this.filterCounts.designationCount +
      this.filterCounts.departmentCount +
      this.filterCounts.statusCount +
      this.filterCounts.dateCount +
      this.filterCounts.empCount +
      this.filterCounts.selectedDateRangeCount
    );
  }

  // no result
  updateNoResultDisplay() {
    const noResultElement = document.querySelector(".noresult") as HTMLElement;
    const paginationElement = document.getElementById(
      "pagination-element"
    ) as HTMLElement;
    if (this.leaveRequestData.length === 0) {
      noResultElement.style.display = "block";
      paginationElement.classList.add("d-none");
    } else {
      noResultElement.style.display = "none";
      paginationElement.classList.remove("d-none");
    }
  }

  reset() {
    // Clear filters
    this.term = "";
    this.selectedDepartments = [];
    this.selectedDesignations = [];
    this.selectedStatus = "";
    this.selectedEmp = [];
    (this.selectedDateRange = ""),
      (this.leaveRequestData = this.leaveRequestDataList);

    this.filterdata();

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        term: null,
        selectedDepartments: null,
        selectedDesignations: null,
        selectedStatus: null,
        selectedEmp: null,
        selectedDateRange: null,
        page: 1,
        itemsPerPage: this.currentItemsPerPage,
      },
      queryParamsHandling: "merge",
    });

    this.getLeaveRequest();
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
