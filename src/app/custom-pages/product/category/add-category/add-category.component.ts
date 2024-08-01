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

import { ActivatedRoute, Router } from "@angular/router";
import { ApiService } from "../../../../core/services/api.service";

@Component({
  selector: "app-add-category",
  templateUrl: "./add-category.component.html",
  styleUrl: "./add-category.component.scss",
})
export class AddCategoryComponent implements OnInit {
  @Output() titleChange = new EventEmitter<string>();
  breadCrumbItems!: Array<{}>;
  sectionHeading!: FormGroup;
  category!: FormGroup;
  categoryData: any = [];
  categoryDataList: any = [];
  editId: number | null = null;
  addSaveButtonActive: boolean = true;
  spinnerStatus: boolean = false;

  //section one image
  categoryselectedImage: any = null;
  categoryselectedImagePreview: any = null;
  categoryuploadedImage: any = null;

  //table
  term: string = "";
  currentPage = 1;
  totalItems = 0;
  itemsPerPage = 5;
  endItem: any;

  constructor(
    private formBuilder: FormBuilder,
    private api: ApiService,
    public toastService: ToastrService
  ) {}

  ngOnInit(): void {
    this.breadCrumbItems = [
      { label: "Product", active: true },
      { label: "Category ", active: true },
    ];
    this.getcategoryData();
    this.initializeFormcategory();
  }

  initializeFormcategory() {
    this.category = this.formBuilder.group({
      title: ["", [Validators.required, Validators.maxLength(30)]],
      description: ["", [Validators.required]],
      image: [""],
      status: ["", [Validators.required]],
      position: ["", [Validators.required]],
    });
    // this.categoryimageValidator()
  }

  categoryimageValidator() {
    return (control: AbstractControl) => {
      if (this.editId == null) {
        return Validators.required(control);
      } else {
        return null;
      }
    };
  }

  get categorySec() {
    return this.category.controls;
  }

  toggleSpinner(isLoading: boolean) {
    this.spinnerStatus = isLoading;
    this.addSaveButtonActive = !isLoading;
  }

  getcategoryData() {
    this.api.getwithoutid("product-category").subscribe(
      (res: any) => {
        if (res && res.status) {
          this.categoryData = res.data || [];
          this.categoryDataList = res.data || [];
          this.updatePagination();
          this.updateDisplayedItems();
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

  submitcategory(team: any) {
    if (this.category.valid) {
      this.toggleSpinner(true);
      const formData = this.createcategoryFormData();
      if (this.editId != null) {
        this.updatecategory(team, formData, this.editId);
      } else {
        this.addcategory(team, formData);
      }
    } else {
      this.category.markAllAsTouched();
    }
  }

  createcategoryFormData(): FormData {
    const formData = new FormData();
    if (this.categoryselectedImage) {
      formData.append("image", this.categoryselectedImage);
    }
    formData.append("title", this.categorySec["title"].value);
    formData.append("description", this.categorySec["description"].value);
    formData.append("status", this.categorySec["status"].value);
    formData.append("position", this.categorySec["position"].value);

    const currentUserString = localStorage.getItem("currentUser");
    const currentUser = currentUserString ? JSON.parse(currentUserString) : {};
    const username = currentUser.username || "Admin";
    const field = this.editId != null ? "updated_by" : "created_by";
    formData.append(field, username);

    return formData;
  }

  updatecategory(team: any, formData: FormData, id: number) {
    this.api.put("product-category", id, formData).subscribe(
      (res: any) => this.handlecategoryResponse(res, team),
      (error) => this.handleError(error)
    );
  }

  addcategory(team: any, formData: FormData) {
    this.api.post("product-category", formData).subscribe(
      (res: any) => this.handlecategoryResponse(res, team),
      (error) => this.handleError(error)
    );
  }

  categorysetStatus(serviceId: number, event: Event) {
    const inputElement = event.target as HTMLInputElement;
    const newStatus = inputElement.checked ? "active" : "inactive";

    const formData = new FormData();
    formData.append("status", newStatus);

    this.toggleSpinner(true);

    this.api.put("product-category", serviceId, formData).subscribe(
      (res: any) => this.handlecategoryResponse(res, null),
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
          this.api.deleteWithId("product-category", id).subscribe(
            (res: any) => this.handlecategoryResponse(res, "delete"),
            (error) => this.handleError(error)
          );
        }
      });
    }
  }

  handlecategoryResponse(res: any, team: any) {
    this.toggleSpinner(false);
    if (res["status"] === true) {
      this.getcategoryData();
      if (team == "delete") {
        this.toastService.success("Data deleted Successfully!!");
      } else {
        this.toastService.success("Data Saved Successfully!!");
        this.resetForm();
        team.hide();
      }
    } else {
      this.toastService.error(res["message"]);
    }
  }

  resetForm() {
    this.categoryselectedImage = null;
    this.categoryselectedImagePreview = null;
    this.categoryuploadedImage = null;
    this.editId = null;
    this.category.reset();
  }

  handleError(error: any) {
    this.toggleSpinner(false);
  }

  // section one image upload
  categoryimageSelect(event: any) {
    const categoryselectedFile = event.target.files[0];
    if (categoryselectedFile) {
      this.categoryselectedImage = categoryselectedFile;
      this.categoryselectedImagePreview =
        URL.createObjectURL(categoryselectedFile);
    }
  }
  categoryremoveImage() {
    this.categoryselectedImage = null;
    this.categoryselectedImagePreview = null;
  }

  editcategory(data: any) {
    this.initializeFormcategory();
    this.editId = data.id;
    this.category.patchValue({
      title: data.title,
      description: data.description,
      position: data.position,
      status: data.status,
    });
    this.categoryuploadedImage = data.image;
  }

  // table
  filterdata() {
    if (this.term) {
      this.categoryData = this.categoryDataList.filter((el: any) => {
        const searchTerm = this.term.toLowerCase();
        return (
          el.title.toLowerCase().includes(searchTerm) ||
          el.status.toLowerCase().includes(searchTerm)
        );
      });
    } else {
      this.categoryData = this.categoryDataList.slice(0, 5);
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
    if (this.term && this.categoryData.length === 0) {
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
    this.totalItems = this.categoryDataList.length;
  }
  updateDisplayedItems(): void {
    const startItem = (this.currentPage - 1) * this.itemsPerPage;
    this.endItem = this.currentPage * this.itemsPerPage;
    this.categoryData = this.categoryDataList.slice(startItem, this.endItem);
  }
}
