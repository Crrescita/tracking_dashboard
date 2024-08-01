import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { AddCategoryComponent } from "./category/add-category/add-category.component";
import { AddSubCategoryComponent } from "./category/add-sub-category/add-sub-category.component";
import { ProductListComponent } from "./add-product/product-list/product-list.component";
import { AddProductComponent } from "./add-product/add-product/add-product.component";
import { AddTagComponent } from "./tag/add-tag/add-tag.component";

const routes: Routes = [
  { path: "", component: ProductListComponent },
  { path: "add-category", component: AddCategoryComponent },
  { path: "add-sub-category", component: AddSubCategoryComponent },

  { path: "add-product", component: AddProductComponent },
  { path: "edit-product/:id", component: AddProductComponent },
  { path: "add-tag", component: AddTagComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ProductRoutingModule {}
