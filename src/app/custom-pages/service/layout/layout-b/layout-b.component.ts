import {
  FormGroup,
  FormBuilder,
  Validators,
  AbstractControl,
} from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { Component, OnInit } from "@angular/core";
import { ToastrService } from "ngx-toastr";
import { PageChangedEvent } from "ngx-bootstrap/pagination";
import Swal from "sweetalert2";
import { ApiService } from "../../../../core/services/api.service";

@Component({
  selector: "app-layout-b",

  templateUrl: "./layout-b.component.html",
  styleUrl: "./layout-b.component.scss",
})
export class LayoutBComponent implements OnInit {
  breadCrumbItems!: Array<{}>;
  urlId: number | null = null;
  serviceData: any;
  addSaveButtonActive: boolean = true;
  spinnerStatus: boolean = false;
  formGroup!: FormGroup;
  dataExists: boolean = false;

  // image
  selectedImage: any = null;
  selectedImagePreview: any = null;
  uploadedImage: any = null;

  sectionOneData: any = [];
  sectionOneDataList: any = [];

  //table
  term: string = "";
  currentPage = 1;
  totalItems = 0;
  itemsPerPage = 5;
  endItem: any;

  constructor(
    private route: ActivatedRoute,
    private api: ApiService,
    public toastService: ToastrService,
    private formBuilder: FormBuilder,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.breadCrumbItems = [
      { label: "Service", active: true },
      { label: "Service Detail", active: true },
    ];

    this.route.params.subscribe((params) => {
      this.urlId = params["id"];
    });

    this.initializeForm();
    this.getData();
    this.getSectionOneData();
  }

  initializeForm() {
    this.formGroup = this.formBuilder.group({
      detail_title: ["", [Validators.required]],
      sub_title: ["", [Validators.required]],
      long_description: ["", [Validators.required, Validators.maxLength(500)]],
      banner: ["", this.imageValidator()],
    });
  }

  imageValidator() {
    return (control: AbstractControl) => {
      if (!this.dataExists) {
        return Validators.required(control);
      } else {
        return null;
      }
    };
  }

  get s2() {
    return this.formGroup.controls;
  }

  toggleSpinner(isLoading: boolean) {
    this.spinnerStatus = isLoading;
    this.addSaveButtonActive = !isLoading;
  }

  getData() {
    this.toggleSpinner(true);
    this.api.get("service", this.urlId).subscribe(
      (res: any) => {
        this.toggleSpinner(false);
        if (res && res.status && res.data && res.data.length > 0) {
          this.serviceData = res.data[0];

          if (
            res.data[0].detail_title &&
            res.data[0].sub_title &&
            res.data[0].long_description
          ) {
            this.dataExists = true;
            this.initializeForm();
            this.formGroup.patchValue({
              detail_title: res.data[0].detail_title,
              sub_title: res.data[0].sub_title,
              long_description: res.data[0].long_description,
            });
            this.uploadedImage = res.data[0].banner;
          }
        } else {
          this.toastService.error("No data found");
        }
      },
      (error) => this.handleError(error)
    );
  }

  getSectionOneData() {
    this.api.getwithoutid("get-layoutb-data").subscribe(
      (res: any) => {
        if (res && res.status) {
          this.sectionOneData = res.data || [];
          this.sectionOneDataList = res.data || [];
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

  onSubmit() {
    if (this.formGroup.valid) {
      this.toggleSpinner(true);
      const formData = this.createFormData();
      this.updateService(formData, this.urlId);
    } else {
      this.formGroup.markAllAsTouched();
    }
  }

  addService(formData: FormData) {
    this.api.post("service", formData).subscribe(
      (res: any) => this.handleResponse(res),
      (error) => this.handleError(error)
    );
  }

  updateService(formData: FormData, id: any) {
    this.api.put("service", id, formData).subscribe(
      (res: any) => this.handleResponse(res),
      (error) => this.handleError(error)
    );
  }

  createFormData(): FormData {
    const formData = new FormData();
    if (this.selectedImage) {
      formData.append("banner", this.selectedImage);
    }
    formData.append("detail_title", this.s2["detail_title"].value);
    formData.append("long_description", this.s2["long_description"].value);
    formData.append("sub_title", this.s2["sub_title"].value);
    return formData;
  }

  delete(id: any) {
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
          this.api.deleteWithId("layoutb-delete", id).subscribe(
            (res: any) => this.handleResponse(res),
            (error) => this.handleError(error)
          );
        }
      });
    }
  }

  sectionOnesetStatus(serviceId: number, event: Event) {
    const inputElement = event.target as HTMLInputElement;
    const newStatus = inputElement.checked ? "active" : "inactive";

    const formData = new FormData();
    formData.append("status", newStatus);

    this.toggleSpinner(true);

    this.api.put("edit-layoutb-data", serviceId, formData).subscribe(
      (res: any) => this.handleResponse(res),
      (error) => this.handleError(error)
    );
  }

  handleResponse(res: any) {
    this.toggleSpinner(false);
    if (res["status"] === true) {
      this.getData();
      this.getSectionOneData();
      this.removeImage();
      this.toastService.success("Data Saved Successfully!!");
    } else {
      this.toastService.error("Oops! Something went wrong");
    }
  }

  handleError(error: any) {
    this.toggleSpinner(false);
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

  // table
  filterdata() {
    if (this.term) {
      this.sectionOneData = this.sectionOneDataList.filter((el: any) => {
        const searchTerm = this.term.toLowerCase();
        return (
          el.title.toLowerCase().includes(searchTerm) ||
          el.status.toLowerCase().includes(searchTerm)
        );
      });
    } else {
      this.sectionOneData = this.sectionOneDataList.slice(0, 5);
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
    if (this.term && this.sectionOneData.length === 0) {
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
    this.totalItems = this.sectionOneDataList.length;
  }
  updateDisplayedItems(): void {
    const startItem = (this.currentPage - 1) * this.itemsPerPage;
    this.endItem = this.currentPage * this.itemsPerPage;
    this.sectionOneData = this.sectionOneDataList.slice(
      startItem,
      this.endItem
    );
  }
}
