import { Component, ViewChild } from "@angular/core";
import { FormGroup, FormBuilder, Validators } from "@angular/forms";
import { ApiService } from "../../../../core/services/api.service";
import { ToastrService } from "ngx-toastr";
import { cloneDeep } from "lodash";
import { PageChangedEvent } from "ngx-bootstrap/pagination";
import { ActivatedRoute, Router } from "@angular/router";
import { ModalDirective } from "ngx-bootstrap/modal";
import { BsDatepickerConfig } from "ngx-bootstrap/datepicker";
import { AbstractControl, ValidationErrors, ValidatorFn } from "@angular/forms";
@Component({
  selector: "app-task-list",
  templateUrl: "./task-list.component.html",
  styleUrl: "./task-list.component.scss",
})
export class TaskListComponent {
  bsConfig?: Partial<BsDatepickerConfig>;
  breadCrumbItems!: Array<{}>;

  taskDataList: any = [];
  taskData: any = [];
  filteredTaskData: any;

  spinnerStatus: boolean = false;
  company_id: any;

  employeeDataList: any = [];

  term: any;
  currentPage: number = 1;
  currentItemsPerPage = 10;
  itemsPerPageOptions = [10, 20, 30, 50];
  checkedValGet: any[] = [];
  masterSelected!: boolean;
  deleteId: any;
  id: number | null = null;
  formGroup!: FormGroup;
  @ViewChild("addTickets", { static: false }) addTickets?: ModalDirective;
  @ViewChild("deleteRecordModal", { static: false })
  deleteRecordModal?: ModalDirective;

  selectedEmp: any[] = [];
  selectedStatus: string = "All";
  selectedFrequency: string = "All";
  selectedPriority: string = "All";
  selectedDate: any;
  selectedEndDate: any;

  filterCounts = {
    termCount: 0,
    // selectedFrequency: 0,
    // departmentCount: 0,
    statusCount: 0,
    frequencyCount: 0,
    priorityCount: 0,
    empCount: 0,
    selectedstartDateCount: 0,
    selectedendDateCount: 0,
    // dateCount: 0,
  };

  constructor(
    private api: ApiService,
    public toastService: ToastrService,
    private formBuilder: FormBuilder,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.bsConfig = {
      showWeekNumbers: false,
      dateInputFormat: "DD/MM/YYYY",
    };
  }

  ngOnInit(): void {
    this.breadCrumbItems = [
      { label: "Employee Management" },
      { label: "Assigned Task", active: true },
    ];

    const data = localStorage.getItem("currentUser");
    if (data) {
      const user = JSON.parse(data);
      this.company_id = user.id;
    }

    if (this.company_id) {
      this.getAssignedTask();
      this.getemployeeData();
    }

    this.formGroup = this.formBuilder.group(
      {
        task_title: ["", [Validators.maxLength(45), Validators.required]],
        emp_id: ["", [Validators.required]],
        task_description: [""],
        start_date: ["", [Validators.required]],
        end_date: ["", [Validators.required]],
        priority: ["", [Validators.required]],
        frequency: ["", [Validators.required]],
        status: ["", [Validators.required]],
      },
      {
        validator: this.dateRangeValidator(), // Apply the custom validator here
      }
    );

    if (this.id) {
      this.formGroup.get("status")?.setValidators([Validators.required]);
    } else {
      this.formGroup.get("status")?.clearValidators(); 
    }
    
    this.formGroup.updateValueAndValidity();

    this.route.queryParams.subscribe((params) => {
      this.currentPage = +params["page"] || 1;
      this.currentItemsPerPage = +params["itemsPerPage"] || 10;
      this.term = params["term"] || "";

      this.selectedStatus = params["selectedStatus"] || null;
      this.selectedFrequency = params["selectedFrequency"] || null;
      this.selectedPriority = params["selectedPriority"] || null;
      this.selectedEmp = params["selectedEmp"]
        ? params["selectedEmp"].split(",")
        : [];
     

      if (params["date"]) {
        this.selectedDate = new Date(params["date"]);
      }

      if (params["enddate"]) {
        this.selectedEndDate = new Date(params["enddate"]);
      }

      this.filterdata();
      this.updatePaginatedData();
    });
  }

  dateRangeValidator(): ValidatorFn {
    return (formGroup: AbstractControl): ValidationErrors | null => {
      const startDate = formGroup.get("start_date")?.value;
      const endDate = formGroup.get("end_date")?.value;

      if (startDate && endDate) {
        if (new Date(startDate) > new Date(endDate)) {
          return { dateRange: true };
        }
      }
      return null;
    };
  }

  get f() {
    return this.formGroup.controls;
  }

  toggleSpinner(isLoading: boolean) {
    this.spinnerStatus = isLoading;
    // this.saveButtonActive = !isLoading;
    // this.submitted = isLoading;
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

  getAssignedTask() {
    this.toggleSpinner(true);
    const url = `assignTask`;
    this.api.getwithoutid(url).subscribe(
      (res: any) => {
        if (res && res.status) {
          this.toggleSpinner(false);
          // this.taskData = res.data || [];
          this.taskDataList = res.data || [];
          this.filterdata();
        } else {
          this.taskData = [];
          this.taskDataList = [];
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
      company_id: this.company_id,
      emp_id: this.f["emp_id"].value.join(","),
      task_title: this.f["task_title"].value,
      task_description: this.f["task_description"].value,
      start_date: this.f["start_date"].value,
      end_date: this.f["end_date"].value,
      priority: this.f["priority"].value,
      frequency: this.f["frequency"].value,
      status: this.id? this.f["status"].value: "To-Do",
    };
    return formData;
  }

  add(formData: any) {
    this.api.post("assignTask", formData).subscribe(
      (res: any) => this.handleResponse(res),
      (error) => this.handleError(error)
    );
  }

  update(formData: any) {
    const id = this.id as number;
    this.api.put("assignTask", id, formData).subscribe(
      (res: any) => this.handleResponse(res),
      (error) => this.handleError(error)
    );
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
      this.api.deleteWithId("assignTask", id).subscribe(
        (res: any) => this.handleResponse(res),
        (error) => this.handleError(error)
      );
    }

    const idsToDelete = this.checkedValGet;
    if (idsToDelete && idsToDelete.length > 0) {
      this.api
        .post("assignTask-delete-multiple", { ids: idsToDelete })
        .subscribe(
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
      this.getAssignedTask();
      this.addTickets?.hide();
    } else {
      this.toastService.error(res["message"]);
    }
  }

  handleError(error: any) {
    this.toggleSpinner(false);
  }

  onAdd() {
    this.formGroup.reset();
    this.addTickets?.show();
    var modaltitle = document.querySelector(".modal-title") as HTMLAreaElement;
    modaltitle.innerHTML = "Assign Task";
    var modalbtn = document.getElementById("add-btn") as HTMLAreaElement;
    modalbtn.innerHTML = "Add Task";
    this.id = null;
  }

  editList(data: any) {
    this.addTickets?.show();
    var modaltitle = document.querySelector(".modal-title") as HTMLAreaElement;
    modaltitle.innerHTML = "Edit Task";
    var modalbtn = document.getElementById("add-btn") as HTMLAreaElement;
    modalbtn.innerHTML = "Update";

    this.id = data.id;
    const empIdArray = data.emp_id
      .split(",")
      .map((id: string) => parseInt(id.trim()));
    this.formGroup.patchValue({
      task_title: data.task_title,
      emp_id: empIdArray,
      task_description: data.task_description,
      start_date: data.start_date ? new Date(data.start_date) : null,
  end_date: data.end_date ? new Date(data.end_date) : null,
      priority: data.priority,
      frequency: data.frequency,
      status: data.status,
    });
  }

  filterdata() {
    let filteredData = this.taskDataList;

    if (this.selectedStatus == null) {
      this.selectedStatus = "";
    }
    if (this.selectedFrequency == null) {
      this.selectedFrequency = "";
    }
    if (this.selectedPriority == null) {
      this.selectedPriority = "";
    }

    // Reset filter counts
    this.filterCounts.termCount = 0;
    this.filterCounts.frequencyCount = 0;
    this.filterCounts.priorityCount = 0;
    this.filterCounts.statusCount = 0;
    this.filterCounts.empCount = 0;
    this.filterCounts.selectedstartDateCount = 0;
    this.filterCounts.selectedendDateCount = 0;


    // Filter by term
    if (this.term) {
      filteredData = filteredData.filter(
        (el: any) =>
          el.task_id.toLowerCase().includes(this.term.toLowerCase()) ||
          el.task_title.toLowerCase().includes(this.term.toLowerCase()) ||
          el.priority.toLowerCase().includes(this.term.toLowerCase()) ||
          el.frequency.toLowerCase().includes(this.term.toLowerCase()) ||
          el.status.toLowerCase().includes(this.term.toLowerCase())
      );
      this.filterCounts.termCount = 1;
    }

    // if (this.selectedEmp && this.selectedEmp.length > 0) {
    //   filteredData = filteredData.filter((el: any) =>
    //     this.selectedEmp
    //       .map((d) => d.toLowerCase())
    //       .includes(el.name.toLowerCase())
    //   );
    //   this.filterCounts.empCount = 1;
    // }

    // Filter by selected status
    if (this.selectedStatus) {
      filteredData = filteredData.filter(
        (el: any) => el.status === this.selectedStatus
      );
      this.filterCounts.statusCount = 1;
    }

    if (this.selectedFrequency) {
      filteredData = filteredData.filter(
        (el: any) => el.frequency === this.selectedFrequency
      );
    }

    if (this.selectedPriority) {
      filteredData = filteredData.filter(
        (el: any) => el.priority === this.selectedPriority
      );
    }

    if (this.selectedDate) {
      let selectedDateStr = this.formatDateWithoutTime(
        new Date(this.selectedDate)
      );

      filteredData = filteredData.filter((el: any) => {
        let taskDateStr = this.formatDateWithoutTime(new Date(el.start_date));
        return taskDateStr === selectedDateStr;
      });
      this.filterCounts.selectedstartDateCount = 1;
    }

    if (this.selectedEndDate) {
      let selectedDateStr = this.formatDateWithoutTime(
        new Date(this.selectedEndDate)
      );

      filteredData = filteredData.filter((el: any) => {
        let taskDateStr = this.formatDateWithoutTime(new Date(el.end_date));
        return taskDateStr === selectedDateStr;
      });
      this.filterCounts.selectedendDateCount = 1;
    }

    // Update filtered data
    this.filteredTaskData = filteredData;

    // If no data is found, reset to the first page
    if (
      this.term ||
      this.selectedFrequency ||
      this.selectedPriority ||
      this.selectedEmp.length ||
      this.selectedStatus ||
      this.selectedDate ||
      this.selectedEndDate
    ) {
      if (this.filteredTaskData.length === 0) {
        this.currentPage = 1; // Reset to page 1 if no results after search
      }
    }

    // Update paginated data based on current page
    this.updatePaginatedData();
  }

  formatDateWithoutTime(date: Date): string {
    const year = date.getFullYear();
    const month = ("0" + (date.getMonth() + 1)).slice(-2); // Month is zero-based
    const day = ("0" + date.getDate()).slice(-2);
    return `${year}-${month}-${day}`;
  }

  updatePaginatedData(): void {
    const startItem = (this.currentPage - 1) * this.currentItemsPerPage;
    const endItem = this.currentPage * this.currentItemsPerPage;

    if (
      this.term ||
      this.selectedFrequency ||
      this.selectedPriority ||
      this.selectedEmp.length ||
      this.selectedStatus ||
      this.selectedDate ||
      this.selectedEndDate
    ) {
      if (startItem >= this.filteredTaskData.length) {
        this.currentPage = 1;
      }
    }

    const newStartItem = (this.currentPage - 1) * this.currentItemsPerPage;
    const newEndItem = this.currentPage * this.currentItemsPerPage;

    this.taskData = cloneDeep(
      this.filteredTaskData.slice(newStartItem, newEndItem)
    );

    this.updateNoResultDisplay();

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        term: this.term,
        page: this.currentPage,
        itemsPerPage: this.currentItemsPerPage,
        selectedFrequency: this.selectedFrequency,
        selectedPriority: this.selectedPriority,
        selectedEmp: this.selectedEmp.join(","),
        selectedStatus:this.selectedStatus,
        date: this.selectedDate
          ? this.formatDateWithoutTime(this.selectedDate)
          : "",
        enddate: this.selectedEndDate
          ? this.formatDateWithoutTime(this.selectedEndDate)
          : "",
      },
      queryParamsHandling: "merge",
    });
  }

  // Select Checkbox value Get
  onCheckboxChange(e: any) {
    var checkedVal: any[] = [];
    var result;
    for (var i = 0; i < this.taskData.length; i++) {
      if (this.taskData[i].states == true) {
        result = this.taskData[i].id;
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
    this.taskData = this.taskData.map((x: { states: any }) => ({
      ...x,
      states: ev.target.checked,
    }));

    var checkedVal: any[] = [];
    var result;
    for (var i = 0; i < this.taskData.length; i++) {
      if (this.taskData[i].states == true) {
        result = this.taskData[i].id;
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
    const sortedArray = [...this.taskData]; // Create a new array
    sortedArray.sort((a, b) => {
      const res = this.compare(a[column], b[column]);
      return this.direction === "asc" ? res : -res;
    });
    this.taskData = sortedArray;
  }
  compare(v1: string | number, v2: string | number) {
    return v1 < v2 ? -1 : v1 > v2 ? 1 : 0;
  }

  onItemsPerPageChange() {
    this.currentPage = 1;
    this.updatePaginatedData();
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
    if (this.taskData.length === 0) {
      noResultElement.style.display = "block";
      paginationElement.classList.add("d-none");
    } else {
      noResultElement.style.display = "none";
      paginationElement.classList.remove("d-none");
    }
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

  get totalFilterCount(): number {
    return (
      this.filterCounts.termCount +
      this.filterCounts.statusCount +
      this.filterCounts.frequencyCount +
      this.filterCounts.priorityCount +
      this.filterCounts.empCount +
      this.filterCounts.selectedstartDateCount +
      this.filterCounts.selectedendDateCount
    );
  }

  reset() {
    // Clear filters
    this.term = "";
    // this.selectedDepartments = [];
    // this.selectedDesignations = [];
    this.selectedStatus = "";
    this.selectedFrequency = "";
    this.selectedPriority = "";

    // this.selectedCheckStatus = "";
    this.taskData = this.taskDataList;
    this.selectedEmp = [];
    this.selectedDate = "";
    this.selectedEndDate = "";
    // this.formattedDate = this.formatDate(this.selectedDate);

    this.filterdata();

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        term: null,
        // selectedDepartments: null,
        // selectedDesignations: null,
        selectedStatus: null,
        selectedFrequency: null,
        selectedPriority: null,
        // selectedCheckStatus: null,
        selectedEmp: null,
        page: 1,
        itemsPerPage: this.currentItemsPerPage,
        date: this.selectedDate,
        enddate: this.selectedEndDate,
      },
      queryParamsHandling: "merge",
    });

    this.getAssignedTask();
  }
}
