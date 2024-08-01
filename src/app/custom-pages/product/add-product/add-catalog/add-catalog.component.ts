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
  selector: "app-add-catalog",
  templateUrl: "./add-catalog.component.html",
  styleUrl: "./add-catalog.component.scss",
})
export class AddCatalogComponent implements OnInit {
  @Output() titleChange = new EventEmitter<string>();

  catalog!: FormGroup;
  catalogData: any = [];
  catalogDataList: any = [];
  editId: number | null = null;
  urlId: any | null = null;
  catalogHeadingId: number | null = null;
  catalogHeading: boolean = false;
  addSaveButtonActive: boolean = true;
  spinnerStatus: boolean = false;

  //section one image
  catalogselectedImage: any = null;
  catalogselectedImagePreview: any = null;
  cataloguploadedImage: any = null;

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
    this.getcatalogData();

    this.initializeFormcatalog();
  }

  initializeFormcatalog() {
    this.catalog = this.formBuilder.group({
      pdf: ["", this.catalogimageValidator()],
      status: ["", [Validators.required]],
    });
  }

  catalogimageValidator() {
    return (control: AbstractControl) => {
      if (this.editId == null) {
        return Validators.required(control);
      } else {
        return null;
      }
    };
  }

  get secOne() {
    return this.catalog.controls;
  }

  toggleSpinner(isLoading: boolean) {
    this.spinnerStatus = isLoading;
    this.addSaveButtonActive = !isLoading;
  }

  getcatalogData() {
    this.api.get("product-catalog", this.urlId).subscribe(
      (res: any) => {
        if (res && res.status) {
          this.catalogData = res.data || [];
          this.catalogDataList = res.data || [];
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

  submitcatalog(team: any) {
    if (this.urlId) {
      if (this.catalog.valid) {
        this.toggleSpinner(true);
        const formData = this.createcatalogFormData();
        if (this.editId != null) {
          this.updatecatalog(team, formData, this.editId);
        } else {
          this.addcatalog(team, formData);
        }
      } else {
        this.catalog.markAllAsTouched();
      }
    } else {
      this.toastService.error(
        "Please fill in all General information required fields."
      );
    }
  }

  createcatalogFormData(): FormData {
    const formData = new FormData();
    if (this.catalogselectedImage) {
      formData.append("pdf", this.catalogselectedImage);
    }
    formData.append("product_id", this.urlId);
    formData.append("status", this.secOne["status"].value);
    const currentUserString = localStorage.getItem("currentUser");
    const currentUser = currentUserString ? JSON.parse(currentUserString) : {};
    const username = currentUser.username || "Admin";
    const field = this.editId != null ? "updated_by" : "created_by";
    formData.append(field, username);
    return formData;
  }

  updatecatalog(team: any, formData: FormData, id: number) {
    this.api.put("product-catalog", id, formData).subscribe(
      (res: any) => this.handlecatalogResponse(res, team),
      (error) => this.handleError(error)
    );
  }

  addcatalog(team: any, formData: FormData) {
    this.api.post("product-catalog", formData).subscribe(
      (res: any) => this.handlecatalogResponse(res, team),
      (error) => this.handleError(error)
    );
  }

  catalogsetStatus(serviceId: number, event: Event) {
    const inputElement = event.target as HTMLInputElement;
    const newStatus = inputElement.checked ? "active" : "inactive";

    const formData = new FormData();
    formData.append("status", newStatus);

    this.toggleSpinner(true);

    this.api.put("product-catalog", serviceId, formData).subscribe(
      (res: any) => this.handlecatalogResponse(res, null),
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
          this.api.deleteWithId("product-catalog", id).subscribe(
            (res: any) => this.handlecatalogResponse(res, "delete"),
            (error) => this.handleError(error)
          );
        }
      });
    }
  }

  handlecatalogResponse(res: any, team: any) {
    this.toggleSpinner(false);
    if (res["status"] === true) {
      this.getcatalogData();
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
    this.catalogselectedImage = null;
    this.catalogselectedImagePreview = null;
    this.cataloguploadedImage = null;
    this.editId = null;
    this.catalog.reset();
  }

  handleError(error: any) {
    this.toggleSpinner(false);
  }

  // section one image upload
  catalogimageSelect(event: any) {
    const catalogselectedFile = event.target.files[0];
    if (catalogselectedFile) {
      this.catalogselectedImage = catalogselectedFile;
      this.catalogselectedImagePreview =
        URL.createObjectURL(catalogselectedFile);
    }
  }
  catalogremoveImage() {
    this.catalogselectedImage = null;
    this.catalogselectedImagePreview = null;
  }

  editcatalog(data: any) {
    this.initializeFormcatalog();
    this.editId = data.id;
    this.catalog.patchValue({
      status: data.status,
    });
    this.cataloguploadedImage = data.pdf;
  }

  // table
  filterdata() {
    if (this.term) {
      this.catalogData = this.catalogDataList.filter((el: any) => {
        const searchTerm = this.term.toLowerCase();
        return (
          el.name.toLowerCase().includes(searchTerm) ||
          el.status.toLowerCase().includes(searchTerm)
        );
      });
    } else {
      this.catalogData = this.catalogDataList.slice(0, 5);
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
    if (this.term && this.catalogData.length === 0) {
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
    this.totalItems = this.catalogDataList.length;
  }
  updateDisplayedItems(): void {
    const startItem = (this.currentPage - 1) * this.itemsPerPage;
    this.endItem = this.currentPage * this.itemsPerPage;
    this.catalogData = this.catalogDataList.slice(startItem, this.endItem);
  }

  isPdf(file: any) {
    const extension = file.substr(file.lastIndexOf(".") + 1);
    return /(pdf)$/gi.test(extension);
  }

  sanitizeAndStyleUrl(html: string): SafeHtml {
    // return this.sanitizer.bypassSecurityTrustHtml(html);
    return this.sanitizer.bypassSecurityTrustResourceUrl(html);
  }
}
