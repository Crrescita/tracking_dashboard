import { Component, Input } from "@angular/core";
import { PageChangedEvent } from "ngx-bootstrap/pagination";

@Component({
  selector: "app-approved-leave",

  templateUrl: "./approved-leave.component.html",
  styleUrl: "./approved-leave.component.scss",
})
export class ApprovedLeaveComponent {
  @Input() approveLeaveList: any;
  approveLeave: any = [];
  //table
  term: string = "";
  currentPage = 1;
  currentPagesss = 3;
  totalItems: any = 0;
  itemsPerPage = 10;
  endItem: any;
  ngOnInit(): void {
    this.approveLeave = this.approveLeaveList;
  }

  filterdata() {
    if (this.term) {
      this.approveLeave = this.approveLeaveList.filter((el: any) => {
        const searchTerm = this.term.toLowerCase();
        return (
          el.name.toLowerCase().includes(searchTerm) ||
          el.employee_id.toLowerCase().includes(searchTerm) ||
          el.status.toLowerCase().includes(searchTerm)
        );
      });
    } else {
      this.approveLeave = this.approveLeaveList.slice(0, 5);
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
    if (this.term && this.approveLeave.length === 0) {
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
    this.totalItems = this.approveLeaveList.length;
  }
  updateDisplayedItems(): void {
    const startItem = (this.currentPage - 1) * this.itemsPerPage;
    this.endItem = this.currentPage * this.itemsPerPage;
    this.approveLeave = this.approveLeaveList.slice(startItem, this.endItem);
  }
}
