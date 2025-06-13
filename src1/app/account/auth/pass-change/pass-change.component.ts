import { Component } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { ToastrService } from "ngx-toastr";
import { AuthService } from "src/app/core/services/custom-pages/auth.service";
import { Observable } from "rxjs";

@Component({
  selector: "app-pass-change",
  templateUrl: "./pass-change.component.html",
  styleUrls: ["./pass-change.component.scss"],
})

// Password Chage Component
export class PassChangeComponent {
  // set the currenr year
  year: number = new Date().getFullYear();
  resetForm!: FormGroup;
  resetButtonActive: boolean = true;
  fieldTextType!: boolean;
  fieldTextType1!: boolean;
  token: any = "";
  sd: any = "";
  user: string | null = null;
  user_type: any;

  passwordValidations = {
    length: false,
    lower: false,
    upper: false,
    number: false,
  };
  constructor(
    private activatedRoute: ActivatedRoute,
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private toastService: ToastrService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    // this.resetForm = this.formBuilder.group(
    //   {
    //     password: ["", [Validators.required]],
    //     confirmPassword: ["", [Validators.required]],
    //   },
    //   { validator: this.passwordMatchValidator }
    // );
    this.route.queryParams.subscribe((params) => {
      this.user_type = params["userType"];
    });
  }

  get r() {
    return this.resetForm.controls;
  }

  ngOnInit() {
    this.getResetToken();
    this.initializeForm();
  }

  initializeForm() {
    this.resetForm = this.formBuilder.group(
      {
        password: [
          "",
          [
            Validators.required,
            Validators.pattern("(?=.*\\d)(?=.*[a-z])(?=.*[A-Z]).{8,}"),
          ],
        ],
        confirmPassword: ["", Validators.required],
      },
      { validator: this.passwordMatchValidator }
    );
  }

  passwordMatchValidator(formGroup: FormGroup) {
    const password = formGroup.get("password")?.value;
    const confirmPassword = formGroup.get("confirmPassword")?.value;
    return password === confirmPassword ? null : { mismatch: true };
  }

  checkPasswordPattern() {
    const password = this.resetForm.get("password")?.value;
    this.passwordValidations.length = password.length >= 8;
    this.passwordValidations.lower = /[a-z]/.test(password);
    this.passwordValidations.upper = /[A-Z]/.test(password);
    this.passwordValidations.number = /\d/.test(password);
  }

  getResetToken() {
    this.activatedRoute.queryParams.subscribe((param) => {
      if (param["token"]) {
        this.token = param["token"];
      }
    });
  }

  // Custom validator function to check if password and confirmPassword match
  // passwordMatchValidator(group: FormGroup) {
  //   const password = group.get("password")?.value;
  //   const confirmPassword = group.get("confirmPassword")?.value;
  //   return password === confirmPassword ? null : { mismatch: true };
  // }

  onSubmit() {
    if (this.resetForm.valid) {
      this.resetButtonActive = false;
      const data = {
        new_password: this.r["password"].value,
        token: this.token,
        user_type: this.user_type,
      };

      const resetPassword = (resetPassMethod: Observable<any>) => {
        resetPassMethod.subscribe((res) => {
          this.resetButtonActive = true;
          if (res.status === true) {
            this.toastService.success(res.message);
            this.resetForm.reset();
            if (this.user_type == "administrator") {
              this.router.navigate(["/auth/login"]);
            } else {
              this.router.navigate(["/auth/company-login"]);
            }
          } else {
            this.toastService.error(res.message);
          }
        });
      };

      // if (this.user === "employee") {
      //   resetPassword(this.authService.resetPassEmployee(data));
      // } else {
      resetPassword(this.authService.resetPass(data));
      // }
    } else {
      this.resetForm.markAllAsTouched();
    }
  }

  /**
   * Password Hide/Show
   */
  toggleFieldTextType() {
    this.fieldTextType = !this.fieldTextType;
  }

  toggleFieldTextType1() {
    this.fieldTextType1 = !this.fieldTextType1;
  }
}
