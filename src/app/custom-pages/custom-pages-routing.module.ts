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

  { path: "employee", component: EmployeeListComponent },

  { path: "add-employee", component: AddEmployeeComponent },
  { path: "edit-employee/:id", component: AddEmployeeComponent },
  { path: "employee-detail/:id", component: EmployeeDetailComponent },

  { path: "attendance-list", component: AttendanceListComponent },

  { path: "department-list", component: DepartmentListComponent },

  { path: "designation-list", component: DesignationListComponent },
  {
    path: "attendance-calender/:id/:company_id",
    component: AttenCalenderComponent,
  },
  { path: "attendance-monthly", component: AttendanceMonthlyComponent },
  { path: "holidays", component: HolidaysListComponent },
  { path: "leave-types", component: LeaveTypeComponent },
  { path: "leave-requests", component: LeaveRequestComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CustomPagesRoutingModule {}
