import { Component, OnInit, ViewChild } from "@angular/core";

import { PageChangedEvent } from "ngx-bootstrap/pagination";
import { ToastrService } from "ngx-toastr";
import { ModalDirective } from "ngx-bootstrap/modal";
import { FormGroup, FormBuilder, Validators } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { cloneDeep } from "lodash";
import { ApiService } from "src/app/core/services/api.service";

@Component({
  selector: 'app-stock-status',
  templateUrl: './stock-status.component.html',
  styleUrl: './stock-status.component.scss'
})
export class StockStatusComponent {
breadCrumbItems!: Array<{}>;
  spinnerStatus: boolean = false;

  quatationData: any = [];
  quatationDataList: any = [];
  filteredquatationData: any = [];

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
    selectedDateRangeCountUpdate: 0
  };

  formGroup!: FormGroup;
  selectedDateRange: any;

  selectedDateRangeUpdate:any;

  @ViewChild("showModal", { static: false }) showModal?: ModalDirective;
    @ViewChild("showModalExport", { static: false }) showModalExport?: ModalDirective;
  @ViewChild("deleteRecordModal", { static: false })
  deleteRecordModal?: ModalDirective;
  deleteId: any;

    id: any | null = null;

  checkedValGet: any[] = [];
  masterSelected!: boolean;

    //employee image
  employeeselectedImage: any = null;
  employeeselectedImagePreview: any = null;
  employeeuploadedImage: any = null;

   constructor(
      private formBuilder: FormBuilder,
      private api: ApiService,
      public toastService: ToastrService,
      private route: ActivatedRoute,
      private router: Router
    ) {}

      ngOnInit(): void {
    this.breadCrumbItems = [
      { label: "Requests", active: true },
      { label: "Stock", active: true },
    ];
    this.initializeForm();

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

        if (params["selectedDateRangeUpdate"]) {
        const dateRange = params["selectedDateRangeUpdate"].split(",");
        if (dateRange.length > 0) {
          this.selectedDateRangeUpdate = {
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
      this.getquatationData();
      this.getDepartment();
      this.getDesignation();
      this.getBranch();
    }
  }


initializeForm() {
  this.formGroup = this.formBuilder.group({
    admin_note: ["", Validators.required],
    file: [null], 
  });
}


   get f() {
    return this.formGroup.controls;
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

  getquatationData() {
    this.toggleSpinner(true);
    const url = `getRequests?type=stock_status&company_id=${this.company_id}`;
    this.api.getwithoutid(url).subscribe(
      (res: any) => {
        this.toggleSpinner(false);
        if (res && res.status) {
          this.quatationDataList = res.data || [];
          this.filterdata();
        } else {
          this.quatationData = [];
          this.quatationDataList = [];
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



   toggleSpinner(isLoading: boolean) {
    this.spinnerStatus = isLoading;
  }

  handleStatusChangeResponse(res: any) {
    this.toggleSpinner(false);
    if (res["status"] === true) {
      this.toastService.success("Data Saved Successfully!!");
      this.getquatationData();
    } else {
      this.toastService.error(res["message"]);
    }
  }

   // Delete
  removeItem(id: any) {
    this.deleteId = id;
    this.deleteRecordModal?.show();
  }


  quatationDataModal:any
    // edit
editList(data: any) {
  this.showModal?.show();

  this.id = data.id;
  this.quatationDataModal = data;

  this.employeeuploadedImage =
    data.latest_response?.file_url || null;


  this.formGroup.patchValue({
    admin_note: data.latest_response?.admin_note || ''
  });


  const fileControl = this.formGroup.get('file');

  if (this.employeeuploadedImage) {
    fileControl?.clearValidators();
  } else {
    fileControl?.setValidators(Validators.required);
  }

  fileControl?.updateValueAndValidity();

  this.employeeselectedImage = null;
  this.employeeselectedImagePreview = null;
}


resetForm() {
  this.formGroup.reset();

  this.employeeselectedImage = null;
  this.employeeselectedImagePreview = null;
  this.employeeuploadedImage = null;
  this.quatationDataModal = null;

  this.formGroup.get('file')?.setValidators(Validators.required);
  this.formGroup.get('file')?.updateValueAndValidity();
}




  deleteData(id?: any) {
    this.toggleSpinner(true);
    this.deleteRecordModal?.hide();

    if (id) {
      this.api.deleteWithId("deleteRequest", id).subscribe(
        (res: any) => this.handleResponse(res),
        (error) => this.handleError(error)
      );
    }

    const idsToDelete = this.checkedValGet;
    if (idsToDelete && idsToDelete.length > 0) {
      this.api
        .post("deleteRequest-multiple", { ids: idsToDelete })
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
      this.getquatationData();
        this.showModal?.hide();
         this.formGroup.reset();
    
    } else {
      this.toastService.error(res["message"]);
    }
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
    const sortedArray = [...this.quatationData]; // Create a new array
    sortedArray.sort((a, b) => {
      const res = this.compare(a[column], b[column]);
      return this.direction === "asc" ? res : -res;
    });
    this.quatationData = sortedArray;
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
    let filteredData = this.quatationDataList;

    // Reset filter counts
    this.filterCounts.termCount = 0;
    this.filterCounts.branchCount = 0;
    this.filterCounts.designationCount = 0;
    this.filterCounts.departmentCount = 0;
    this.filterCounts.statusCount = 0;
    this.filterCounts.empCount = 0;
    this.filterCounts.selectedDateRangeCount = 0;
    this.filterCounts.selectedDateRangeCountUpdate = 0;

    // Filter by term
    if (this.term) {
      filteredData = filteredData.filter(
        (el: any) =>
          el.name.toLowerCase().includes(this.term.toLowerCase()) ||
          el.mobile.toLowerCase().includes(this.term.toLowerCase()) 
          // el.email.toLowerCase().includes(this.term.toLowerCase()) ||
          // el.employee_id.toLowerCase().includes(this.term.toLowerCase())
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

    

      if (this.selectedDateRangeUpdate) {
      let fromDateStr = "";
      let toDateStr = "";

      if (this.selectedDateRangeUpdate.from) {
        fromDateStr = this.formatDateWithoutTime(
          new Date(this.selectedDateRangeUpdate.from)
        );
      }

      if (this.selectedDateRangeUpdate.to) {
        toDateStr = this.formatDateWithoutTime(
          new Date(this.selectedDateRangeUpdate.to)
        );
      }

      filteredData = filteredData.filter((el: any) => {
        const fromDate = this.formatDateWithoutTime(new Date(el.updated_at));
        const toDate = this.formatDateWithoutTime(new Date(el.updated_at));

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
      this.filterCounts.selectedDateRangeCountUpdate = 1;
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
    this.filteredquatationData = filteredData;

    // If no data is found, reset to the first page
    if (
      this.term ||
      this.selectedBranch.length ||
      this.selectedDepartments.length ||
      this.selectedDesignations.length ||
      this.selectedEmp.length ||
      this.selectedStatus
    ) {
      if (this.filteredquatationData.length === 0) {
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
      this.selectedDateRange ||
      this.selectedDateRangeUpdate
    ) {
      if (startItem >= this.filteredquatationData.length) {
        this.currentPage = 1; // Reset to page 1
      }
    }

    const newStartItem = (this.currentPage - 1) * this.currentItemsPerPage;
    const newEndItem = this.currentPage * this.currentItemsPerPage;

    // Slice the filtered data based on current page
    this.quatationData = cloneDeep(
      this.filteredquatationData.slice(newStartItem, newEndItem)
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

    

      let formattedDateRangeUpdated = "";
    if (this.selectedDateRangeUpdate) {
      const fromDate = this.formatDateWithoutTime(
        new Date(this.selectedDateRangeUpdate.from)
      );
      const toDate = this.selectedDateRangeUpdate.to
        ? this.formatDateWithoutTime(new Date(this.selectedDateRangeUpdate.to))
        : "";
      formattedDateRangeUpdated = `${fromDate},${toDate}`; // Comma-separated range
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
        selectedDateRangeUpdate: formattedDateRangeUpdated
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
    this.quatationData = this.quatationDataList; // Reset data to the original list
     (this.selectedDateRange = ""),
     this.selectedDateRangeUpdate = ""

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
        selectedDateRangeUpdate: null,
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
      this.filterCounts.selectedDateRangeCount + 
      this.filterCounts.selectedDateRangeCountUpdate
    );
  }


   updateNoResultDisplay() {
    const noResultElement = document.querySelector(".noresult") as HTMLElement;
    const paginationElement = document.getElementById(
      "pagination-element"
    ) as HTMLElement;
    if (this.quatationData.length === 0) {
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
    for (var i = 0; i < this.quatationData.length; i++) {
      if (this.quatationData[i].states == true) {
        result = this.quatationData[i].id;
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
    this.quatationData = this.quatationData.map((x: { states: any }) => ({
      ...x,
      states: ev.target.checked,
    }));

    var checkedVal: any[] = [];
    var result;
    for (var i = 0; i < this.quatationData.length; i++) {
      if (this.quatationData[i].states == true) {
        result = this.quatationData[i].id;
        checkedVal.push(result);
      }
    }

    this.checkedValGet = checkedVal;

    checkedVal.length > 0
      ? document.getElementById("remove-actions")?.classList.remove("d-none")
      : document.getElementById("remove-actions")?.classList.add("d-none");
  }


onSubmit() {
  if (this.formGroup.invalid) {
    this.formGroup.markAllAsTouched();
    return;
  }

  this.toggleSpinner(true);

  const formData = new FormData();
  formData.append('admin_note', this.formGroup.value.admin_note);

  if (this.employeeselectedImage) {
    formData.append('file', this.employeeselectedImage);
  }

  this.addemployee(formData);
}


    createFormData(): FormData {
    const formData = new FormData();
    formData.append("admin_note", this.f["admin_note"].value);
    console.log(this.employeeselectedImage)
    if (this.employeeselectedImage) {
      formData.append("image", this.employeeselectedImage);
    }

    return formData;
  }

  //   employeeimageSelect(event: any) {
  //   const employeeselectedFile = event.target.files[0];

  //   if (employeeselectedFile) {
  //     this.employeeselectedImage = employeeselectedFile;
  //     this.employeeselectedImagePreview =
  //       URL.createObjectURL(employeeselectedFile);
  //   }
  // }

  employeeimageSelect(event: any) {
  const file = event.target.files[0];
  if (!file) return;

  this.employeeselectedImage = file;
  this.employeeselectedImagePreview = URL.createObjectURL(file);

  this.formGroup.patchValue({ file });

  // ensure file validator is removed once file is selected
  const fileControl = this.formGroup.get('file');
  fileControl?.clearValidators();
  fileControl?.updateValueAndValidity();

  // hide old file visually
  this.employeeuploadedImage = null;
}




    addemployee(formData: FormData) {
    this.api.postwithid("updateRequest", this.id , formData).subscribe(
      (res: any) => this.handleResponse(res),
      (error) => this.handleError(error)
    );
  }
}
