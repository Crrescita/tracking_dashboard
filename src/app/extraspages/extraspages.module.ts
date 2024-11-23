import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";

// Page Route
import { ExtrapagesRoutingModule } from "./extraspages-routing.module";

// Component
import { MaintenanceComponent } from "./maintenance/maintenance.component";
import { ComingSoonComponent } from "./coming-soon/coming-soon.component";
import { PrivacyPolicyComponent } from "./privacy-policy/privacy-policy.component";

@NgModule({
  declarations: [
    MaintenanceComponent,
    ComingSoonComponent,
    PrivacyPolicyComponent,
  ],
  imports: [CommonModule, ExtrapagesRoutingModule],
})
export class ExtraspagesModule {}
