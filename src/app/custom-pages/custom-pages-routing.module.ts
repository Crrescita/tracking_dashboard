import { NgModule, Component } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";

import { CompanyListComponent } from "./administrator/company/company-list/company-list.component";
import { AddCompanyComponent } from "./administrator/company/add-company/add-company.component";
import { EmployeeListComponent } from "./company/employee/employee-list/employee-list.component";
import { AddEmployeeComponent } from "./company/employee/add-employee/add-employee.component";
import { EmployeeDetailComponent } from "./company/employee/employee-detail/employee-detail.component";
import { AttendanceListComponent } from "./company/attendance/attendance-list/attendance-list.component";
import { DepartmentListComponent } from "./company/team/department/department-list/department-list.component";
import { DesignationListComponent } from "./company/team/designation/designation-list/designation-list.component";
import { AttenCalenderComponent } from "./company/attendance/atten-calender/atten-calender.component";
import { AttendanceMonthlyComponent } from "./company/attendance/attendance-monthly/attendance-monthly.component";
import { HolidaysListComponent } from "./company/holidays/holidays-list/holidays-list.component";
import { LeaveTypeComponent } from "./company/leave-management/leave-type/leave-type.component";
import { LeaveRequestComponent } from "./company/leave-management/leave-request/leave-request.component";
import { LeaveRequestDeatilComponent } from "./company/leave-management/leave-request-deatil/leave-request-deatil.component";
import { LogsComponent } from "./administrator/logs/logs.component";
import { LeaveRecordComponent } from "./company/leave-management/leave-record/leave-record.component";
import { EmpLeaveComponent } from "./company/leave-management/leave-record-detail/emp-leave/emp-leave.component";
import { DashboardComponent } from "./company/dashboard/dashboard.component";
import { NotificationComponent } from "./company/notification/notification.component";
import { TaskListComponent } from "./company/task/task-list/task-list.component";
import { LiveLocationComponent } from "./company/employee/live-location/live-location.component";
import { BranchComponent } from "./company/team/branch/branch.component";
import { LeavePolicyComponent } from "./company/leave-management/leave-policy/leave-policy.component";

const routes: Routes = [
  {
    path: "company",
    component: CompanyListComponent,
  },
  {
    path: "add-company",
    component: AddCompanyComponent,
  },

  {
    path: "edit-company/:id",
    component: AddCompanyComponent,
  },
  {
    path: "logs",
    component: LogsComponent,
  },

  // /company
  { path: "dashboard", component: DashboardComponent },
  { path: "employee", component: EmployeeListComponent },

  { path: "add-employee", component: AddEmployeeComponent },
  { path: "edit-employee/:id", component: AddEmployeeComponent },
  { path: "employee-detail/:id", component: EmployeeDetailComponent },

  { path: "attendance-list", component: AttendanceListComponent },

  { path: "department-list", component: DepartmentListComponent },

  { path: "designation-list", component: DesignationListComponent },
  { path: "branch-list", component: BranchComponent },
  {
    path: "attendance-calender/:id/:company_id",
    component: AttenCalenderComponent,
  },
  { path: "attendance-monthly", component: AttendanceMonthlyComponent },
  { path: "holidays", component: HolidaysListComponent },
  { path: "leave-policy", component: LeavePolicyComponent },
  { path: "leave-types", component: LeaveTypeComponent },
  { path: "leave-requests", component: LeaveRequestComponent },
  { path: "leave-detail/:id/:emp_id", component: LeaveRequestDeatilComponent },
  { path: "leave-record", component: LeaveRecordComponent },

  { path: "employe-leave-record/:emp_id", component: EmpLeaveComponent },

  { path: "notification", component: NotificationComponent },

  { path: "assign-task", component: TaskListComponent },
  { path: "live-location/:id", component: LiveLocationComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CustomPagesRoutingModule {}
