import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { ApiService } from "../../../../core/services/api.service";
import { ToastrService } from "ngx-toastr";
import { Location } from "@angular/common";

@Component({
  selector: "app-leave-request-deatil",
  templateUrl: "./leave-request-deatil.component.html",
  styleUrl: "./leave-request-deatil.component.scss",
})
export class LeaveRequestDeatilComponent implements OnInit {
  breadCrumbItems!: Array<{}>;
  submitted: boolean = false;
  spinnerStatus: boolean = false;
  saveButtonActive: boolean = true;
  id: any;
  company_id: any;
  emp_id: any;
  leaveTypesData: any = [];
  employeeDetail: any;
  leaveDetailData: any;
  reason: string = "";
  constructor(
    private route: ActivatedRoute,
    private api: ApiService,
    private router: Router,
    public toastService: ToastrService,
    private location: Location
  ) {}

  ngOnInit(): void {
    this.breadCrumbItems = [
      { label: "Leave Management", active: true },
      { label: "Leave Detail", active: true },
    ];

    this.id = this.route.snapshot.paramMap.get("id");
    this.emp_id = this.route.snapshot.paramMap.get("emp_id");
    const data = localStorage.getItem("currentUser");

    if (data) {
      const user = JSON.parse(data);
      this.company_id = user.id;
    }

    if (this.company_id) {
      this.leaveDetail();
      this.getemployeeData();
    }
  }

  toggleSpinner(isLoading: boolean) {
    this.spinnerStatus = isLoading;
    this.saveButtonActive = !isLoading;
    this.submitted = isLoading;
  }

  leaveDetail() {
    this.toggleSpinner(true);
    const url = `leaveDetail/${this.id}?company_id=${this.company_id}&emp_id=${this.emp_id}`;
    this.api.getwithoutid(url).subscribe(
      (res: any) => {
        if (res && res.status) {
          this.toggleSpinner(false);
          this.leaveTypesData = res.data;
          this.leaveDetailData = res.leave_details;
        } else {
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

  getemployeeData() {
    this.toggleSpinner(true);
    this.api.get("employees", this.emp_id).subscribe(
      (res: any) => {
        if (res && res.status) {
          this.toggleSpinner(false);
          this.employeeDetail = res.data[0];
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

  handleError(error: any) {
    this.toggleSpinner(false);
  }

  getTotal(key: string): number {
    return this.leaveTypesData.reduce(
      (total: number, data: any) => total + Number(data[key]),
      0
    );
  }

  updateLeaveStatus(data: any) {
    const formData = {
      status: data,
      admin_reason: this.reason,
    };

    this.toggleSpinner(true);

    this.api.put("updateleaveRequestStatus", this.id, formData).subscribe(
      (res: any) => this.handleStatusResponse(data),
      (error) => this.handleError(error)
    );
  }

  handleStatusResponse(res: any) {
    this.toggleSpinner(false);
    if (res == "Approved") {
      this.toastService.success("Leave Request Approved Successfully!!");
    } else {
      this.toastService.error("The leave request has been declined.");
    }
    this.router.navigate(["leave-requests"]);
  }

  goBack(): void {
    this.location.back();
  }
}
