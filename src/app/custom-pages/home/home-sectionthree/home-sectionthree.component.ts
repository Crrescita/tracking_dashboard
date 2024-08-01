import { Component, OnInit, Output, EventEmitter } from "@angular/core";
import {
  FormGroup,
  FormBuilder,
  Validators,
  AbstractControl,
} from "@angular/forms";
import { ApiService } from "../../../core/services/api.service";
import { ToastrService } from "ngx-toastr";
import { Editor, TOOLBAR_FULL } from "ngx-editor";

@Component({
  selector: "app-home-sectionthree",
  templateUrl: "./home-sectionthree.component.html",
  styleUrl: "./home-sectionthree.component.scss",
})
export class HomeSectionthreeComponent implements OnInit {
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
    private formBuilder: FormBuilder,
    private api: ApiService,
    private toastService: ToastrService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.getData();
    this.editordescription = new Editor();
  }

  initializeForm() {
    this.formGroup = this.formBuilder.group({
      title: ["", [Validators.required, Validators.maxLength(45)]],
      sub_title: ["", [Validators.required, Validators.maxLength(55)]],
      image: ["", this.imageValidator()],
      description: ["", [Validators.required]],
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
    this.api.getwithoutid("home-getsectionThree").subscribe(
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
            sub_title: data.sub_title,
            description: data.description,
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
    this.api.post("home-sectionThree", formData).subscribe(
      (res: any) => {
        this.reset();
        this.handleResponse(res);
      },
      (error) => this.handleError(error)
    );
  }

  reset() {
    this.uploadedImageOne = null;
  }

  updateSection(formData: FormData) {
    const urlId = this.id as number;
    this.api.put("home-sectionThree", urlId, formData).subscribe(
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
    formData.append("title", this.s2["title"].value);
    formData.append("sub_title", this.s2["sub_title"].value);
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
