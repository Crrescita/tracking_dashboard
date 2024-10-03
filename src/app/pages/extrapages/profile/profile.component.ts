import { Component } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { ApiService } from "../../../core/services/api.service";
import { PageChangedEvent } from "ngx-bootstrap/pagination";

@Component({
  selector: "app-profile",
  templateUrl: "./profile.component.html",
  styleUrls: ["./profile.component.scss"],
})

// profile component
export class ProfileComponent {
  // bread crumb items
  breadCrumbItems!: Array<{}>;
  submitted: boolean = false;
  spinnerStatus: boolean = false;
  saveButtonActive: boolean = true;

  companyData: any;
  urlId: any;
  company_id: any;

  currentPage: number = 1;
  currentItemsPerPage = 10;
  itemsPerPageOptions = [10, 20, 30, 50];

  totalItems = 0;
  itemsPerPage = 9;
  endItem: any;

  employeeData: any = [];
  employeeDataList: any = [];
  constructor(private route: ActivatedRoute, private api: ApiService) {}

  ngOnInit(): void {
    /**
     * BreadCrumb
     */
    this.breadCrumbItems = [
      { label: "Pages", active: true },
      { label: "Profile", active: true },
    ];

    this.route.params.subscribe((params) => {
      this.urlId = params["id"] ? Number(params["id"]) : null;
    });

    if (this.urlId) {
      this.getCompanyData();
    }

    const data = localStorage.getItem("currentUser");

    if (data) {
      const user = JSON.parse(data);
      this.company_id = user.id;
    }
    if (this.company_id) {
      this.getemployeeData();
    }
  }

  getCompanyData() {
    this.toggleSpinner(true);
    this.api.get("company", this.urlId).subscribe(
      (res: any) => {
        if (res && res.status) {
          this.toggleSpinner(false);
          this.companyData = res.data[0];
          console.log(this.companyData);
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

  getemployeeData() {
    this.toggleSpinner(true);
    const url = `employees?company_id=${this.company_id}`;
    this.api.getwithoutid(url).subscribe(
      (res: any) => {
        this.toggleSpinner(false);
        if (res && res.status) {
          this.employeeData = res.data || [];
          this.employeeDataList = res.data || [];
          this.updatePagination();
          this.updateDisplayedItems();
        } else {
          this.employeeData = [];
          this.employeeDataList = [];
          this.toggleSpinner(false);
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

  toggleSpinner(isLoading: boolean) {
    this.spinnerStatus = isLoading;
    this.saveButtonActive = !isLoading;
    this.submitted = isLoading;
  }

  handleError(error: any) {
    this.toggleSpinner(false);
  }

  // follow button toggle
  Followbtn(ev: any) {
    ev.target.closest("button").classList.toggle("active");
  }

  pageChanged(event: PageChangedEvent): void {
    this.currentPage = event.page;
    this.updateDisplayedItems();
  }
  updatePagination() {
    // Update total items for pagination
    this.totalItems = this.employeeDataList.length;
  }
  updateDisplayedItems(): void {
    const startItem = (this.currentPage - 1) * this.itemsPerPage;
    this.endItem = this.currentPage * this.itemsPerPage;
    this.employeeData = this.employeeDataList.slice(startItem, this.endItem);
  }
}
