import { ServiceComponent } from "./service/service/service.component";
import { LayoutBComponent } from "./service/layout/layout-b/layout-b.component";
import { LayoutAComponent } from "./service/layout/layout-a/layout-a.component";
import { AddServiceComponent } from "./service/add-service/add-service.component";
import { NgModule, Component } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { AddLayoutBComponent } from "./service/add-layout-b/add-layout-b.component";
import { BannerListComponent } from "./home/banner-list/banner-list.component";
import { AddBannerComponent } from "./home/add-banner/add-banner.component";
import { HomeComponent } from "./home/home/home.component";
import { LocationComponent } from "./location/location.component";
import { AboutComponent } from "./about/about/about.component";
import { OurTeamComponent } from "./our-team/our-team.component";
import { TestimonialsComponent } from "./testimonials/testimonials.component";
import { ScienceComponent } from "./science/science/science.component";
import { ContactComponent } from "./contacts/contact/contact.component";
import { ProductModule } from "./product/product.module";
import { CompanyListComponent } from "./administrator/company/company-list/company-list.component";
import { AddCompanyComponent } from "./administrator/company/add-company/add-company.component";
import { EmployeeListComponent } from "./company/employee/employee-list/employee-list.component";
import { AddEmployeeComponent } from "./company/employee/add-employee/add-employee.component";
import { EmployeeDetailComponent } from "./company/employee/employee-detail/employee-detail.component";
import { AttendanceListComponent } from "./company/attendance/attendance-list/attendance-list.component";
import { DepartmentListComponent } from './company/team/department/department-list/department-list.component';

const routes: Routes = [
  {
    path: "home",
    children: [
      {
        path: "company",
        component: CompanyListComponent,
      },
      {
        path: "banner-list",
        component: BannerListComponent,
      },
      {
        path: "add-banner",
        component: AddBannerComponent,
      },

      {
        path: "edit-banner/:id",
        component: AddBannerComponent,
      },
    ],
  },

  {
    path: "service",
    children: [
      { path: "", component: ServiceComponent },
      {
        path: "add-service",
        component: AddServiceComponent,
      },
      {
        path: "layout-a/:id",
        component: LayoutAComponent,
      },
      {
        path: "layout-b/:id",
        component: LayoutBComponent,
      },
      {
        path: "add-layout-b-data/:id",
        component: AddLayoutBComponent,
      },
      {
        path: "edit-layout-b-data/:id/:dataId",
        component: AddLayoutBComponent,
      },
    ],
  },
  { path: "about", component: AboutComponent },
  { path: "science", component: ScienceComponent },
  { path: "our-team", component: OurTeamComponent },
  { path: "add-testimonial", component: TestimonialsComponent },
  { path: "add-contact", component: ContactComponent },
  { path: "location", component: LocationComponent },

  {
    path: "products",
    loadChildren: () =>
      import("./product/product.module").then((m) => m.ProductModule),
  },

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

  {path:"department-list" , component:DepartmentListComponent},
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CustomPagesRoutingModule {}
