import { Component, OnInit, ViewChild } from "@angular/core";

import { PageChangedEvent } from "ngx-bootstrap/pagination";
import { ToastrService } from "ngx-toastr";
import { ModalDirective } from "ngx-bootstrap/modal";
import { FormGroup, FormBuilder, Validators } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { cloneDeep } from "lodash";
import { ApiService } from "../../../core/services/api.service";

@Component({
  selector: "app-notification",
  templateUrl: "./notification.component.html",
  styleUrl: "./notification.component.scss",
})
export class NotificationComponent implements OnInit {
  breadCrumbItems!: Array<{}>;
  submitted: boolean = false;
  spinnerStatus: boolean = false;
  saveButtonActive: boolean = true;
  masterSelected!: boolean;
  notificationData: any = [];
  notificationDataList: any = [];
  filteredDepartmentData: any = [];
  endItem: any;

  formGroup!: FormGroup;

  id: number | null = null;

  checkedValGet: any[] = [];
  company_id: any;

  currentPage: number = 1;
  currentItemsPerPage = 10;
  itemsPerPageOptions = [10, 20, 30, 50];

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
      { label: "Employee Management" },
      { label: "Notification", active: true },
    ];

    this.route.queryParams.subscribe((params) => {
      this.currentPage = +params["page"] || 1;
      this.currentItemsPerPage = +params["itemsPerPage"] || 10;
      this.term = params["term"] || "";
      this.filterdata();
      this.updatePaginatedData();
    });

    const data = localStorage.getItem("currentUser");

    if (data) {
      const user = JSON.parse(data);
      this.company_id = user.id;
    }

    if (this.company_id) {
      this.getDepartment();
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

  getDepartment() {
    this.toggleSpinner(true);
    // const url = `?company_id=${this.company_id}`;
    this.api
      .get(`getNotification`, this.company_id)
      // this.api.getwithoutid(url)
      .subscribe(
        (res: any) => {
          if (res && res.status) {
            this.toggleSpinner(false);
            // this.notificationData = res.data || [];
            this.notificationDataList = res.data || [];
            this.filterdata();
          } else {
            this.notificationData = [];
            this.notificationDataList = [];
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

  setStatus(data: any, event: Event) {
    const inputElement = event.target as HTMLInputElement;
    const newStatus = inputElement.checked ? "active" : "inactive";

    const formData = {
      name: data.name,
      status: newStatus,
    };
    this.toggleSpinner(true);

    this.api.put("department", data.id, formData).subscribe(
      (res: any) => this.handleResponse(res),
      (error) => this.handleError(error)
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
      name: this.f["name"].value,
      status: this.f["status"].value,
    };
    return formData;
  }

  add(formData: any) {
    this.api.post("department", formData).subscribe(
      (res: any) => this.handleResponse(res),
      (error) => this.handleError(error)
    );
  }

  update(formData: any) {
    const id = this.id as number;
    this.api.put("department", id, formData).subscribe(
      (res: any) => this.handleResponse(res),
      (error) => this.handleError(error)
    );
  }

  onAdd() {
    this.resetForm();
    this.showModal?.show();
    var modaltitle = document.querySelector(".modal-title") as HTMLAreaElement;
    modaltitle.innerHTML = "Add Department";
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
    modaltitle.innerHTML = "Edit Department";
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
      this.api.deleteWithId("notificationDelete", id).subscribe(
        (res: any) => this.handleResponse(res),
        (error) => this.handleError(error)
      );
    }

    const idsToDelete = this.checkedValGet;
    if (idsToDelete && idsToDelete.length > 0) {
      this.api
        .post("notification-delete-multiple", { ids: idsToDelete })
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
      this.getDepartment();
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
    for (var i = 0; i < this.notificationData.length; i++) {
      if (this.notificationData[i].states == true) {
        result = this.notificationData[i].id;
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
    this.notificationData = this.notificationData.map((x: { states: any }) => ({
      ...x,
      states: ev.target.checked,
    }));

    var checkedVal: any[] = [];
    var result;
    for (var i = 0; i < this.notificationData.length; i++) {
      if (this.notificationData[i].states == true) {
        result = this.notificationData[i].id;
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
    const sortedArray = [...this.notificationData]; // Create a new array
    sortedArray.sort((a, b) => {
      const res = this.compare(a[column], b[column]);
      return this.direction === "asc" ? res : -res;
    });
    this.notificationData = sortedArray;
  }
  compare(v1: string | number, v2: string | number) {
    return v1 < v2 ? -1 : v1 > v2 ? 1 : 0;
  }

  // pageChanged(event: PageChangedEvent): void {
  //   const startItem = (event.page - 1) * event.itemsPerPage;
  //   this.endItem = event.page * event.itemsPerPage;
  //   this.notificationData = this.notificationDataList.slice(
  //     startItem,
  //     this.endItem
  //   );
  // }
  term: any;

  // filterdata
  // filterdata() {
  //   if (this.term) {
  //     this.notificationData = this.notificationDataList.filter((el: any) =>
  //       el.name.toLowerCase().includes(this.term.toLowerCase())
  //     );
  //   } else {
  //     this.notificationData = this.notificationDataList;
  //   }
  //   // noResultElement
  //   this.updateNoResultDisplay();
  // }

  // filterdata

  filterdata() {
    let filteredData = this.notificationDataList;

    // Filter by term
    if (this.term) {
      filteredData = filteredData.filter((el: any) =>
        el.name.toLowerCase().includes(this.term.toLowerCase())
      );
    }
    this.filteredDepartmentData = filteredData;
    // Update paginated data based on current page
    this.updatePaginatedData();
  }

  // no result
  updateNoResultDisplay() {
    const noResultElement = document.querySelector(".noresult") as HTMLElement;
    const paginationElement = document.getElementById(
      "pagination-element"
    ) as HTMLElement;
    if (this.term && this.notificationData.length === 0) {
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
  pageChanged(event: PageChangedEvent) {
    this.currentPage = event.page;
    this.updatePaginatedData();
  }

  updatePaginatedData(): void {
    const startItem = (this.currentPage - 1) * this.currentItemsPerPage;
    const endItem = this.currentPage * this.currentItemsPerPage;

    if (this.term) {
      if (startItem >= this.filteredDepartmentData.length) {
        this.currentPage = 1;
      }
    }

    const newStartItem = (this.currentPage - 1) * this.currentItemsPerPage;
    const newEndItem = this.currentPage * this.currentItemsPerPage;

    this.notificationData = cloneDeep(
      this.filteredDepartmentData.slice(newStartItem, newEndItem)
    );

    this.updateNoResultDisplay();

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        page: this.currentPage,
        itemsPerPage: this.currentItemsPerPage,
        term: this.term,
      },
      queryParamsHandling: "merge",
    });
  }
}