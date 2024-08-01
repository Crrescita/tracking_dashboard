import { Component, OnInit, Output, EventEmitter } from "@angular/core";
import {
  Validators,
  AbstractControl,
  FormBuilder,
  FormGroup,
} from "@angular/forms";
import { ApiService } from "../../../core/services/api.service";
import { ToastrService } from "ngx-toastr";
import { Editor, TOOLBAR_FULL } from "ngx-editor";

@Component({
  selector: "app-about-sectionseven",
  templateUrl: "./about-sectionseven.component.html",
  styleUrl: "./about-sectionseven.component.scss",
})
export class AboutSectionsevenComponent implements OnInit {
  @Output() titleChange = new EventEmitter<string>();
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
    this.editordescription = new Editor();
    this.initializeForm();
    this.getData();
  }

  initializeForm() {
    this.formGroup = this.formBuilder.group({
      title: ["", [Validators.required, Validators.maxLength(45)]],
      description: ["", [Validators.required]],
      cta_name: ["", [Validators.required]],
      cta_link: ["", [Validators.required]],
      cta_status: ["", [Validators.required]],
      status: ["", [Validators.required]],
    });
  }

  get s2() {
    return this.formGroup.controls;
  }

  getData() {
    this.toggleSpinner(true);
    this.api.getwithoutid("about-getsectionSeven").subscribe(
      (res: any) => {
        this.toggleSpinner(false);
        if (res && res.status && res.data && res.data.length > 0) {
          this.dataExists = true;
          const data = res.data[0];
          this.id = data.id;
          this.formGroup.patchValue({
            title: data.title,
            description: data.description,
            cta_name: data.cta_name,
            cta_link: data.cta_link,
            cta_status: data.cta_status,
            status: data.status,
          });

          this.titleChange.emit(data.title);
        }
      },
      (error) => this.handleError(error)
    );
  }

  onSubmit() {
    if (this.formGroup.valid) {
      this.toggleSpinner(true);
      const formData = this.createFormData();
      if (this.id) {
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
      cta_name: this.s2["cta_name"].value,
      cta_link: this.s2["cta_link"].value,
      cta_status: this.s2["cta_status"].value,
      status: this.s2["status"].value,
    };
    return formData;
  }

  addSection(formData: any) {
    this.api.post("about-sectionSeven", formData).subscribe(
      (res: any) => {
        this.handleResponse(res);
      },
      (error) => this.handleError(error)
    );
  }

  updateSection(formData: any) {
    const urlId = this.id as number;
    this.api.put("about-sectionSeven", urlId, formData).subscribe(
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
      this.getData();
      this.toastService.success("Data Saved Successfully!!");
    } else {
      this.toastService.error("Oops! Something went wrong");
    }
  }

  handleError(error: any) {
    this.toggleSpinner(false);
    this.toastService.error("Oops! Something went wrong", error);
    console.error("Error:", error);
  }
}
