import { Component, OnInit, Output, EventEmitter } from "@angular/core";
import {
  FormGroup,
  Validators,
  FormBuilder,
  AbstractControl,
} from "@angular/forms";

import { ToastrService } from "ngx-toastr";
import { PageChangedEvent } from "ngx-bootstrap/pagination";
import Swal from "sweetalert2";
import { ApiService } from "../../core/services/api.service";

@Component({
  selector: "app-our-process",
  templateUrl: "./our-process.component.html",
  styleUrl: "./our-process.component.scss",
})
export class OurProcessComponent implements OnInit {
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

  // image
  selectedImage: any = null;
  selectedImagePreview: any = null;
  uploadedImage: any = null;

  serviceData: any = [];
  serviceDataList: any = [];

  constructor(
    private formBuilder: FormBuilder,
    public toastService: ToastrService,
    private api: ApiService
  ) {}

  ngOnInit(): void {
    this.breadCrumbItems = [
      { label: "Pages", active: true },
      { label: "Our Process", active: true },
    ];
    this.initializeForm();
    this.getData();
  }

  initializeForm() {
    this.formGroup = this.formBuilder.group({
      title: ["", [Validators.required, Validators.maxLength(45)]],
      description: ["", [Validators.required, Validators.maxLength(250)]],
      image: ["", this.imageValidator()],
      status: ["", [Validators.required]],
    });
  }

  imageValidator() {
    return (control: AbstractControl) => {
      if (this.editId == null) {
        return Validators.required(control);
      } else {
        return null;
      }
    };
  }

  get s2() {
    return this.formGroup.controls;
  }

  // image upload code
  imageSelect(event: any) {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      this.selectedImage = selectedFile;
      this.selectedImagePreview = URL.createObjectURL(selectedFile);
    }
  }
  removeImage() {
    this.selectedImage = null;
    this.selectedImagePreview = null;
  }

  // api's
  getData() {
    this.api.getwithoutid("process").subscribe(
      (res: any) => {
        if (res && res.status) {
          this.serviceData = res.data || [];
          this.serviceDataList = res.data || [];
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
    this.serviceData = [];
    this.serviceDataList = [];
  }

  onSubmit(modal: any) {
    if (this.formGroup.valid) {
      this.toggleSpinner(true);

      const formData = this.createFormData();

      if (this.editId != null) {
        this.updateService(modal, formData, this.editId);
      } else {
        this.addService(modal, formData);
      }
    } else {
      this.formGroup.markAllAsTouched();
    }
  }

  toggleSpinner(isLoading: boolean) {
    this.spinnerStatus = isLoading;
    this.addSaveButtonActive = !isLoading;
  }

  createFormData(): FormData {
    const formData = new FormData();
    if (this.selectedImage) {
      formData.append("image", this.selectedImage);
    }
    formData.append("title", this.s2["title"].value);
    formData.append("description", this.s2["description"].value);
    formData.append("status", this.s2["status"].value);
    return formData;
  }

  updateService(modal: any, formData: FormData, id: number) {
    this.api.put("process", id, formData).subscribe(
      (res: any) => this.handleResponse(res, modal),
      (error) => this.handleError(error)
    );
  }

  addService(modal: any, formData: FormData) {
    this.api.post("process", formData).subscribe(
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
          this.api.deleteWithId("process", id).subscribe(
            (res: any) => this.handleStatusChangeResponse(res),
            (error) => this.handleError(error)
          );
        }
      });
    }
  }

  setStatus(serviceId: number, event: Event) {
    const inputElement = event.target as HTMLInputElement;
    const newStatus = inputElement.checked ? "active" : "inactive";

    const formData = new FormData();
    formData.append("status", newStatus);

    this.toggleSpinner(true);

    this.api.put("process", serviceId, formData).subscribe(
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
    this.selectedImage = null;
    this.selectedImagePreview = null;
    this.uploadedImage = null;
    this.editId = null;
    this.formGroup.reset();
  }

  // table

  filterdata() {
    if (this.term) {
      this.serviceData = this.serviceDataList.filter((el: any) => {
        const searchTerm = this.term.toLowerCase();
        return (
          el.title.toLowerCase().includes(searchTerm) ||
          el.status.toLowerCase().includes(searchTerm)
        );
      });
    } else {
      this.serviceData = this.serviceDataList.slice(0, 5);
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
    if (this.term && this.serviceData.length === 0) {
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
    this.totalItems = this.serviceDataList.length;
  }
  updateDisplayedItems(): void {
    const startItem = (this.currentPage - 1) * this.itemsPerPage;
    this.endItem = this.currentPage * this.itemsPerPage;
    this.serviceData = this.serviceDataList.slice(startItem, this.endItem);
  }

  edit(data: any) {
    this.initializeForm();
    this.editId = data.id;
    this.formGroup.patchValue({
      title: data.title,
      description: data.description,
      status: data.status,
    });
    this.uploadedImage = data.image;
  }
}
