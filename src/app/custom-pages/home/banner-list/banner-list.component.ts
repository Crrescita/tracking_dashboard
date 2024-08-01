import { Component, OnInit } from "@angular/core";
import { FormBuilder } from "@angular/forms";
import { ApiService } from "../../../core/services/api.service";
import { PageChangedEvent } from "ngx-bootstrap/pagination";
import { ToastrService } from "ngx-toastr";
import Swal from "sweetalert2";

@Component({
  selector: "app-banner-list",
  templateUrl: "./banner-list.component.html",
  styleUrl: "./banner-list.component.scss",
})
export class BannerListComponent implements OnInit {
  breadCrumbItems!: Array<{}>;
  spinnerStatus: boolean = false;

  bannerData: any = [];
  bannerDataList: any = [];

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
    this.getHomebanner();
  }

  getHomebanner() {
    this.toggleSpinner(true);
    this.api.getwithoutid("homebanner").subscribe(
      (res: any) => {
        if (res && res.status) {
          this.toggleSpinner(false);
          this.bannerData = res.data || [];
          this.bannerDataList = res.data || [];
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

  setStatus(serviceId: number, event: Event) {
    const inputElement = event.target as HTMLInputElement;
    const newStatus = inputElement.checked ? "active" : "inactive";

    const formData = new FormData();
    formData.append("status", newStatus);

    this.toggleSpinner(true);

    this.api.put("homebanner", serviceId, formData).subscribe(
      (res: any) => this.handleStatusChangeResponse(res),
      (error) => this.handleError(error)
    );
  }

  toggleSpinner(isLoading: boolean) {
    this.spinnerStatus = isLoading;
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
          this.api.deleteWithId("delete-banner", id).subscribe(
            (res: any) => this.handleStatusChangeResponse(res),
            (error) => this.handleError(error)
          );
        }
      });
    }
  }

  handleStatusChangeResponse(res: any) {
    this.toggleSpinner(false);
    if (res["status"] === true) {
      this.toastService.success("Data Saved Successfully!!");
      this.getHomebanner();
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
      this.bannerData = this.bannerDataList.filter((el: any) => {
        const searchTerm = this.term.toLowerCase();
        return (
          el.title.toLowerCase().includes(searchTerm) ||
          el.status.toLowerCase().includes(searchTerm)
        );
      });
    } else {
      this.bannerData = this.bannerDataList.slice(0, 5);
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
    if (this.term && this.bannerData.length === 0) {
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
    this.totalItems = this.bannerDataList.length;
  }
  updateDisplayedItems(): void {
    const startItem = (this.currentPage - 1) * this.itemsPerPage;
    this.endItem = this.currentPage * this.itemsPerPage;
    this.bannerData = this.bannerDataList.slice(startItem, this.endItem);
  }
}
