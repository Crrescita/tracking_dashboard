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
  selector: "app-home-sectionfour",
  templateUrl: "./home-sectionfour.component.html",
  styleUrl: "./home-sectionfour.component.scss",
})
export class HomeSectionfourComponent implements OnInit {
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
    });
  }

  get s2() {
    return this.formGroup.controls;
  }

  // api's

  getHeading() {
    this.toggleSpinner(true);
    this.api.get("home-getHeading", "section-four-heading").subscribe(
      (res: any) => {
        this.toggleSpinner(false);

        if (res && res.status && res.data && res.data.length > 0) {
          this.dataExists = true;
          const data = res.data[0];
          this.formGroup.patchValue({
            title: data.heading,
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

  // getHeading() {
  //   const sectionKeysToMatch = ["section-one-heading", "section-two-heading"];

  //   this.toggleSpinner(true);
  //   this.api.getwithoutid("home-getHeading").subscribe(
  //     (res: any) => {
  //       this.toggleSpinner(false);

  //       if (res && res.status && res.data && res.data.length > 0) {
  //         for (const sectionKey of sectionKeysToMatch) {
  //           const matchingData = res.data.find(
  //             (item: any) => item.section_key === sectionKey
  //           );

  //           if (matchingData) {
  //             switch (sectionKey) {
  //               case "section-two-heading":
  //                 this.formGroup.patchValue({
  //                   title: matchingData.heading,
  //                 });
  //                 this.dataExists = true;
  //                 this.titleChange.emit(matchingData.heading);

  //                 break;
  //             }
  //           }
  //         }
  //       }
  //     },
  //     (error) => {
  //       this.toggleSpinner(false);
  //       console.error("Error fetching data:", error);
  //     }
  //   );
  // }

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
      sub_title: "",
      section_key: "section-two-heading",
    };
    // const formData = new FormData();
    // formData.append('heading', this.s2['title'].value);
    // formData.append('section_key', 'section-one-heading');
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
