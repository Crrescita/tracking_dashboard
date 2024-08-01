import { Component } from '@angular/core';
import { FormBuilder, FormGroup, UntypedFormGroup, Validators } from '@angular/forms';
import { BsDatepickerConfig } from 'ngx-bootstrap/datepicker';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from 'src/app/core/services/custom-pages/auth.service';

@Component({
  selector: 'app-profile-settings',
  templateUrl: './profile-settings.component.html',
  styleUrls: ['./profile-settings.component.scss']
})

// Profile Setting component
export class ProfileSettingsComponent {

  // bread crumb items
  breadCrumbItems!: Array<{}>;
  fieldTextType!: boolean;
  fieldTextType1!: boolean;
  fieldTextType2!: boolean;
  bsConfig?: Partial<BsDatepickerConfig>;

  formGroups: FormGroup[] = [];
  educationForm!: FormGroup;
  profileDetails!: FormGroup;
  changePassForm!: FormGroup;
  currentTab = 'personalDetails';
  userDetails:any='';
  profileButtonActive:boolean=true;
  changePassButtonActive:boolean=true;
  token:any='';

  constructor(private formBuilder: FormBuilder, private authService: AuthService,
    private toastService: ToastrService) { 
    this.profileDetails = this. formBuilder.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
    })

    this.changePassForm = this. formBuilder.group({
      oldPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required]],
      confirmPassword: ['', [Validators.required]],
    },{ validator: this.passwordMatchValidator })
  }

  get c() { return this.changePassForm.controls; }
  get p() { return this.profileDetails.controls; }

  ngOnInit(): void {

    this.getUserDetails()
    /**
     * BreadCrumb
     */
    this.breadCrumbItems = [
      { label: 'Pages', active: true },
      { label: 'Profile Settings', active: true }
    ];

    this.educationForm = this.formBuilder.group({
      degree: [''],
      name: [''],
      year: [''],
      to: [''],
      description: ['']
    });
    this.formGroups.push(this.educationForm);

  }

  /**
  * Default Select2
  */
  selectedAccount = 'This is a placeholder';
  Skills = [
    { name: 'Illustrator' },
    { name: 'Photoshop' },
    { name: 'CSS' },
    { name: 'HTML' },
    { name: 'Javascript' },
    { name: 'Python' },
    { name: 'PHP' },
  ];

  // Change Tab Content
  changeTab(tab: string) {
    this.currentTab = tab;
  }

  // File Upload
  imageURL: any;
  fileChange(event: any, id: any) {
    let fileList: any = (event.target as HTMLInputElement);
    let file: File = fileList.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      this.imageURL = reader.result as string;
      if (id == '0') {
        document.querySelectorAll('#cover-img').forEach((element: any) => {
          element.src = this.imageURL;
        });
      }
      if (id == '1') {
        document.querySelectorAll('#user-img').forEach((element: any) => {
          element.src = this.imageURL;
        });
      }
    }

    reader.readAsDataURL(file)
  }

  /**
  * Password Hide/Show
  */
  toggleFieldTextType() {
    this.fieldTextType = !this.fieldTextType;
  }
  toggleFieldTextType1() {
    this.fieldTextType1 = !this.fieldTextType1
  }
  toggleFieldTextType2() {
    this.fieldTextType2 = !this.fieldTextType2;
  }

   // add Form
   addForm() {
    const formGroupClone = this.formBuilder.group(this.educationForm.value);
    this.formGroups.push(formGroupClone);
  }

  // Delete Form
  deleteForm(id: any) {
    this.formGroups.splice(id, 1)
  }

  getUserDetails(){
    let details = localStorage.getItem('currentUser');
    const token = localStorage.getItem('access_token');
    if(details){
      details = JSON.parse(details)
      this.userDetails = details
      this.profileDetails.get('name')?.setValue(this.userDetails.username)
      this.profileDetails.get('email')?.setValue(this.userDetails.email)
    }
    if(token){
      this.token = token
    }
  }

  onSubmit(){
    if(this.profileDetails.valid){
      this.profileButtonActive = false
    const data = {
      email: this.p['email'].value,
      username: this.p['name'].value,
      api_token: this.token
    }
    this.authService.updateProfileDetails(data).subscribe((res)=>{
      if(res.status == true){
        this.profileButtonActive = true
        this.toastService.success(res.message)
        delete data.api_token
        localStorage.setItem('currentUser',JSON.stringify(data))
        this.getUserDetails()
        // console.log(res);
      }else{
        this.profileButtonActive = true
        this.toastService.error(res.message)
        // console.log(res);
      }
      // console.log(res);
    })
    }else{
      this.profileDetails.markAllAsTouched()
    }
  }

  // Custom validator function to check if password and confirmPassword match
  passwordMatchValidator(group: FormGroup) {
    const password = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { mismatch: true };
  }

  onchangePassSubmit(){
    if(this.changePassForm.valid){
      console.log(this.changePassForm.value);
      this.changePassButtonActive = false
      const data = {
        password: this.c['newPassword'].value,
        old_password: this.c['oldPassword'].value,
        api_token: this.token
      }
      this.authService.updatePassword(data).subscribe((res)=>{
        if(res.status == true){
          this.changePassButtonActive = true
          this.toastService.success(res.message)
        }else{
          this.changePassButtonActive = true
          this.toastService.error(res.message)
        }
      })
    }else{
      this.changePassForm.markAllAsTouched()
    }
  }

}


