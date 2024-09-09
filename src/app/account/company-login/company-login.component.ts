import { AuthService } from "./../../core/services/custom-pages/auth.service";
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

import { login } from "src/app/store/Authentication/authentication.actions";
import { AngularFireMessaging } from "@angular/fire/compat/messaging";
import { UAParser } from "ua-parser-js";
import { ApiService } from "../../core/services/api.service";

@Component({
  selector: "app-company-login",
  templateUrl: "./company-login.component.html",
  styleUrl: "./company-login.component.scss",
})
export class CompanyLoginComponent {
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

  deviceInfo: string = "";
  userId: any;
  // tslint:disable-next-line: max-line-length
  constructor(
    private formBuilder: UntypedFormBuilder,
    private router: Router,
    private store: Store,
    private authService: AuthService,
    private toastService: ToastrService,
    private afMessaging: AngularFireMessaging,
    private api: ApiService
  ) {}

  ngOnInit(): void {
    this.deviceInfo = this.getDeviceInfo();
    console.log(this.deviceInfo);
    if (
      localStorage.getItem("currentUser") &&
      localStorage.getItem("access_token")
    ) {
      this.router.navigate(["/employee"]);
    }
    /**
     * Form Validatyion
     */
    this.loginForm = this.formBuilder.group({
      // user_type: ["", [Validators.required]],
      email: ["", [Validators.required, Validators.email]],
      password: ["", [Validators.required]],
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

      const user_type = "company";
      const email = this.f["email"].value ? this.f["email"].value : ""; // Get the username from the form
      const password = this.f["password"].value; // Get the password from the form

      // Login Api
      this.authService
        .logIn({
          email: email,
          password: password,
          user_type: user_type,
          device_info: this.deviceInfo,
        })
        .subscribe((res: any) => {
          if (res.status == true) {
            this.requestPermission();

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

            this.router.navigate(["/employee"]);
          } else if (res.status == false) {
            this.loginButtonActive = true;
            this.toastService.error(res.message);
          }
        });
    } else {
      this.loginForm.markAllAsTouched();
    }
  }

  requestPermission() {
    this.afMessaging.requestToken.subscribe(
      (token) => {
        console.log("Admin FCM Token:", token);
        // Save the token to the backend
        const user_id = localStorage.getItem("currentUser");

        if (user_id) {
          const user = JSON.parse(user_id);
          this.userId = user.id;
        }
        const data = {
          userId: this.userId,
          fcmToken: token,
          device_info: this.deviceInfo,
        };
        this.api.post("setFcmToken", data).subscribe();
      },
      (error) => {
        console.error("Error getting permission", error);
      }
    );

    this.authService.requestPermission().subscribe(
      () => {
        navigator.serviceWorker
          .register("firebase-messaging-sw.js")
          .then((registration) => {
            console.log("Service Worker Registered", registration);
          })
          .catch((error) => {
            console.error("Service Worker Registration Failed", error);
          });
      },
      (error) => {
        console.error("Error requesting FCM permission", error);
      }
    );
  }

  /**
   * Password Hide/Show
   */
  toggleFieldTextType() {
    this.fieldTextType = !this.fieldTextType;
  }

  getDeviceInfo(): string {
    const parser = new UAParser();
    const result = parser.getResult();
    return `Browser: ${result.browser.name} ${result.browser.version}, OS: ${result.os.name} ${result.os.version}, Device: ${result.device.model}`;
  }
}
