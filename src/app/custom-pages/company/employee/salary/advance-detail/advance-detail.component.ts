import { Component, OnInit, ViewChild, Input, EventEmitter, Output ,SimpleChanges} from '@angular/core';

import { PageChangedEvent } from "ngx-bootstrap/pagination";
import { ToastrService } from "ngx-toastr";
import { ModalDirective } from "ngx-bootstrap/modal";
import { FormGroup, FormBuilder, Validators } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { cloneDeep } from "lodash";
import { ApiService } from '../../../../../core/services/api.service';

@Component({
  selector: 'app-advance-detail',
  templateUrl: './advance-detail.component.html',
  styleUrl: './advance-detail.component.scss'
})
export class AdvanceDetailComponent {
  @Input() isActive!: boolean; 
  @Input() urlId: number | null = null;
  @Output() advanceData = new EventEmitter<any>();
  submitted: boolean = false;
  spinnerStatus: boolean = false;
  saveButtonActive: boolean = true;


  advanceDataList: any = [];
  totalBalance:any

  adjustmentDataList: any = [];
  totalAdjustment:any
  totalAmount:any
  formGroup!: FormGroup;
  adjuestedformGroup!: FormGroup;

  id: number | null = null;
  adjustment_id: number | null = null;

  @ViewChild("showModal", { static: false }) showModal?: ModalDirective;
  @ViewChild("showAdjustModal", { static: false }) showAdjustModal?: ModalDirective;
  @ViewChild("deleteRecordModal", { static: false })
  deleteRecordModal?: ModalDirective;
  deleteId: any;

  constructor(
    private api: ApiService,
    public toastService: ToastrService,
    private formBuilder: FormBuilder,

  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    this.getAdvanceAmount();
    this.getAdjustedAmount()
  }

  ngOnInit(): void {
    this.getAdvanceAmount();
    this.getAdjustedAmount()
    this.formGroup = this.formBuilder.group({
      advance_amount: ["", [Validators.required]],
      notes: [""],
    });

    this.adjuestedformGroup = this.formBuilder.group({
      adjustment_amount: ["", [Validators.required]],
      notes: [""],
    });
  }

  get f() {
    return this.formGroup.controls;
  }

  get a() {
    return this.adjuestedformGroup.controls;
  }

  toggleSpinner(isLoading: boolean) {
    this.spinnerStatus = isLoading;
    this.saveButtonActive = !isLoading;
    this.submitted = isLoading;
  }

  getAdvanceAmount() {
    this.toggleSpinner(true);
    const url = `advance/${this.urlId}`;
    this.api.getwithoutid(url).subscribe(
      (res: any) => {
        if (res && res.status) {
          this.toggleSpinner(false);
          this.advanceDataList = res.advances || [];
          this.totalBalance = res.total_balance
          this.totalAmount = res.totalAmount

          this.emitAdvanceData(); 
        } else {
          this.advanceDataList = [];
          this.handleError("Unexpected response format");
        }
      },
      (error) => {
        this.toggleSpinner(false);
        this.handleError(
          error.message || "An error occurred while fetching data"
        );
      }
    );
  }


  getAdjustedAmount() {
    this.toggleSpinner(true);
    const url = `getAdjustment/${this.urlId}`;
    this.api.getwithoutid(url).subscribe(
      (res: any) => {
        if (res && res.status) {
          this.toggleSpinner(false);
          this.adjustmentDataList = res.adjustment || [];
          this.totalAdjustment = res.total_adjustment

          this.emitAdvanceData(); 
        } else {
          this.adjustmentDataList = [];
          this.handleError("Unexpected response format");
        }
      },
      (error) => {
        this.toggleSpinner(false);
        this.handleError(
          error.message || "An error occurred while fetching data"
        );
      }
    );
  }

  emitAdvanceData() {
    const data = {
      totalBalance: this.totalBalance,
      totalAmount: this.totalAmount,
      totalAdjustment: this.totalAdjustment,
    };
    this.advanceData.emit(data);
  }

  onSubmit() {
  
    if (this.formGroup.valid) {

      this.toggleSpinner(true);
      const formData = this.createFormData();
      if (this.id) {
        this.update(formData);
      } else {
        this.add(formData);
      }
    } else {
      this.formGroup.markAllAsTouched();
    }
  }

  createFormData() {
    const formData = {
      emp_id: this.urlId,
      advance_amount: this.f["advance_amount"].value,
      notes: this.f["notes"].value,
    };
    return formData;
  }

  add(formData: any) {
    this.api.post("addAdvance", formData).subscribe(
      (res: any) => this.handleResponse(res),
      (error) => this.handleError(error)
    );
  }

  update(formData: any) {
    const id = this.id as number;
    this.api.put("updateAdvance", id, formData).subscribe(
      (res: any) => this.handleResponse(res),
      (error) => this.handleError(error)
    );
  }

  onAdd() {
    this.resetForm();
    this.showModal?.show();
    var modaltitle = document.querySelector(".modal-title") as HTMLAreaElement;
    modaltitle.innerHTML = "Add";
    var modalbtn = document.getElementById("add-btn") as HTMLAreaElement;
    modalbtn.innerHTML = "Add";
    this.id = null;
  }




  resetForm() {
    this.formGroup.reset();
    // Set default values if necessary
    this.formGroup.patchValue({
      advance_amount: "",
      notes: "",
    });
  }

  // edit
  editList(data: any) {
    this.showModal?.show();
    var modaltitle = document.querySelector(".modal-title") as HTMLAreaElement;
    modaltitle.innerHTML = "Edit";
    var modalbtn = document.getElementById("add-btn") as HTMLAreaElement;
    modalbtn.innerHTML = "Update";

    this.id = data.id;

    this.formGroup.patchValue({
      advance_amount: data.advance_amount,
      notes: data.notes,
    });
  }

  // Delete
  removeItem(id: any) {
    this.deleteId = id;
    this.deleteRecordModal?.show();
  }

  deleteData(id?: any) {
    this.toggleSpinner(true);
    this.deleteRecordModal?.hide();

    if (id) {
      this.api.deleteWithId("deleteAdvance", id).subscribe(
        (res: any) => this.handleResponse(res),
        (error) => this.handleError(error)
      );
    }

   
  }

  handleResponse(res: any) {
    this.toggleSpinner(false);
    if (res["status"] === true) {
      this.formGroup.reset();
      this.toastService.success("Data Saved Successfully!!");
      this.getAdvanceAmount();
      this.getAdjustedAmount();
      this.showModal?.hide();
    } else {
      this.toastService.error(res["message"]);
    }
  }


  onAddAdjust() {
    this.resetForm();
    this.showAdjustModal?.show();
    var modaltitle = document.querySelector(".modal-title") as HTMLAreaElement;
    modaltitle.innerHTML = "Add";
    var modalbtn = document.getElementById("add-btn") as HTMLAreaElement;
    modalbtn.innerHTML = "Add";
    this.id = null;
  }

  editListAdjust(data: any) {
    this.showAdjustModal?.show();
    var modaltitle = document.querySelector(".modal-title") as HTMLAreaElement;
    modaltitle.innerHTML = "Edit";
    var modalbtn = document.getElementById("add-btn") as HTMLAreaElement;
    modalbtn.innerHTML = "Update";

    this.adjustment_id = data.id;
console.log(data.id , this.adjustment_id)
    this.adjuestedformGroup.patchValue({
      adjustment_amount: data.adjustment_amount,
      notes: data.notes,
    });
  }

  onSubmitAdjustment(){
    if (this.adjuestedformGroup.valid) {
      this.toggleSpinner(true);
      const formData = this.createAdjuestedFormData();
      if (this.adjustment_id) {
        this.updateAdjustment(formData);
      } else {
        this.addAdjustment(formData);
      }
    } else {
      this.adjuestedformGroup.markAllAsTouched();
    }
  }

  createAdjuestedFormData() {
    const formData = {
      emp_id: this.urlId,
      adjustment_amount: this.a["adjustment_amount"].value,
      notes: this.a["notes"].value,
    };
    return formData;
  }

  addAdjustment(formData: any) {
    this.api.post("applyAdjustment", formData).subscribe(
      (res: any) => this.handleAdjustmentResponse(res),
      (error) => this.handleError(error)
    );
  }

  updateAdjustment(formData: any) {
    const id = this.adjustment_id as number;
    this.api.put("editAdjustment", id, formData).subscribe(
      (res: any) => this.handleResponse(res),
      (error) => this.handleError(error)
    );
  }
  
  handleAdjustmentResponse(res: any) {
    this.toggleSpinner(false);
    if (res["status"] === true) {
      this.adjuestedformGroup.reset();
      this.toastService.success("Data Saved Successfully!!");
      this.getAdjustedAmount();
      this.getAdvanceAmount()
      this.showAdjustModal?.hide();
    } else {
      this.toastService.error(res["message"]);
    }
  }



  handleError(error: any) {
    this.toggleSpinner(false);
  }




 
}
