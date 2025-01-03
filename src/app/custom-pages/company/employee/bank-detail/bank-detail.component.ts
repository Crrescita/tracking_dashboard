import { Component, OnInit, Input, EventEmitter, Output } from "@angular/core";
import { FormGroup, FormBuilder, Validators } from "@angular/forms";
import { ToastrService } from "ngx-toastr";
import { ApiService } from "../../../../core/services/api.service";

@Component({
  selector: "app-bank-detail",
  templateUrl: "./bank-detail.component.html",
  styleUrl: "./bank-detail.component.scss",
})
export class BankDetailComponent implements OnInit {
  @Input() urlId: number | null = null;
  @Output() bankDataFetched = new EventEmitter<boolean>();
  company_id: any;
  formGroup!: FormGroup;
  submitted: boolean = false;
  spinnerStatus: boolean = false;
  saveButtonActive: boolean = true;

  constructor(
    private formBuilder: FormBuilder,
    public toastService: ToastrService,
    private api: ApiService
  ) {}

  ngOnInit(): void {
    const data = localStorage.getItem("currentUser");

    if (data) {
      const user = JSON.parse(data);
      this.company_id = user.id;
    }

    this.formGroup = this.formBuilder.group({
      acc_holder_name: [
        "",
        [
          Validators.required,
          Validators.maxLength(45),
          Validators.pattern(/^[a-zA-Z\s]+$/),
        ],
      ],
      acc_number: ["", [Validators.required, Validators.pattern(/^\d{9,18}$/)]],
      bank_name: [
        "",
        [
          Validators.required,
          Validators.maxLength(100),
          Validators.pattern(/^[a-zA-Z\s]+$/),
        ],
      ],
      ifsc_code: [
        "",
        [Validators.required, Validators.pattern(/^[A-Z]{4}0[A-Z0-9]{6}$/)],
      ],
    });
    if (this.urlId) {
      this.getBankDetail();
    }
  }

  getBankDetail() {
    this.toggleSpinner(true);
    const url = `bankDetail?emp_id=${this.urlId}`;
    this.api.getwithoutid(url).subscribe(
      (res: any) => {
        if (res && res.status) {
          const data = res.data[0];
          this.toggleSpinner(false);
          this.formGroup.patchValue({
            acc_holder_name: data.acc_holder_name,
            acc_number: data.acc_number,
            bank_name: data.bank_name,
            ifsc_code: data.ifsc_code,
          });
          this.bankDataFetched.emit(true);

          // this.departmentData = res.data || [];
          // // this.departmentDataList = res.data || [];
          // this.filterdata();
        } else {
          // this.departmentData = [];
          // this.departmentDataList = [];
          this.handleError("Unexpected response format");
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

  toggleSpinner(isLoading: boolean) {
    this.spinnerStatus = isLoading;
    this.saveButtonActive = !isLoading;
    this.submitted = isLoading;
  }

  onSubmit() {
    if (!this.urlId) {
      this.toastService.error("Please add Personal Details First");
    } else {
      if (this.formGroup.valid) {
        this.toggleSpinner(true);
        const formData = this.createFormData();
        if (this.urlId) {
          this.update(formData);
        } else {
          this.add(formData);
        }
      } else {
        this.formGroup.markAllAsTouched();
      }
    }
  }

  get f() {
    return this.formGroup.controls;
  }

  createFormData() {
    const formData = {
      emp_id: this.urlId,
      company_id: this.company_id,
      acc_holder_name: this.f["acc_holder_name"].value,
      acc_number: this.f["acc_number"].value,
      bank_name: this.f["bank_name"].value,
      ifsc_code: this.f["ifsc_code"].value,
    };
    return formData;
  }

  add(formData: any) {
    this.api.post("bankDetail", formData).subscribe(
      (res: any) => this.handleResponse(res),
      (error) => this.handleError(error)
    );
  }

  update(formData: any) {
    const id = this.urlId as number;
    this.api.put("bankDetail", id, formData).subscribe(
      (res: any) => this.handleResponse(res),
      (error) => this.handleError(error)
    );
  }

  handleResponse(res: any) {
    this.toggleSpinner(false);
    if (res["status"] === true) {
      // this.formGroup.reset();
      this.toastService.success("Data Saved Successfully!!");
      // this.getDesignation();
    } else {
      this.toastService.error(res["message"]);
    }
  }

  handleError(error: any) {
    this.toggleSpinner(false);
  }
}
