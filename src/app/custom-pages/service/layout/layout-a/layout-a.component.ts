import {
  FormGroup,
  FormBuilder,
  Validators,
  AbstractControl,
} from "@angular/forms";

import { ActivatedRoute } from "@angular/router";
import { Component, OnInit } from "@angular/core";
import { ToastrService } from "ngx-toastr";
import { PageChangedEvent } from "ngx-bootstrap/pagination";
import Swal from "sweetalert2";
import { ApiService } from "../../../../core/services/api.service";

@Component({
  selector: "app-layout-a",
  templateUrl: "./layout-a.component.html",
  styleUrl: "./layout-a.component.scss",
})
export class LayoutAComponent implements OnInit {
  breadCrumbItems!: Array<{}>;
  urlId: number | null = null;
  serviceData: any;
  addSaveButtonActive: boolean = true;
  spinnerStatus: boolean = false;
  formGroup!: FormGroup;
  sectionHeading!: FormGroup;
  dataExists: boolean = false;
  sectionOneHeading: boolean = false;

  sectionOne!: FormGroup;
  sectionOneData: any = [];
  sectionOneDataList: any = [];
  editId: number | null = null;
  SectionOneHeadingId: number | null = null;

  // image
  selectedImage: any = null;
  selectedImagePreview: any = null;
  uploadedImage: any = null;

  //section one image
  sectionOneselectedImage: any = null;
  sectionOneselectedImagePreview: any = null;
  sectionOneuploadedImage: any = null;

  //table
  term: string = "";
  currentPage = 1;
  totalItems = 0;
  itemsPerPage = 5;
  endItem: any;

  constructor(
    private route: ActivatedRoute,
    private api: ApiService,
    public toastService: ToastrService,
    private formBuilder: FormBuilder
  ) {}

  ngOnInit(): void {
    this.breadCrumbItems = [
      { label: "Service", active: true },
      { label: "Service Detail", active: true },
    ];

    this.route.params.subscribe((params) => {
      this.urlId = params["id"];
    });

    this.sectionHeading = this.formBuilder.group({
      heading: ["", [Validators.required]],
      status: ["", [Validators.required]],
    });

    this.sectionOne = this.formBuilder.group({
      title: ["", [Validators.required]],
      description: ["", [Validators.required, Validators.maxLength(250)]],
      image: ["", this.imageValidator()],
      status: ["", [Validators.required]],
    });

    this.initializeForm();
    this.getData();

    this.getHeading();

    this.getSectionOneData();
    this.initializeFormSectionOne();
  }

  initializeForm() {
    this.formGroup = this.formBuilder.group({
      detail_title: ["", [Validators.required]],
      sub_title: ["", [Validators.required]],
      long_description: ["", [Validators.required, Validators.maxLength(500)]],
      banner: ["", this.imageValidator()],
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

  initializeFormSectionOne() {
    this.sectionOne = this.formBuilder.group({
      title: ["", [Validators.required]],
      description: ["", [Validators.required, Validators.maxLength(250)]],
      image: ["", this.sectionOneimageValidator()],
      status: ["", [Validators.required]],
    });
  }

  sectionOneimageValidator() {
    return (control: AbstractControl) => {
      if (this.editId == null) {
        return Validators.required(control);
      } else {
        return null;
      }
    };
  }

  get s2() {
    return this.formGroup.controls;
  }

  get sOne() {
    return this.sectionHeading.controls;
  }

  get secOne() {
    return this.sectionOne.controls;
  }

  toggleSpinner(isLoading: boolean) {
    this.spinnerStatus = isLoading;
    this.addSaveButtonActive = !isLoading;
  }

  getData() {
    this.toggleSpinner(true);
    this.api.get("service", this.urlId).subscribe(
      (res: any) => {
        this.toggleSpinner(false);
        if (res && res.status && res.data && res.data.length > 0) {
          this.serviceData = res.data[0];

          if (
            res.data[0].detail_title &&
            res.data[0].sub_title &&
            res.data[0].long_description
          ) {
            this.dataExists = true;
            this.initializeForm();
            this.formGroup.patchValue({
              detail_title: res.data[0].detail_title,
              sub_title: res.data[0].sub_title,
              long_description: res.data[0].long_description,
            });
            this.uploadedImage = res.data[0].banner;
          }
        } else {
          this.toastService.error("No data found");
        }
      },
      (error) => this.handleError(error)
    );
  }

  getHeading() {
    const sectionKeysToMatch = ["section-one-heading", "section-two-heading"];

    this.toggleSpinner(true);
    this.api.get("get-service-heading", this.urlId).subscribe(
      (res: any) => {
        this.toggleSpinner(false);

        if (res && res.status && res.data && res.data.length > 0) {
          for (const sectionKey of sectionKeysToMatch) {
            const matchingData = res.data.find(
              (item: any) =>
                item.section_key === sectionKey &&
                item.service_id === this.urlId
            );

            if (matchingData) {
              switch (sectionKey) {
                case "section-one-heading":
                  this.sectionHeading.patchValue({
                    heading: matchingData.heading,
                    status: matchingData.status,
                  });
                  this.SectionOneHeadingId = matchingData.id;
                  this.sectionOneHeading = true;
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

  getSectionOneData() {
    this.api.get("get-section-one", this.urlId).subscribe(
      (res: any) => {
        if (res && res.status) {
          this.sectionOneData = res.data || [];
          this.sectionOneDataList = res.data || [];
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
      this.updateService(formData, this.urlId);
    } else {
      this.formGroup.markAllAsTouched();
    }
  }

  addService(formData: FormData) {
    this.api.post("service", formData).subscribe(
      (res: any) => this.handleResponse(res),
      (error) => this.handleError(error)
    );
  }

  updateService(formData: FormData, id: any) {
    this.api.put("service", id, formData).subscribe(
      (res: any) => this.handleResponse(res),
      (error) => this.handleError(error)
    );
  }

  createFormData(): FormData {
    const formData = new FormData();
    if (this.selectedImage) {
      formData.append("banner", this.selectedImage);
    }
    formData.append("detail_title", this.s2["detail_title"].value);
    formData.append("long_description", this.s2["long_description"].value);
    formData.append("sub_title", this.s2["sub_title"].value);
    return formData;
  }

  handleResponse(res: any) {
    this.toggleSpinner(false);
    if (res["status"] === true) {
      this.getData();
      this.removeImage();
      this.toastService.success("Data Saved Successfully!!");
    } else {
      this.toastService.error("Oops! Something went wrong");
    }
  }

  // heading api's

  onSubmitHeadingForm(sectionSlug: any) {
    if (this.sectionHeading.valid) {
      this.toggleSpinner(true);
      const formData = this.createFormDataHeading(sectionSlug);
      this.addSecontionHeading(formData);
    } else {
      this.sectionHeading.markAllAsTouched();
    }
  }

  createFormDataHeading(sectionSlug: any) {
    const serviceId = this.urlId !== null ? this.urlId.toString() : "";
    const data = {
      service_id: this.urlId,
      section_key: sectionSlug,
      heading: this.sOne["heading"].value,
      status: this.sOne["status"].value,
    };
    return data;
  }

  addSecontionHeading(formData: any) {
    this.api.post("add-service-heading", formData).subscribe(
      (res: any) => this.handleHeadingResponse(res),
      (error) => this.handleError(error)
    );
  }

  handleHeadingResponse(res: any) {
    this.toggleSpinner(false);
    if (res["status"] === true) {
      this.getHeading();
      this.toastService.success("Data Saved Successfully!!");
    } else {
      this.toastService.error("Oops! Something went wrong");
    }
  }

  //section One api's

  editSectionOne(data: any) {
    this.initializeFormSectionOne();
    this.editId = data.id;
    this.sectionOne.patchValue({
      title: data.title,
      description: data.description,
      status: data.status,
    });
    this.sectionOneuploadedImage = data.image;
  }

  submitSectionOne(modal: any) {
    if (this.sectionOne.valid) {
      this.toggleSpinner(true);
      const formData = this.createSectionOneFormData();
      if (this.editId != null) {
        this.updateSectionOne(modal, formData, this.editId);
      } else {
        this.addSectionOne(modal, formData);
      }
    } else {
      this.sectionOne.markAllAsTouched();
    }
  }

  createSectionOneFormData(): FormData {
    const formData = new FormData();
    if (this.sectionOneselectedImage) {
      formData.append("image", this.sectionOneselectedImage);
    }
    formData.append(
      "service_id",
      this.urlId !== null ? this.urlId.toString() : ""
    );
    formData.append(
      "heading_id",
      this.SectionOneHeadingId !== null
        ? this.SectionOneHeadingId.toString()
        : ""
    );
    formData.append("title", this.secOne["title"].value);
    formData.append("description", this.secOne["description"].value);
    formData.append("status", this.secOne["status"].value);
    return formData;
  }

  updateSectionOne(modal: any, formData: FormData, id: number) {
    this.api.put("section-one", id, formData).subscribe(
      (res: any) => this.handleSectionOneResponse(res, modal),
      (error) => this.handleError(error)
    );
  }

  addSectionOne(modal: any, formData: FormData) {
    this.api.post("section-one", formData).subscribe(
      (res: any) => this.handleSectionOneResponse(res, modal),
      (error) => this.handleError(error)
    );
  }

  sectionOnesetStatus(serviceId: number, event: Event) {
    const inputElement = event.target as HTMLInputElement;
    const newStatus = inputElement.checked ? "active" : "inactive";

    const formData = new FormData();
    formData.append("status", newStatus);

    this.toggleSpinner(true);

    this.api.put("section-one", serviceId, formData).subscribe(
      (res: any) => this.handleSectionOneResponse(res, null),
      (error) => this.handleError(error)
    );
  }

  delete(id: number) {
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
          this.api.deleteWithId("section-one", id).subscribe(
            (res: any) => this.handleSectionOneResponse(res, null),
            (error) => this.handleError(error)
          );
        }
      });
    }
  }

  handleSectionOneResponse(res: any, modal: any) {
    this.toggleSpinner(false);
    if (res["status"] === true) {
      this.getSectionOneData();
      modal.hide();
      this.toastService.success("Data Saved Successfully!!");
      this.resetForm();
    } else {
      this.toastService.error("Oops! Something went wrong");
    }
  }

  resetForm() {
    this.sectionOneselectedImage = null;
    this.sectionOneselectedImagePreview = null;
    this.sectionOneuploadedImage = null;
    this.editId = null;
    this.sectionOne.reset();
  }

  handleError(error: any) {
    this.toggleSpinner(false);
  }

  // image upload code
  imageSelect(event: any) {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      this.selectedImage = selectedFile;
      this.selectedImagePreview = URL.createObjectURL(selectedFile);
    }
  }
  removeImage() {
    this.selectedImage = null;
    this.selectedImagePreview = null;
  }

  // section one image upload
  sectionOneimageSelect(event: any) {
    const sectionOneselectedFile = event.target.files[0];
    if (sectionOneselectedFile) {
      this.sectionOneselectedImage = sectionOneselectedFile;
      this.sectionOneselectedImagePreview = URL.createObjectURL(
        sectionOneselectedFile
      );
    }
  }
  sectionOneremoveImage() {
    this.sectionOneselectedImage = null;
    this.sectionOneselectedImagePreview = null;
  }

  // table
  filterdata() {
    if (this.term) {
      this.sectionOneData = this.sectionOneDataList.filter((el: any) => {
        const searchTerm = this.term.toLowerCase();
        return (
          el.title.toLowerCase().includes(searchTerm) ||
          el.status.toLowerCase().includes(searchTerm)
        );
      });
    } else {
      this.sectionOneData = this.sectionOneDataList.slice(0, 5);
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
    if (this.term && this.serviceData.length === 0) {
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
    this.totalItems = this.sectionOneDataList.length;
  }
  updateDisplayedItems(): void {
    const startItem = (this.currentPage - 1) * this.itemsPerPage;
    this.endItem = this.currentPage * this.itemsPerPage;
    this.sectionOneData = this.sectionOneDataList.slice(
      startItem,
      this.endItem
    );
  }
}
