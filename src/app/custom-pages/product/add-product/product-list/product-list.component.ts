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
  selector: "app-product-list",
  templateUrl: "./product-list.component.html",
  styleUrl: "./product-list.component.scss",
})
export class ProductListComponent implements OnInit {
  @Output() titleChange = new EventEmitter<string>();
  breadCrumbItems!: Array<{}>;
  sectionHeading!: FormGroup;
  product!: FormGroup;
  productData: any = [];
  productDataList: any = [];
  editId: number | null = null;
  addSaveButtonActive: boolean = true;
  spinnerStatus: boolean = false;

  //table
  term: string = "";
  currentPage = 1;
  totalItems = 0;
  itemsPerPage = 5;
  endItem: any;

  // category
  categoryData: any = [];

  constructor(
    private formBuilder: FormBuilder,
    private api: ApiService,
    public toastService: ToastrService
  ) {}

  ngOnInit(): void {
    this.breadCrumbItems = [
      { label: "Product", active: true },
      { label: "Product List ", active: true },
    ];
    this.getproductData();
    this.getCategoryData();
  }

  toggleSpinner(isLoading: boolean) {
    this.spinnerStatus = isLoading;
    this.addSaveButtonActive = !isLoading;
  }

  getCategoryData() {
    this.api.getwithoutid("product-category?columns=id,title").subscribe(
      (res: any) => {
        if (res && res.status) {
          this.categoryData = res.data || [];
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

  getproductData() {
    this.api.getwithoutid("product").subscribe(
      (res: any) => {
        if (res && res.status) {
          this.productData = res.data || [];
          this.productDataList = res.data || [];
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

  productsetStatus(serviceId: number, event: Event) {
    const inputElement = event.target as HTMLInputElement;
    const newStatus = inputElement.checked ? "active" : "inactive";

    const formData = new FormData();
    formData.append("status", newStatus);

    this.toggleSpinner(true);

    this.api.put("product", serviceId, formData).subscribe(
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
          this.api.deleteWithId("product", id).subscribe(
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
      this.getproductData();
      if (team == "delete") {
        this.toastService.success("Data deleted Successfully!!");
      } else {
        this.toastService.success("Data Saved Successfully!!");
      }
    } else {
      this.toastService.error(res["message"]);
    }
  }

  handleError(error: any) {
    this.toggleSpinner(false);
  }

  // table
  filterdata() {
    if (this.term) {
      this.productData = this.productDataList.filter((el: any) => {
        const searchTerm = this.term.toLowerCase();
        return (
          el.title.toLowerCase().includes(searchTerm) ||
          el.status.toLowerCase().includes(searchTerm)
        );
      });
    } else {
      this.productData = this.productDataList.slice(0, 5);
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
    if (this.term && this.productData.length === 0) {
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
    this.totalItems = this.productDataList.length;
  }
  updateDisplayedItems(): void {
    const startItem = (this.currentPage - 1) * this.itemsPerPage;
    this.endItem = this.currentPage * this.itemsPerPage;
    this.productData = this.productDataList.slice(startItem, this.endItem);
  }
}
