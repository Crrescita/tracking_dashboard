import { Component, OnInit, ViewChild } from "@angular/core";
import { FormBuilder } from "@angular/forms";
import { ApiService } from "../../../../core/services/api.service";
import { ToastrService } from "ngx-toastr";
import { PageChangedEvent } from "ngx-bootstrap/pagination";
import Swal from "sweetalert2";
import { ModalDirective } from "ngx-bootstrap/modal";
import { cloneDeep } from "lodash";

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

  company_id: any;

  //table
  // term: string = "";
  // currentPage = 1;
  // totalItems = 0;
  // itemsPerPage = 5;
  endItem: any;

  @ViewChild("showModal", { static: false }) showModal?: ModalDirective;
  @ViewChild("deleteRecordModal", { static: false })
  deleteRecordModal?: ModalDirective;
  deleteId: any;

  checkedValGet: any[] = [];
  masterSelected!: boolean;

  constructor(
    private formBuilder: FormBuilder,
    private api: ApiService,
    public toastService: ToastrService
  ) {}

  ngOnInit(): void {
    this.breadCrumbItems = [
      { label: "Employee Management", active: true },
      { label: "Employees", active: true },
    ];

    const data = localStorage.getItem("currentUser");

    if (data) {
      const user = JSON.parse(data);
      this.company_id = user.id;
    }
    this.getemployeeData();
  }

  getemployeeData() {
    this.toggleSpinner(true);

    const url = `employees?company_id=${this.company_id}`;

    this.api.getwithoutid(url).subscribe(
      (res: any) => {
        if (res && res.status) {
          this.toggleSpinner(false);
          this.employeeData = res.data || [];
          this.employeeDataList = res.data || [];
          this.employeeData = cloneDeep(this.employeeDataList.slice(0, 10));
        } else {
          this.handleError("Unexpected response format");
        }
      },
      (error) => {
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
      this.showModal?.hide();
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

  pageChanged(event: PageChangedEvent): void {
    const startItem = (event.page - 1) * event.itemsPerPage;
    this.endItem = event.page * event.itemsPerPage;
    this.employeeData = this.employeeDataList.slice(startItem, this.endItem);
  }
  term: any;

  // filterdata
  filterdata() {
    if (this.term) {
      this.employeeData = this.employeeDataList.filter(
        (el: any) =>
          el.name.toLowerCase().includes(this.term.toLowerCase()) ||
          el.mobile.toLowerCase().includes(this.term.toLowerCase()) ||
          el.email.toLowerCase().includes(this.term.toLowerCase()) ||
          el.designation.toLowerCase().includes(this.term.toLowerCase()) ||
          el.department.toLowerCase().includes(this.term.toLowerCase()) ||
          el.employee_id.toLowerCase().includes(this.term.toLowerCase())
      );
    } else {
      this.employeeData = this.employeeDataList;
    }
    // noResultElement
    this.updateNoResultDisplay();
  }

  // no result
  updateNoResultDisplay() {
    const noResultElement = document.querySelector(".noresult") as HTMLElement;
    const paginationElement = document.getElementById(
      "pagination-element"
    ) as HTMLElement;
    if (this.term && this.employeeData.length === 0) {
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
