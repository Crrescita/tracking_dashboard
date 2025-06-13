import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ModalModule } from 'ngx-bootstrap/modal';
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
// Page Route
import { ExtrapagesRoutingModule } from "./extraspages-routing.module";
import { TooltipModule } from "ngx-bootstrap/tooltip";
import { AlertModule } from 'ngx-bootstrap/alert';
// Component
import { MaintenanceComponent } from "./maintenance/maintenance.component";
import { ComingSoonComponent } from "./coming-soon/coming-soon.component";
import { PrivacyPolicyComponent } from "./privacy-policy/privacy-policy.component";
import { SupportComponent } from './support/support.component';
import { AssignedTaskComponent } from './assigned-task/assigned-task.component';

import { SimplebarAngularModule } from "simplebar-angular";
import { PickerModule } from '@ctrl/ngx-emoji-mart';
import { TaskListComponent } from './task-list/task-list.component';
import { AddEmployeeComponent } from './add-employee/add-employee.component';
import { EmpDocsComponent } from './emp-docs/emp-docs.component';

@NgModule({
  declarations: [
    MaintenanceComponent,
    ComingSoonComponent,
    PrivacyPolicyComponent,
    SupportComponent,
    AssignedTaskComponent,
    TaskListComponent,
    AddEmployeeComponent,
    EmpDocsComponent
  ],
  imports: [CommonModule, AlertModule.forRoot(), TooltipModule.forRoot(), ExtrapagesRoutingModule, ModalModule.forRoot(),FormsModule, ReactiveFormsModule, SimplebarAngularModule, PickerModule],
})
export class ExtraspagesModule {}
