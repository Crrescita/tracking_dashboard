import {
  Component,
  OnInit,
  ViewChild,
  Input,
  Output,
  EventEmitter,
} from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import {
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  FormControl,
} from "@angular/forms";
import { ToastrService } from "ngx-toastr";
import { BsDatepickerConfig } from "ngx-bootstrap/datepicker";
import { ModalDirective } from "ngx-bootstrap/modal";
import { Location } from "@angular/common";
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-add-employee',
  templateUrl: './add-employee.component.html',
  styleUrl: './add-employee.component.scss'
})
export class AddEmployeeComponent {
 @Input() urlId: number | null = null;
  @Output() dataFetched = new EventEmitter<any>();
  @ViewChild("showModal", { static: false }) showModal?: ModalDirective;
  @ViewChild("showModalDepartment", { static: false })
  showModalDepartment?: ModalDirective;
  @ViewChild("showModalBranch", { static: false })
  showModalBranch?: ModalDirective;

  formGroup!: FormGroup;
  formGroupDesignation!: FormGroup;
  formGroupDepartment!: FormGroup;
  formGroupBranch!: FormGroup;

  empId:any;
  // urlId: number | null = null;

  submitted: boolean = false;
  spinnerStatus: boolean = false;
  saveButtonActive: boolean = true;

  //employee image
  employeeselectedImage: any = null;
  employeeselectedImagePreview: any = null;
  employeeuploadedImage: any = null;

  company_id: any= '8';

  bsConfig?: Partial<BsDatepickerConfig>;
    currentTab = 'personal-detail';

  states: string[] = [
    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    "Chhattisgarh",
    "Goa",
    "Gujarat",
    "Haryana",
    "Himachal Pradesh",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "Madhya Pradesh",
    "Maharashtra",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Odisha",
    "Punjab",
    "Rajasthan",
    "Sikkim",
    "Tamil Nadu",
    "Telangana",
    "Tripura",
    "Uttar Pradesh",
    "Uttarakhand",
    "West Bengal",
    "Andaman and Nicobar Islands",
    "Chandigarh",
    "Dadra and Nagar Haveli and Daman and Diu",
    "Lakshadweep",
    "Delhi",
    "Puducherry",
    "Ladakh",
    "Jammu and Kashmir",
  ];

  fieldTextType1: boolean = false;
  fieldTextType2: boolean = false;
  passwordValidations = {
    length: false,
    lower: false,
    upper: false,
    number: false,
    special: false,
  };
  useDefaultPassword: boolean = true;

  departments: any[] = [];
  designations: any[] = [];
  branch: any[] = [];

  timeValue: number = 0;
  convertedTime: any;
  originalTimerValue: any;

   documents = [
    {
      name: "Aadhaar",
      field: "aadhaar",
      fileField: "aadhaar_file",
      status: "Not Uploaded",
      documentNo: "",
      fileUrl: "",
    },
    {
      name: "PAN",
      field: "pan",
      fileField: "pan_file",
      status: "Not Uploaded",
      documentNo: "",
      fileUrl: "",
    },
    {
      name: "Driving License",
      field: "driving_license",
      fileField: "driving_license_file",
      status: "Not Uploaded",
      documentNo: "",
      fileUrl: "",
    },
    {
      name: "Voter ID",
      field: "voter",
      fileField: "voter_file",
      status: "Not Uploaded",
      documentNo: "",
      fileUrl: "",
    },
    {
      name: "UAN",
      field: "uan",
      fileField: "uan_file",
      status: "Not Uploaded",
      documentNo: "",
      fileUrl: "",
    },
  ];

  documentForm: FormGroup;

    selectedDocument: string = "";

      selectedImage: any = null;
  selectedImagePreview: any = null;
  uploadedImage: any = null;

    selectedFiles: File[] = [];

  constructor(
    private route: ActivatedRoute,
    private formBuilder: FormBuilder,
    private api: ApiService,
    private router: Router,
    public toastService: ToastrService,
    private location: Location,
  ) {
     this.route.queryParams.subscribe((params) => {
      this.currentTab = params["tab"] || "personal-detail";
    });

     this.documentForm = this.formBuilder.group({});
  }

  ngOnInit(): void {
    // this.route.params.subscribe((params) => {
    //   this.urlId = params["id"] ? Number(params["id"]) : null;
    // });

    this.initializeForm();

    if (this.urlId) {
      this.useDefaultPassword = false;

      this.getemployeeData();
    } else {
      this.convertTime();
    }

    // const data = localStorage.getItem("currentUser");

    // if (data) {
    //   const user = JSON.parse(data);
    //   this.company_id = user.id;
    // }
    this.updateFormControls();
    this.getDepartment();
    this.getDesignation();
    this.getBranch();

    this.formGroupDesignation = this.formBuilder.group({
      name: ["", [Validators.maxLength(45), Validators.required]],
      status: ["", [Validators.required]],
    });

    this.formGroupDepartment = this.formBuilder.group({
      name: ["", [Validators.maxLength(45), Validators.required]],
      status: ["", [Validators.required]],
    });

    this.formGroupBranch = this.formBuilder.group({
      name: ["", [Validators.maxLength(45), Validators.required]],
      status: ["", [Validators.required]],
    });
  }

  initializeForm() {
    this.formGroup = this.formBuilder.group(
      {
        name: ["", [Validators.maxLength(45), Validators.required]],
        address: ["", [Validators.maxLength(100)]],
        dob: [""],
        image: ["", this.imageValidator()],
        emp_id: ["", [Validators.required]],

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
        // , [Validators.required]
        status: [""],
        gender: ["", [Validators.required]],
        state: [""],
        city: [""],
        zip_code: ["", [Validators.maxLength(6)]],
        branch: ["", [Validators.required]],
        designation: ["", [Validators.required]],
        department: ["", [Validators.required]],
        joining_date: [""],
        emergency_contact_name: ["", [Validators.maxLength(45)]],
        emergency_contact_number: ["",  [
            Validators.pattern("^((\\+91-?)|0)?[0-9]{10}$"),
          ]],
        pf_no: [""],
        esi_no: [""],
        timer: [30, [Validators.required, Validators.min(0)]],
        unit: ["seconds", Validators.required], // Default unit
        password: [
          this.urlId ? "" : "123456",
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
        confirmPassword: [
          this.urlId ? "" : "123456",
          this.urlId ? [] : [Validators.required],
        ],
      },
      { validator: this.passwordMatchValidator }
    );
  }

  convertTime(): void {
    const time = this.formGroup.get("timer")?.value;
    const unit = this.formGroup.get("unit")?.value;

    if (!time || time < 0) {
      this.convertedTime = null;
      return;
    }

    switch (unit) {
      case "seconds":
        this.convertedTime = time * 1000;
        break;
      case "minutes":
        this.convertedTime = time * 60 * 1000;
        break;
      case "hours":
        this.convertedTime = time * 60 * 60 * 1000;
        break;
    }
  }

  imageValidator() {
    // return (control: AbstractControl) => {
    //   if (!this.urlId) {
    //     return Validators.required(control);
    //   } else {
    //     return null;
    //   }
    // };
  }

  toggleFieldTextType1(): void {
    this.fieldTextType1 = !this.fieldTextType1;
  }

  toggleFieldTextType2(): void {
    this.fieldTextType2 = !this.fieldTextType2;
  }

  // passwordMatchValidator(formGroup: FormGroup) {
  //   const password = formGroup.get("password")?.value;
  //   const confirmPassword = formGroup.get("confirmPassword")?.value;
  //   return password === confirmPassword ? null : { mismatch: true };
  // }

  passwordMatchValidator(formGroup: FormGroup) {
    const passwordControl = formGroup.get("password")?.value;
    const confirmPasswordControl = formGroup.get("confirmPassword")?.value;

    if (passwordControl && confirmPasswordControl) {
      const password = passwordControl;
      const confirmPassword = confirmPasswordControl;

      return password === confirmPassword ? null : { mismatch: true };
      // if (password !== confirmPassword) {
      //   confirmPasswordControl.setErrors({ mismatch: true });
      // } else {
      //   confirmPasswordControl.setErrors(null);
      // }
    }

    return null;
  }

  // passwordMatchValidator(formGroup: FormGroup) {
  //   const passwordControl = formGroup.get("password") as FormControl;
  //   const confirmPasswordControl = formGroup.get(
  //     "confirmPassword"
  //   ) as FormControl;

  //   if (passwordControl && confirmPasswordControl) {
  //     const password = passwordControl.value;
  //     const confirmPassword = confirmPasswordControl.value;

  //     return password === confirmPassword ? null : { mismatch: true };

  //     // if (password !== confirmPassword) {
  //     //
  //     //   confirmPasswordControl.setErrors({ mismatch: true });
  //     // } else {
  //     //   confirmPasswordControl.setErrors(null);
  //     // }
  //   }

  //   return null;
  // }

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

  onCheckboxChange(event: any): void {
    this.useDefaultPassword = event.target.checked;
    this.updateFormControls();
  }

  updateFormControls(): void {
    if (this.useDefaultPassword) {
      this.formGroup.get("password")?.setValue("123456");
      this.formGroup.get("confirmPassword")?.setValue("123456");
      this.formGroup.get("password")?.disable();
      this.formGroup.get("confirmPassword")?.disable();
    } else {
      this.formGroup.get("password")?.enable();
      this.formGroup.get("confirmPassword")?.enable();
      this.formGroup.get("password")?.setValue("");
      this.formGroup.get("confirmPassword")?.setValue("");
    }
  }

  get f() {
    return this.formGroup.controls;
  }

  get d() {
    return this.formGroupDesignation.controls;
  }

  get de() {
    return this.formGroupDepartment.controls;
  }

  get br() {
    return this.formGroupBranch.controls;
  }

  // API Methods

  getBranch() {
    this.toggleSpinner(true);
    this.api
      .getwithoutid(`branch?status=active&company_id=${this.company_id}`)
      .subscribe(
        (res: any) => {
          this.toggleSpinner(false);
          if (res && res.status) {
            this.branch = res.data;
          } else {
            this.branch = [];
          }
        },
        (error) => {
          this.toggleSpinner(false);
          this.handleError(
            error.message || "An error occurred while fetching data"
          );
        }
      );
  }

  getDepartment() {
    this.toggleSpinner(true);
    this.api
      .getwithoutid(`department?status=active&company_id=${this.company_id}`)
      .subscribe(
        (res: any) => {
          this.toggleSpinner(false);
          if (res && res.status) {
            this.departments = res.data;
          } else {
            this.departments = [];
          }
        },
        (error) => {
          this.toggleSpinner(false);
          this.handleError(
            error.message || "An error occurred while fetching data"
          );
        }
      );
  }

  getDesignation() {
    this.toggleSpinner(true);
    this.api
      .getwithoutid(`designation?status=active&company_id=${this.company_id}`)
      .subscribe(
        (res: any) => {
          this.toggleSpinner(false);
          if (res && res.status) {
            this.designations = res.data;
          } else {
            this.designations = [];
          }
        },
        (error) => {
          this.toggleSpinner(false);
          this.handleError(
            error.message || "An error occurred while fetching data"
          );
        }
      );
  }


  fetchEmployeeByMobile() {
  const mobile = this.formGroup.value.mobile;
  if (!this.formGroup.controls['mobile'].valid) {
    return;
  }

  // const company_id = this.currentCompanyId; // or fetch from local/session storage

  this.api.getwithoutid(`employeesBy-mobile?mobile=${mobile}&company_id=${this.company_id}`).subscribe((res: any) => {
    if (res.status) {
      const emp = res.data[0];
      console.log("Employee found:", emp);
      this.toastService.success("Employee data fetched!");
      // Optionally patch form:
      // this.formGroup.patchValue({
      //   name: emp.name,
      //   email: emp.email,
      //   // ...other fields
      // });
this.urlId = res.data[0].id;
this.empId = res.data[0].id;
       this.toggleSpinner(false);
          this.setemployeeDetails(res.data[0]);
          this.dataFetched.emit(res.data[0]);
    } else {
      this.toastService.warning("No employee found with this mobile number");
    }
  });
}

  getemployeeData() {
    this.toggleSpinner(true);
    this.api.get("employees", this.urlId).subscribe(
      (res: any) => {
        if (res && res.status) {
          this.toggleSpinner(false);
          this.setemployeeDetails(res.data[0]);
          this.dataFetched.emit(res.data[0]);
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

  setemployeeDetails(data: any) {
    if (data) {
      this.formGroup.patchValue({
        name: data.name,
        address: data.address,
        dob: data.dob,
        emp_id: data.employee_id,
        email: data.email,
        password: data.password,
        status: data.status,
        mobile: data.mobile,
        joining_date: data.joining_date,
        emergency_contact_name: data.emergency_contact_name,
        emergency_contact_number:  data.emergency_contact_number,
        pf_no: data.pf_no,
        esi_no:  data.esi_no,
        gender: data.gender,
        designation: data.designation,
        branch: data.branch,
        department: data.department,
        state: data.state,
        city: data.city,
        zip_code: data.zip_code,
        timer: data.timer ? data.timer / 1000 : null,
      });
      this.originalTimerValue = data.timer ? data.timer / 1000 : null;
      // Set uploaded image
      this.employeeuploadedImage = data.image || "";
    }
  }

  toggleSpinner(isLoading: boolean) {
    this.spinnerStatus = isLoading;
    this.saveButtonActive = !isLoading;
    this.submitted = isLoading;
  }

  isTimerChanged(): boolean {
    const currentTimerValue = this.formGroup.get("timer")?.value || null;

    return currentTimerValue !== this.originalTimerValue;
  }

  onSubmit() {
    if (this.formGroup.valid) {
      this.toggleSpinner(true);

      if (this.isTimerChanged()) {
        this.convertTime();
      }
      const formData = this.createFormData();
      if (this.urlId) {
        this.updateemployee(formData);
      } else {
        this.addemployee(formData);
      }
    } else {
      this.formGroup.markAllAsTouched();
    }
  }

  capitalizeWords(str: string): string {
    return str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
  }

  createFormData(): FormData {
    const formData = new FormData();
    formData.append("company_id", this.company_id);
    formData.append("name", this.capitalizeWords(this.f["name"].value.trim()));
    formData.append("mobile", this.f["mobile"].value);
    formData.append("email", this.f["email"].value);
    formData.append("address", this.f["address"].value);
    formData.append("dob", this.f["dob"].value);
    formData.append("employee_id", this.f["emp_id"].value);
    // this.f["status"].value
    formData.append("status", 'active');
    formData.append("joining_date", this.f["joining_date"].value);
    formData.append("emergency_contact_name", this.f["emergency_contact_name"].value);
    formData.append("emergency_contact_number", this.f["emergency_contact_number"].value);
    formData.append("pf_no", this.f["pf_no"].value);
    formData.append("esi_no", this.f["esi_no"].value);
    formData.append("gender", this.f["gender"].value);
    formData.append("branch", this.f["branch"].value);
    formData.append("designation", this.f["designation"].value);
    formData.append("department", this.f["department"].value);
    formData.append("state", this.f["state"].value);
    formData.append("city", this.f["city"].value);
    formData.append("zip_code", this.f["zip_code"].value);
    if (this.convertedTime) {
      formData.append("timer", this.convertedTime);
    }
    if (this.f["password"].value) {
      formData.append("password", this.f["password"].value);
    }

    if (this.employeeselectedImage) {
      formData.append("image", this.employeeselectedImage);
    }

    return formData;
  }

  addemployee(formData: FormData) {
    this.api.post("employees", formData).subscribe(
      (res: any) => this.handleResponse(res),
      (error) => this.handleError(error)
    );
  }

  updateemployee(formData: FormData) {
    const urlId = this.urlId as number;
    this.api.put("employees", urlId, formData).subscribe(
      (res: any) => this.handleResponse(res),
      (error) => this.handleError(error)
    );
  }

  handleResponse(res: any) {
    this.toggleSpinner(false);
    if (res.status === true) {
      // this.resetForm();
      this.toastService.success("Data Saved Successfully!!");
      this.empId =  res.id;
       this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: 'background-verification' },
      queryParamsHandling: 'merge',
    });
      // this.router.navigate(["employee"]);
    } else {
      this.toastService.error(res["message"]);
    }
  }

  resetForm() {
    this.employeeselectedImage = null;
    this.formGroup.reset();
  }

  handleError(error: any) {
    this.toggleSpinner(false);
  }

  // employee logo upload
  employeeimageSelect(event: any) {
    const employeeselectedFile = event.target.files[0];
    if (employeeselectedFile) {
      this.employeeselectedImage = employeeselectedFile;
      this.employeeselectedImagePreview =
        URL.createObjectURL(employeeselectedFile);
    }
  }
  employeeremoveImage() {
    this.employeeselectedImage = null;
    this.employeeselectedImagePreview = null;
  }

  onAddBranch() {
    this.resetFormBranch();
    this.showModalBranch?.show();
    var modaltitle = document.querySelector(".modal-title") as HTMLAreaElement;
    modaltitle.innerHTML = "Add Branch";
    var modalbtn = document.getElementById("add-btn") as HTMLAreaElement;
    modalbtn.innerHTML = "Add";
  }

  resetFormBranch() {
    this.formGroupBranch.reset();

    this.formGroupBranch.patchValue({
      name: "",
      status: "",
    });
  }

  onSubmitBranch() {
    if (this.formGroupBranch.valid) {
      this.toggleSpinner(true);
      const formData = this.createFormDataBranch();
      this.addBranch(formData);
    } else {
      this.formGroupBranch.markAllAsTouched();
    }
  }

  createFormDataBranch() {
    const formData = {
      company_id: this.company_id,
      name: this.br["name"].value,
      status: this.br["status"].value,
    };
    return formData;
  }

  addBranch(formData: any) {
    this.api.post("branch", formData).subscribe(
      (res: any) => this.handleResponseBranch(res),
      (error) => this.handleError(error)
    );
  }

  handleResponseBranch(res: any) {
    this.toggleSpinner(false);
    if (res.status === true) {
      this.formGroupBranch.reset();
      this.toastService.success("Branch Created Successfully!!");
      this.getBranch();
      this.showModalBranch?.hide();
    } else {
      this.toastService.error(res["message"]);
    }
  }
  // desi
  onAdd() {
    this.resetFormDes();
    this.showModal?.show();
    var modaltitle = document.querySelector(".modal-title") as HTMLAreaElement;
    modaltitle.innerHTML = "Add Designation";
    var modalbtn = document.getElementById("add-btn") as HTMLAreaElement;
    modalbtn.innerHTML = "Add";
  }

  resetFormDes() {
    this.formGroupDesignation.reset();
    // Set default values if necessary
    this.formGroupDesignation.patchValue({
      name: "",
      status: "",
    });
  }

  onSubmitDes() {
    if (this.formGroupDesignation.valid) {
      this.toggleSpinner(true);
      const formData = this.createFormDataDes();
      this.adddes(formData);
    } else {
      this.formGroupDesignation.markAllAsTouched();
    }
  }

  createFormDataDes() {
    const formData = {
      company_id: this.company_id,
      name: this.d["name"].value,
      status: this.d["status"].value,
    };
    return formData;
  }

  adddes(formData: any) {
    this.api.post("designation", formData).subscribe(
      (res: any) => this.handleResponseDes(res),
      (error) => this.handleError(error)
    );
  }

  handleResponseDes(res: any) {
    this.toggleSpinner(false);
    if (res.status === true) {
      this.formGroupDesignation.reset();
      this.toastService.success("Designation Created Successfully!!");
      this.getDesignation();
      this.showModal?.hide();
    } else {
      this.toastService.error(res["message"]);
    }
  }

  // department
  onAdddep() {
    this.resetFormDes();
    this.showModalDepartment?.show();
    var modaltitle = document.querySelector(".modal-title") as HTMLAreaElement;
    modaltitle.innerHTML = "Add Designation";
    var modalbtn = document.getElementById("add-btn") as HTMLAreaElement;
    modalbtn.innerHTML = "Add";
  }

  resetFormDep() {
    this.formGroupDepartment.reset();
    // Set default values if necessary
    this.formGroupDepartment.patchValue({
      name: "",
      status: "",
    });
  }

  onSubmitDep() {
    if (this.formGroupDepartment.valid) {
      this.toggleSpinner(true);
      const formData = this.createFormDataDep();
      this.adddep(formData);
    } else {
      this.formGroupDepartment.markAllAsTouched();
    }
  }

  createFormDataDep() {
    const formData = {
      company_id: this.company_id,
      name: this.de["name"].value,
      status: this.de["status"].value,
    };
    return formData;
  }

  adddep(formData: any) {
    this.api.post("department", formData).subscribe(
      (res: any) => this.handleResponseDep(res),
      (error) => this.handleError(error)
    );
  }

  handleResponseDep(res: any) {
    this.toggleSpinner(false);
    if (res.status === true) {
      this.formGroupDepartment.reset();
      this.toastService.success("Department Created Successfully!!");
      this.getDepartment();
      this.showModalDepartment?.hide();
    } else {
      this.toastService.error(res["message"]);
    }
  }

  goBack(): void {
    this.location.back();
  }
  change(event: any) {}

    changeTab(tab: string) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: tab },
      queryParamsHandling: 'merge',
    });
  }

}
