import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import {
  Validators,
  AbstractControl,
  FormBuilder,
  FormGroup,
} from "@angular/forms";
import { ToastrService } from "ngx-toastr";
import { ApiService } from "../../../core/services/api.service";
import Swal from "sweetalert2";

@Component({
  selector: "app-add-layout-b",
  templateUrl: "./add-layout-b.component.html",
  styleUrl: "./add-layout-b.component.scss",
})
export class AddLayoutBComponent implements OnInit {
  breadCrumbItems!: Array<{}>;
  urlId: number | null = null;
  formGroup!: FormGroup;
  imageGroup!: FormGroup;
  editimageGroup!: FormGroup;
  spinnerStatus: boolean = false;
  addSaveButtonActive: boolean = true;
  service_id: number | null = null;

  // image
  selectedImage: any = null;
  selectedImagePreview: any = null;
  uploadedImage: any = null;

  //science image
  selectedScienceImage: any = null;
  selectedScienceImagePreview: any = null;
  uploadedScienceImage: any = null;

  // multiple images
  multiUploadedImages: any = [];
  multiImageFilePreview: any = null;
  multiImageSelectedFiles: any = null;

  imageButtonActive: boolean = true;

  //edit image
  editImageId: any | null = null;
  editselectedImage: any = null;
  editselectedImagePreview: any = null;
  edituploadedImage: any = null;

  editSaveButtonActive: boolean = true;

  constructor(
    private route: ActivatedRoute,
    private formBuilder: FormBuilder,
    public toastService: ToastrService,
    private api: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.breadCrumbItems = [
      { label: "Service Detail", active: true },
      { label: "Add Data", active: true },
    ];

    this.route.params.subscribe((params) => {
      this.service_id = params["id"];
    });

    this.route.params.subscribe((params) => {
      this.urlId = params["dataId"];

      if (this.urlId) {
        this.getData();
      }
    });
    this.initializeForm();

    this.imageGroup = this.formBuilder.group({
      title: ["", [Validators.required]],
      image: ["", [Validators.required]],
    });

    this.editimageGroup = this.formBuilder.group({
      title: ["", [Validators.required]],
      image: [""],
    });

    this.getIconData();
  }

  initializeForm() {
    this.formGroup = this.formBuilder.group({
      title: ["", [Validators.required]],
      description: ["", [Validators.required]],
      image: ["", this.imageValidator()],
      scienceImage: [""],
      status: ["", [Validators.required]],
    });
  }

  imageValidator() {
    return (control: AbstractControl) => {
      if (this.urlId == null) {
        return Validators.required(control);
      } else {
        return null;
      }
    };
  }

  get s2() {
    return this.formGroup.controls;
  }

  get s() {
    return this.imageGroup.controls;
  }

  get e() {
    return this.editimageGroup.controls;
  }

  getData() {
    this.api.get("get-layoutb-data", this.urlId).subscribe(
      (res: any) => {
        if (res && res.status) {
          this.formGroup.patchValue({
            title: res.data[0].title,
            description: res.data[0].description,
            status: res.data[0].status,
          });
          this.uploadedImage = res.data[0].image;
          this.uploadedScienceImage = res.data[0].science_image;
        } else {
          this.handleError("Unexpected response format");
        }
      },
      (error) => {
        this.handleError(
          error.message || "An error occurred while fetching data"
        );
      }
    );
  }

  getIconData() {
    this.api.get(`layoutb-images/${this.service_id}`, this.urlId).subscribe(
      (res: any) => {
        if (res && res.status) {
          this.multiUploadedImages = res.data;
        } else {
          this.handleError("Unexpected response format");
        }
      },
      (error) => {
        this.handleError(
          error.message || "An error occurred while fetching data"
        );
      }
    );
  }

  onSubmit() {
    if (this.formGroup.valid) {
      this.toggleSpinner(true);
      const formData = this.createFormData();
      if (this.urlId) {
        this.updateService(formData, this.urlId);
      } else {
        this.addService(formData);
      }
    } else {
      this.formGroup.markAllAsTouched();
    }
  }

  toggleSpinner(isLoading: boolean) {
    this.spinnerStatus = isLoading;
    this.addSaveButtonActive = !isLoading;
    this.editSaveButtonActive = !isLoading;
  }

  addService(formData: FormData) {
    this.api.post("add-layoutb-data", formData).subscribe(
      (res: any) => this.handleResponse(res),
      (error) => this.handleError(error)
    );
  }

  updateService(formData: FormData, id: any) {
    this.api.put("edit-layoutb-data", id, formData).subscribe(
      (res: any) => this.handleResponse(res),
      (error) => this.handleError(error)
    );
  }

  createFormData(): FormData {
    const formData = new FormData();
    if (this.selectedImage) {
      formData.append("image", this.selectedImage);
    }
    if (this.selectedScienceImage) {
      formData.append("science_image", this.selectedScienceImage);
    }
    formData.append(
      "service_id",
      this.service_id !== null ? this.service_id.toString() : ""
    );
    formData.append("title", this.s2["title"].value);
    formData.append("description", this.s2["description"].value);
    formData.append("status", this.s2["status"].value);
    return formData;
  }

  handleResponse(res: any) {
    this.toggleSpinner(false);
    if (res["status"] === true) {
      if (!this.urlId) {
        this.resetForm();
      } else {
        this.getData();
      }
      this.toastService.success("Data Saved Successfully!!");
    } else {
      this.toastService.error(res["message"]);
      // this.toastService.error("Oops! Something went wrong");
    }
  }

  resetForm() {
    this.selectedImage = null;
    this.selectedImagePreview = null;
    this.formGroup.reset();
  }

  onSubmitImage() {
    if (this.imageGroup.valid) {
      this.toggleSpinner(true);
      const formData = this.createFormDataImage();
      this.addIcon(formData);
    } else {
      this.imageGroup.markAllAsTouched();
    }
  }

  createFormDataImage(): FormData {
    const formData = new FormData();
    if (this.multiImageSelectedFiles) {
      formData.append("image", this.multiImageSelectedFiles);
    }

    formData.append(
      "service_id",
      this.service_id !== null ? this.service_id.toString() : ""
    );
    formData.append(
      "detail_layoutb_id",
      this.urlId !== null ? this.urlId.toString() : ""
    );
    formData.append("title", this.s["title"].value);

    return formData;
  }

  addIcon(formData: FormData) {
    this.api.post("layoutb-images", formData).subscribe(
      (res: any) => this.handleImageResponse(res),
      (error) => this.handleError(error)
    );
  }

  handleImageResponse(res: any) {
    this.toggleSpinner(false);
    if (res["status"] === true) {
      this.resetImageForm();
      this.getIconData();
      this.toastService.success("Data Saved Successfully!!");
    } else {
      this.toastService.error(res["message"]);
      // this.toastService.error("Oops! Something went wrong");
    }
  }

  onSubmitEditImage(modal: any) {
    if (this.editimageGroup.valid) {
      this.toggleSpinner(true);
      const formData = this.createFormDataEditImage();
      this.editIcon(modal, formData);
    } else {
      this.editimageGroup.markAllAsTouched();
    }
  }

  createFormDataEditImage(): FormData {
    const formData = new FormData();
    if (this.editselectedImage) {
      formData.append("image", this.editselectedImage);
    }
    formData.append(
      "service_id",
      this.service_id !== null ? this.service_id.toString() : ""
    );
    formData.append(
      "detail_layoutb_id",
      this.urlId !== null ? this.urlId.toString() : ""
    );
    formData.append("title", this.e["title"].value);

    return formData;
  }

  editIcon(modal: any, formData: FormData) {
    this.api.put("layoutb-images", this.editImageId, formData).subscribe(
      (res: any) => this.handleEditImageResponse(res, modal),
      (error) => this.handleError(error)
    );
  }

  handleEditImageResponse(res: any, modal: any) {
    this.toggleSpinner(false);
    if (res["status"] === true) {
      this.resetediImageForm();
      this.getIconData();
      modal.hide();
      this.toastService.success("Data Saved Successfully!!");
    } else {
      this.toastService.error(res["message"]);
    }
  }

  deleteImageUploadedFile(id: any) {
    if (id) {
      Swal.fire({
        title: "Are you sure?",
        text: "You won't be able to revert this!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Yes, delete it!",
      }).then((result: any) => {
        if (result.isConfirmed) {
          this.api.deleteWithId("layoutb-image-delete", id).subscribe(
            (res: any) => this.handleImageResponse(res),
            (error) => this.handleError(error)
          );
        }
      });
    }
  }

  resetediImageForm() {
    this.editselectedImage = null;
    this.editselectedImagePreview = null;
    this.editimageGroup.reset();
  }

  resetImageForm() {
    this.multiImageSelectedFiles = null;
    this.multiImageFilePreview = null;
    this.imageGroup.reset();
  }

  handleError(error: any) {
    this.toggleSpinner(false);
  }

  // edit modal
  editImageUploadedFile(data: any) {
    this.editimageGroup.patchValue({
      title: data.title,
    });
    this.edituploadedImage = data.image;

    this.editImageId = data.id;
  }

  // image upload code
  imageSelect(event: any) {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      this.selectedImage = selectedFile;
      this.selectedImagePreview = URL.createObjectURL(selectedFile);
    }
  }

  imageScienceSelect(event: any) {
    const selectedScienceFile = event.target.files[0];
    if (selectedScienceFile) {
      this.selectedScienceImage = selectedScienceFile;
      this.selectedScienceImagePreview =
        URL.createObjectURL(selectedScienceFile);
    }
  }

  onEditImageSelected(event: any) {
    const editFile = event.target.files[0];
    if (editFile) {
      this.editselectedImage = editFile;
      this.editselectedImagePreview = URL.createObjectURL(editFile);
    }
  }

  removeImage(type: string) {
    if (type == "image") {
      this.selectedImage = null;
      this.selectedImagePreview = null;
    } else if (type == "science") {
      this.selectedScienceImage = null;
      this.selectedScienceImagePreview = null;
    } else if (type == "editImage") {
      this.editselectedImage = null;
      this.editselectedImagePreview = null;
    }
  }

  ImageSelected(event: any) {
    const selectedFiless = event.target.files[0];
    if (selectedFiless) {
      this.multiImageSelectedFiles = selectedFiless;
      this.multiImageFilePreview = URL.createObjectURL(selectedFiless);
    }
  }

  removemultiSelectedFile(fileInput: any) {
    this.multiImageSelectedFiles = null;
    this.multiImageFilePreview = null;
    fileInput.value = null;
  }
}
