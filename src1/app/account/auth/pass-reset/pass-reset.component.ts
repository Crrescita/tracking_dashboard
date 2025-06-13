import { Component } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { Router, ActivatedRoute } from "@angular/router";
import { ToastrService } from "ngx-toastr";
import { AuthService } from "src/app/core/services/custom-pages/auth.service";

@Component({
  selector: "app-pass-reset",
  templateUrl: "./pass-reset.component.html",
  styleUrls: ["./pass-reset.component.scss"],
})

// Password Reset
export class PassResetComponent {
  forgotForm: FormGroup;
  resetButtonActive: boolean = true;
  userType: any;
  // set the currenr year
  year: number = new Date().getFullYear();

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private toastService: ToastrService,
    private route: ActivatedRoute
  ) {
    this.route.queryParams.subscribe((params) => {
      this.userType = params["userType"];
    });

    this.forgotForm = this.formBuilder.group({
      email: ["", [Validators.required, Validators.email]],
    });
  }

  get f() {
    return this.forgotForm.controls;
  }

  onSubmit() {
    if (this.forgotForm.valid) {
      this.resetButtonActive = false;
      const data = {
        email: this.f["email"].value,
        user_type: this.userType,
      };
      this.authService.forgetPass(data).subscribe((res) => {
        if (res.status == true) {
          this.resetButtonActive = true;
          this.toastService.success(res.message);
        } else {
          this.resetButtonActive = true;
          this.toastService.error(res.message);
        }
      });
    } else {
      this.forgotForm.markAllAsTouched();
    }
  }
}
