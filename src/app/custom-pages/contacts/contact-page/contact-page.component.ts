import { Component, OnInit, Output, EventEmitter } from "@angular/core";
import {
  FormGroup,
  FormBuilder,
  Validators,
  AbstractControl,
} from "@angular/forms";
import { ToastrService } from "ngx-toastr";
import { ApiService } from "../../../core/services/api.service";
import { Editor, TOOLBAR_FULL } from "ngx-editor";

@Component({
  selector: "app-contact-page",
  templateUrl: "./contact-page.component.html",
  styleUrl: "./contact-page.component.scss",
})
export class ContactPageComponent implements OnInit {
  @Output() titleChange = new EventEmitter<string>();
  // breadCrumbItems!: Array<{}>;
  formGroup!: FormGroup;
  dataExists: boolean = false;
  saveButtonActive: boolean = true;
  spinnerStatus: boolean = false;
  id: number | null = null;

  // editor
  editor: any = Editor;
  toolbar: any = TOOLBAR_FULL;
  editordescription: any = Editor;

  constructor(
    private formBuilder: FormBuilder,
    private api: ApiService,
    private toastService: ToastrService
  ) {}

  ngOnInit(): void {
    // this.breadCrumbItems = [
    //   { label: "Pages", active: true },
    //   { label: "Contact", active: true },
    // ];

    this.editordescription = new Editor();

    this.initializeForm();
    this.getHeading();
  }

  initializeForm() {
    this.formGroup = this.formBuilder.group({
      title: ["", [Validators.required, Validators.maxLength(45)]],
      description: ["", [Validators.required]],
    });
  }

  get s2() {
    return this.formGroup.controls;
  }

  // api's

  getHeading() {
    this.toggleSpinner(true);
    this.api.getwithoutid("contact").subscribe(
      (res: any) => {
        this.toggleSpinner(false);

        if (res && res.status && res.data && res.data.length > 0) {
          this.dataExists = true;
          const data = res.data[0];
          this.formGroup.patchValue({
            title: data.title,
            description: data.description,
          });
          this.id = data.id;
          this.titleChange.emit(data.title);
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
      if (this.dataExists) {
        this.updateSection(formData);
      } else {
        this.addSection(formData);
      }
    } else {
      this.formGroup.markAllAsTouched();
    }
  }

  createFormData() {
    const formData = {
      title: this.s2["title"].value,
      description: this.s2["description"].value,
    };
    return formData;
  }

  addSection(formData: any) {
    this.api.post("add-contact", formData).subscribe(
      (res: any) => {
        this.handleResponse(res);
      },
      (error) => this.handleError(error)
    );
  }

  updateSection(formData: any) {
    const urlId = this.id as number;
    this.api.put("add-contact", urlId, formData).subscribe(
      (res: any) => this.handleResponse(res),
      (error) => this.handleError(error)
    );
  }

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
    this.toastService.error("Oops! Something went wrong", error);
    console.error("Error:", error);
  }
}
