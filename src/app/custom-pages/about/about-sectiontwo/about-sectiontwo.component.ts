import { Component, OnInit, EventEmitter, Output } from "@angular/core";
import {
  FormGroup,
  FormBuilder,
  Validators,
  AbstractControl,
} from "@angular/forms";
import { ApiService } from "../../../core/services/api.service";
import { ToastrService } from "ngx-toastr";

@Component({
  selector: "app-about-sectiontwo",
  templateUrl: "./about-sectiontwo.component.html",
  styleUrl: "./about-sectiontwo.component.scss",
})
export class AboutSectiontwoComponent implements OnInit {
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

  selectedImageTwo: any = null;
  selectedImageTwoPreview: any = null;
  uploadedImageTwo: any = null;

  selectedImageThree: any = null;
  selectedImageThreePreview: any = null;
  uploadedImageThree: any = null;

  selectedImageFour: any = null;
  selectedImageFourPreview: any = null;
  uploadedImageFour: any = null;

  constructor(
    private formBuilder: FormBuilder,
    private api: ApiService,
    private toastService: ToastrService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.getData();

    // const titleControl = this.formGroup.get("title");
    // if (titleControl) {
    //   titleControl.valueChanges.subscribe((value) => {
    //     this.titleChange.emit(value);
    //   });
    // }
  }

  initializeForm() {
    this.formGroup = this.formBuilder.group({
      title: ["", [Validators.required, Validators.maxLength(45)]],
      sub_title: ["", [Validators.required, Validators.maxLength(45)]],
      img_one: ["", this.imageValidator()],
      title_one: ["", [Validators.required, Validators.maxLength(45)]],
      description_one: ["", [Validators.required, Validators.maxLength(250)]],
      img_two: ["", this.imageValidator()],
      title_two: ["", [Validators.required, Validators.maxLength(45)]],
      description_two: ["", [Validators.required, Validators.maxLength(250)]],
      img_three: ["", this.imageValidator()],
      title_three: ["", [Validators.required, Validators.maxLength(45)]],
      description_three: ["", [Validators.required, Validators.maxLength(250)]],
      img_four: ["", this.imageValidator()],
      title_four: ["", [Validators.required, Validators.maxLength(45)]],
      description_four: ["", [Validators.required, Validators.maxLength(250)]],
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
    this.api.getwithoutid("about-getsectionTwo").subscribe(
      (res: any) => {
        this.toggleSpinner(false);
        if (res && res.status && res.data && res.data.length > 0) {
          this.dataExists = true;
          this.initializeForm();
          const data = res.data[0];
          this.id = data.id;
          this.uploadedImageOne = data.img_one;
          this.uploadedImageTwo = data.img_two;
          this.uploadedImageThree = data.img_three;
          this.uploadedImageFour = data.img_four;
          this.formGroup.patchValue({
            title: data.title,
            sub_title: data.sub_title,
            title_one: data.title_one,
            description_one: data.description_one,
            title_two: data.title_two,
            description_two: data.description_two,
            title_three: data.title_three,
            description_three: data.description_three,
            title_four: data.title_four,
            description_four: data.description_four,
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
    this.api.post("about-sectionTwo", formData).subscribe(
      (res: any) => {
        this.reset();
        this.handleResponse(res);
      },
      (error) => this.handleError(error)
    );
  }

  reset() {
    this.uploadedImageOne = null;
    this.uploadedImageTwo = null;
    this.uploadedImageThree = null;
    this.uploadedImageFour = null;
  }

  updateSection(formData: FormData) {
    const urlId = this.id as number;
    this.api.put("about-sectionTwo", urlId, formData).subscribe(
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
      formData.append("img_one", this.selectedImageOne);
    }
    if (this.selectedImageTwo) {
      formData.append("img_two", this.selectedImageTwo);
    }

    if (this.selectedImageThree) {
      formData.append("img_three", this.selectedImageThree);
    }

    if (this.selectedImageFour) {
      formData.append("img_four", this.selectedImageFour);
    }

    formData.append("title", this.s2["title"].value);
    formData.append("sub_title", this.s2["sub_title"].value);
    formData.append("title_one", this.s2["title_one"].value);
    formData.append("description_one", this.s2["description_one"].value);
    formData.append("title_two", this.s2["title_two"].value);
    formData.append("description_two", this.s2["description_two"].value);
    formData.append("title_three", this.s2["title_three"].value);
    formData.append("description_three", this.s2["description_three"].value);
    formData.append("title_four", this.s2["title_four"].value);
    formData.append("description_four", this.s2["description_four"].value);
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

  imageTwoSelect(event: any) {
    const selectedFileTwo = event.target.files[0];
    if (selectedFileTwo) {
      this.selectedImageTwo = selectedFileTwo;
      this.selectedImageTwoPreview = URL.createObjectURL(selectedFileTwo);
    }
  }
  removeImageTwo() {
    this.selectedImageTwo = null;
    this.selectedImageTwoPreview = null;
  }

  imageThreeSelect(event: any) {
    const selectedFileThree = event.target.files[0];
    if (selectedFileThree) {
      this.selectedImageThree = selectedFileThree;
      this.selectedImageThreePreview = URL.createObjectURL(selectedFileThree);
    }
  }
  removeImageThree() {
    this.selectedImageThree = null;
    this.selectedImageThreePreview = null;
  }

  imageFourSelect(event: any) {
    const selectedFileFour = event.target.files[0];
    if (selectedFileFour) {
      this.selectedImageFour = selectedFileFour;
      this.selectedImageFourPreview = URL.createObjectURL(selectedFileFour);
    }
  }
  removeImageFour() {
    this.selectedImageFour = null;
    this.selectedImageFourPreview = null;
  }
}
