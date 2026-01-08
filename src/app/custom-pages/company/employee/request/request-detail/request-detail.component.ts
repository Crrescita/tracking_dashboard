import { Component, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {  } from 'ngx-editor';
import { ToastrService } from 'ngx-toastr';
import { ApiService } from 'src/app/core/services/api.service';
import { PageChangedEvent } from "ngx-bootstrap/pagination";
import { cloneDeep } from "lodash";
import { ModalDirective } from 'ngx-bootstrap/modal';

@Component({
  selector: 'app-request-detail',
  templateUrl: './request-detail.component.html',
  styleUrl: './request-detail.component.scss'
})
export class RequestDetailComponent {
      @ViewChild("statusModal", { static: false })
    statusModal?: ModalDirective;
breadCrumbItems!: Array<{}>;
    submitted: boolean = false;
  spinnerStatus: boolean = false;
  saveButtonActive: boolean = true;

  company_id: any;
  requestDetail: any;
  formGroup!: FormGroup;
  currentPage: number = 1;

  itemsPerPage = 10;
  totalItems: any = 0;
  endItem: any;

        //employee image
  employeeselectedImage: any = null;
  employeeselectedImagePreview: any = null;
  employeeuploadedImage: any = null;

  requestHistroyData: any = [];
 requestHistroyDataList: any = [];
  filteredrequestHistroyData: any = [];
    // term: any;

  requestId:any;
  constructor(
    private route: ActivatedRoute,
    private api: ApiService,
    public toastService: ToastrService,
    private formBuilder: FormBuilder,
    private router: Router
  ) { } 

  ngOnInit(): void {

        this.breadCrumbItems = [
      { label: "Quatation", active: true },
      { label: "Detail", active: true },
    ];


        const data = localStorage.getItem("currentUser");

    if (data) {
      const user = JSON.parse(data);
      this.company_id = user.id;
    }
       this.initializeForm();
    this.route.params.subscribe(params => {
       this.requestId = params["id"] ? Number(params["id"]) : null;
      // Use the requestId as needed
       if (this.requestId) {
       this.getRequestDetail();
      // this.getCheckInDetail();
    }
    });
  }

  initializeForm() {
    this.formGroup = this.formBuilder.group({
      admin_note: ["", Validators.required],
      file: [null], 
    });
  }


   get f() {
    return this.formGroup.controls;
  }

    toggleSpinner(isLoading: boolean) {
    this.spinnerStatus = isLoading;
    this.saveButtonActive = !isLoading;
    this.submitted = isLoading;
  }

  getRequestDetail() {
    console.log("Fetching request detail for ID:", this.requestId);
    this.toggleSpinner(true);
    this.api
      .getwithoutcache(
        `getRequestById?id=${this.requestId}&company_id=${this.company_id}&type=quotation`
      )
      .subscribe(
        (res: any) => {
          this.toggleSpinner(false);
          if (res && res.status) {
            // this.requestDetail = res.data; 

            // this.requestDetail = { ...res.data };
            this.requestDetail = JSON.parse(JSON.stringify(res.data));
            
            this.requestHistroyData = this.requestDetail.history || [];
            this.requestHistroyDataList = this.requestDetail.history || [];


            this.employeeuploadedImage =
                this.requestDetail.latest_response?.file_url || null;
            
            
              this.formGroup.patchValue({
                admin_note: this.requestDetail.latest_response?.admin_note || ''
              });
            
            
              const fileControl = this.formGroup.get('file');
            
              if (this.employeeuploadedImage) {
                fileControl?.clearValidators();
              } else {
                fileControl?.setValidators(Validators.required);
              }
            
              fileControl?.updateValueAndValidity();
            
              this.employeeselectedImage = null;
              this.employeeselectedImagePreview = null;
            console.log("Request Detail:", this.requestDetail);
          } else {
            this.requestDetail = null;
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


    employeeimageSelect(event: any) {
  const file = event.target.files[0];
  if (!file) return;

  this.employeeselectedImage = file;
  this.employeeselectedImagePreview = URL.createObjectURL(file);

  this.formGroup.patchValue({ file });

  // ensure file validator is removed once file is selected
  const fileControl = this.formGroup.get('file');
  fileControl?.clearValidators();
  fileControl?.updateValueAndValidity();

  // hide old file visually
  this.employeeuploadedImage = null;
}

 statusid: any
    statusModel(id: any) {
    this.statusid = id;
    this.statusModal?.show();
  }

    updateStatus(statusid?: any) {
    this.toggleSpinner(true);
    // 

    if (statusid) {
           const data = { status: 'rejected' }

      this.api.put("updateRequestStatus", statusid, data).subscribe(
        (res: any) => this.handleResponse(res),
        (error) => this.handleError(error)
      );
    }

  }


  onSubmit() {
  if (this.formGroup.invalid) {
    this.formGroup.markAllAsTouched();
    return;
  }

  

  this.toggleSpinner(true);

  const formData = new FormData();
  formData.append('admin_note', this.formGroup.value.admin_note);

  if (this.employeeselectedImage) {
    formData.append('file', this.employeeselectedImage);
  }

  this.addemployee(formData);
}

    addemployee(formData: FormData) {
    this.api.postwithid("updateRequest", this.requestId , formData).subscribe(
      (res: any) => this.handleResponse(res),
      (error) => this.handleError(error)
    );
  }

   handleResponse(res: any) {
    this.toggleSpinner(false);
    if (res["status"] === true) {
      this.toastService.success(res["message"] || "Request updated successfully");
         this.statusModal?.hide();
     setTimeout(() => {
      this.getRequestDetail();
    }, 300);
        //  this.formGroup.reset();
    
    } else {
      this.toastService.error(res["message"]);
    }
  }

  handleError(error: any) {
    this.toggleSpinner(false);
  }

  

     updateNoResultDisplay() {
    const noResultElement = document.querySelector(".noresult") as HTMLElement;
    const paginationElement = document.getElementById(
      "pagination-element"
    ) as HTMLElement;
    if (this.requestHistroyData.length === 0) {
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
    this.totalItems = this.requestHistroyDataList.length;
  }
  updateDisplayedItems(): void {
    const startItem = (this.currentPage - 1) * this.itemsPerPage;
    this.endItem = this.currentPage * this.itemsPerPage;
    this.requestHistroyData = this.requestHistroyDataList.slice(startItem, this.endItem);
  }

  

}

