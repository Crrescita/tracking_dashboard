import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import {
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
} from "@angular/forms";
import { ApiService } from "../../../../core/services/api.service";
import { ToastrService } from "ngx-toastr";
import { BsDatepickerConfig } from "ngx-bootstrap/datepicker";

@Component({
  selector: "app-add-employee",

  templateUrl: "./add-employee.component.html",
  styleUrl: "./add-employee.component.scss",
})
export class AddEmployeeComponent implements OnInit {
  breadCrumbItems!: Array<{}>;
  formGroup!: FormGroup;

  urlId: number | null = null;

  submitted: boolean = false;
  spinnerStatus: boolean = false;
  saveButtonActive: boolean = true;

  //employee image
  employeeselectedImage: any = null;
  employeeselectedImagePreview: any = null;
  employeeuploadedImage: any = null;

  company_id: any;

  bsConfig?: Partial<BsDatepickerConfig>;

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

  constructor(
    private route: ActivatedRoute,
    private formBuilder: FormBuilder,
    private api: ApiService,
    private router: Router,
    public toastService: ToastrService
  ) {}

  ngOnInit(): void {
    this.breadCrumbItems = [
      { label: "Employee", active: true },
      { label: "Add", active: true },
    ];

    this.route.params.subscribe((params) => {
      this.urlId = params["id"] ? Number(params["id"]) : null;
    });

    this.initializeForm();

    if (this.urlId) {
      this.getemployeeData();
    }

    const data = localStorage.getItem("currentUser");

    if (data) {
      const user = JSON.parse(data);
      this.company_id = user.id;
    }
  }

  initializeForm() {
    this.formGroup = this.formBuilder.group({
      name: ["", [Validators.maxLength(45), Validators.required]],
      address: ["", [Validators.maxLength(100), Validators.required]],
      dob: ["", [Validators.required]],
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
        [Validators.required, Validators.pattern("^((\\+91-?)|0)?[0-9]{10}$")],
      ],
      // password: ["", [Validators.required, Validators.minLength(5)]],
      status: ["", [Validators.required]],
      gender: ["", [Validators.required]],
      state: ["", [Validators.required]],
      city: ["", [Validators.required]],
      zip_code: ["", [Validators.required, Validators.maxLength(6)]],
      designation: ["", [Validators.required]],
      joining_date: [],
    });
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
  getemployeeData() {
    this.toggleSpinner(true);
    this.api.get("employees", this.urlId).subscribe(
      (res: any) => {
        if (res && res.status) {
          this.toggleSpinner(false);
          this.setemployeeDetails(res.data[0]);
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
        gender: data.gender,
        designation: data.designation,
        state: data.state,
        city: data.city,
        zip_code: data.zip_code,
      });

      // Set uploaded image
      this.employeeuploadedImage = data.image || "";
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
      if (this.urlId) {
        this.updateemployee(formData);
      } else {
        this.addemployee(formData);
      }
    } else {
      this.formGroup.markAllAsTouched();
    }
  }

  createFormData(): FormData {
    const formData = new FormData();
    formData.append("company_id", this.company_id);
    formData.append("name", this.f["name"].value);
    formData.append("mobile", this.f["mobile"].value);
    formData.append("email", this.f["email"].value);
    formData.append("address", this.f["address"].value);
    formData.append("dob", this.f["dob"].value);
    formData.append("employee_id", this.f["emp_id"].value);
    formData.append("status", this.f["status"].value);
    formData.append("joining_date", this.f["joining_date"].value);
    formData.append("gender", this.f["gender"].value);
    formData.append("designation", this.f["designation"].value);
    formData.append("state", this.f["state"].value);
    formData.append("city", this.f["city"].value);
    formData.append("zip_code", this.f["zip_code"].value);

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
    console.log("update");
    this.api.put("employees", urlId, formData).subscribe(
      (res: any) => this.handleResponse(res),
      (error) => this.handleError(error)
    );
  }

  handleResponse(res: any) {
    this.toggleSpinner(false);
    if (res.status === true) {
      this.resetForm();
      this.toastService.success("Data Saved Successfully!!");
      this.router.navigate(["employee"]);
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
}
