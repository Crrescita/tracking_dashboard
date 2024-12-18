import { environment } from "./../../../../../environments/environment.prod";
import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import {
  FormBuilder,
  Validators,
  FormGroup,
  AbstractControl,
} from "@angular/forms";
import { ApiService } from "../../../../core/services/api.service";
import { ToastrService } from "ngx-toastr";

@Component({
  selector: "app-add-company",

  templateUrl: "./add-company.component.html",
  styleUrl: "./add-company.component.scss",
})
export class AddCompanyComponent implements OnInit {
  breadCrumbItems!: Array<{}>;
  formGroup!: FormGroup;

  urlId: number | null = null;

  submitted: boolean = false;
  spinnerStatus: boolean = false;
  saveButtonActive: boolean = true;

  //company image
  companyselectedImage: any = null;
  companyselectedImagePreview: any = null;
  companyuploadedImage: any = null;

  fieldTextType!: boolean;

  fieldTextType1: boolean = false;
  fieldTextType2: boolean = false;

  passwordValidations = {
    length: false,
    lower: false,
    upper: false,
    number: false,
    special: false,
  };

  constructor(
    private route: ActivatedRoute,
    private formBuilder: FormBuilder,
    private api: ApiService,
    private router: Router,
    public toastService: ToastrService
  ) {}

  ngOnInit(): void {
    this.breadCrumbItems = [
      { label: "Compay", active: true },
      { label: "Add", active: true },
    ];

    this.route.params.subscribe((params) => {
      this.urlId = params["id"] ? Number(params["id"]) : null;
    });

    this.initializeForm();

    if (this.urlId) {
      this.getCompanyData();
    }
  }

  initializeForm() {
    this.formGroup = this.formBuilder.group(
      {
        name: ["", [Validators.maxLength(45), Validators.required]],
        address: ["", [Validators.maxLength(100), Validators.required]],
        no_of_emp: ["", [Validators.required]],
        logo: ["", this.imageValidator()],
        cin_id: ["", [Validators.required]],
        tax_no: ["", [Validators.required]],
        website_url: ["", [Validators.required]],
        email: [
          "",
          [
            Validators.required,
            Validators.email,
            Validators.pattern("^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$"),
          ],
        ],
        mobile: [
          "",
          [
            Validators.required,
            Validators.pattern("^((\\+91-?)|0)?[0-9]{10}$"),
          ],
        ],
        business_type: ["", [Validators.maxLength(45), Validators.required]],
        // password: ["", [this.imageValidator(), Validators.minLength(5)]],
        password: [
          "",
          this.urlId
            ? [
                Validators.pattern(
                  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
                ),
              ]
            : [
                Validators.required,
                Validators.pattern(
                  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
                ),
              ],
        ],
        confirmPassword: ["", this.urlId ? [] : [Validators.required]],
        status: ["", [Validators.required]],
        city: ["", [Validators.required]],
        state: ["", [Validators.required]],
        zip_code: ["", [Validators.required]],
        contact_person: ["", [Validators.required]],
        check_out_time: ["", [Validators.required]],
        check_in_time_start: ["", [Validators.required]],
        check_in_time_end: ["", [Validators.required]],
      },
      { validator: this.passwordMatchValidator }
    );
  }

  passwordMatchValidator(formGroup: FormGroup) {
    const passwordControl = formGroup.get("password")?.value;
    const confirmPasswordControl = formGroup.get("confirmPassword")?.value;

    if (passwordControl && confirmPasswordControl) {
      const password = passwordControl;
      const confirmPassword = confirmPasswordControl;

      return password === confirmPassword ? null : { mismatch: true };
    }

    return null;
  }

  checkPasswordPattern() {
    const password = this.formGroup.get("password")?.value;
    this.passwordValidations.length = password.length >= 8;
    this.passwordValidations.lower = /[a-z]/.test(password);
    this.passwordValidations.upper = /[A-Z]/.test(password);
    this.passwordValidations.number = /\d/.test(password);
    this.passwordValidations.special = /[@$!%*?&]/.test(password);

    const confirmPasswordControl = this.formGroup.get("confirmPassword");

    if (password) {
      confirmPasswordControl?.setValidators([Validators.required]);
    } else {
      confirmPasswordControl?.clearValidators();
    }
    confirmPasswordControl?.updateValueAndValidity();
  }

  imageValidator() {
    return (control: AbstractControl) => {
      if (!this.urlId) {
        return Validators.required(control);
      } else {
        return null;
      }
    };
  }

  get f() {
    return this.formGroup.controls;
  }

  // API Methods
  getCompanyData() {
    this.toggleSpinner(true);
    this.api.get("company", this.urlId).subscribe(
      (res: any) => {
        if (res && res.status) {
          this.toggleSpinner(false);
          this.setCompanyDetails(res.data[0]);
        } else {
          this.handleError("Unexpected response format");
        }
      },
      (error) => {
        this.handleError(
          error.message || "An error occurred while fetching data"
        );
      }
    );
  }

  setCompanyDetails(data: any) {
    if (data) {
      // Update form values
      this.formGroup.patchValue({
        name: data.name,
        address: data.address,
        no_of_emp: data.no_of_emp,
        cin_id: data.cin_id,
        tax_no: data.tax_no,
        email: data.email,
        // password: data.password,
        status: data.status,
        mobile: data.mobile,
        business_type: data.business_type,
        city: data.city,
        state: data.state,
        zip_code: data.zip_code,
        contact_person: data.contact_person,
        website_url: data.website_url,
        check_in_time_start: data.check_in_time_start,
        check_in_time_end: data.check_in_time_end,
        check_out_time: data.check_out_time,
      });

      // Set uploaded image
      this.companyuploadedImage = data.logo || "";
    }
  }

  toggleSpinner(isLoading: boolean) {
    this.spinnerStatus = isLoading;
    this.saveButtonActive = !isLoading;
    this.submitted = isLoading;
  }

  onSubmit() {
    if (this.formGroup.valid) {
      this.toggleSpinner(true);
      const formData = this.createFormData();

      const checkInStart = this.f["check_in_time_start"].value;
      const checkInEnd = this.f["check_in_time_end"].value;
      const checkOutTime = this.f["check_out_time"].value;

      if (checkInStart > checkInEnd) {
        this.toastService.error(
          "Check-in start time must be before the end time."
        );
        return;
        this.toggleSpinner(false);
      }
      if (checkOutTime <= checkInEnd) {
        this.toastService.error(
          "Check-out time must be after the check-in end time."
        );
        return;
        this.toggleSpinner(false);
      }

      if (checkOutTime <= checkInStart) {
        this.toastService.error(
          "Check-out time must be after the check-in start time."
        );
        return;
        this.toggleSpinner(false);
      }

      if (this.urlId) {
        this.updateCompany(formData);
      } else {
        this.addCompany(formData);
      }
    } else {
      this.formGroup.markAllAsTouched();
    }
  }

  createFormData(): FormData {
    const formData = new FormData();
    formData.append("name", this.f["name"].value);
    formData.append("address", this.f["address"].value);
    formData.append("no_of_emp", this.f["no_of_emp"].value);
    formData.append("cin_id", this.f["cin_id"].value);
    formData.append("email", this.f["email"].value);
    if (this.f["password"].value) {
      formData.append("password", this.f["password"].value);
    }
    formData.append("status", this.f["status"].value);
    formData.append("mobile", this.f["mobile"].value);
    formData.append("business_type", this.f["business_type"].value);
    formData.append("tax_no", this.f["tax_no"].value);
    formData.append("city", this.f["city"].value);
    formData.append("state", this.f["state"].value);
    formData.append("zip_code", this.f["zip_code"].value);
    formData.append("contact_person", this.f["contact_person"].value);
    formData.append("website_url", this.f["website_url"].value);
    formData.append("check_out_time", this.f["check_out_time"].value);
    formData.append("check_in_time_start", this.f["check_in_time_start"].value);
    formData.append("check_in_time_end", this.f["check_in_time_end"].value);
    if (this.companyselectedImage) {
      formData.append("logo", this.companyselectedImage);
    }

    return formData;
  }

  addCompany(formData: FormData) {
    this.api.post("company", formData).subscribe(
      (res: any) => this.handleResponse(res),
      (error) => this.handleError(error)
    );
  }

  updateCompany(formData: FormData) {
    const urlId = this.urlId as number;
    this.api.put("company", urlId, formData).subscribe(
      (res: any) => this.handleResponse(res),
      (error) => this.handleError(error)
    );
  }

  handleResponse(res: any) {
    this.toggleSpinner(false);
    if (res.status === true) {
      this.resetForm();
      this.toastService.success("Data Saved Successfully!!");
      this.router.navigate(["company"]);
    } else {
      this.toastService.error(res["message"]);
    }
  }

  resetForm() {
    this.companyselectedImage = null;
    this.formGroup.reset();
  }

  handleError(error: any) {
    this.toggleSpinner(false);
  }

  // company logo upload
  companyimageSelect(event: any) {
    const companyselectedFile = event.target.files[0];
    if (companyselectedFile) {
      this.companyselectedImage = companyselectedFile;
      this.companyselectedImagePreview =
        URL.createObjectURL(companyselectedFile);
    }
  }
  companyremoveImage() {
    this.companyselectedImage = null;
    this.companyselectedImagePreview = null;
  }

  toggleFieldTextType() {
    this.fieldTextType = !this.fieldTextType;
  }

  toggleFieldTextType1(): void {
    this.fieldTextType1 = !this.fieldTextType1;
  }

  toggleFieldTextType2(): void {
    this.fieldTextType2 = !this.fieldTextType2;
  }
}
