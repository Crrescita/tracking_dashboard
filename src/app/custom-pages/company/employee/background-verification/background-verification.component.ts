import {
  Component,
  OnInit,
  Input,
  ViewChild,
  Output,
  EventEmitter,
} from "@angular/core";
import { ApiService } from "../../../../core/services/api.service";
import { ModalDirective } from "ngx-bootstrap/modal";
import { FormBuilder, Validators, FormGroup } from "@angular/forms";
import { ToastrService } from "ngx-toastr";

@Component({
  selector: "app-background-verification",

  templateUrl: "./background-verification.component.html",
  styleUrl: "./background-verification.component.scss",
})
export class BackgroundVerificationComponent implements OnInit {
  @Input() urlId: number | null = null;
  @Output() backGroundDetail = new EventEmitter<boolean>();

  @ViewChild("showModal", { static: false }) showModal?: ModalDirective;

  documents = [
    {
      name: "Aadhaar",
      field: "aadhaar",
      fileField: "aadhaar_file",
      status: "Not Uploaded",
      documentNo: "",
      fileUrl: "",
    },
    {
      name: "PAN",
      field: "pan",
      fileField: "pan_file",
      status: "Not Uploaded",
      documentNo: "",
      fileUrl: "",
    },
    {
      name: "Driving License",
      field: "driving_license",
      fileField: "driving_license_file",
      status: "Not Uploaded",
      documentNo: "",
      fileUrl: "",
    },
    {
      name: "Voter ID",
      field: "voter",
      fileField: "voter_file",
      status: "Not Uploaded",
      documentNo: "",
      fileUrl: "",
    },
    {
      name: "UAN",
      field: "uan",
      fileField: "uan_file",
      status: "Not Uploaded",
      documentNo: "",
      fileUrl: "",
    },
  ];

  company_id: any;

  formGroup!: FormGroup;
  selectedDocument: string = "";
  //employee image
  selectedImage: any = null;
  selectedImagePreview: any = null;
  uploadedImage: any = null;

  submitted: boolean = false;
  spinnerStatus: boolean = false;
  saveButtonActive: boolean = true;

  uploadedDocuments: Array<{ number: string; fileUrl: string }> = [];

  constructor(
    private api: ApiService,
    private formBuilder: FormBuilder,
    public toastService: ToastrService
  ) {}

  ngOnInit(): void {
  
    this.formGroup = this.formBuilder.group({
      documentNo: ["", [Validators.required, Validators.maxLength(100)]],
      documentFile: [""],
    });
    if (this.urlId) {
      this.getbackgroundDetail();
    }
  }

  toggleSpinner(isLoading: boolean) {
    this.spinnerStatus = isLoading;
    this.saveButtonActive = !isLoading;
    // this.submitted = isLoading;
  }

  getbackgroundDetail() {
    this.toggleSpinner(true);
    const url = `backgroundVerification?emp_id=${this.urlId}`;
    this.api.getwithoutid(url).subscribe(
      (res: any) => {
        if (res && res.status) {
          const data = res.data[0];
          this.toggleSpinner(false);
          this.uploadedDocuments = data;

          this.documents.forEach((doc) => {
            if (data[doc.field]) {
              doc.documentNo = data[doc.field];

              doc.status = "Uploaded";
              doc.fileUrl = data[doc.fileField];
            }
          });
          // this.formGroup.patchValue({
          //   acc_holder_name: data.acc_holder_name,
          //   acc_number: data.acc_number,
          //   bank_name: data.bank_name,
          //   ifsc_code: data.ifsc_code,
          // });
          this.backGroundDetail.emit(true);
        } else {
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

  get f() {
    return this.formGroup.controls;
  }

  imageSelect(event: any) {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      this.selectedImage = selectedFile;
      this.selectedImagePreview = URL.createObjectURL(selectedFile);
    }
  }

  onAdd(documentType: string): void {
    this.selectedDocument = documentType;

    // Update validation based on the document type
    const documentValidators = this.getValidators(documentType);

    this.formGroup.setControl(
      "documentNo",
      this.formBuilder.control("", documentValidators.number)
    );
    this.formGroup.setControl(
      "documentFile",
      this.formBuilder.control("", documentValidators.file)
    );

    // Show modal
    this.showModal?.show();

    var modaltitle = document.querySelector(".modal-title") as HTMLAreaElement;

    modaltitle.innerHTML = `Add ${this.selectedDocument}`;
    var modalbtn = document.getElementById("add-btn") as HTMLAreaElement;
    modalbtn.innerHTML = "Add";
  }

  onEdit(documentName: any) {
    this.selectedDocument = documentName.name;

    this.uploadedImage = documentName.fileUrl;

    // Update validators to not require the file for editing
    const documentValidators = this.getValidators(documentName.name);
    this.formGroup.setControl(
      "documentNo",
      this.formBuilder.control(
        documentName.documentNo || "",
        documentValidators.number
      )
    );

    this.formGroup.setControl("documentFile", this.formBuilder.control(""));

    this.showModal?.show();

    // Update modal title and button text
    const modaltitle = document.querySelector(
      ".modal-title"
    ) as HTMLAreaElement;
    modaltitle.innerHTML = `Edit ${this.selectedDocument}`;
    const modalbtn = document.getElementById("add-btn") as HTMLAreaElement;
    modalbtn.innerHTML = "Save"; // Indicate edit mode
  }

  getValidators(documentType: string) {
    switch (documentType) {
      case "Aadhaar":
        return {
          number: [Validators.required, Validators.pattern(/^\d{9,18}$/)],
          file: [Validators.required],
        };
      case "PAN":
        return {
          number: [
            Validators.required,
            Validators.pattern(/^[A-Z]{5}\d{4}[A-Z]{1}$/),
          ],
          file: [Validators.required],
        };
      case "Driving License":
        return {
          number: [Validators.required, Validators.pattern(/^[A-Z0-9]{15}$/)],
          file: [Validators.required],
        };
      case "Voter":
        return {
          number: [Validators.required, Validators.pattern(/^[A-Z]{3}\d{7}$/)],
          file: [Validators.required],
        };
      case "UAN":
        return {
          number: [Validators.required, Validators.pattern(/^\d{12}$/)],
          file: [Validators.required],
        };
      default:
        return {
          number: [Validators.required],
          file: [Validators.required],
        };
    }
  }

  onSubmit(): void {
    if (!this.urlId) {
      this.toastService.error("Please add Personal Details First");
    } else {
      if (this.formGroup.valid) {
        const formData = new FormData();
        formData.append("emp_id", this.urlId.toString());

        formData.append("documentType", this.selectedDocument);
        formData.append("documentNo", this.f["documentNo"].value);
        formData.append("documentFile", this.selectedImage);

        this.api.post("backgroundVerification", formData).subscribe(
          (res: any) => this.handleResponse(res),
          (error) => this.handleError(error)
        );
        // Handle submission logic
      } else {
        this.formGroup.markAllAsTouched();
      }
    }
  }

  handleResponse(res: any) {
    this.toggleSpinner(false);
    if (res.status === true) {
      this.toastService.success("Data Saved Successfully!!");
      this.showModal?.hide();

      this.getbackgroundDetail();
      this.resetForm();
      // this.router.navigate(["employee"]);
    } else {
      this.toastService.error(res["message"]);
    }
  }

  handleError(error: any) {
    this.toggleSpinner(false);
  }

  resetForm(): void {
    this.showModal?.hide()
    this.formGroup.reset();
    this.selectedImage = null;
    this.selectedImagePreview = null;
    this.uploadedImage = null;
  }
}
