import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";

import { ProductRoutingModule } from "./product-routing.module";
import { AddCategoryComponent } from "./category/add-category/add-category.component";
import { SharedModule } from "../../shared/shared.module";
import { AccordionModule } from "ngx-bootstrap/accordion";
import { BsDropdownModule } from "ngx-bootstrap/dropdown";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { PaginationModule } from "ngx-bootstrap/pagination";
import { ModalModule } from "ngx-bootstrap/modal";
import { SlickCarouselModule } from "ngx-slick-carousel";
import { SimplebarAngularModule } from "simplebar-angular";
import { TooltipModule } from "ngx-bootstrap/tooltip";
import { NgApexchartsModule } from "ng-apexcharts";
import { CountUpModule } from "ngx-countup";
import { AlertModule } from "ngx-bootstrap/alert";
import { NgSelectModule } from "@ng-select/ng-select";
import { NgxSliderModule } from "ngx-slider-v2";
import { CKEditorModule } from "@ckeditor/ckeditor5-angular";
import { NgxEditorModule } from "ngx-editor";
import { EditorModule } from "@tinymce/tinymce-angular";
import { BsDatepickerModule } from "ngx-bootstrap/datepicker";
import { ProgressbarModule } from "ngx-bootstrap/progressbar";
import { LeafletModule } from "@asymmetrik/ngx-leaflet";
import { RatingModule } from "ngx-bootstrap/rating";
import { DropzoneModule } from "ngx-dropzone-wrapper";
import { FlatpickrModule } from "angularx-flatpickr";
import { AddSubCategoryComponent } from "./category/add-sub-category/add-sub-category.component";
import { ProductListComponent } from "./add-product/product-list/product-list.component";
import { AddProductComponent } from "./add-product/add-product/add-product.component";
import { AddTagComponent } from "./tag/add-tag/add-tag.component";
import { AddCatalogComponent } from "./add-product/add-catalog/add-catalog.component";
import { AddProductImageComponent } from "./add-product/add-product-image/add-product-image.component";

@NgModule({
  declarations: [
    AddCategoryComponent,
    AddSubCategoryComponent,
    ProductListComponent,
    AddProductComponent,
    AddTagComponent,
    AddCatalogComponent,
    AddProductImageComponent,
  ],
  imports: [
    CommonModule,
    ProductRoutingModule,
    SharedModule,
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
export class ProductModule {}
