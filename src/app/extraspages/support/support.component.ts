import { Component, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ToastrService } from 'ngx-toastr';
import { ModalDirective } from 'ngx-bootstrap/modal';

@Component({
  selector: 'app-support',
  templateUrl: './support.component.html',
  styleUrl: './support.component.scss'
})
export class SupportComponent {

  formGroup!: FormGroup;
  submitted: boolean = false;
  spinnerStatus: boolean = false;
  saveButtonActive: boolean = true;
  @ViewChild("grid", { static: false }) grid?: ModalDirective;
  constructor( private formBuilder: FormBuilder, private api: ApiService, public toastService: ToastrService)
  {}

  ngOnInit(): void {
    this.formGroup = this.formBuilder.group({
      name: ["", [Validators.maxLength(45), Validators.required]],
      email: ["",  [
        Validators.required,
        Validators.email,
        Validators.pattern("^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$"),
      ],],
      message: [""],
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

  onSubmit() {
    if (this.formGroup.valid) {
      this.toggleSpinner(true);
      const formData = this.createFormData();
     
        this.add(formData);
    } else {
      this.formGroup.markAllAsTouched();
    }
  }

  createFormData() {
    const formData = {
      name: this.f["name"].value,
      email: this.f["email"].value,
      message: this.f["message"].value
    };
    return formData;
  }

  add(formData: any) {
    this.api.post("createSupport", formData).subscribe(
      (res: any) => this.handleResponse(res),
      (error) => this.handleError(error)
    );
  }

  handleResponse(res: any) {
    this.toggleSpinner(false);
    if (res["status"] === true) {
      this.formGroup.reset();
      this.toastService.success(res.message);
      this.grid?.hide();
    } else {
      this.toastService.error(res["message"]);
    }
  }

  handleError(error: any) {
    this.toggleSpinner(false);
  }
}
