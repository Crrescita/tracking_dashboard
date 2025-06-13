import { Component, OnInit, HostListener } from "@angular/core";
import { ActivatedRoute, Router } from '@angular/router';
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
  empData: any;
  empBankData: boolean = false;
  empBackData: boolean = false;
  empSalaryData:any;
  salaryInvioceData:any
  advanceData:any;

  currentTab = 'personal-detail';
  constructor(private route: ActivatedRoute, private location: Location, private router:Router) {
    this.route.queryParams.subscribe((params) => {
      this.currentTab = params["tab"] || "personal-detail";
    });
  }

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

  changeTab(tab: string) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: tab },
      queryParamsHandling: 'merge',
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
      console.log(this.empSalaryData)
    }
  }

  onSalaryInvoiceDataFected(isFetched:any){
    if(isFetched){
      this.salaryInvioceData = isFetched
    }
  }

  onAdvanceDatafected(isFetched:any){
    if(isFetched){
      this.advanceData = isFetched
    }
  }
}
