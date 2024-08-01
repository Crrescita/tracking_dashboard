import { Component, OnInit, Output, EventEmitter } from "@angular/core";
import {
  FormGroup,
  Validators,
  FormBuilder,
  AbstractControl,
} from "@angular/forms";

import { ToastrService } from "ngx-toastr";
import { PageChangedEvent } from "ngx-bootstrap/pagination";
import Swal from "sweetalert2";
import { ApiService } from "../../core/services/api.service";

@Component({
  selector: "app-our-team",
  templateUrl: "./our-team.component.html",
  styleUrl: "./our-team.component.scss",
})
export class OurTeamComponent implements OnInit {
  @Output() titleChange = new EventEmitter<string>();
  breadCrumbItems!: Array<{}>;
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
    this.breadCrumbItems = [
      { label: "Pages", active: true },
      { label: "Our Team", active: true },
    ];
    this.sectionHeading = this.formBuilder.group({
      title: ["", [Validators.required, Validators.maxLength(45)]],
      sub_title: ["", [Validators.required, Validators.maxLength(45)]],
      description: ["", [Validators.required, Validators.maxLength(250)]],
      status: ["", [Validators.required]],
    });

    this.getSectionOneData();
    this.getHeading();
    this.initializeFormSectionOne();
    // const titleControl = this.sectionHeading.get("title");
    // if (titleControl) {
    //   titleControl.valueChanges.subscribe((value) => {
    //     this.titleChange.emit(value);
    //   });
    // }
  }

  initializeFormSectionOne() {
    this.sectionOne = this.formBuilder.group({
      name: ["", [Validators.required, Validators.maxLength(30)]],
      designation: ["", [Validators.required, Validators.maxLength(60)]],
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
    this.api.getwithoutid("get-team").subscribe(
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

  submitSectionOne(team: any) {
    if (this.sectionOne.valid) {
      this.toggleSpinner(true);
      const formData = this.createSectionOneFormData();
      if (this.editId != null) {
        this.updateSectionOne(team, formData, this.editId);
      } else {
        this.addSectionOne(team, formData);
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
    // formData.append(
    //   "heading_id",
    //   this.SectionOneHeadingId !== null
    //     ? this.SectionOneHeadingId.toString()
    //     : ""
    // );
    formData.append("name", this.secOne["name"].value);
    formData.append("designation", this.secOne["designation"].value);
    formData.append("status", this.secOne["status"].value);
    return formData;
  }

  updateSectionOne(team: any, formData: FormData, id: number) {
    this.api.put("add-team", id, formData).subscribe(
      (res: any) => this.handleSectionOneResponse(res, team),
      (error) => this.handleError(error)
    );
  }

  addSectionOne(team: any, formData: FormData) {
    this.api.post("add-team", formData).subscribe(
      (res: any) => this.handleSectionOneResponse(res, team),
      (error) => this.handleError(error)
    );
  }

  sectionOnesetStatus(serviceId: number, event: Event) {
    const inputElement = event.target as HTMLInputElement;
    const newStatus = inputElement.checked ? "active" : "inactive";

    const formData = new FormData();
    formData.append("status", newStatus);

    this.toggleSpinner(true);

    this.api.put("add-team", serviceId, formData).subscribe(
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
          this.api.deleteWithId("delete-team", id).subscribe(
            (res: any) => this.handleSectionOneResponse(res, "delete"),
            (error) => this.handleError(error)
          );
        }
      });
    }
  }

  handleSectionOneResponse(res: any, team: any) {
    this.toggleSpinner(false);
    if (res["status"] === true) {
      this.getSectionOneData();
      if (team == "delete") {
        this.toastService.success("Data deleted Successfully!!");
      } else {
        this.toastService.success("Data Saved Successfully!!");
        this.resetForm();
        team.hide();
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
    this.toggleSpinner(true);
    this.api.get("heading", "team-heading").subscribe(
      (res: any) => {
        this.toggleSpinner(false);

        if (res && res.status && res.data && res.data.length > 0) {
          const data = res.data[0];
          this.sectionHeading.patchValue({
            title: data.title,
            description: data.description,
            sub_title: data.sub_title,
            status: data.status,
          });
          this.titleChange.emit(data.title);
          this.SectionOneHeadingId = data.id;
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
      // if (this.SectionOneHeadingId) {
      //   this.updateSectionHeading(formData);
      // } else {
      this.addSecontionHeading(formData);
      // }
    } else {
      this.sectionHeading.markAllAsTouched();
    }
  }

  createFormDataHeading(sectionSlug: any) {
    const data = {
      title: this.sOne["title"].value,
      sub_title: this.sOne["sub_title"].value,
      description: this.sOne["description"].value,
      section_key: "team-heading",
      status: this.sOne["status"].value,
    };
    return data;
  }

  addSecontionHeading(formData: any) {
    this.api.post("add-heading", formData).subscribe(
      (res: any) => this.handleHeadingResponse(res),
      (error) => this.handleError(error)
    );
  }

  updateSectionHeading(formData: any) {
    const id = this.SectionOneHeadingId as number;
    this.api.put("add-team-heading", id, formData).subscribe(
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
      this.toastService.error(res["message"]);
    }
  }

  handleError(error: any) {
    this.toggleSpinner(false);
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
      name: data.name,
      designation: data.designation,
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
          el.name.toLowerCase().includes(searchTerm) ||
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
