import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";

// page route
import { PagesRoutingModule } from "./pages-routing.module";
import { SharedModule } from "../shared/shared.module";
import { CustomPagesModule } from "../custom-pages/custom-pages.module";

@NgModule({
  declarations: [],
  imports: [CommonModule, PagesRoutingModule, SharedModule, CustomPagesModule],
})
export class PagesModule {}
