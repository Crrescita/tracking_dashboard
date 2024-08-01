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
import { ApiService } from "../../../../core/services/api.service";
import { ActivatedRoute } from "@angular/router";
import { DomSanitizer, SafeHtml, SafeStyle } from "@angular/platform-browser";

@Component({
  selector: "app-add-product-image",
  templateUrl: "./add-product-image.component.html",
  styleUrl: "./add-product-image.component.scss",
})
export class AddProductImageComponent implements OnInit {
  @Output() titleChange = new EventEmitter<string>();

  product!: FormGroup;
  productImageData: any = [];
  productImageDataList: any = [];
  editId: number | null = null;
  urlId: any | null = null;
  productHeadingId: number | null = null;
  productHeading: boolean = false;
  addSaveButtonActive: boolean = true;
  spinnerStatus: boolean = false;

  //section one image
  productselectedImage: any = null;
  productselectedImagePreview: any = null;
  productuploadedImage: any = null;

  //table
  term: string = "";
  currentPage = 1;
  totalItems = 0;
  itemsPerPage = 5;
  endItem: any;

  constructor(
    private formBuilder: FormBuilder,
    private api: ApiService,
    public toastService: ToastrService,
    private route: ActivatedRoute,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.urlId = params["id"];
    });
    this.getproductImageData();

    this.initializeFormproduct();
  }

  initializeFormproduct() {
    this.product = this.formBuilder.group({
      type: ["", [Validators.required]],
      image: ["", this.productimageValidator()],
      status: ["", [Validators.required]],
    });
  }

  productimageValidator() {
    return (control: AbstractControl) => {
      if (this.editId == null) {
        return Validators.required(control);
      } else {
        return null;
      }
    };
  }

  get secOne() {
    return this.product.controls;
  }

  toggleSpinner(isLoading: boolean) {
    this.spinnerStatus = isLoading;
    this.addSaveButtonActive = !isLoading;
  }

  getproductImageData() {
    this.api.get("product-image", this.urlId).subscribe(
      (res: any) => {
        if (res && res.status) {
          this.productImageData = res.data || [];
          this.productImageDataList = res.data || [];
          this.updatePagination();
          this.updateDisplayedItems();
        } else {
          this.toastService.error("Oops! Something went wrongsssssssss");
          // this.handleError("Unexpected response format");
        }
      },
      (error) => {
        this.handleError(
          error.message || "An error occurred while fetching data"
        );
      }
    );
  }

  submitproduct(team: any) {
    if (this.urlId) {
      if (this.product.valid) {
        this.toggleSpinner(true);
        const formData = this.createproductFormData();
        if (this.editId != null) {
          this.updateproduct(team, formData, this.editId);
        } else {
          this.addproduct(team, formData);
        }
      } else {
        this.product.markAllAsTouched();
      }
    } else {
      this.toastService.error(
        "Please fill in all General information required fields."
      );
    }
  }

  createproductFormData(): FormData {
    const formData = new FormData();
    if (this.productselectedImage) {
      formData.append("image", this.productselectedImage);
    }
    formData.append("type", this.secOne["type"].value);
    formData.append("product_id", this.urlId);
    formData.append("status", this.secOne["status"].value);
    const currentUserString = localStorage.getItem("currentUser");
    const currentUser = currentUserString ? JSON.parse(currentUserString) : {};
    const username = currentUser.username || "Admin";
    const field = this.editId != null ? "updated_by" : "created_by";
    formData.append(field, username);
    return formData;
  }

  updateproduct(team: any, formData: FormData, id: number) {
    this.api.put("product-image", id, formData).subscribe(
      (res: any) => this.handleproductResponse(res, team),
      (error) => this.handleError(error)
    );
  }

  addproduct(team: any, formData: FormData) {
    this.api.post("product-image", formData).subscribe(
      (res: any) => this.handleproductResponse(res, team),
      (error) => this.handleError(error)
    );
  }

  productImagesetStatus(serviceId: number, event: Event) {
    const inputElement = event.target as HTMLInputElement;
    const newStatus = inputElement.checked ? "active" : "inactive";

    const formData = new FormData();
    formData.append("status", newStatus);

    this.toggleSpinner(true);

    this.api.put("product-image", serviceId, formData).subscribe(
      (res: any) => this.handleproductResponse(res, null),
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
          this.api.deleteWithId("product-image", id).subscribe(
            (res: any) => this.handleproductResponse(res, "delete"),
            (error) => this.handleError(error)
          );
        }
      });
    }
  }

  handleproductResponse(res: any, team: any) {
    this.toggleSpinner(false);
    if (res["status"] === true) {
      this.getproductImageData();
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
    this.productselectedImage = null;
    this.productselectedImagePreview = null;
    this.productuploadedImage = null;
    this.editId = null;
    this.product.reset();
  }

  handleError(error: any) {
    this.toggleSpinner(false);
  }

  // section one image upload
  productimageSelect(event: any) {
    const productselectedFile = event.target.files[0];
    if (productselectedFile) {
      this.productselectedImage = productselectedFile;
      this.productselectedImagePreview =
        URL.createObjectURL(productselectedFile);
    }
  }
  productremoveImage() {
    this.productselectedImage = null;
    this.productselectedImagePreview = null;
  }

  editproductImage(data: any) {
    this.initializeFormproduct();
    this.editId = data.id;
    this.product.patchValue({
      status: data.status,
      type: data.type,
    });
    this.productuploadedImage = data.image;
  }

  // table
  filterdata() {
    if (this.term) {
      console.log(this.term);
      this.productImageData = this.productImageDataList.filter((el: any) => {
        const searchTerm = this.term.toLowerCase();
        return (
          el.type.toLowerCase().includes(searchTerm) ||
          el.status.toLowerCase().includes(searchTerm)
        );
      });
    } else {
      this.productImageData = this.productImageDataList.slice(0, 5);
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
    if (this.term && this.productImageData.length === 0) {
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
    this.totalItems = this.productImageDataList.length;
  }
  updateDisplayedItems(): void {
    const startItem = (this.currentPage - 1) * this.itemsPerPage;
    this.endItem = this.currentPage * this.itemsPerPage;
    this.productImageData = this.productImageDataList.slice(
      startItem,
      this.endItem
    );
  }
}
