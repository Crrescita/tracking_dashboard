import { TaskDetailComponent } from './company/task/task-detail/task-detail.component';
import { SalarySettingComponent } from './company/employee/salary/salary-setting/salary-setting.component';
import { AdvanceDetailComponent } from './company/employee/salary/advance-detail/advance-detail.component';
import { SalaryInvoiceComponent } from './company/employee/salary/salary-invoice/salary-invoice.component';
import { EmployeeComponent } from "./company/employee/employee/employee.component";
import { LeaveRecordComponent } from "./company/leave-management/leave-record/leave-record.component";
import { HolidaysListComponent } from "./company/holidays/holidays-list/holidays-list.component";
import { DesignationListComponent } from "./company/team/designation/designation-list/designation-list.component";
import { CustomPagesRoutingModule } from "./custom-pages-routing.module";
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { NgxEditorModule } from "ngx-editor";
// Page Route
import { SharedModule } from "src/app/shared/shared.module";
// Date Format
import { DatePipe } from "@angular/common";
// Drop Zone
import { DropzoneModule } from "ngx-dropzone-wrapper";
import { DROPZONE_CONFIG } from "ngx-dropzone-wrapper";
import { DropzoneConfigInterface } from "ngx-dropzone-wrapper";

// Simplebar
import { SimplebarAngularModule } from "simplebar-angular";

// Select Droup down
import { NgSelectModule } from "@ng-select/ng-select";
// Count To
import { CountUpModule } from "ngx-countup";

// Range Slider
import { NgxSliderModule } from "ngx-slider-v2";

// Swiper Slider
import { SlickCarouselModule } from "ngx-slick-carousel";
// Ck Editer
import { CKEditorModule } from "@ckeditor/ckeditor5-angular";

// Apex Chart Package
import { NgApexchartsModule } from "ng-apexcharts";

// Leaflet Map
import { LeafletModule } from "@asymmetrik/ngx-leaflet";

import { EditorModule } from "@tinymce/tinymce-angular";

// Bootstrap Component
import { BsDropdownModule } from "ngx-bootstrap/dropdown";
import { PaginationModule } from "ngx-bootstrap/pagination";
import { ModalModule } from "ngx-bootstrap/modal";
import { AccordionModule } from "ngx-bootstrap/accordion";
import { TooltipModule } from "ngx-bootstrap/tooltip";
import { AlertModule } from "ngx-bootstrap/alert";
import { BsDatepickerModule } from "ngx-bootstrap/datepicker";
import { ProgressbarModule } from "ngx-bootstrap/progressbar";
import { RatingModule } from "ngx-bootstrap/rating";

// Calendar package
import { FullCalendarModule } from "@fullcalendar/angular";
import { PopoverModule } from "ngx-bootstrap/popover";

import { UiSwitchModule } from 'ngx-ui-switch';

// Flat Picker
import { FlatpickrModule } from "angularx-flatpickr";
import { TabsModule } from "ngx-bootstrap/tabs";

//Wizard
import { CdkStepperModule } from "@angular/cdk/stepper";
import { NgStepperModule } from "angular-ng-stepper";

// lord-icon
import lottie from "lottie-web";
import { defineElement, In } from "@lordicon/element";

// Emoji Picker
import { PickerModule } from '@ctrl/ngx-emoji-mart';

import { CompanyListComponent } from "./administrator/company/company-list/company-list.component";
import { AddCompanyComponent } from "./administrator/company/add-company/add-company.component";
import { EmployeeListComponent } from "./company/employee/employee-list/employee-list.component";
import { AddEmployeeComponent } from "./company/employee/add-employee/add-employee.component";
import { EmployeeDetailComponent } from "./company/employee/employee-detail/employee-detail.component";
import { TimelineComponent } from "./company/employee/timeline/timeline.component";
import { PasswordChangeComponent } from "./company/employee/password-change/password-change.component";
import { LiveLocationComponent } from "./company/employee/live-location/live-location.component";
import { AttendanceListComponent } from "./company/attendance/attendance-list/attendance-list.component";
import { DepartmentListComponent } from "./company/team/department/department-list/department-list.component";
import { AttenCalenderComponent } from "./company/attendance/atten-calender/atten-calender.component";
import { MapComponent } from "./company/employee/map/map.component";
import { AttendanceMonthlyComponent } from "./company/attendance/attendance-monthly/attendance-monthly.component";
import { LeaveTypeComponent } from "./company/leave-management/leave-type/leave-type.component";
import { LeaveRequestComponent } from "./company/leave-management/leave-request/leave-request.component";
import { LeaveRequestDeatilComponent } from "./company/leave-management/leave-request-deatil/leave-request-deatil.component";
import { LogsComponent } from "./administrator/logs/logs.component";
import { EmpLeaveComponent } from "./company/leave-management/leave-record-detail/emp-leave/emp-leave.component";
import { DashboardComponent } from "./company/dashboard/dashboard.component";
import { NotificationComponent } from "./company/notification/notification.component";
import { ApprovedLeaveComponent } from "./company/leave-management/leave-record-detail/approved-leave/approved-leave.component";
import { RejectLeaveComponent } from "./company/leave-management/leave-record-detail/reject-leave/reject-leave.component";
import { PendingLeaveComponent } from "./company/leave-management/leave-record-detail/pending-leave/pending-leave.component";
import { ExpiredLeaveComponent } from "./company/leave-management/leave-record-detail/expired-leave/expired-leave.component";
import { TaskListComponent } from "./company/task/task-list/task-list.component";
import { BranchComponent } from "./company/team/branch/branch.component";
import { LeavePolicyComponent } from "./company/leave-management/leave-policy/leave-policy.component";
import { GernalReportsComponent } from "./company/reports/gernal-reports/gernal-reports.component";
import { BankDetailComponent } from "./company/employee/bank-detail/bank-detail.component";
import { BackgroundVerificationComponent } from "./company/employee/background-verification/background-verification.component";
import { SalaryDetailComponent } from "./company/employee/salary/salary-detail/salary-detail.component";
import { AllowanceComponent } from "./company/employee/salary/allowance/allowance.component";
import { PayrollListComponent } from './company/payroll/payroll-list/payroll-list.component';
import { QuotationsComponent } from './company/employee/request/quotations/quotations.component';
import { InvoiceComponent } from './company/employee/request/invoice/invoice.component';
import { StatementComponent } from './company/employee/request/statement/statement.component';
import { CreditNoteComponent } from './company/employee/request/credit-note/credit-note.component';
import { StockStatusComponent } from './company/employee/request/stock-status/stock-status.component';
import { RequestDetailComponent } from './company/employee/request/request-detail/request-detail.component';

const DEFAULT_DROPZONE_CONFIG: DropzoneConfigInterface = {
  // Change this to your upload POST address:
  url: 'https://httpbin.org/post',
  maxFilesize: 50,
  acceptedFiles: 'image/*'
};

@NgModule({
  declarations: [
    CompanyListComponent,
    AddCompanyComponent,
    EmployeeListComponent,
    AddEmployeeComponent,
    EmployeeDetailComponent,
    TimelineComponent,
    PasswordChangeComponent,
    LiveLocationComponent,
    AttendanceListComponent,
    DepartmentListComponent,
    DesignationListComponent,
    AttenCalenderComponent,
    MapComponent,
    AttendanceMonthlyComponent,
    HolidaysListComponent,
    LeaveTypeComponent,
    LeaveRequestComponent,
    LeaveRequestDeatilComponent,
    LeaveRecordComponent,
    LogsComponent,
    EmpLeaveComponent,
    DashboardComponent,
    NotificationComponent,
    ApprovedLeaveComponent,
    RejectLeaveComponent,
    PendingLeaveComponent,
    ExpiredLeaveComponent,
    TaskListComponent,
    BranchComponent,
    LeavePolicyComponent,
    GernalReportsComponent,
    EmployeeComponent,
    BankDetailComponent,
    BackgroundVerificationComponent,
    SalaryDetailComponent,
    AllowanceComponent,
    SalaryInvoiceComponent,
    AdvanceDetailComponent,
    PayrollListComponent,
    SalarySettingComponent,
    TaskDetailComponent,
    QuotationsComponent,
    InvoiceComponent,
    StatementComponent,
    CreditNoteComponent,
    StockStatusComponent,
    RequestDetailComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    CustomPagesRoutingModule,
    BsDropdownModule.forRoot(),
    FormsModule,
    ReactiveFormsModule,
    PaginationModule.forRoot(),
    ModalModule.forRoot(),
    AccordionModule.forRoot(),
    SlickCarouselModule,
    SimplebarAngularModule,
    TooltipModule.forRoot(),
    NgApexchartsModule,
    CountUpModule,
    AlertModule.forRoot(),
    NgSelectModule,
    NgxSliderModule,
    CKEditorModule,
    NgxEditorModule,
    EditorModule,
    BsDatepickerModule.forRoot(),
    ProgressbarModule.forRoot(),
    LeafletModule,
    RatingModule.forRoot(),
    DropzoneModule,
    FlatpickrModule.forRoot(),
    CdkStepperModule,
    NgStepperModule,
    FullCalendarModule,
    UiSwitchModule,
    PopoverModule,
    TabsModule.forRoot(),
    PickerModule,
  ],

    providers: [
    DatePipe,
    {
      provide: DROPZONE_CONFIG,
      useValue: DEFAULT_DROPZONE_CONFIG
    }
  ],

})
export class CustomPagesModule {
  constructor() {
    defineElement(lottie.loadAnimation);
  }
}
