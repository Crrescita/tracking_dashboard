import { Component, OnInit, Output, EventEmitter } from "@angular/core";
import {
  FormGroup,
  FormBuilder,
  Validators,
  AbstractControl,
} from "@angular/forms";
import { ApiService } from "../../../core/services/api.service";
import { ToastrService } from "ngx-toastr";

@Component({
  selector: "app-home-sectiontwo",
  templateUrl: "./home-sectiontwo.component.html",
  styleUrl: "./home-sectiontwo.component.scss",
})
export class HomeSectiontwoComponent implements OnInit {
  @Output() titleChange = new EventEmitter<string>();
  formGroup!: FormGroup;
  dataExists: boolean = false;
  saveButtonActive: boolean = true;
  spinnerStatus: boolean = false;
  // id: number | null = null;

  constructor(
    private formBuilder: FormBuilder,
    private api: ApiService,
    private toastService: ToastrService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.getHeading();
  }

  initializeForm() {
    this.formGroup = this.formBuilder.group({
      title: ["", [Validators.required, Validators.maxLength(45)]],
      sub_title: ["", [Validators.required, Validators.maxLength(45)]],
    });
  }

  get s2() {
    return this.formGroup.controls;
  }

  // api's

  getHeading() {
    this.toggleSpinner(true);
    this.api.get("home-getHeading", "section-two-heading").subscribe(
      (res: any) => {
        this.toggleSpinner(false);

        if (res && res.status && res.data && res.data.length > 0) {
          this.dataExists = true;
          const data = res.data[0];
          this.formGroup.patchValue({
            title: data.heading,
            sub_title: data.sub_title,
          });
          this.titleChange.emit(data.heading);
        }
      },
      (error) => {
        this.toggleSpinner(false);
        console.error("Error fetching data:", error);
      }
    );
  }

  onSubmit() {
    if (this.formGroup.valid) {
      this.toggleSpinner(true);
      const formData = this.createFormData();
      // if (this.dataExists) {
      //   this.updateSection(formData);
      // } else {
      this.addSection(formData);
      // }
    } else {
      this.formGroup.markAllAsTouched();
    }
  }

  createFormData() {
    const formData = {
      heading: this.s2["title"].value,
      sub_title: this.s2["sub_title"].value,
      section_key: "section-two-heading",
    };
    return formData;
  }

  addSection(formData: any) {
    this.api.post("home-headingAdd", formData).subscribe(
      (res: any) => {
        this.handleResponse(res);
      },
      (error) => this.handleError(error)
    );
  }

  // updateSection(formData: FormData) {
  //   const urlId = this.id as number;
  //   this.api.put('home-headingUpdate', urlId, formData).subscribe(
  //     (res: any) => this.handleResponse(res),
  //     (error) => this.handleError(error)
  //   );
  // }

  toggleSpinner(isLoading: boolean) {
    this.spinnerStatus = isLoading;
    this.saveButtonActive = !isLoading;
  }

  handleResponse(res: any) {
    this.toggleSpinner(false);
    if (res.status === true) {
      this.getHeading();
      this.toastService.success("Data Saved Successfully!!");
    } else {
      this.toastService.error(res["message"]);
    }
  }

  handleError(error: any) {
    this.toggleSpinner(false);
  }
}
