import { Component, OnInit, Output, EventEmitter } from "@angular/core";
import {
  FormGroup,
  Validators,
  FormBuilder,
  AbstractControl,
} from "@angular/forms";
import { ApiService } from "../../../core/services/api.service";
import { ToastrService } from "ngx-toastr";
import { PageChangedEvent } from "ngx-bootstrap/pagination";
import Swal from "sweetalert2";

@Component({
  selector: "app-about-sectionthree",
  templateUrl: "./about-sectionthree.component.html",
  styleUrl: "./about-sectionthree.component.scss",
})
export class AboutSectionthreeComponent implements OnInit {
  @Output() titleChange = new EventEmitter<string>();
  sectionHeading!: FormGroup;
  sectionOne!: FormGroup;
  aboutSectionthree: any = [];
  aboutSectionthreeList: any = [];
  editId: number | null = null;
  SectionOneHeadingId: number | null = null;
  sectionOneHeading: boolean = false;
  addSaveButtonActive: boolean = true;
  spinnerStatus: boolean = false;

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
    private formBuilder: FormBuilder,
    private api: ApiService,
    public toastService: ToastrService
  ) {}

  ngOnInit(): void {
    this.sectionHeading = this.formBuilder.group({
      heading: ["", [Validators.required]],
      status: ["", [Validators.required]],
    });

    this.getSectionOneData();
    this.getHeading();
    const titleControl = this.sectionHeading.get("heading");
    // if (titleControl) {
    //   titleControl.valueChanges.subscribe((value) => {
    //     this.titleChange.emit(value);
    //   });
    // }
    this.initializeFormSectionOne();
  }

  initializeFormSectionOne() {
    this.sectionOne = this.formBuilder.group({
      title: ["", [Validators.required, Validators.maxLength(45)]],
      description: ["", [Validators.required, Validators.maxLength(350)]],
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

  getSectionOneData() {
    this.api.getwithoutid("about-getsectionThree").subscribe(
      (res: any) => {
        if (res && res.status) {
          this.aboutSectionthree = res.data || [];
          this.aboutSectionthreeList = res.data || [];
          this.updatePagination();
          this.updateDisplayedItems();
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
    this.api.put("about-sectionThree", id, formData).subscribe(
      (res: any) => this.handleSectionOneResponse(res, modal),
      (error) => this.handleError(error)
    );
  }

  addSectionOne(modal: any, formData: FormData) {
    this.api.post("about-sectionThree", formData).subscribe(
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

    this.api.put("about-sectionThree", serviceId, formData).subscribe(
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
          this.api.deleteWithId("aboutSectionThree-delete", id).subscribe(
            (res: any) => this.handleSectionOneResponse(res, "delete"),
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
      if (modal == "delete") {
        this.toastService.success("Data deleted Successfully!!");
      } else {
        this.toastService.success("Data Saved Successfully!!");
        this.resetForm();
        modal.hide();
      }
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

  getHeading() {
    const sectionKeysToMatch = ["section-three-heading", "section-two-heading"];

    this.toggleSpinner(true);
    this.api.getwithoutid("about-getHeading").subscribe(
      (res: any) => {
        this.toggleSpinner(false);

        if (res && res.status && res.data && res.data.length > 0) {
          for (const sectionKey of sectionKeysToMatch) {
            const matchingData = res.data.find(
              (item: any) => item.section_key === sectionKey
            );

            if (matchingData) {
              switch (sectionKey) {
                case "section-three-heading":
                  this.sectionHeading.patchValue({
                    heading: matchingData.heading,
                    status: matchingData.status,
                  });
                  this.SectionOneHeadingId = matchingData.id;
                  this.sectionOneHeading = true;
                  this.titleChange.emit(matchingData.heading);
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
    const data = {
      section_key: sectionSlug,
      heading: this.sOne["heading"].value,
      status: this.sOne["status"].value,
    };
    return data;
  }

  addSecontionHeading(formData: any) {
    this.api.post("about-headingAdd", formData).subscribe(
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

  handleError(error: any) {
    this.toggleSpinner(false);
    this.toastService.error("Oops! Something went wrong", error);
    console.error("Error:", error);
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

  // table
  filterdata() {
    if (this.term) {
      this.aboutSectionthree = this.aboutSectionthreeList.filter((el: any) => {
        const searchTerm = this.term.toLowerCase();
        return (
          el.title.toLowerCase().includes(searchTerm) ||
          el.status.toLowerCase().includes(searchTerm)
        );
      });
    } else {
      this.aboutSectionthree = this.aboutSectionthreeList.slice(0, 5);
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
    if (this.term && this.aboutSectionthree.length === 0) {
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
    this.totalItems = this.aboutSectionthreeList.length;
  }
  updateDisplayedItems(): void {
    const startItem = (this.currentPage - 1) * this.itemsPerPage;
    this.endItem = this.currentPage * this.itemsPerPage;
    this.aboutSectionthree = this.aboutSectionthreeList.slice(
      startItem,
      this.endItem
    );
  }
}
