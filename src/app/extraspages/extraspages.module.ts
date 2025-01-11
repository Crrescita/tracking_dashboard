import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ModalModule } from 'ngx-bootstrap/modal';
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
// Page Route
import { ExtrapagesRoutingModule } from "./extraspages-routing.module";

// Component
import { MaintenanceComponent } from "./maintenance/maintenance.component";
import { ComingSoonComponent } from "./coming-soon/coming-soon.component";
import { PrivacyPolicyComponent } from "./privacy-policy/privacy-policy.component";
import { SupportComponent } from './support/support.component';

@NgModule({
  declarations: [
    MaintenanceComponent,
    ComingSoonComponent,
    PrivacyPolicyComponent,
    SupportComponent
  ],
  imports: [CommonModule, ExtrapagesRoutingModule, ModalModule.forRoot(),FormsModule, ReactiveFormsModule],
})
export class ExtraspagesModule {}
