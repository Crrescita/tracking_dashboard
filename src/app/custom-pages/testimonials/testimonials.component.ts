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
import { ActivatedRoute, Router } from "@angular/router";

@Component({
  selector: "app-testimonials",
  templateUrl: "./testimonials.component.html",
  styleUrl: "./testimonials.component.scss",
})
export class TestimonialsComponent implements OnInit {
  @Output() titleChange = new EventEmitter<string>();
  breadCrumbItems!: Array<{}>;
  sectionHeading!: FormGroup;
  sectionOne!: FormGroup;
  testimonialData: any = [];
  testimonialDataList: any = [];
  editId: number | null = null;
  SectionOneHeadingId: number | null = null;
  sectionOneHeading: boolean = false;
  addSaveButtonActive: boolean = true;
  spinnerStatus: boolean = false;

  //table
  term: string = "";
  currentPage = 1;
  totalItems = 0;
  itemsPerPage = 5;
  endItem: any;

  constructor(
    private formBuilder: FormBuilder,
    private api: ApiService,
    public toastService: ToastrService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.breadCrumbItems = [
      { label: "Pages", active: true },
      { label: "Testimonial", active: true },
    ];
    this.sectionHeading = this.formBuilder.group({
      title: ["", [Validators.required, Validators.maxLength(45)]],
      sub_title: ["", [Validators.required, Validators.maxLength(45)]],
      status: ["", [Validators.required]],
    });

    this.getSectionOneData();
    this.getHeading();
    this.initializeFormSectionOne();
  }

  initializeFormSectionOne() {
    this.sectionOne = this.formBuilder.group({
      name: ["", [Validators.required, Validators.maxLength(45)]],
      testimonials: ["", [Validators.required, Validators.maxLength(500)]],
      type: ["", [Validators.required]],
      status: ["", [Validators.required]],
    });
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
    this.api.getwithoutid("get-testimonials").subscribe(
      (res: any) => {
        if (res && res.status) {
          this.testimonialData = res.data || [];
          this.testimonialDataList = res.data || [];
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

  createSectionOneFormData() {
    const formData = {
      name: this.secOne["name"].value,
      testimonials: this.secOne["testimonials"].value,
      type: this.secOne["type"].value,
      status: this.secOne["status"].value,
    };
    return formData;
  }

  updateSectionOne(team: any, formData: any, id: number) {
    this.api.put("add-testimonials", id, formData).subscribe(
      (res: any) => this.handleSectionOneResponse(res, team),
      (error) => this.handleError(error)
    );
  }

  addSectionOne(team: any, formData: any) {
    this.api.post("add-testimonials", formData).subscribe(
      (res: any) => this.handleSectionOneResponse(res, team),
      (error) => this.handleError(error)
    );
  }

  sectionOnesetStatus(data: any, event: Event) {
    const inputElement = event.target as HTMLInputElement;
    const newStatus = inputElement.checked ? "active" : "inactive";

    const formData = {
      name: data.name,
      testimonials: data.testimonials,
      type: data.type,
      status: newStatus,
    };
    // const formData = new FormData();
    // formData.append("status", newStatus);

    this.toggleSpinner(true);

    this.api.put("add-testimonials", data.id, formData).subscribe(
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
          this.api.deleteWithId("delete-testimonials", id).subscribe(
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
      this.toastService.error(res["message"]);
    }
  }

  resetForm() {
    this.editId = null;
    this.sectionOne.reset();
  }

  getHeading() {
    this.toggleSpinner(true);
    this.api.get("heading", "testimonial-heading").subscribe(
      (res: any) => {
        this.toggleSpinner(false);

        if (res && res.status && res.data && res.data.length > 0) {
          const data = res.data[0];
          this.sectionHeading.patchValue({
            title: data.title,
            sub_title: data.sub_title,
            status: data.status,
          });
          this.SectionOneHeadingId = data.id;
          this.titleChange.emit(data.title);
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
      title: this.sOne["title"].value,
      sub_title: this.sOne["sub_title"].value,
      description: "",
      section_key: "testimonial-heading",
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

  editSectionOne(data: any) {
    this.initializeFormSectionOne();
    this.editId = data.id;
    this.sectionOne.patchValue({
      name: data.name,
      testimonials: data.testimonials,
      type: data.type,
      status: data.status,
    });
  }

  // table
  filterdata() {
    if (this.term) {
      this.testimonialData = this.testimonialDataList.filter((el: any) => {
        const searchTerm = this.term.toLowerCase();
        return (
          el.name.toLowerCase().includes(searchTerm) ||
          el.status.toLowerCase().includes(searchTerm)
        );
      });
    } else {
      this.testimonialData = this.testimonialDataList.slice(0, 5);
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
    if (this.term && this.testimonialData.length === 0) {
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
    this.totalItems = this.testimonialDataList.length;
  }
  updateDisplayedItems(): void {
    const startItem = (this.currentPage - 1) * this.itemsPerPage;
    this.endItem = this.currentPage * this.itemsPerPage;
    this.testimonialData = this.testimonialDataList.slice(
      startItem,
      this.endItem
    );
  }
}
