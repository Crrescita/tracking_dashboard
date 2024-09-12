import { Component, OnInit } from "@angular/core";
import { ApiService } from "../../../core/services/api.service";
import { debounceTime } from "rxjs/operators";
import { Subject } from "rxjs";
import { BsDatepickerConfig } from "ngx-bootstrap/datepicker";
import { PageChangedEvent } from "ngx-bootstrap/pagination";
// import { LogEntry } from "./log-entry.model";
import { cloneDeep } from "lodash";

@Component({
  selector: "app-logs",
  templateUrl: "./logs.component.html",
  styleUrls: ["./logs.component.scss"],
})
export class LogsComponent implements OnInit {
  bsConfig?: Partial<BsDatepickerConfig>;
  private dateChangeSubject = new Subject<Date>();
  breadCrumbItems!: Array<{}>;

  logsAdminData: any;
  logsFrontData: any;
  logDataList: any;
  logsData: any[] = [];

  selectedDate: Date = new Date();
  formattedDate: string = "";
  spinnerStatus: boolean = false;
  endItem: any;
  fileType: string = "admin";
  logsFile: string = "admin";

  constructor(private api: ApiService) {
    this.bsConfig = {
      maxDate: new Date(),
      showWeekNumbers: false,
      dateInputFormat: "DD/MM/YYYY",
    };
  }

  ngOnInit(): void {
    this.selectedDate = new Date();

    if (this.selectedDate) {
      this.formattedDate = this.formatDate(this.selectedDate);
    }

    this.dateChangeSubject.pipe(debounceTime(300)).subscribe((newDate) => {
      this.handleDateChange(newDate);
    });

    this.getLogs();
  }

  handleDateChange(newDate: Date): void {
    this.selectedDate = newDate;
    this.formattedDate = this.formatDate(newDate);
    this.getLogs();
  }

  formatDate(date: Date): string {
    if (!date) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  onDateChange(newDate: Date): void {
    this.dateChangeSubject.next(newDate);
  }

  getLogs() {
    // logs?type=${this.fileType}&date=${this.formattedDate}
    this.api.getwithoutid(`logs?date=${this.formattedDate}`).subscribe(
      (res: any) => {
        this.logsAdminData = res.find((log: any) => log.logType === "admin");
        this.logsFrontData = res.find((log: any) => log.logType === "frontend");
        this.updateTableData();
      },
      (error: any) => {
        console.error("Error fetching logs", error);
      }
    );
  }

  // Sort Data
  direction: any = "asc";
  onSort(column: any) {
    if (this.direction == "asc") {
      this.direction = "desc";
    } else {
      this.direction = "asc";
    }
    const sortedArray = [...this.logsData];
    sortedArray.sort((a: any, b: any) => {
      const res = this.compare(a[column], b[column]);
      return this.direction === "asc" ? res : -res;
    });
    this.logsData = sortedArray;
  }
  compare(v1: string | number, v2: string | number) {
    return v1 < v2 ? -1 : v1 > v2 ? 1 : 0;
  }

  setLogFile(type: string) {
    this.fileType = type;
    this.updateTableData(); // Update table data based on selected type
  }

  updateTableData() {
    if (this.fileType === "admin") {
      this.logsData = this.logsAdminData?.logs || [];
      this.logDataList = this.logsAdminData?.logs || [];
    } else if (this.fileType === "frontend") {
      this.logsData = this.logsFrontData?.logs || [];
      this.logDataList = this.logsFrontData?.logs || [];
    }
  }

  term: any;

  // filterdata
  filterdata() {
    if (this.term) {
      this.logsData = this.logDataList.filter(
        (el: any) =>
          el.filename.toLowerCase().includes(this.term.toLowerCase()) ||
          el.createdAt.toLowerCase().includes(this.term.toLowerCase())
      );
    } else {
      this.logsData = this.logDataList;
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
    if (this.term && this.logsData.length === 0) {
      noResultElement.style.display = "block";
      paginationElement.classList.add("d-none");
    } else {
      noResultElement.style.display = "none";
      paginationElement.classList.remove("d-none");
    }
  }

  pageChanged(event: PageChangedEvent): void {
    const startItem = (event.page - 1) * event.itemsPerPage;
    this.endItem = event.page * event.itemsPerPage;
    this.logsData = this.logDataList.slice(startItem, this.endItem);
  }
}
