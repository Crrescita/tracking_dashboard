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

import { ActivatedRoute, Router } from "@angular/router";
import { ApiService } from "../../../../core/services/api.service";

@Component({
  selector: "app-add-tag",
  templateUrl: "./add-tag.component.html",
  styleUrl: "./add-tag.component.scss",
})
export class AddTagComponent implements OnInit {
  @Output() titleChange = new EventEmitter<string>();
  breadCrumbItems!: Array<{}>;
  sectionHeading!: FormGroup;
  tag!: FormGroup;
  tagData: any = [];
  tagDataList: any = [];
  editId: number | null = null;
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
    public toastService: ToastrService
  ) {}

  ngOnInit(): void {
    this.breadCrumbItems = [
      { label: "Product", active: true },
      { label: "tag ", active: true },
    ];
    this.gettagData();
    this.initializeFormtag();
  }

  initializeFormtag() {
    this.tag = this.formBuilder.group({
      title: ["", [Validators.required, Validators.maxLength(30)]],

      status: ["", [Validators.required]],
    });
    // this.tagimageValidator()
  }

  tagimageValidator() {
    return (control: AbstractControl) => {
      if (this.editId == null) {
        return Validators.required(control);
      } else {
        return null;
      }
    };
  }

  get tagSec() {
    return this.tag.controls;
  }

  toggleSpinner(isLoading: boolean) {
    this.spinnerStatus = isLoading;
    this.addSaveButtonActive = !isLoading;
  }

  gettagData() {
    this.api.getwithoutid("tag").subscribe(
      (res: any) => {
        if (res && res.status) {
          this.tagData = res.data || [];
          this.tagDataList = res.data || [];
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

  submittag(team: any) {
    if (this.tag.valid) {
      this.toggleSpinner(true);
      const formData = this.createtagFormData();
      if (this.editId != null) {
        this.updatetag(team, formData, this.editId);
      } else {
        this.addtag(team, formData);
      }
    } else {
      this.tag.markAllAsTouched();
    }
  }

  createtagFormData() {
    const formData: { [key: string]: any } = {
      title: this.tagSec["title"].value,
      status: this.tagSec["status"].value,
    };
    const currentUserString = localStorage.getItem("currentUser");
    const currentUser = currentUserString ? JSON.parse(currentUserString) : {};
    const username = currentUser.username || "Admin";
    const field = this.editId != null ? "updated_by" : "created_by";

    formData[field] = username;

    return formData;
  }

  updatetag(team: any, formData: any, id: number) {
    this.api.put("tag", id, formData).subscribe(
      (res: any) => this.handletagResponse(res, team),
      (error) => this.handleError(error)
    );
  }

  addtag(team: any, formData: any) {
    this.api.post("tag", formData).subscribe(
      (res: any) => this.handletagResponse(res, team),
      (error) => this.handleError(error)
    );
  }

  tagsetStatus(data: any, event: Event) {
    const inputElement = event.target as HTMLInputElement;
    const newStatus = inputElement.checked ? "active" : "inactive";

    const formData: { [key: string]: any } = {
      title: data.title,
      status: newStatus,
    };

    this.toggleSpinner(true);

    this.api.put("tag", data.id, formData).subscribe(
      (res: any) => this.handletagResponse(res, null),
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
          this.api.deleteWithId("tag", id).subscribe(
            (res: any) => this.handletagResponse(res, "delete"),
            (error) => this.handleError(error)
          );
        }
      });
    }
  }

  handletagResponse(res: any, team: any) {
    this.toggleSpinner(false);
    if (res["status"] === true) {
      this.gettagData();
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
    this.tag.reset();
  }

  handleError(error: any) {
    this.toggleSpinner(false);
  }

  edittag(data: any) {
    this.initializeFormtag();
    this.editId = data.id;
    this.tag.patchValue({
      title: data.title,
      description: data.description,
      position: data.position,
      status: data.status,
    });
  }

  // table
  filterdata() {
    if (this.term) {
      this.tagData = this.tagDataList.filter((el: any) => {
        const searchTerm = this.term.toLowerCase();
        return (
          el.title.toLowerCase().includes(searchTerm) ||
          el.status.toLowerCase().includes(searchTerm)
        );
      });
    } else {
      this.tagData = this.tagDataList.slice(0, 5);
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
    if (this.term && this.tagData.length === 0) {
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
    this.totalItems = this.tagDataList.length;
  }
  updateDisplayedItems(): void {
    const startItem = (this.currentPage - 1) * this.itemsPerPage;
    this.endItem = this.currentPage * this.itemsPerPage;
    this.tagData = this.tagDataList.slice(startItem, this.endItem);
  }
}
