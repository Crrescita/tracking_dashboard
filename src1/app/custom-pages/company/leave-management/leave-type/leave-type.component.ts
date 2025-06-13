import { Component, OnInit, ViewChild } from "@angular/core";
import { PageChangedEvent } from "ngx-bootstrap/pagination";
import { ToastrService } from "ngx-toastr";
import { ModalDirective } from "ngx-bootstrap/modal";
import {
  FormGroup,
  FormBuilder,
  Validators,
  ValidatorFn,
  AbstractControl,
} from "@angular/forms";
import { ApiService } from "../../../../core/services/api.service";
import { ActivatedRoute, Router } from "@angular/router";
import { cloneDeep } from "lodash";

@Component({
  selector: "app-leave-type",
  templateUrl: "./leave-type.component.html",
  styleUrl: "./leave-type.component.scss",
})
export class LeaveTypeComponent {
  breadCrumbItems!: Array<{}>;
  submitted: boolean = false;
  spinnerStatus: boolean = false;
  saveButtonActive: boolean = true;
  masterSelected!: boolean;
  leaveData: any = [];
  leaveDataList: any = [];
  filteredLeaveTypeData: any = [];
  endItem: any;

  formGroup!: FormGroup;
  leaveForm!: FormGroup;

  id: number | null = null;

  checkedValGet: any[] = [];

  currentPage: number = 1;
  currentItemsPerPage = 10;
  itemsPerPageOptions = [10, 20, 30, 50];

  @ViewChild("showModal", { static: false }) showModal?: ModalDirective;
  @ViewChild("deleteRecordModal", { static: false })
  deleteRecordModal?: ModalDirective;
  deleteId: any;

  company_id: any;

  remaining_leavedays: any;
  fixedremaininggdays: any;

  isEditMode: boolean = false;

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
      { label: "Leave Type", active: true },
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
    // , this.maxLeaveDaysValidator.bind(this)
    this.formGroup = this.formBuilder.group({
      name: ["", [Validators.required, Validators.maxLength(45)]],
      totalLeaveDays: ["", [Validators.required]],
      status: [""],
    });

    // this.formGroup.get("totalLeaveDays")?.valueChanges.subscribe((value) => {
    //   this.updateRemainingDays(value);
    //   this.isEditMode = false;
    // });

    this.leaveForm = this.formBuilder.group({
      totalLeave: ["", Validators.required],
      carryForward: [false, Validators.required],
      maxCarryForward: [{ value: "", disabled: true }],
    });

    this.leaveForm
      .get("carryForward")!
      .valueChanges.subscribe((carryForwardValue) => {
        const maxCarryForwardControl = this.leaveForm.get("maxCarryForward");

        if (carryForwardValue) {
          maxCarryForwardControl!.enable();
          maxCarryForwardControl!.setValidators([
            Validators.required,
            this.maxCarryForwardValidator(),
          ]);
        } else {
          maxCarryForwardControl!.disable();
          maxCarryForwardControl!.clearValidators();
          maxCarryForwardControl!.reset();
        }

        maxCarryForwardControl!.updateValueAndValidity();
      });

    if (this.company_id) {
      this.getLeaveType();
      this.getLeaveSetting();
    }
  }

  maxLeaveDaysValidator(control: AbstractControl) {
    if (control.value && control.value > this.fixedremaininggdays) {
      return { maxLeaveDaysExceeded: true };
    }
    return null;
  }

  previousValue: number | null = null;

  // updateRemainingDays(days: number | null) {
  //   if (this.isEditMode) {
  //     return;
  //   }
  //   if (
  //     days !== null &&
  //     days !== undefined &&
  //     days <= this.remaining_leavedays
  //   ) {
  //     if (this.previousValue !== null) {
  //       const difference = days - this.previousValue;

  //       if (difference !== 0 && this.remaining_leavedays - difference >= 0) {
  //         this.remaining_leavedays -= difference;
  //       }
  //     } else if (days <= this.remaining_leavedays) {
  //       this.remaining_leavedays -= days;
  //     }
  //     this.previousValue = days;
  //   } else {
  //     this.getLeaveSetting();
  //     this.previousValue = null;
  //   }
  // }

  maxCarryForwardValidator(): ValidatorFn {
    return (control: AbstractControl) => {
      const totalLeave = this.leaveForm.get("totalLeave")!.value;
      const maxCarryForward = control.value;

      if (maxCarryForward > totalLeave) {
        return { maxCarryForwardExceeded: true };
      }
      return null;
    };
  }

  get f() {
    return this.formGroup.controls;
  }

  get l() {
    return this.leaveForm.controls;
  }

  toggleSpinner(isLoading: boolean) {
    this.spinnerStatus = isLoading;
    this.saveButtonActive = !isLoading;
    this.submitted = isLoading;
  }

  getLeaveType() {
    this.toggleSpinner(true);
    const url = `leaveType?company_id=${this.company_id}`;
    this.api.getwithoutid(url).subscribe(
      (res: any) => {
        if (res && res.status) {
          this.toggleSpinner(false);
          // this.leaveData = res.data || [];
          this.leaveDataList = res.data || [];
          this.filterdata();
        } else {
          this.leaveData = [];
          this.leaveDataList = [];
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

  getLeaveSetting() {
    this.toggleSpinner(true);
    const url = `leaveSetting?company_id=${this.company_id}`;

    this.api.getwithoutid(url).subscribe(
      (res: any) => {
        this.toggleSpinner(false);

        if (res && res.status) {
          const data = res.data[0];
          if (data) {
            this.remaining_leavedays = data.remaining_leavedays;
            this.fixedremaininggdays = data.remaining_leavedays;
            this.leaveForm.patchValue({
              totalLeave: data.totalannual_leavedays ?? "",
              carryForward: data.carry_forword_status == 0 ? false : true,
              maxCarryForward: data.carry_forword_leaves ?? "",
            });
          } else {
            this.leaveForm.patchValue({
              totalLeave: "",
              carryForward: false,
              maxCarryForward: "",
            });
            this.handleError("No data found");
          }
        } else {
          this.leaveForm.patchValue({
            totalLeave: "",
            carryForward: false,
            maxCarryForward: "",
          });
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

    this.api.put("leaveType", data.id, formData).subscribe(
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
      total_leave_days: this.f["totalLeaveDays"].value,
      status: "active",
      // status: this.f["status"].value,
    };
    return formData;
  }

  add(formData: any) {
    this.api.post("leaveType", formData).subscribe(
      (res: any) => this.handleResponse(res),
      (error) => this.handleError(error)
    );
  }

  update(formData: any) {
    const id = this.id as number;
    this.api.put("leaveType", id, formData).subscribe(
      (res: any) => this.handleResponse(res),
      (error) => this.handleError(error)
    );
  }

  // leave setting
  onSubmitLeaveSetting() {
    if (this.leaveForm.valid) {
      this.toggleSpinner(true);
      const formData = {
        company_id: this.company_id,
        totalannual_leavedays: this.l["totalLeave"].value,
        carry_forword_status: this.l["carryForward"].value,
        carry_forword_leaves: this.l["maxCarryForward"].value,
      };
      this.api.post("leaveSetting", formData).subscribe(
        (res: any) => this.handleResponse(res),
        (error) => this.handleError(error)
      );
    } else {
      this.leaveForm.markAllAsTouched();
    }
  }

  onAdd() {
    if (this.l["totalLeave"].value) {
      this.resetForm();
      this.showModal?.show();
      var modaltitle = document.querySelector(
        ".modal-title"
      ) as HTMLAreaElement;
      modaltitle.innerHTML = "Add Leave Type";
      var modalbtn = document.getElementById("add-btn") as HTMLAreaElement;
      modalbtn.innerHTML = "Add";
      this.id = null;
    } else {
      this.toastService.error(
        "Leave Type cannot be created unless the Total Annual Leave is added."
      );
    }
  }

  resetForm() {
    this.formGroup.reset();
    // Set default values if necessary
    this.formGroup.patchValue({
      name: "",
      totalLeaveDays: "",
      status: "",
    });
  }

  // edit
  editList(data: any) {
    this.isEditMode = true;
    this.showModal?.show();
    var modaltitle = document.querySelector(".modal-title") as HTMLAreaElement;
    modaltitle.innerHTML = "Edit Leave Type";
    var modalbtn = document.getElementById("add-btn") as HTMLAreaElement;
    modalbtn.innerHTML = "Update";

    this.id = data.id;

    this.formGroup.patchValue({
      name: data.name,
      totalLeaveDays: data.total_leave_days,
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
      this.api.deleteWithId("leaveType", id).subscribe(
        (res: any) => this.handleResponse(res),
        (error) => this.handleError(error)
      );
    }

    const idsToDelete = this.checkedValGet;
    if (idsToDelete && idsToDelete.length > 0) {
      this.api
        .post("leaveType-delete-multiple", { ids: idsToDelete })
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
      this.getLeaveType();
      this.getLeaveSetting();
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
    for (var i = 0; i < this.leaveData.length; i++) {
      if (this.leaveData[i].states == true) {
        result = this.leaveData[i].id;
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
    this.leaveData = this.leaveData.map((x: { states: any }) => ({
      ...x,
      states: ev.target.checked,
    }));

    var checkedVal: any[] = [];
    var result;
    for (var i = 0; i < this.leaveData.length; i++) {
      if (this.leaveData[i].states == true) {
        result = this.leaveData[i].id;
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
    const sortedArray = [...this.leaveData]; // Create a new array
    sortedArray.sort((a, b) => {
      const res = this.compare(a[column], b[column]);
      return this.direction === "asc" ? res : -res;
    });
    this.leaveData = sortedArray;
  }
  compare(v1: string | number, v2: string | number) {
    return v1 < v2 ? -1 : v1 > v2 ? 1 : 0;
  }

  // pageChanged(event: PageChangedEvent): void {
  //   const startItem = (event.page - 1) * event.itemsPerPage;
  //   this.endItem = event.page * event.itemsPerPage;
  //   this.leaveData = this.leaveDataList.slice(startItem, this.endItem);
  // }
  term: any;

  // filterdata

  filterdata() {
    let filteredData = this.leaveDataList;

    // Filter by term
    if (this.term) {
      filteredData = filteredData.filter((el: any) =>
        el.name.toLowerCase().includes(this.term.toLowerCase())
      );
    }
    this.filteredLeaveTypeData = filteredData;
    // Update paginated data based on current page
    this.updatePaginatedData();
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
      if (startItem >= this.filteredLeaveTypeData.length) {
        this.currentPage = 1;
      }
    }

    const newStartItem = (this.currentPage - 1) * this.currentItemsPerPage;
    const newEndItem = this.currentPage * this.currentItemsPerPage;

    this.leaveData = cloneDeep(
      this.filteredLeaveTypeData.slice(newStartItem, newEndItem)
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

  // no result
  updateNoResultDisplay() {
    const noResultElement = document.querySelector(".noresult") as HTMLElement;
    const paginationElement = document.getElementById(
      "pagination-element"
    ) as HTMLElement;
    if (this.term && this.leaveData.length === 0) {
      noResultElement.style.display = "block";
      paginationElement.classList.add("d-none");
    } else {
      noResultElement.style.display = "none";
      paginationElement.classList.remove("d-none");
    }
  }
}
