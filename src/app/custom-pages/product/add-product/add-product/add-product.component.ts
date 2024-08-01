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
import { DomSanitizer, SafeHtml, SafeStyle } from "@angular/platform-browser";
import { Editor, TOOLBAR_FULL } from "ngx-editor";

@Component({
  selector: "app-add-product",

  templateUrl: "./add-product.component.html",
  styleUrl: "./add-product.component.scss",
})
export class AddProductComponent implements OnInit {
  @Output() titleChange = new EventEmitter<string>();
  breadCrumbItems!: Array<{}>;
  sectionHeading!: FormGroup;
  formGroup!: FormGroup;
  productData: any = [];
  subproductData: any = [];

  editId: number | null = null;
  addSaveButtonActive: boolean = true;
  spinnerStatus: boolean = false;

  // category data
  categoryData: any = [];
  subcategoryData: any = [];

  //multiple image
  productUploadedThumbnail: any = [];
  productImageFilePreview: any = [];
  productImageSelectedFiles: any = [];

  // image

  // pdf
  selectedFile: string | ArrayBuffer | null = null;
  selectedImage: any = null;
  selectedImagePreview: any = null;
  uploadedImage: any = null;

  //table
  term: string = "";
  currentPage = 1;
  totalItems = 0;
  itemsPerPage = 5;
  endItem: any;

  // eidtor
  editor: any = Editor;
  toolbar: any = TOOLBAR_FULL;
  editordescription: any = Editor;
  editorinstructions: any = Editor;
  editordisclaimer: any = Editor;
  editorshortDescription: any = Editor;

  //
  tags: any = [];

  constructor(
    private formBuilder: FormBuilder,
    private api: ApiService,
    public toastService: ToastrService,
    private route: ActivatedRoute,
    private sanitizer: DomSanitizer,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.breadCrumbItems = [
      { label: "Product", active: true },
      { label: "Product List ", active: true },
    ];

    this.editordescription = new Editor();
    this.editorshortDescription = new Editor();
    this.editorinstructions = new Editor();
    this.editordisclaimer = new Editor();

    this.route.params.subscribe((params) => {
      this.editId = params["id"];
    });

    if (this.editId) {
      this.productGet();
    }

    this.getCategoryData();
    this.getSubCategoryData();
    this.initializeFormproduct();
    this.getTag();
  }

  getTag() {
    this.api.getwithoutid("tag?columns=id,title&status=active").subscribe(
      (res: any) => {
        if (res && res.status) {
          this.tags = res.data || [];
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

  productGet() {
    this.api.get("product", this.editId).subscribe(
      (res: any) => {
        if (res && res.status) {
          const productData = res.data[0];

          if (productData.tags && productData.tags != "undefined") {
            var tagsArray = Array.isArray(productData.tags)
              ? productData.tags
              : JSON.parse(productData.tags);
          }

          this.formGroup.patchValue({
            category_id: productData.category_id,
            sub_category_id: productData.sub_category_id,
            title: productData.title,
            description: productData.description,
            short_description: productData.short_description,
            instructions: productData.instructions,
            sku_no: productData.sku_no,
            product_price: productData.product_price,
            discount_price: productData.discount_price,
            // product_pdf: productData.product_pdf,
            quantity: productData.quantity,
            validity: productData.validity,
            validityUnit: productData.validityUnit,
            product_limit: productData.product_limit,
            seo_url: productData.seo_url,
            slug: productData.slug,
            meta_tag: productData.meta_tag,
            meta_keywords: productData.meta_keywords,
            meta_description: productData.meta_description,
            product_type: productData.product_type,
            status: productData.status,
            price_on_req: productData.price_on_req,
            cta_btn: productData.cta_btn,
            cta_status: productData.cta_status,
            tags: tagsArray,
          });

          this.uploadedImage = productData.product_pdf;
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

  initializeFormproduct() {
    this.formGroup = this.formBuilder.group({
      category_id: ["", [Validators.required]],
      sub_category_id: ["", [Validators.required]],
      title: ["", [Validators.required, Validators.maxLength(45)]],
      description: ["", [Validators.required]],
      short_description: [""],
      instructions: [""],
      disclaimer: [""],
      sku_no: ["", [Validators.required]],
      product_price: ["", [Validators.required]],
      discount_price: [""],
      product_pdf: [""],
      quantity: [""],
      validity: [""],
      validityUnit: [""],
      product_limit: [""],
      seo_url: [""],
      tags: [""],
      slug: [""],
      meta_tag: [""],
      meta_keywords: [""],
      meta_description: [""],
      status: ["", [Validators.required]],
      product_type: ["", [Validators.required]],
      price_on_req: ["", [Validators.required]],
      cta_btn: [""],
      cta_status: [""],
    });

    this.formGroup.get("price_on_req")?.valueChanges.subscribe((value) => {
      const ctaControl = this.formGroup.get("cta_btn");
      const ctalinkControl = this.formGroup.get("cta_status");
      const productpriceControl = this.formGroup.get("product_price");
      if (value === "false") {
        ctaControl?.setValidators([Validators.required]);
        ctalinkControl?.setValidators([Validators.required]);
        productpriceControl?.clearValidators();
      } else if (value === "true") {
        productpriceControl?.setValidators([Validators.required]);
        ctaControl?.clearValidators();
        ctalinkControl?.clearValidators();
      } else {
        productpriceControl?.clearValidators();
        ctaControl?.clearValidators();
        ctalinkControl?.clearValidators();
      }

      productpriceControl?.updateValueAndValidity();
      ctaControl?.updateValueAndValidity();
      ctalinkControl?.updateValueAndValidity();
    });

    this.formGroup.get("product_type")?.valueChanges.subscribe((value) => {
      const quantityControl = this.formGroup.get("quantity");
      const productLimitControl = this.formGroup.get("product_limit");
      const validityControl = this.formGroup.get("validity");
      const validityUnitControl = this.formGroup.get("validityUnit");

      if (value === "product") {
        quantityControl?.setValidators([Validators.required]);
        productLimitControl?.setValidators([Validators.required]);
        validityControl?.clearValidators();
        validityUnitControl?.clearValidators();
      } else if (value === "service") {
        validityControl?.setValidators([Validators.required]);
        validityUnitControl?.setValidators([Validators.required]);
        quantityControl?.clearValidators();
        productLimitControl?.clearValidators();
      } else {
        quantityControl?.clearValidators();
        productLimitControl?.clearValidators();
        validityControl?.clearValidators();
        validityUnitControl?.clearValidators();
      }

      quantityControl?.updateValueAndValidity();
      productLimitControl?.updateValueAndValidity();
      validityControl?.updateValueAndValidity();
      validityUnitControl?.updateValueAndValidity();
    });

    // this.categoryimageValidator()
  }

  productimageValidator() {
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

  toggleSpinner(isLoading: boolean) {
    this.spinnerStatus = isLoading;
    this.addSaveButtonActive = !isLoading;
  }

  getCategoryData() {
    this.api.getwithoutid("product-category?columns=id,title").subscribe(
      (res: any) => {
        if (res && res.status) {
          this.categoryData = res.data || [];
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

  getSubCategoryData() {
    this.api.getwithoutid("product-sub-category?columns=id,title").subscribe(
      (res: any) => {
        if (res && res.status) {
          this.subcategoryData = res.data || [];
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
      const formData = this.createproductFormData();
      if (this.editId != null) {
        this.updateproduct(formData, this.editId);
      } else {
        this.addproduct(formData);
      }
    } else {
      this.formGroup.markAllAsTouched();
      this.toastService.error(
        "Please fill in all General information required fields."
      );
    }
  }

  createproductFormData(): FormData {
    const formData = new FormData();

    formData.append("category_id", this.s2["category_id"].value);
    formData.append("sub_category_id", this.s2["sub_category_id"].value);
    formData.append("title", this.s2["title"].value);
    formData.append("product_type", this.s2["product_type"].value);
    formData.append("description", this.s2["description"].value);
    formData.append("short_description", this.s2["short_description"].value);
    formData.append("instructions", this.s2["instructions"].value);
    formData.append("disclaimer", this.s2["disclaimer"].value);
    formData.append("sku_no", this.s2["sku_no"].value);
    formData.append("product_price", this.s2["product_price"].value);
    formData.append("discount_price", this.s2["discount_price"].value);
    formData.append("quantity", this.s2["quantity"].value);
    formData.append("validity", this.s2["validity"].value);
    formData.append("validityUnit", this.s2["validityUnit"].value);
    formData.append("product_limit", this.s2["product_limit"].value);
    formData.append("seo_url", this.s2["seo_url"].value);
    const selectedTags = this.s2["tags"].value;
    formData.append("tags", JSON.stringify(selectedTags));

    formData.append("slug", this.s2["slug"].value);
    formData.append("meta_tag", this.s2["meta_tag"].value);
    formData.append("meta_keywords", this.s2["meta_keywords"].value);
    formData.append("meta_description", this.s2["meta_description"].value);
    formData.append("status", this.s2["status"].value);
    formData.append("price_on_req", this.s2["price_on_req"].value);
    formData.append("cta_btn", this.s2["cta_btn"].value);
    formData.append("cta_status", this.s2["cta_status"].value);
    if (this.selectedImage) {
      formData.append("product_pdf", this.selectedImage);
    }

    const currentUserString = localStorage.getItem("currentUser");
    const currentUser = currentUserString ? JSON.parse(currentUserString) : {};
    const username = currentUser.username || "Admin";
    const field = this.editId != null ? "updated_by" : "created_by";
    formData.append(field, username);

    return formData;
  }

  updateproduct(formData: FormData, id: number) {
    this.api.put("product", id, formData).subscribe(
      (res: any) => this.handleproductResponse(res),
      (error) => this.handleError(error)
    );
  }

  addproduct(formData: FormData) {
    this.api.post("product", formData).subscribe(
      (res: any) => this.handleproductResponse(res),
      (error) => this.handleError(error)
    );
  }

  handleproductResponse(res: any) {
    this.toggleSpinner(false);
    if (res["status"] === true) {
      this.toastService.success("Data Saved Successfully!!");
      this.router.navigate(["/products"]);
      // this.resetForm();
    } else {
      this.toastService.error(res["message"]);
    }
  }

  resetForm() {
    this.editId = null;
    this.formGroup.reset();
  }

  handleError(error: any) {
    this.toggleSpinner(false);
  }

  // multiple image upload
  onProductImageSelected(event: any) {
    const selectedFile = event.target.files;
    if (selectedFile) {
      if (selectedFile.length < 6) {
        selectedFile.forEach((item: any) => {
          this.productImageSelectedFiles.push(item);
          this.productImageFilePreview.push(URL.createObjectURL(item));
        });
      } else {
      }
    }
  }

  removeproductSelectedFile(fileInput: any, imageFile: any, previewFile: any) {
    this.productImageSelectedFiles.splice(
      this.productImageSelectedFiles.indexOf(imageFile),
      1
    );
    this.productImageFilePreview.splice(
      this.productImageFilePreview.indexOf(previewFile),
      1
    );
    fileInput.value = null;
  }
  editproductUploadedFile(event: any, id: number, fileInput: any) {
    const selectedFile = event.target.files[0];
    if (selectedFile && id) {
      this.spinnerStatus = true;
      const formData = new FormData();
      formData.append("image", selectedFile);
      // this.homeApi
      //   .patch("section9gallary/productmultipleimages", id, formData)
      //   .subscribe((res: any) => {
      //     if (res["status"] == true) {
      //       this.getproductImages();
      //       this.spinnerStatus = false;
      //       fileInput.value = null;
      //       this.toastService.success("Image Updated Successfully!!");
      //     } else {
      //       this.spinnerStatus = false;
      //       this.toastService.error("Oops! Something went wrong");
      //     }
      //   });
    }
  }

  deleteproductUploadedFile(id: number) {
    if (id) {
      Swal.fire({
        title: "Are you sure?",
        text: "You won't be able to revert this!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Yes, delete it!",
      }).then((result) => {
        if (result.isConfirmed) {
          // this.spinnerStatus = true;
          // this.homeApi
          //   .deleteWithId("section9gallary", id)
          //   .subscribe((res: any) => {
          //     if (res["status"] == true) {
          //       this.getOvernightImages();
          //       this.spinnerStatus = false;
          //       Swal.fire(
          //         "Deleted!",
          //         "Your Image has been deleted.",
          //         "success"
          //       );
          //     } else {
          //       this.spinnerStatus = false;
          //       Swal.fire("Error!", "Something went wrong.", "error");
          //     }
          //   });
        }
      });
    }
  }

  // image code
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
}
