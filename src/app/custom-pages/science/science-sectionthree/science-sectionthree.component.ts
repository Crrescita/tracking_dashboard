import { Component, OnInit, Output, EventEmitter } from "@angular/core";
import {
  FormGroup,
  FormBuilder,
  Validators,
  AbstractControl,
} from "@angular/forms";

import { ActivatedRoute, Router } from "@angular/router";
import { ToastrService } from "ngx-toastr";
import { ApiService } from "../../../core/services/api.service";
import { Editor, TOOLBAR_FULL } from "ngx-editor";

@Component({
  selector: "app-science-sectionthree",
  templateUrl: "./science-sectionthree.component.html",
  styleUrl: "./science-sectionthree.component.scss",
})
export class ScienceSectionthreeComponent implements OnInit {
  @Output() titleChange = new EventEmitter<string>();
  formGroup!: FormGroup;
  dataExists: boolean = false;
  saveButtonActive: boolean = true;
  spinnerStatus: boolean = false;
  id: number | null = null;

  // image
  selectedImageOne: any = null;
  selectedImageOnePreview: any = null;
  uploadedImageOne: any = null;

  // editor
  editor: any = Editor;
  toolbar: any = TOOLBAR_FULL;
  editordescription: any = Editor;

  constructor(
    private route: ActivatedRoute,
    private formBuilder: FormBuilder,
    private api: ApiService,
    private router: Router,
    public toastService: ToastrService
  ) {}

  ngOnInit(): void {
    // this.breadCrumbItems = [
    //   { label: 'Pages', active: true },
    //   { label: 'Home Page', active: true },
    // ];
    this.editordescription = new Editor();
    this.initializeForm();
    this.getData();
  }

  initializeForm() {
    this.formGroup = this.formBuilder.group({
      title: ["", [Validators.required, Validators.maxLength(60)]],
      image: ["", this.imageValidator()],
      description: [""],
      status: ["", Validators.required],
    });
  }

  imageValidator() {
    return (control: AbstractControl) => {
      if (!this.dataExists) {
        return Validators.required(control);
      } else {
        return null;
      }
    };
  }

  get s2() {
    return this.formGroup.controls;
  }

  // api's

  getData() {
    this.toggleSpinner(true);
    this.api.get("get-science-section", "section-three").subscribe(
      (res: any) => {
        this.toggleSpinner(false);

        if (res && res.status && res.data && res.data.length > 0) {
          this.dataExists = true;
          this.initializeForm();
          const data = res.data[0];
          this.id = data.id;
          this.uploadedImageOne = data.image;
          this.formGroup.patchValue({
            title: data.title,
            description: data.description,
            status: data.status,
          });

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

  addSection(formData: FormData) {
    this.api.post("insert-science-section", formData).subscribe(
      (res: any) => {
        this.reset();
        this.handleResponse(res);
      },
      (error) => this.handleError(error)
    );
  }

  reset() {
    this.selectedImageOne = null;
    this.selectedImageOnePreview = null;
  }

  updateSection(formData: FormData) {
    const urlId = this.id as number;
    this.api.put("insert-science-section", urlId, formData).subscribe(
      (res: any) => this.handleResponse(res),
      (error) => this.handleError(error)
    );
  }

  toggleSpinner(isLoading: boolean) {
    this.spinnerStatus = isLoading;
    this.saveButtonActive = !isLoading;
  }

  createFormData(): FormData {
    const formData = new FormData();
    if (this.selectedImageOne) {
      formData.append("image", this.selectedImageOne);
    }
    formData.append("section_key", "section-three");
    formData.append("title", this.s2["title"].value);
    formData.append("status", this.s2["status"].value);
    formData.append("description", this.s2["description"].value);
    return formData;
  }

  handleResponse(res: any) {
    this.toggleSpinner(false);
    if (res.status === true) {
      this.getData();
      this.toastService.success("Data Saved Successfully!!");
    } else {
      this.toastService.error(res["message"]);
    }
  }

  handleError(error: any) {
    this.toggleSpinner(false);
  }

  // image upload code
  imageOneSelect(event: any) {
    const selectedFileOne = event.target.files[0];
    if (selectedFileOne) {
      this.selectedImageOne = selectedFileOne;
      this.selectedImageOnePreview = URL.createObjectURL(selectedFileOne);
    }
  }
  removeImageOne() {
    this.selectedImageOne = null;
    this.selectedImageOnePreview = null;
  }
}
