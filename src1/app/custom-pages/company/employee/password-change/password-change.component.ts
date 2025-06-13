import { FormGroup, FormBuilder, Validators } from "@angular/forms";
import { ToastrService } from "ngx-toastr";
import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  SimpleChanges,
  OnChanges,
} from "@angular/core";
import { ApiService } from "../../../../core/services/api.service";
import { ActivatedRoute } from "@angular/router";
import { PageChangedEvent } from "ngx-bootstrap/pagination";
import { cloneDeep } from "lodash";

@Component({
  selector: "app-password-change",
  templateUrl: "./password-change.component.html",
  styleUrl: "./password-change.component.scss",
})
export class PasswordChangeComponent implements OnInit {
  @Input() companyId!: string;
  @Input() employeeChange: any;
  fieldTextType!: boolean;
  fieldTextType1!: boolean;
  fieldTextType2!: boolean;

  urlId: number | null = null;

  submitted: boolean = false;
  spinnerStatus: boolean = false;
  saveButtonActive: boolean = true;

  loginDetails: any = [];
  loginDetailsList: any = [];

  //table
  term: string = "";
  currentPage = 1;
  currentPagesss = 3;
  totalItems = 0;
  itemsPerPage = 10;
  endItem: any;

  formGroup!: FormGroup;

  passwordValidations = {
    length: false,
    lower: false,
    upper: false,
    number: false,
  };

  constructor(
    private route: ActivatedRoute,
    private api: ApiService,
    public toastService: ToastrService,
    private formBuilder: FormBuilder
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes["employeeChange"] &&
      !changes["employeeChange"].isFirstChange()
    ) {
      const newUrlId = changes["employeeChange"].currentValue;

      this.urlId = newUrlId;

      this.getemployeeLoginDetail();
    }
  }

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.urlId = params["id"] ? Number(params["id"]) : null;
    });

    if (this.urlId && this.companyId) {
      this.getemployeeLoginDetail();
    }

    this.initializeForm();
  }

  onEmployeeChange(newEmployeeData: any): void {
    // this.employeeChange.emit(newEmployeeData);
    console.log(newEmployeeData);
    // this.urlId = newEmployeeId;
  }

  initializeForm() {
    this.formGroup = this.formBuilder.group(
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
    const password = this.formGroup.get("password")?.value;
    this.passwordValidations.length = password.length >= 8;
    this.passwordValidations.lower = /[a-z]/.test(password);
    this.passwordValidations.upper = /[A-Z]/.test(password);
    this.passwordValidations.number = /\d/.test(password);
  }

  get f() {
    return this.formGroup.controls;
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

  // api's

  toggleSpinner(isLoading: boolean) {
    this.spinnerStatus = isLoading;
    this.saveButtonActive = !isLoading;
    this.submitted = isLoading;
  }

  getemployeeLoginDetail() {
    this.toggleSpinner(true);
    const url = `getEmpLoginDetail?emp_id=${this.urlId}company_id=${this.companyId}`;
    this.api.getwithoutid(url).subscribe(
      (res: any) => {
        this.toggleSpinner(false);
        if (res && res.status) {
          this.loginDetails = res.data || [];
          this.loginDetailsList = res.data || [];
          this.loginDetails = cloneDeep(this.loginDetailsList.slice(0, 10));
          // this.updatePagination();
          // this.updateDisplayedItems();
        } else {
          this.loginDetails = [];
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

  // change password submit
  onSubmit() {
    if (this.formGroup.valid) {
      this.toggleSpinner(true);
      const formData = this.createFormData();

      this.updateemployee(formData);
    } else {
      this.formGroup.markAllAsTouched();
    }
  }

  createFormData(): FormData {
    const formData = new FormData();
    formData.append("company_id", this.companyId);
    formData.append("password", this.f["password"].value);

    return formData;
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
      this.formGroup.reset();
      this.toastService.success("Data Saved Successfully!!");
    } else {
      this.toastService.error(res["message"]);
    }
  }

  handleError(error: any) {
    this.toggleSpinner(false);
  }

  // table

  filterdata() {
    if (this.term) {
      this.loginDetails = this.loginDetailsList.filter((el: any) => {
        const searchTerm = this.term.toLowerCase();
        return (
          el.name.toLowerCase().includes(searchTerm) ||
          el.employee_id.toLowerCase().includes(searchTerm) ||
          el.status.toLowerCase().includes(searchTerm)
        );
      });
    } else {
      this.loginDetails = this.loginDetailsList.slice(0, 5);
    }
    // noResultElement
    this.updateNoResultDisplay();
  }

  // no result
  updateNoResultDisplay() {
    const noResultElement = document.querySelector(".noresult") as HTMLElement;
    const paginationElement = document.getElementById(
      "pagination-element"
    ) as HTMLElement;
    if (this.term && this.loginDetails.length === 0) {
      noResultElement.style.display = "block";
      paginationElement.classList.add("d-none");
    } else {
      noResultElement.style.display = "none";
      paginationElement.classList.remove("d-none");
    }
  }

  pageChanged(event: PageChangedEvent): void {
    this.currentPage = event.page;
    this.updateDisplayedItems();
  }
  updatePagination() {
    // Update total items for pagination
    this.totalItems = this.loginDetailsList.length;
  }
  updateDisplayedItems(): void {
    const startItem = (this.currentPage - 1) * this.itemsPerPage;
    this.endItem = this.currentPage * this.itemsPerPage;
    this.loginDetails = this.loginDetailsList.slice(startItem, this.endItem);
  }
}
