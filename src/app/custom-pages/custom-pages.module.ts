import { ScienceSectiononeComponent } from "./science/science-sectionone/science-sectionone.component";
import { HomeSectionthreeComponent } from "./home/home-sectionthree/home-sectionthree.component";
import { LayoutBComponent } from "./service/layout/layout-b/layout-b.component";
import { LayoutAComponent } from "./service/layout/layout-a/layout-a.component";

import { AddServiceComponent } from "./service/add-service/add-service.component";

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

// Flat Picker
import { FlatpickrModule } from "angularx-flatpickr";
import { AddLayoutBComponent } from "./service/add-layout-b/add-layout-b.component";
import { AddBannerComponent } from "./home/add-banner/add-banner.component";
import { BannerListComponent } from "./home/banner-list/banner-list.component";
import { HomeSectiononeComponent } from "./home/home-sectionone/home-sectionone.component";
import { HomeComponent } from "./home/home/home.component";
import { HomeSectiontwoComponent } from "./home/home-sectiontwo/home-sectiontwo.component";
import { HomeSectionfourComponent } from "./home/home-sectionfour/home-sectionfour.component";
import { LocationComponent } from "./location/location.component";
import { AboutComponent } from "./about/about/about.component";
import { AboutBannerComponent } from "./about/about-banner/about-banner.component";
import { AboutMissionComponent } from "./about/about-mission/about-mission.component";
import { AboutVisionComponent } from "./about/about-vision/about-vision.component";
import { AboutSectiontwoComponent } from "./about/about-sectiontwo/about-sectiontwo.component";
import { AboutSectionthreeComponent } from "./about/about-sectionthree/about-sectionthree.component";
import { OurTeamComponent } from "./our-team/our-team.component";
import { TestimonialsComponent } from "./testimonials/testimonials.component";
import { AboutSectionsevenComponent } from "./about/about-sectionseven/about-sectionseven.component";
import { ServiceBannerComponent } from "./service/service-banner/service-banner.component";
import { ServiceComponent } from "./service/service/service.component";
import { ServiceContactFormComponent } from "./service/service-contact-form/service-contact-form.component";
import { ScienceBannerComponent } from "./science/science-banner/science-banner.component";
import { ScienceComponent } from "./science/science/science.component";

import { ScienceSectiontwoComponent } from "./science/science-sectiontwo/science-sectiontwo.component";
import { ScienceSectionthreeComponent } from "./science/science-sectionthree/science-sectionthree.component";
import { ScienceSectionfourComponent } from "./science/science-sectionfour/science-sectionfour.component";
import { ScienceSectionfiveComponent } from "./science/science-sectionfive/science-sectionfive.component";
import { ScienceSectionsixComponent } from "./science/science-sectionsix/science-sectionsix.component";
import { ScienceContactFormComponent } from "./science/science-contact-form/science-contact-form.component";
import { OurProcessComponent } from "./our-process/our-process.component";
import { ContactPageComponent } from "./contacts/contact-page/contact-page.component";
import { ContactComponent } from "./contacts/contact/contact.component";
import { ContactFormComponent } from "./contacts/contact-form/contact-form.component";
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

@NgModule({
  declarations: [
    ServiceComponent,
    AddServiceComponent,
    LayoutAComponent,
    LayoutBComponent,
    AddLayoutBComponent,
    AddBannerComponent,
    BannerListComponent,
    HomeComponent,
    HomeSectiononeComponent,
    HomeSectiontwoComponent,
    HomeSectionthreeComponent,
    HomeSectionfourComponent,
    AboutComponent,
    AboutBannerComponent,
    AboutMissionComponent,
    AboutVisionComponent,
    AboutSectiontwoComponent,
    AboutSectionthreeComponent,
    AboutSectionsevenComponent,
    OurTeamComponent,
    TestimonialsComponent,
    ServiceBannerComponent,
    ServiceContactFormComponent,
    ScienceComponent,
    ScienceBannerComponent,
    ScienceSectiononeComponent,
    ScienceSectiontwoComponent,
    ScienceSectionthreeComponent,
    ScienceSectionfourComponent,
    ScienceSectionfiveComponent,
    ScienceSectionsixComponent,
    ScienceContactFormComponent,
    OurProcessComponent,
    ContactComponent,
    ContactPageComponent,
    ContactFormComponent,
    LocationComponent,

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
  ],
})
export class CustomPagesModule {}
