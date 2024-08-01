import { Component, OnInit } from "@angular/core";
import {
  FormGroup,
  FormBuilder,
  Validators,
  AbstractControl,
} from "@angular/forms";

import { ToastrService } from "ngx-toastr";
import { PageChangedEvent } from "ngx-bootstrap/pagination";
import Swal from "sweetalert2";
import { ApiService } from "../../core/services/api.service";

@Component({
  selector: "app-location",
  templateUrl: "./location.component.html",
  styleUrl: "./location.component.scss",
})
export class LocationComponent implements OnInit {
  breadCrumbItems!: Array<{}>;
  formGroup!: FormGroup;
  addSaveButtonActive: boolean = true;
  spinnerStatus: boolean = false;
  editId: number | null = null;

  //table
  term: string = "";
  currentPage = 1;
  totalItems = 0;
  itemsPerPage = 5;
  endItem: any;

  locationData: any = [];
  locationDataList: any = [];

  constructor(
    private formBuilder: FormBuilder,
    private api: ApiService,
    private toastService: ToastrService
  ) {}

  ngOnInit(): void {
    this.breadCrumbItems = [
      { label: "Pages", active: true },
      { label: "Location", active: true },
    ];
    this.initializeForm();
    this.getData();
  }

  initializeForm() {
    this.formGroup = this.formBuilder.group({
      city_name: ["", [Validators.required, Validators.maxLength(45)]],
      address: ["", [Validators.required, Validators.maxLength(100)]],
      email: [
        "",
        [
          Validators.required,
          Validators.email,
          Validators.pattern("^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$"),
        ],
      ],
      mobile: [
        "",
        [Validators.required, Validators.pattern("^((\\+91-?)|0)?[0-9]{10}$")],
      ],
      iframe_url: ["", [Validators.required]],
      status: ["", [Validators.required]],
    });
  }

  get s2() {
    return this.formGroup.controls;
  }

  // api's
  getData() {
    this.api.getwithoutid("get-location").subscribe(
      (res: any) => {
        if (res && res.status) {
          this.locationData = res.data || [];
          this.locationDataList = res.data || [];
        } else {
          this.clearServiceData();
          this.handleError("Unexpected response format");
        }
      },
      (error) => {
        this.clearServiceData();
        this.handleError(
          error.message || "An error occurred while fetching data"
        );
      }
    );
  }

  clearServiceData() {
    this.locationData = [];
    this.locationDataList = [];
  }

  onSubmit(modal: any) {
    if (this.formGroup.valid) {
      this.toggleSpinner(true);

      const formData = this.createFormData();

      if (this.editId != null) {
        this.updateLocation(modal, formData, this.editId);
      } else {
        this.addLocation(modal, formData);
      }
    } else {
      this.formGroup.markAllAsTouched();
    }
  }

  toggleSpinner(isLoading: boolean) {
    this.spinnerStatus = isLoading;
    this.addSaveButtonActive = !isLoading;
  }

  createFormData() {
    const formData = {
      city_name: this.s2["city_name"].value,
      address: this.s2["address"].value,
      email: this.s2["email"].value,
      mobile: this.s2["mobile"].value,
      iframe_url: this.s2["iframe_url"].value,
      status: this.s2["status"].value,
    };
    return formData;
  }

  updateLocation(modal: any, formData: any, id: number) {
    this.api.put("location", id, formData).subscribe(
      (res: any) => this.handleResponse(res, modal),
      (error) => this.handleError(error)
    );
  }

  addLocation(modal: any, formData: any) {
    this.api.post("location", formData).subscribe(
      (res: any) => this.handleResponse(res, modal),
      (error) => this.handleError(error)
    );
  }

  delete(id: number) {
    if (id) {
      Swal.fire({
        title: "Are you sure?",
        text: "You won't be able to revert this!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Yes, delete it!",
      }).then((result: any) => {
        if (result.isConfirmed) {
          this.api.deleteWithId("location-delete", id).subscribe(
            (res: any) => this.handleStatusChangeResponse(res),
            (error) => this.handleError(error)
          );
        }
      });
    }
  }

  setStatus(location: any, event: Event) {
    const inputElement = event.target as HTMLInputElement;
    const newStatus = inputElement.checked ? "active" : "inactive";

    const formData = {
      city_name: location.city_name,
      address: location.address,
      email: location.email,
      mobile: location.mobile,
      iframe_url: location.iframe_url,
      status: newStatus,
    };

    // const formData = new FormData();
    // formData.append('status', newStatus);

    this.toggleSpinner(true);

    this.api.put("location", location.id, formData).subscribe(
      (res: any) => this.handleStatusChangeResponse(res),
      (error) => this.handleError(error)
    );
  }

  handleStatusChangeResponse(res: any) {
    this.toggleSpinner(false);
    if (res["status"] === true) {
      this.toastService.success("Data Saved Successfully!!");
      this.getData();
    } else {
      this.toastService.error(res["message"]);
    }
  }

  handleResponse(res: any, modal: any) {
    this.toggleSpinner(false);
    if (res["status"] === true) {
      this.getData();
      modal.hide();
      this.toastService.success("Data Saved Successfully!!");
      this.resetForm();
    } else {
      this.toastService.error(res["message"]);
    }
  }

  handleError(error: any) {
    this.toggleSpinner(false);
  }

  resetForm() {
    this.editId = null;
    this.formGroup.reset();
  }

  // table

  filterdata() {
    if (this.term) {
      this.locationData = this.locationDataList.filter((el: any) => {
        const searchTerm = this.term.toLowerCase();
        return (
          el.city_name.toLowerCase().includes(searchTerm) ||
          el.status.toLowerCase().includes(searchTerm)
        );
      });
    } else {
      this.locationData = this.locationDataList.slice(0, 5);
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
    if (this.term && this.locationData.length === 0) {
      noResultElement.style.display = "block";
      paginationElement.classList.add("d-none");
    } else {
      noResultElement.style.display = "none";
      paginationElement.classList.remove("d-none");
    }
  }

  pageChanged(event: PageChangedEvent): void {
    this.currentPage = event.page;
    this.updateDisplayedItems();
  }
  updatePagination() {
    // Update total items for pagination
    this.totalItems = this.locationDataList.length;
  }
  updateDisplayedItems(): void {
    const startItem = (this.currentPage - 1) * this.itemsPerPage;
    this.endItem = this.currentPage * this.itemsPerPage;
    this.locationData = this.locationDataList.slice(startItem, this.endItem);
  }

  edit(data: any) {
    this.initializeForm();
    this.editId = data.id;
    this.formGroup.patchValue({
      city_name: data.city_name,
      address: data.address,
      email: data.email,
      mobile: data.mobile,
      iframe_url: data.iframe_url,
      status: data.status,
    });
  }
}
