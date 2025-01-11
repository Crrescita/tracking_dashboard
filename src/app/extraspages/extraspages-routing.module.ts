import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";

// Component Pages
import { MaintenanceComponent } from "./maintenance/maintenance.component";
import { ComingSoonComponent } from "./coming-soon/coming-soon.component";
import { PrivacyPolicyComponent } from "./privacy-policy/privacy-policy.component";
import { SupportComponent } from './support/support.component';

const routes: Routes = [
  {
    path: "maintenance",
    component: MaintenanceComponent,
  },
  {
    path: "coming-soon",
    component: ComingSoonComponent,
  },
  {
    path: "privacy-policy",
    component: PrivacyPolicyComponent,
  },
  {
    path: "support",
    component: SupportComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ExtrapagesRoutingModule {}
