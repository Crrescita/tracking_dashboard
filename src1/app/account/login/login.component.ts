import { Component } from "@angular/core";
import {
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
} from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { Store } from "@ngrx/store";
import { ToastrService } from "ngx-toastr";
import { AuthenticationService } from "src/app/core/services/auth.service";
import { AuthfakeauthenticationService } from "src/app/core/services/authfake.service";
import { AuthService } from "src/app/core/services/custom-pages/auth.service";
import { login } from "src/app/store/Authentication/authentication.actions";

@Component({
  selector: "app-login",
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.scss"],
})

// Login Component
export class LoginComponent {
  // Login Form
  loginForm!: UntypedFormGroup;
  submitted = false;
  fieldTextType!: boolean;
  error = "";
  returnUrl!: string;
  a: any = 10;
  b: any = 20;
  toast!: false;

  // set the current year
  year: number = new Date().getFullYear();
  loginButtonActive: boolean = true;
  currentUser = {};

  // tslint:disable-next-line: max-line-length
  constructor(
    private formBuilder: UntypedFormBuilder,
    private router: Router,
    private store: Store,
    private authService: AuthService,
    private toastService: ToastrService
  ) {}

  ngOnInit(): void {
    if (
      localStorage.getItem("currentUser") &&
      localStorage.getItem("access_token")
    ) {
      this.router.navigate(["/company"]);
    }
    /**
     * Form Validatyion
     */
    this.loginForm = this.formBuilder.group({
      // user_type: ["", [Validators.required]],
      email: ["admin@admin.com", [Validators.required, Validators.email]],
      password: ["admin@123", [Validators.required]],
    });
  }

  // convenience getter for easy access to form fields
  get f() {
    return this.loginForm.controls;
  }

  /**
   * Form submit
   */
  onSubmit() {
    if (this.loginForm.valid) {
      this.submitted = true;
      this.loginButtonActive = false;

      const user_type = "administrator";
      const email = this.f["email"].value ? this.f["email"].value : ""; // Get the username from the form
      const password = this.f["password"].value; // Get the password from the form

      // Login Api
      this.authService
        .logIn({ email: email, password: password, user_type: user_type })
        .subscribe((res: any) => {
          if (res.status == true) {
            this.loginButtonActive = true;
            localStorage.setItem("access_token", res.data.api_token);

            const userData = res.data;
            delete userData.api_token;
            delete userData.password;
            delete userData.reset_token;
            delete userData.token_expire;
            delete userData.create_at;
            delete userData.update_at;
            delete userData.city;
            delete userData.zipcode;
            this.currentUser = userData;

            this.toastService.success(res.message);
            localStorage.setItem(
              "currentUser",
              JSON.stringify(this.currentUser)
            );
            localStorage.setItem("userType", res.user_type);

            this.router.navigate(["/company"]);
          } else if (res.status == false) {
            this.loginButtonActive = true;
            this.toastService.error(res.message);
          }
        });
    } else {
      this.loginForm.markAllAsTouched();
    }
  }

  /**
   * Password Hide/Show
   */
  toggleFieldTextType() {
    this.fieldTextType = !this.fieldTextType;
  }
}
