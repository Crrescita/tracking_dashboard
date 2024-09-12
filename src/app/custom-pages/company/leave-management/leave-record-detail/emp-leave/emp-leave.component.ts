import { Component, OnInit } from "@angular/core";
import { ApiService } from "../../../../../core/services/api.service";
import { ActivatedRoute } from "@angular/router";

@Component({
  selector: "app-emp-leave",

  templateUrl: "./emp-leave.component.html",
  styleUrl: "./emp-leave.component.scss",
})
export class EmpLeaveComponent implements OnInit {
  breadCrumbItems!: Array<{}>;
  currentTab = "personalDetails";
  id: any;
  company_id: any;
  empLeaveRecordData: any;
  employeeDetail: any;
  // empLeaveRecordDataList: any;
  leaveTypesData: any = [];
  submitted: boolean = false;
  spinnerStatus: boolean = false;
  saveButtonActive: boolean = true;
  constructor(private api: ApiService, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.breadCrumbItems = [
      { label: "Leave Management" },
      { label: "Employee Leave Detail", active: true },
    ];

    const data = localStorage.getItem("currentUser");
    this.id = this.route.snapshot.paramMap.get("emp_id");

    if (data) {
      const user = JSON.parse(data);
      this.company_id = user.id;
    }

    if (this.id) {
      this.getEmpRecord();
      this.getemployeeData();
    }
    if (this.id && this.company_id) {
      this.leaveDetail();
    }
  }

  toggleSpinner(isLoading: boolean) {
    this.spinnerStatus = isLoading;
    this.saveButtonActive = !isLoading;
    this.submitted = isLoading;
  }

  getEmpRecord() {
    this.toggleSpinner(true);
    const url = `leaveRecord?emp_id=${this.id}`;
    this.api.getwithoutid(url).subscribe(
      (res: any) => {
        if (res && res.status) {
          this.toggleSpinner(false);
          this.empLeaveRecordData = res.data[0] || [];
        } else {
          this.empLeaveRecordData = [];
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
    this.api.get("employees", this.id).subscribe(
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

  leaveDetail() {
    this.toggleSpinner(true);
    const url = `leaveDetail?company_id=${this.company_id}&emp_id=${this.id}`;
    this.api.getwithoutid(url).subscribe(
      (res: any) => {
        if (res && res.status) {
          this.toggleSpinner(false);
          this.leaveTypesData = res.data;
          console.log(this.leaveTypesData);
          // this.leaveDetailData = res.leave_details;
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

  handleError(error: any) {
    this.toggleSpinner(false);
  }

  // Change Tab Content
  changeTab(tab: string) {
    this.currentTab = tab;
  }

  getTotal(key: string): number {
    return this.leaveTypesData.reduce(
      (total: number, data: any) => total + Number(data[key]),
      0
    );
  }
}
