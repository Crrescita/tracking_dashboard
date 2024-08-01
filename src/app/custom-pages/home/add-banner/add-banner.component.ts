import { Component, OnInit } from "@angular/core";
import { FormGroup, FormBuilder, Validators } from "@angular/forms";

import { ActivatedRoute, Router } from "@angular/router";
import { ToastrService } from "ngx-toastr";
import { ApiService } from "../../../core/services/api.service";

@Component({
  selector: "app-add-banner",
  templateUrl: "./add-banner.component.html",
  styleUrls: ["./add-banner.component.scss"],
})
export class AddBannerComponent implements OnInit {
  breadCrumbItems!: Array<{}>;
  BannerSectionform!: FormGroup;

  urlId: number | null = null;

  submitted: boolean = false;
  spinnerStatus: boolean = false;
  saveButtonActive: boolean = true;

  // Image and video
  BannerImageSelectedFiles: File | null = null;
  BannerImageFilePreview: any = null;
  BannerThumbnailSelectedFiles: File | null = null;
  BannerThumbnailFilePreview: any = null;
  BannerVideoSelectedFiles: File | null = null;
  BannerVideoFilePreview: any = null;
  mobBannerVideoSelectedFiles: File | null = null;
  mobBannerVideoFilePreview: any = null;

  uploadedThumbnail: string = "";
  uploadedMobileThumbnail: string = "";
  uploadedVideo: string = "";
  mobuploadedVideo: string = "";

  constructor(
    private route: ActivatedRoute,
    private formBuilder: FormBuilder,
    private api: ApiService,
    private router: Router,
    public toastService: ToastrService
  ) {}

  ngOnInit(): void {
    this.breadCrumbItems = [
      { label: "Pages", active: true },
      { label: "Home Page", active: true },
    ];

    this.route.params.subscribe((params) => {
      this.urlId = params["id"] ? Number(params["id"]) : null;
    });

    this.initializeForm();

    if (this.urlId) {
      this.getHomebannerDetails();
    }
  }

  get f() {
    return this.BannerSectionform.controls;
  }

  initializeForm() {
    this.BannerSectionform = this.formBuilder.group({
      title: ["", [Validators.maxLength(25)]],
      sub_title: ["", [Validators.maxLength(25)]],
      description: ["", [Validators.maxLength(150)]],
      type: ["", [Validators.required]],
      videotype: ["", [Validators.required]],
      videotypemob: ["", [Validators.required]],
      bannervideoUrl: [""],
      mobbannervideoUrl: [""],
      cta1Name: [""],
      cta1Url: [""],
      cta1Status: ["", [Validators.required]],
      status: ["", [Validators.required]],
    });
  }

  // API Methods
  getHomebannerDetails() {
    this.toggleSpinner(true);
    this.api.get("homebanner", this.urlId).subscribe(
      (res: any) => {
        if (res && res.status) {
          this.toggleSpinner(false);
          this.setHomebannerDetails(res.data[0]);
          this.setValidation(res.data[0].type);
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

  setValidation(value: string) {
    if (value === "image") {
      this.clearVideoValidators();
    } else if (value === "video") {
      this.setVideoValidators();
    }
  }

  clearVideoValidators() {
    this.BannerSectionform.get("videotype")!.clearValidators();
    this.BannerSectionform.get("videotypemob")!.clearValidators();
    this.BannerSectionform.get("videotype")!.updateValueAndValidity();
    this.BannerSectionform.get("videotypemob")!.updateValueAndValidity();
  }

  setVideoValidators() {
    this.BannerSectionform.get("videotype")!.setValidators([
      Validators.required,
    ]);
    this.BannerSectionform.get("videotypemob")!.setValidators([
      Validators.required,
    ]);
    this.BannerSectionform.get("videotype")!.updateValueAndValidity();
    this.BannerSectionform.get("videotypemob")!.updateValueAndValidity();
  }

  setHomebannerDetails(data: any) {
    if (data) {
      this.f["title"].setValue(data.title);
      this.f["sub_title"].setValue(data.sub_title);
      this.f["description"].setValue(data.description);
      this.f["type"].setValue(data.type);
      this.f["videotype"].setValue(data.videotype);
      this.f["videotypemob"].setValue(data.videotypemob);
      this.f["cta1Name"].setValue(data.cta1_name);
      this.f["cta1Url"].setValue(data.cta1_link);
      this.f["cta1Status"].setValue(data.cta1_status);
      this.f["status"].setValue(data.status);
      this.f["bannervideoUrl"].setValue(data.video_url);
      this.f["mobbannervideoUrl"].setValue(data.mobbannervideoUrl);
      this.uploadedThumbnail = data.thumbnail;
      this.uploadedMobileThumbnail = data.thumbnail_mob;
      this.uploadedVideo = data.video;
      this.mobuploadedVideo = data.mobvideo;
    }
  }

  toggleSpinner(isLoading: boolean) {
    this.spinnerStatus = isLoading;
    this.saveButtonActive = !isLoading;
    this.submitted = isLoading;
  }

  onSubmit() {
    if (this.BannerSectionform.valid) {
      this.toggleSpinner(true);
      const formData = this.createFormData();
      if (this.urlId) {
        this.updateBanner(formData);
      } else {
        this.addBanner(formData);
      }
    } else {
      this.BannerSectionform.markAllAsTouched();
    }
  }

  createFormData(): FormData {
    const formData = new FormData();

    formData.append("title", this.f["title"].value);
    formData.append("sub_title", this.f["sub_title"].value);
    formData.append("description", this.f["description"].value);
    formData.append("type", this.f["type"].value);
    formData.append("cta1_name", this.f["cta1Name"].value);
    formData.append("cta1_link", this.f["cta1Url"].value);
    formData.append("cta1_status", this.f["cta1Status"].value);

    formData.append("status", this.f["status"].value);
    formData.append("videotype", this.f["videotype"].value);
    formData.append("videotypemob", this.f["videotypemob"].value);
    formData.append("alt_name", "banner");

    if (this.f["type"].value === "image") {
      if (this.BannerImageSelectedFiles) {
        formData.append("thumbnail", this.BannerImageSelectedFiles);
      }
      // else {
      //   formData.append('thumbnail', this.uploadedThumbnail);
      // }
      if (this.BannerThumbnailSelectedFiles) {
        formData.append("thumbnail_mob", this.BannerThumbnailSelectedFiles);
      }
      // else {
      //   formData.append('thumbnail_mob', this.uploadedMobileThumbnail);
      // }
    } else if (this.f["type"].value === "video") {
      if (this.f["videotype"].value === "file") {
        if (this.BannerVideoSelectedFiles) {
          formData.append("video", this.BannerVideoSelectedFiles);
        }
        //  else {
        //   formData.append('video', this.uploadedVideo);
        // }
      } else if (this.f["videotype"].value === "url") {
        formData.append("video_url", this.f["bannervideoUrl"].value);
      }

      if (this.f["videotypemob"].value === "file") {
        if (this.mobBannerVideoSelectedFiles) {
          formData.append("mobvideo", this.mobBannerVideoSelectedFiles);
        }
        // else {
        //   formData.append('mobvideo', this.mobuploadedVideo);
        // }
      } else if (this.f["videotypemob"].value === "url") {
        formData.append("mobbannervideoUrl", this.f["mobbannervideoUrl"].value);
      }

      if (this.BannerThumbnailSelectedFiles) {
        formData.append("thumbnail_mob", this.BannerThumbnailSelectedFiles);
      }
      // else {
      //   formData.append('thumbnail_mob', this.uploadedMobileThumbnail); // Retain existing mobile thumbnail
      // }
    }

    return formData;
  }

  addBanner(formData: FormData) {
    this.api.post("homebanner", formData).subscribe(
      (res: any) => this.handleResponse(res),
      (error) => this.handleError(error)
    );
  }

  updateBanner(formData: FormData) {
    const urlId = this.urlId as number;
    this.api.put("homebanner", urlId, formData).subscribe(
      (res: any) => this.handleResponse(res),
      (error) => this.handleError(error)
    );
  }

  handleResponse(res: any) {
    this.toggleSpinner(false);
    if (res.status === true) {
      this.resetForm();
      this.toastService.success("Data Saved Successfully!!");
      this.router.navigate(["home/banner-list"]);
    } else {
      this.toastService.error(res["message"]);
    }
  }

  resetForm() {
    this.BannerImageSelectedFiles = null;
    this.BannerThumbnailSelectedFiles = null;
    this.BannerVideoSelectedFiles = null;
    this.mobBannerVideoSelectedFiles = null;
    this.BannerSectionform.reset();
  }

  handleError(error: any) {
    this.toggleSpinner(false);
  }

  // Image and video upload
  onBannerImageSelected(event: any) {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      this.BannerImageSelectedFiles = selectedFile;
      this.BannerImageFilePreview = URL.createObjectURL(selectedFile);
    }
  }

  onBannerVideoSelected(event: any) {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      this.BannerVideoSelectedFiles = selectedFile;
      this.BannerVideoFilePreview = URL.createObjectURL(selectedFile);
    }
  }

  mobBannerVideoSelected(event: any) {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      this.mobBannerVideoSelectedFiles = selectedFile;
      this.mobBannerVideoFilePreview = URL.createObjectURL(selectedFile);
    }
  }

  onThumbnailSelected(event: any) {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      this.BannerThumbnailSelectedFiles = selectedFile;
      this.BannerThumbnailFilePreview = URL.createObjectURL(selectedFile);
    }
  }

  removeImageSelectedFile(fileInput: any) {
    this.BannerImageSelectedFiles = null;
    this.BannerImageFilePreview = null;
    fileInput.value = null;
  }

  removeThumbnailSelectedFile(fileInput: any) {
    this.BannerThumbnailSelectedFiles = null;
    this.BannerThumbnailFilePreview = null;
    fileInput.value = null;
  }

  removeVideoSelectedFile(fileInput: any) {
    this.BannerVideoSelectedFiles = null;
    this.BannerVideoFilePreview = null;
    fileInput.value = null;
  }

  mobremoveVideoSelectedFile(mobfileInput: any) {
    this.mobBannerVideoSelectedFiles = null;
    this.mobBannerVideoFilePreview = null;
    mobfileInput.value = null;
  }

  onTypeChange(event: any) {
    const value = event.target.value;
    if (value === "video") {
      this.setVideoValidators();
    } else {
      this.clearVideoValidators();
    }
  }
}
