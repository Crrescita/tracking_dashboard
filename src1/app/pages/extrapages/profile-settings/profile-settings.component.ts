import { Component } from "@angular/core";
import {
  FormBuilder,
  FormGroup,
  UntypedFormGroup,
  Validators,
} from "@angular/forms";
import { BsDatepickerConfig } from "ngx-bootstrap/datepicker";
import { ToastrService } from "ngx-toastr";
import { AuthService } from "src/app/core/services/custom-pages/auth.service";

@Component({
  selector: "app-profile-settings",
  templateUrl: "./profile-settings.component.html",
  styleUrls: ["./profile-settings.component.scss"],
})

// Profile Setting component
export class ProfileSettingsComponent {
  // bread crumb items
  breadCrumbItems!: Array<{}>;
  fieldTextType!: boolean;
  fieldTextType1!: boolean;
  fieldTextType2!: boolean;
  bsConfig?: Partial<BsDatepickerConfig>;

  formGroups: FormGroup[] = [];
  educationForm!: FormGroup;
  profileDetails!: FormGroup;
  changePassForm!: FormGroup;
  currentTab = "personalDetails";
  userDetails: any = "";
  profileButtonActive: boolean = true;
  changePassButtonActive: boolean = true;
  token: any = "";
  userType: any;

  passwordValidations = {
    length: false,
    lower: false,
    upper: false,
    number: false,
  };

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private toastService: ToastrService
  ) {
    this.profileDetails = this.formBuilder.group({
      name: ["", [Validators.required]],
      email: ["", [Validators.required, Validators.email]],
    });

    // this.changePassForm = this.formBuilder.group(
    //   {
    //     oldPassword: ["", [Validators.required]],
    //     newPassword: ["", [Validators.required]],
    //     confirmPassword: ["", [Validators.required]],
    //   },
    //   { validator: this.passwordMatchValidator }
    // );
  }

  get p() {
    return this.profileDetails.controls;
  }

  ngOnInit(): void {
    this.getUserDetails();
    this.initializeForm();
    /**
     * BreadCrumb
     */
    this.breadCrumbItems = [
      { label: "Pages", active: true },
      { label: "Profile Settings", active: true },
    ];

    this.educationForm = this.formBuilder.group({
      degree: [""],
      name: [""],
      year: [""],
      to: [""],
      description: [""],
    });
    this.formGroups.push(this.educationForm);
  }

  initializeForm() {
    this.changePassForm = this.formBuilder.group(
      {
        oldPassword: ["", [Validators.required]],
        newPassword: [
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

  // passwordMatchValidator(formGroup: FormGroup) {
  //   const password = formGroup.get("password")?.value;
  //   const confirmPassword = formGroup.get("confirmPassword")?.value;
  //   return password === confirmPassword ? null : { mismatch: true };
  // }

  // Custom validator function to check if password and confirmPassword match
  passwordMatchValidator(group: FormGroup) {
    const password = group.get("newPassword")?.value;
    const confirmPassword = group.get("confirmPassword")?.value;
    return password === confirmPassword ? null : { mismatch: true };
  }

  checkPasswordPattern() {
    const password = this.changePassForm.get("newPassword")?.value;
    this.passwordValidations.length = password.length >= 8;
    this.passwordValidations.lower = /[a-z]/.test(password);
    this.passwordValidations.upper = /[A-Z]/.test(password);
    this.passwordValidations.number = /\d/.test(password);
  }

  get c() {
    return this.changePassForm.controls;
  }

  /**
   * Default Select2
   */
  selectedAccount = "This is a placeholder";
  Skills = [
    { name: "Illustrator" },
    { name: "Photoshop" },
    { name: "CSS" },
    { name: "HTML" },
    { name: "Javascript" },
    { name: "Python" },
    { name: "PHP" },
  ];

  // Change Tab Content
  changeTab(tab: string) {
    this.currentTab = tab;
  }

  // File Upload
  imageURL: any;
  fileChange(event: any, id: any) {
    let fileList: any = event.target as HTMLInputElement;
    let file: File = fileList.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      this.imageURL = reader.result as string;
      if (id == "0") {
        document.querySelectorAll("#cover-img").forEach((element: any) => {
          element.src = this.imageURL;
        });
      }
      if (id == "1") {
        document.querySelectorAll("#user-img").forEach((element: any) => {
          element.src = this.imageURL;
        });
      }
    };

    reader.readAsDataURL(file);
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
  toggleFieldTextType2() {
    this.fieldTextType2 = !this.fieldTextType2;
  }

  // add Form
  addForm() {
    const formGroupClone = this.formBuilder.group(this.educationForm.value);
    this.formGroups.push(formGroupClone);
  }

  // Delete Form
  deleteForm(id: any) {
    this.formGroups.splice(id, 1);
  }

  getUserDetails() {
    let details = localStorage.getItem("currentUser");
    this.userType = localStorage.getItem("userType");

    const token = localStorage.getItem("access_token");
    if (details) {
      details = JSON.parse(details);
      this.userDetails = details;
      this.profileDetails
        .get("name")
        ?.setValue(
          this.userType == "company"
            ? this.userDetails.name
            : this.userDetails.username
        );
      this.profileDetails.get("email")?.setValue(this.userDetails.email);
    }
    if (token) {
      this.token = token;
    }
  }

  onSubmit() {
    if (this.profileDetails.valid) {
      this.profileButtonActive = false;
      const data = {
        email: this.p["email"].value,
        username: this.p["name"].value,
        user_type: this.userType,
      };
      this.authService.updateProfileDetails(data).subscribe((res) => {
        if (res.status == true) {
          this.profileButtonActive = true;
          this.toastService.success(res.message);
          // delete data.api_token;
          const currentUserString = localStorage.getItem("currentUser");

          if (currentUserString) {
            let currentUser = JSON.parse(currentUserString);

            if (this.userType === "company") {
              currentUser.name = this.p["name"].value;
            } else {
              currentUser.username = this.p["name"].value;
            }
            currentUser.email = this.p["email"].value;

            localStorage.setItem("currentUser", JSON.stringify(currentUser));
          }
          // this.getUserDetails();
          // console.log(res);
        } else {
          this.profileButtonActive = true;
          this.toastService.error(res.message);
          // console.log(res);
        }
        // console.log(res);
      });
    } else {
      this.profileDetails.markAllAsTouched();
    }
  }

  onchangePassSubmit() {
    if (this.changePassForm.valid) {
      this.changePassButtonActive = false;

      const data = {
        new_password: this.c["newPassword"].value,
        old_password: this.c["oldPassword"].value,
        api_token: this.token,
        user_type: this.userType,
      };

      this.authService.updatePassword(data).subscribe(
        (res) => {
          if (res.status) {
            this.toastService.success(res.message);
          } else {
            this.toastService.error(res.message);
          }

          this.changePassForm.reset();
          this.changePassButtonActive = true;
        },
        (error) => {
          this.changePassButtonActive = true;
        }
      );
    } else {
      this.changePassButtonActive = true;
      this.changePassForm.markAllAsTouched();
    }
  }
}
