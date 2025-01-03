import { Component, OnInit, HostListener } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { Location } from "@angular/common";

@Component({
  selector: "app-employee",
  templateUrl: "./employee.component.html",
  styleUrl: "./employee.component.scss",
})
export class EmployeeComponent implements OnInit {
  isMobile: boolean = false;

  @HostListener("window:resize", ["$event"])
  onResize(event: any) {
    this.isMobile = window.innerWidth <= 768; // Adjust width for mobile
  }
  breadCrumbItems!: Array<{}>;
  urlId: any;
  empData: boolean = false;
  empBankData: boolean = false;
  empBackData: boolean = false;
  empSalaryData: boolean = false;
  constructor(private route: ActivatedRoute, private location: Location) {}

  ngOnInit(): void {
    this.isMobile = window.innerWidth <= 768;
    this.breadCrumbItems = [
      { label: "Employee", active: true },
      { label: "Add", active: true },
    ];
    this.route.params.subscribe((params) => {
      this.urlId = params["id"] ? Number(params["id"]) : null;
    });
  }

  goBack(): void {
    this.location.back();
  }

  onEmpDataFetched(isFetched: any) {
    if (isFetched) {
      this.empData = isFetched;
    }
  }
  onEmpbankDataFetched(isFetched: any) {
    if (isFetched) {
      this.empBankData = isFetched;
    }
  }

  onEmpbankBagbroundDataFetched(isFetched: any) {
    if (isFetched) {
      this.empBackData = isFetched;
    }
  }

  onSalaryDataFecthed(isFetched: any) {
    if (isFetched) {
      this.empSalaryData = isFetched;
    }
  }
}
