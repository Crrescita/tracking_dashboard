import { Component, OnInit, ViewChild } from "@angular/core";

import { PageChangedEvent } from "ngx-bootstrap/pagination";
import { ToastrService } from "ngx-toastr";
import { ModalDirective } from "ngx-bootstrap/modal";
import { FormGroup, FormBuilder, Validators } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { cloneDeep } from "lodash";
import { ApiService } from '../../../../../core/services/api.service';

@Component({
  selector: 'app-salary-setting',
  templateUrl: './salary-setting.component.html',
  styleUrl: './salary-setting.component.scss'
})
export class SalarySettingComponent {
  breadCrumbItems!: Array<{}>;
  submitted: boolean = false;
  spinnerStatus: boolean = false;
  saveButtonActive: boolean = true;
  masterSelected!: boolean;
  salarySettingData: any = [];
  salarySettingDataList: any = [];
  filteredbranchData: any = [];
  endItem: any;

  formGroup!: FormGroup;

  id: number | null = null;

  checkedValGet: any[] = [];
  

  currentPage: number = 1;
  currentItemsPerPage = 10;
  itemsPerPageOptions = [10, 20, 30, 50];

  @ViewChild("showModal", { static: false }) showModal?: ModalDirective;
  @ViewChild("deleteRecordModal", { static: false })
  deleteRecordModal?: ModalDirective;
  deleteId: any;
  availableVariables: { name: string }[] = [{ name: 'Net_Salary' }]; 
  formula: string = "";
  constructor(
    private api: ApiService,
    public toastService: ToastrService,
    private formBuilder: FormBuilder,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.breadCrumbItems = [
      { label: "Employee Management" },
      { label: "Branch", active: true },
    ];

    this.route.queryParams.subscribe((params) => {
      this.currentPage = +params["page"] || 1;
      this.currentItemsPerPage = +params["itemsPerPage"] || 10;
      this.term = params["term"] || "";
      this.filterdata();
      this.updatePaginatedData();
    });

   
    this.getSalarySetting();

    this.formGroup = this.formBuilder.group({
      name: ["", [Validators.maxLength(45), Validators.required]],
      formula:[""],
      status: ["", [Validators.required]],
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

  getSalarySetting() {
    this.toggleSpinner(true);
    const url = `salarySettings`;
    this.api.getwithoutid(url).subscribe(
      (res: any) => {
        this.toggleSpinner(false);
        if (res && res.status) {
          this.salarySettingDataList = res.data || [];
          this.filterdata();
          this.updateAvailableVariables();
        } else {
          this.salarySettingData = [];
          this.salarySettingDataList = [];
          this.handleError("Unexpected response format");
        }
      },
      (error) => {
        this.toggleSpinner(false);
        this.handleError(error.message || "An error occurred while fetching data");
      }
    );
  }

  updateAvailableVariables() {
    // Ensure Net_Salary is always present and filter out null/undefined values
    this.availableVariables = [{ name: 'Net_Salary' }];
  
    // Append only valid (non-null) unique variables from salarySettingDataList
    this.salarySettingDataList.forEach((item: any) => {
      if (item?.name && typeof item.name === 'string' && item.name.trim() !== '' &&
          !this.availableVariables.some(v => v.name === item.name)) {
        this.availableVariables.push({ name: item.name });
      }
    });
  
    console.log("Updated Variables: ", this.availableVariables); // Debugging log
  }
  
  
  

  setStatus(data: any, event: Event) {
    const inputElement = event.target as HTMLInputElement;
    const newStatus = inputElement.checked ? "active" : "inactive";

    const formData = {
      name: data.name,
      status: newStatus,
    };
    this.toggleSpinner(true);

    this.api.put("salarySettings", data.id, formData).subscribe(
      (res: any) => this.handleResponse(res),
      (error) => this.handleError(error)
    );
  }

  onSubmit() {
    console.log(this.formGroup.valid)
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

  convertToFormat(name: string): string {
    return name
      .trim()
      .replace(/\s+/g, '_')          // Replace all spaces with underscores
      .replace(/(^|\_)([a-z])/g, (match) => match.toUpperCase());  // Capitalize the first letter of each word
  }
  
  
  createFormData() {
    const formData = {
      name: this.convertToFormat(this.f["name"].value),
      formula: this.f["formula"].value,
      status: this.f["status"].value,
      type:"allowance"
    };
    return formData;
  }

  add(formData: any) {
    this.api.post("salarySettings", formData).subscribe(
      (res: any) => this.handleResponse(res),
      (error) => this.handleError(error)
    );
  }

  update(formData: any) {
    const id = this.id as number;
    this.api.put("salarySettings", id, formData).subscribe(
      (res: any) => this.handleResponse(res),
      (error) => this.handleError(error)
    );
  }

  onAdd() {
    this.resetForm();
    this.showModal?.show();
    var modaltitle = document.querySelector(".modal-title") as HTMLAreaElement;
    modaltitle.innerHTML = "Add Branch";
    var modalbtn = document.getElementById("add-btn") as HTMLAreaElement;
    modalbtn.innerHTML = "Add";
    this.id = null;
  }

  resetForm() {
    this.formGroup.reset();
    // Set default values if necessary
    this.formGroup.patchValue({
      name: "",
      status: "",
    });
  }

  // edit
  editList(data: any) {
    this.showModal?.show();
    var modaltitle = document.querySelector(".modal-title") as HTMLAreaElement;
    modaltitle.innerHTML = "Edit Branch";
    var modalbtn = document.getElementById("add-btn") as HTMLAreaElement;
    modalbtn.innerHTML = "Update";

    this.id = data.id;

    this.formGroup.patchValue({
      name: data.name,
      status: data.status,
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
      this.api.deleteWithId("salarySettings", id).subscribe(
        (res: any) => this.handleResponse(res),
        (error) => this.handleError(error)
      );
    }

    const idsToDelete = this.checkedValGet;
    if (idsToDelete && idsToDelete.length > 0) {
      this.api.post("salarySetting-delete-multiple", { ids: idsToDelete }).subscribe(
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
      this.getSalarySetting();
      this.showModal?.hide();
    } else {
      this.toastService.error(res["message"]);
    }
  }

  handleError(error: any) {
    this.toggleSpinner(false);
  }

  // Select Checkbox value Get
  onCheckboxChange(e: any) {
    var checkedVal: any[] = [];
    var result;
    for (var i = 0; i < this.salarySettingData.length; i++) {
      if (this.salarySettingData[i].states == true) {
        result = this.salarySettingData[i].id;
        checkedVal.push(result);
      }
    }
    this.checkedValGet = checkedVal;
    checkedVal.length > 0
      ? document.getElementById("remove-actions")?.classList.remove("d-none")
      : document.getElementById("remove-actions")?.classList.add("d-none");
  }

  // The master checkbox will check/ uncheck all items
  checkUncheckAll(ev: any) {
    this.salarySettingData = this.salarySettingData.map((x: { states: any }) => ({
      ...x,
      states: ev.target.checked,
    }));

    var checkedVal: any[] = [];
    var result;
    for (var i = 0; i < this.salarySettingData.length; i++) {
      if (this.salarySettingData[i].states == true) {
        result = this.salarySettingData[i].id;
        checkedVal.push(result);
      }
    }

    this.checkedValGet = checkedVal;

    checkedVal.length > 0
      ? document.getElementById("remove-actions")?.classList.remove("d-none")
      : document.getElementById("remove-actions")?.classList.add("d-none");
  }

  // table

  // Sort Data
  direction: any = "asc";
  onSort(column: any) {
    if (this.direction == "asc") {
      this.direction = "desc";
    } else {
      this.direction = "asc";
    }
    const sortedArray = [...this.salarySettingData]; // Create a new array
    sortedArray.sort((a, b) => {
      const res = this.compare(a[column], b[column]);
      return this.direction === "asc" ? res : -res;
    });
    this.salarySettingData = sortedArray;
  }
  compare(v1: string | number, v2: string | number) {
    return v1 < v2 ? -1 : v1 > v2 ? 1 : 0;
  }

  // pageChanged(event: PageChangedEvent): void {
  //   const startItem = (event.page - 1) * event.itemsPerPage;
  //   this.endItem = event.page * event.itemsPerPage;
  //   this.salarySettingData = this.salarySettingDataList.slice(
  //     startItem,
  //     this.endItem
  //   );
  // }
  term: any;

  // filterdata
  // filterdata() {
  //   if (this.term) {
  //     this.salarySettingData = this.salarySettingDataList.filter((el: any) =>
  //       el.name.toLowerCase().includes(this.term.toLowerCase())
  //     );
  //   } else {
  //     this.salarySettingData = this.salarySettingDataList;
  //   }
  //   // noResultElement
  //   this.updateNoResultDisplay();
  // }

  // filterdata

  filterdata() {
    let filteredData = this.salarySettingDataList;

    // Filter by term
    if (this.term) {
      filteredData = filteredData.filter((el: any) =>
        el.name.toLowerCase().includes(this.term.toLowerCase())
      );
    }
    this.filteredbranchData = filteredData;
    // Update paginated data based on current page
    this.updatePaginatedData();
  }

  // no result
  updateNoResultDisplay() {
    const noResultElement = document.querySelector(".noresult") as HTMLElement;
    const paginationElement = document.getElementById(
      "pagination-element"
    ) as HTMLElement;
    if (this.term && this.salarySettingData.length === 0) {
      noResultElement.style.display = "block";
      paginationElement.classList.add("d-none");
    } else {
      noResultElement.style.display = "none";
      paginationElement.classList.remove("d-none");
    }
  }

  onItemsPerPageChange() {
    this.currentPage = 1;
    this.updatePaginatedData();
  }
  pageChanged(event: PageChangedEvent) {
    this.currentPage = event.page;
    this.updatePaginatedData();
  }

  updatePaginatedData(): void {
    const startItem = (this.currentPage - 1) * this.currentItemsPerPage;
    const endItem = this.currentPage * this.currentItemsPerPage;

    if (this.term) {
      if (startItem >= this.filteredbranchData.length) {
        this.currentPage = 1;
      }
    }

    const newStartItem = (this.currentPage - 1) * this.currentItemsPerPage;
    const newEndItem = this.currentPage * this.currentItemsPerPage;

    this.salarySettingData = cloneDeep(
      this.filteredbranchData.slice(newStartItem, newEndItem)
    );

    this.updateNoResultDisplay();

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        page: this.currentPage,
        itemsPerPage: this.currentItemsPerPage,
        term: this.term,
      },
      queryParamsHandling: "merge",
    });
  }

  addVariable() {
    const name = this.formGroup.value.name.trim();
    if (name && !this.availableVariables.some(v => v.name === name)) {
      this.availableVariables.push({ name });
    }
  }

  // Insert variable into formula
  insertVariable(variable: string) {
    const formulaControl = this.formGroup.get('formula');
    formulaControl?.setValue((formulaControl.value ?? '') + ` ${variable} `);
  }
  
  appendNumber(num: number) {
    const formulaControl = this.formGroup.get('formula');
    formulaControl?.setValue((formulaControl.value ?? '') + num.toString());
  }
  
  insertOperation(op: string) {
    const formulaControl = this.formGroup.get('formula');
    formulaControl?.setValue((formulaControl.value ?? '') + ` ${op} `);
  }
  
  

  // Clear Formula
  clearFormula() {
    this.formula = '';
  }
}
