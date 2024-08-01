import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";

// Component
import { LoginComponent } from "./login/login.component";
import { RegisterComponent } from "./register/register.component";
import { CompanyLoginComponent } from "./company-login/company-login.component";

const routes: Routes = [
  {
    path: "auth",
    loadChildren: () => import("./auth/auth.module").then((m) => m.AuthModule),
  },
  {
    path: "login",
    component: LoginComponent,
  },
  {
    path: "company-login",
    component: CompanyLoginComponent,
  },
  {
    path: "register",
    component: RegisterComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AccountRoutingModule {}
