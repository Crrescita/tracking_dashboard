import { Component, OnInit } from "@angular/core";
import { ApiService } from "../../../../core/services/api.service";
import { PageChangedEvent } from "ngx-bootstrap/pagination";

@Component({
  selector: "app-leave-record",
  templateUrl: "./leave-record.component.html",
  styleUrl: "./leave-record.component.scss",
})
export class LeaveRecordComponent implements OnInit {
  breadCrumbItems!: Array<{}>;

  leaveRecordData: any = [];
  leaveRecordDataList: any = [];

  company_id: any;
  endItem: any;

  submitted: boolean = false;
  spinnerStatus: boolean = false;
  saveButtonActive: boolean = true;

  currentItemsPerPage = 10; // Default items per page
  itemsPerPageOptions = [10, 20, 30, 50];
  term: any;

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.breadCrumbItems = [
      { label: "Leave Management" },
      { label: "Leave Record", active: true },
    ];

    const data = localStorage.getItem("currentUser");

    if (data) {
      const user = JSON.parse(data);
      this.company_id = user.id;
    }

    if (this.company_id) {
      this.getLeaveRecord();
    }
  }

  toggleSpinner(isLoading: boolean) {
    this.spinnerStatus = isLoading;
    this.saveButtonActive = !isLoading;
    this.submitted = isLoading;
  }

  getLeaveRecord() {
    this.toggleSpinner(true);
    const url = `leaveRecord?company_id=${this.company_id}`;
    this.api.getwithoutid(url).subscribe(
      (res: any) => {
        if (res && res.status) {
          this.toggleSpinner(false);
          this.leaveRecordData = res.data || [];
          this.leaveRecordDataList = res.data || [];
          this.pageChanged({ page: 1, itemsPerPage: this.currentItemsPerPage });
        } else {
          this.leaveRecordData = [];
          this.leaveRecordDataList = [];
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

  handleError(error: any) {
    this.toggleSpinner(false);
  }

  // Sort Data
  direction: any = "asc";
  onSort(column: any) {
    if (this.direction == "asc") {
      this.direction = "desc";
    } else {
      this.direction = "asc";
    }
    const sortedArray = [...this.leaveRecordData]; // Create a new array
    sortedArray.sort((a, b) => {
      const res = this.compare(a[column], b[column]);
      return this.direction === "asc" ? res : -res;
    });
    this.leaveRecordData = sortedArray;
  }
  compare(v1: string | number, v2: string | number) {
    return v1 < v2 ? -1 : v1 > v2 ? 1 : 0;
  }

  pageChanged(event: PageChangedEvent): void {
    const startItem = (event.page - 1) * event.itemsPerPage;
    this.endItem = event.page * event.itemsPerPage;
    this.leaveRecordData = this.leaveRecordDataList.slice(
      startItem,
      this.endItem
    );
  }

  // filterdata
  filterdata() {
    if (this.term) {
      this.leaveRecordData = this.leaveRecordDataList.filter((el: any) =>
        el.name.toLowerCase().includes(this.term.toLowerCase())
      );
    } else {
      this.leaveRecordData = this.leaveRecordDataList;
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
    if (this.term && this.leaveRecordData.length === 0) {
      noResultElement.style.display = "block";
      paginationElement.classList.add("d-none");
    } else {
      noResultElement.style.display = "none";
      paginationElement.classList.remove("d-none");
    }
  }

  onItemsPerPageChange(event: any): void {
    this.currentItemsPerPage = +event.target.value; // Convert to number
    this.pageChanged({ page: 1, itemsPerPage: this.currentItemsPerPage });
  }
}
