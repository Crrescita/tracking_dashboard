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
  selector: "app-about-mission",
  templateUrl: "./about-mission.component.html",
  styleUrl: "./about-mission.component.scss",
})
export class AboutMissionComponent implements OnInit {
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
    const sectionKeysToMatch = ["about-mission", "section-two-heading"];

    this.toggleSpinner(true);
    this.api.getwithoutid("get-about-SectionOne").subscribe(
      (res: any) => {
        this.toggleSpinner(false);

        if (res && res.status && res.data && res.data.length > 0) {
          for (const sectionKey of sectionKeysToMatch) {
            const matchingData = res.data.find(
              (item: any) => item.section_key === sectionKey
            );

            if (matchingData) {
              switch (sectionKey) {
                case "about-mission":
                  this.formGroup.patchValue({
                    title: matchingData.title,
                    sub_title: matchingData.sub_title,
                    description: matchingData.description,
                  });
                  this.dataExists = true;
                  this.uploadedImageOne = matchingData.image;
                  this.id = matchingData.id;
                  this.titleChange.emit(matchingData.title);
                  // this.titleChange.emit(matchingData.title);
                  break;
                case "section-two-heading":
                  break;
              }
            }
          }
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

  addSection(formData: FormData) {
    this.api.post("insert-about-SectionOne", formData).subscribe(
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

  // updateSection(formData: FormData) {
  //   const urlId = this.id as number;
  //   this.api.put('update-about-SectionOne', urlId, formData).subscribe(
  //     (res: any) => this.handleResponse(res),
  //     (error) => this.handleError(error)
  //   );
  // }

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
    formData.append("section_key", "about-mission");
    return formData;
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
