import {
  Component,
  Input,
  Output,
  EventEmitter,
  HostListener,
  SimpleChanges
} from "@angular/core";
import {
  FormGroup,
  FormArray,
  FormBuilder,
  Validators,
  AbstractControl,
} from "@angular/forms";
import { ToastrService } from 'ngx-toastr';
import { ApiService } from '../../../../../core/services/api.service';
import { BsDatepickerConfig } from "ngx-bootstrap/datepicker";
import { debounceTime, filter } from "rxjs/operators";
import { Subject } from "rxjs";

@Component({
  selector: 'app-salary-invoice',

  templateUrl: './salary-invoice.component.html',
  styleUrl: './salary-invoice.component.scss'
})
export class SalaryInvoiceComponent {
  @Input() isActive!: boolean; 
  @Input()salaryDetailData:any
  @Output() salaryInvoiceData = new EventEmitter<any>();
  bsConfig?: Partial<BsDatepickerConfig>;
  selectedDate: Date = new Date();
  formattedDate: any;
  private dateChangeSubject = new Subject<Date>();
  @Input() urlId: number | null = null;
  // @Output() salaryDataFetched = new EventEmitter<boolean>();
  availableVariables: { name: string; value: number }[] = [];
  dependencyMap: Record<string, Set<number>> = {};
  operations: string[] = ["+", "-", "*", "/", "%", "(", ")"];
  formula: string = "";
  company_id: any;
  formGroup!: FormGroup;
  submitted: boolean = false;
  spinnerStatus: boolean = false;
  saveButtonActive: boolean = true;
  forms: any = [];
  // paymentSign: "Rs.";

  totalAdvBal= 0;
  totalAmount = 0;
  totalError = false;

  gernated:boolean =false;


  allowances = [
    { id: 1, name: "HRA", formula: "Basic / 2" },
    { id: 2, name: "Travel Allowance" },
    { id: 3, name: "Special Allowance", formula: "Net_Salary -  Basic - HRA - Travel_Allowance" },
  ];
  allowancesList = [
    { id: 1, name: "HRA", formula: "Basic / 2" },
    { id: 2, name: "Travel Allowance" },
    { id: 3, name: "Special Allowance", formula: "Net_Salary -  Basic - HRA - Travel_Allowance" },
  ];
  // selectedAllowances: any[] = [];
  showAllowanceSelect: boolean = false;

  @HostListener("document:click", ["$event"])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    const isClickInsideAllowanceSelect = target.closest(".ng-select");
    const isClickInsideButton = target.closest("#add-item");

    // Only hide the dropdown if the click is outside the ng-select or button that triggers it
    if (!isClickInsideAllowanceSelect && !isClickInsideButton) {
      this.showAllowanceSelect = false;
    }
  }

  constructor(
    private formBuilder: FormBuilder,
    public toastService: ToastrService,
    private api: ApiService
  ) {
    this.bsConfig = {
      minMode: "month",
      dateInputFormat: "MMM , YYYY",
      showWeekNumbers: false,
    };
  }


  ngOnChanges(changes: SimpleChanges): void {
    this.getOpenAdvances()
  
    // this.getPresentDays()
    // if (changes['isActive'] && changes['isActive'].currentValue) {
    //   this.selectedDate = new Date();

    // this.dateChangeSubject.pipe(debounceTime(300)).subscribe((newDate) => {

    //   this.handleDateChange(newDate);
    // });
    // if (this.urlId) {
    //   this.initializeFormWithData()
    //   // this.getPresentDays()    
      
    // } else {
    //   this.initializeForm();
    // }
  }

  ngOnInit(): void {
    this.selectedDate = new Date();

    this.dateChangeSubject.pipe(debounceTime(300)).subscribe((newDate) => {

      this.handleDateChange(newDate);
    });
    if (this.urlId) {
      this.initializeFormWithData()
      // this.getPresentDays()    
      
    } else {
      this.initializeForm();
    }

    // this.breakup.valueChanges.subscribe(() => {
    //   this.populateDependencyMap();
    // });
    
    // Listen to changes in breakup (basic salary)
    const breakup = this.formGroup.get('breakup') as FormArray;
    breakup.valueChanges.subscribe(() => {
      this.recalculateDeductions();
    });

    this.setupSalaryChangeSubscription();
    this.setupBreakupChangeSubscription();
   
  }

  setupSalaryChangeSubscription(): void {
    this.formGroup.get('salary')?.valueChanges.subscribe((salaryValue) => {
      this.recalculateDeductions();
      this.updateVariable("Net Salary", salaryValue || 0); // Update the "Net Salary" variable
  
      const netSalaryRowIndex = this.findRowIndex("Net Salary");
      if (netSalaryRowIndex !== -1) {
        this.updateDependentRows(netSalaryRowIndex);
      }
    });
  }
  
  setupBreakupChangeSubscription(): void {
    this.breakup.valueChanges.subscribe(() => {
      this.populateDependencyMap();
    });
  }

  onDateChange(newDate: Date): void {
    this.dateChangeSubject.next(newDate);
  }

  handleDateChange(newDate: Date): void {
    this.selectedDate = newDate;
    this.formattedDate = this.formatDate(newDate);

    this.getPresentDays();
    this.getOpenAdvances();
  }

  formatDate(date: Date): string {
    if (!date) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    // return `${year}-${month}-${day}`;
    return `${year}-${month}`;
  }


  

  initializeForm() {
    this.formGroup = this.formBuilder.group({
      salary: ["", [Validators.required, Validators.min(0)]],
      breakup: this.formBuilder.array([this.createPermanentRow()]),
      deductions: this.formBuilder.array([
        this.createDeductionRow("PF", "none", "", 0),
        this.createDeductionRow("ESI", "none", "", 0),
        this.createDeductionRow("TDS", "none", "", 0),
      ]),
    });
  }

  initializeFormWithData() {
    this.formGroup = this.formBuilder.group({
      salary: ["", [Validators.required, Validators.min(0)]],
      breakup: this.formBuilder.array([]),
      deductions: this.formBuilder.array([]),
    });
  }

  populateDependencyMap(): void {
    this.dependencyMap = {}; // Reset the map
  
    // Populate dependencies from breakup rows
    this.breakup.controls.forEach((control, index) => {
      const formula = control.get("formula")?.value;
  
      if (formula) {
        const matches = formula.match(/Net_Salary|[A-Za-z_]+/g);
  
        matches?.forEach((variableName:any) => {
          const sluggedVariable = variableName.trim().replace(/\s+/g, "_");
          if (!this.dependencyMap[sluggedVariable]) {
            this.dependencyMap[sluggedVariable] = new Set();
          }
          this.dependencyMap[sluggedVariable].add(index);
        });
      }
    });
  
    if (!this.dependencyMap["Net_Salary"]) {
      this.dependencyMap["Net_Salary"] = new Set();
    }
  }
  

  findRowIndex(variableName: string): number {
    const sluggedName = variableName.trim().replace(/\s+/g, "_");
  
    // Special handling for "Net Salary" or other external variables
    if (sluggedName === "Net_Salary") {
      return -2; // Use a custom code to signify external variables
    }

    // Default case: Search in the breakup array
    return this.breakup.controls.findIndex(
      (control) => control.value.name.trim().replace(/\s+/g, "_") === sluggedName
    );
  }

  findRowDeductionIndex(variableName: string): number {
    const sluggedName = variableName.trim().replace(/\s+/g, "_");
  
    // Special handling for "Net Salary" or other external variables
    if (sluggedName === "Net_Salary") {
      return -2; // Use a custom code to signify external variables
    }
  
    // Default case: Search in the breakup array
    return this.deductions.controls.findIndex(
      (control) => control.value.name.trim().replace(/\s+/g, "_") === sluggedName
    );
  }
  
  

  recalculateDeductions(): void {
    const deductions = this.formGroup.get("deductions") as FormArray;
    // Trigger deductions recalculation for each row
    deductions.controls.forEach((_, index) => {
      this.calculateDeductions(index);
    });
  }

  get breakup(): FormArray {
    return this.formGroup.get("breakup") as FormArray;
  }
  get deductions(): FormArray {
    return this.formGroup.get("deductions") as FormArray;
  }

  createPermanentRow(): FormGroup {
    return this.formBuilder.group({
      name: ["Basic", Validators.required],
      calculationType: ["custom"],
      formula: [""],
      amount: [0, [Validators.required, Validators.min(0)]],
    });
  }

  createBreakupItem(): FormGroup {
    return this.formBuilder.group({
      name: ["", Validators.required],
      calculationType: ["custom"], // Default to custom
      formula: [""],
      amount: ["", [Validators.required, Validators.min(0)]],
      nameReadonly: [false],
    });
  }



  createDeductionRow(name: string, calculationType: string, formula: string, amount: number): FormGroup {
    return this.formBuilder.group({
      name: [name, Validators.required],
      calculationType: [calculationType || 'none', Validators.required],
      formula: [formula],
      amount: [amount, [Validators.required, Validators.min(0)]],
      nameReadonly: [false],
    });
  }

  getOpenAdvances(){
    this.toggleSpinner(true);
    const url = `getOpenAdvances/${this.urlId}`;
    this.api.getwithoutcache(url).subscribe(
      (res: any) => {
        this.toggleSpinner(false);
        if (res?.status) {
        this.totalAdvBal = res.totalBalance    
        } else {
          this.handleError("Unexpected response format");
        }
      },
      (error) => {
        this.toggleSpinner(false);
        this.handleError(error.message || "An error occurred while fetching attendance data");
      }
    );
  }

  presentDays: any;
  daysInMonth: any;
  
  getPresentDays() {
    this.toggleSpinner(true);
    const url = `getEmployeePresentDay?emp_id=${this.urlId}&date=${this.formattedDate}`;
  
    this.api.getwithoutid(url).subscribe(
      (res: any) => {
        this.toggleSpinner(false);
  
        if (res?.status) {
          this.presentDays = res.presentDays;
          this.daysInMonth = res.daysInMonth;

  if(this.presentDays == 0){
    this.employeerPfAmount =0
    this.employeerEsiAmount = 0
    this.initializeFormWithData()
    this.calculateTotalAmount();
  }
          // Ensure both values are valid before fetching salary details
          if (this.presentDays && this.daysInMonth ) {
          
            this.getSalaryPayslip();           
          }
        } else {
          this.getSalaryDetail()
          this.handleError("Unexpected response format");
        }
      },
      (error) => {
       
        this.toggleSpinner(false);
        this.handleError(error.message || "An error occurred while fetching attendance data");
      }
    );
  }
  
  
  getSalaryPayslip() {
    this.toggleSpinner(true);
    const url = `salaryPayslip?emp_id=${this.urlId}&payslip_for_month=${this.formattedDate}`;
  
    this.api.getwithoutcache(url).subscribe(
      (res: any) => {
        this.toggleSpinner(false);
        if (res?.status) {
        
          const data = res.data[0];
          if (data) {
            this.gernated = true
            const netSalary = Number(data.salary);
            if (!isNaN(netSalary)) {
              if (this.presentDays && this.daysInMonth && !isNaN(this.presentDays) && !isNaN(this.daysInMonth)) {
                // const salaryForPresentDays = Math.round((netSalary / this.daysInMonth) * this.presentDays);
  
                // Patch the calculated salary
                this.formGroup.patchValue({ salary: netSalary });
                this.updateVariable("Net Salary", netSalary);
  
                // Recalculate earnings and deductions
                this.patchEarnings(data.earning);
                this.patchDeductions(data.deduction);
                this.employeerPfAmount = data.employeer_ctc.employeerPfAmount || 0;
                this.employeerEsiAmount = data.employeer_ctc.employeerEsiAmount || 0;
                this.totalctc = data.employeer_ctc.totalctc || 0;
                this.calculateTotalAmount();
              
              } else {
                this.toastService.error("Invalid attendance data. Please ensure daysInMonth and presentDays are correct.");
              }
            } else {
              this.toastService.error("Invalid salary value received.");
            }
          }
        } else {
          this.gernated = false
          this.getSalaryDetail();
          this.initializeForm();
          // this.handleError("Unexpected response format");
        }
      },
      (error) => {
        this.toggleSpinner(false);
        this.handleError(error.message || "An error occurred while fetching salary details");
      }
    );
  }

  
  getSalaryDetail() {
    this.toggleSpinner(true);
    const url = `salaryDetail?emp_id=${this.urlId}`;
  
    this.api.getwithoutcache(url).subscribe(
      (res: any) => {
        this.toggleSpinner(false);
        if (res?.status) {
        
          const data = res.data[0];
          if (data) {
            
            const netSalary = Number(data.salary);
            if (!isNaN(netSalary)) {
              if (this.presentDays && this.daysInMonth && !isNaN(this.presentDays) && !isNaN(this.daysInMonth)) {
                const salaryForPresentDays = Math.round((netSalary / this.daysInMonth) * this.presentDays);
 
                // Patch the calculated salary
                this.formGroup.patchValue({ salary: salaryForPresentDays });
                this.updateVariable("Net Salary", salaryForPresentDays);
  
                // Recalculate earnings and deductions
                this.patchEarnings(data.earning);
                this.patchDeductions(data.deduction);
                this.calculateTotalAmount();
               
              } else {
                this.toastService.error("Invalid attendance data. Please ensure daysInMonth and presentDays are correct.");
              }
            } else {
              this.toastService.error("Invalid salary value received.");
            }
          }
        } else {
          this.initializeForm();
          this.handleError("Unexpected response format");
        }
      },
      (error) => {
        this.toggleSpinner(false);
        this.handleError(error.message || "An error occurred while fetching salary details");
      }
    );
  }
  
 
  patchEarnings(earnings: any[]): void {
    const breakupArray = this.formGroup.get("breakup") as FormArray;
    breakupArray.clear();
  
    if (Array.isArray(earnings)) {
    
      earnings.forEach((earningItem: any) => {
        const row = this.createBreakupItem();
      
        if(!this.gernated){
          if (earningItem.name.toLowerCase() === 'basic' && this.presentDays && this.daysInMonth) {
            // Recalculate basic amount based on the current attendance data
            const netBasicSalary = Number(earningItem.amount);

            if (!isNaN(netBasicSalary)) {
              earningItem.amount = Math.round((netBasicSalary / this.daysInMonth) * this.presentDays);
            }
          }
        }
       

        // Patch values into the row
        row.patchValue({
          name: earningItem.name || "",
          calculationType: earningItem.calculationType,
          amount: Math.round(earningItem.amount) || 0,
          formula: earningItem.formula || "",
        });
  
        // Update variables and allowances
        this.updateVariable(earningItem.name, earningItem.amount);
        this.allowances = this.allowances.filter(
          (item) => item.name !== earningItem.name
        );
  
       
        breakupArray.push(row);
        row.get("nameReadonly")?.setValue(true);

        this.populateDependencyMap();
      });
      // Second pass: Trigger dependent updates for each row
      breakupArray.controls.forEach((control, index) => {
        const variableName = control.get("name")?.value;
        if (variableName) {
        
          const rowIndex = this.findRowIndex(variableName);
         
          if (rowIndex !== -1) {
            this.updateDependentRows(rowIndex);
          }
        }
      });
    }
  }
  
  patchDeductions(deductions: any[]) {
    const deductionsArray = this.formGroup.get("deductions") as FormArray;
    deductionsArray.clear();

    if (Array.isArray(deductions)) {
      deductions.forEach((deductionItem: any) => {
        const row = this.createDeductionRow(
          deductionItem.name || "",
          deductionItem.calculationType || "none",
          deductionItem.formula || "",
          deductionItem.amount || 0
        );
        deductionsArray.push(row);
        row.get("nameReadonly")?.setValue(true);
        // row.get("name")?.disable();
      });
    }
  
    if(!this.gernated){
    const advanceExists = deductions.some(
      (deductionItem) => deductionItem.name === "Advance"
    );
  
    if (!advanceExists && this.totalAdvBal > 0) {
      const advanceRow = this.createDeductionRow(
        "Advance",
        "none",
        "",
        this.totalAdvBal
      );
    // this.updateVariable("Advance", this.totalAdvBal);
    advanceRow.get("nameReadonly")?.setValue(true);
      deductionsArray.push(advanceRow);
    }

  }
  // if(!this.gernated){
    this.recalculateDeductions();
  // }
   
  }

  toggleSpinner(isLoading: boolean) {
    this.spinnerStatus = isLoading;
    this.saveButtonActive = !isLoading;
    this.submitted = isLoading;
  }

  onSubmit() {
    if (!this.urlId) {
      this.toastService.error("Please add Personal Details First");
    } else {
      if (this.formGroup.valid) {
        this.toggleSpinner(true);
       
        const formData = this.createFormData();
  
        if (this.urlId) {
          this.update(formData);
        } else {
          this.add(formData);
        }
      } else {
        this.formGroup.markAllAsTouched();
      }
    }
  }

  get f() {
    return this.formGroup.controls;
  }

  createFormData() {
    const formData = {
      emp_id: this.urlId,
      paid_days:this.presentDays,
      net_pay :this.totalAmount,
      payslip_for_month:this.formattedDate,
      salary: this.f["salary"].value,
      // earning: this.f["breakup"].value,
      earning: (this.formGroup.get("breakup") as FormArray).getRawValue(),
      deduction: (this.formGroup.get("deductions") as FormArray).getRawValue(),
      earning_amount:this.earningTotal.toFixed(2),
      deduction_amount:this.deductionsTotal.toFixed(2),
      employeer_ctc:{
        totalEarning: this.earningTotal,
        employeerPfAmount:this.employeerPfAmount,
        employeerEsiAmount: this.employeerEsiAmount,
        totalctc: this.totalctc
       }
      // deductions: this.formGroup.get("deductions")!.value.map((deduction: any) => ({
      //   name: deduction.name,
      //   calculationType: deduction.calculationType,
      //   formula: deduction.formula,
      //   amount: deduction.amount,
      // })),
    };
    return formData;
  }

  add(formData: any) {
    this.api.post("salaryPayslip", formData).subscribe(
      (res: any) => this.handleResponse(res),
      (error) => this.handleError(error)
    );
  }

  update(formData: any) {
    const id = this.urlId as number;
    this.api.put("salaryPayslip", id, formData).subscribe(
      (res: any) => this.handleResponse(res),
      (error) => this.handleError(error)
    );
  }

  handleResponse(res: any) {
    this.toggleSpinner(false);
    if (res["status"] === true) {
      // this.formGroup.reset();
      this.toastService.success("Data Saved Successfully!!");
      this.getOpenAdvances()
      // this.getDesignation();
    } else {
      this.toastService.error(res["message"]);
    }
  }

  handleError(error: any) {
    this.toggleSpinner(false);
  }

  // table row

  onSelectionChange(event: any): void {
    if (!event) {
      return;
    }
    this.addRow(event);
  }



  addRow(selected: any): void {
    const lastRow = this.breakup.at(this.breakup.length - 1);

    if (!lastRow.get("amount")?.value || lastRow.get("amount")?.value <= 0) {
      this.toastService.error(
        "Please enter a valid amount before adding a new row."
      );
      lastRow.get("amount")?.markAsTouched();
      return;
    }

    if (
      !lastRow.get("name")?.value ||
      lastRow.get("name")?.value.trim() === ""
    ) {
      this.toastService.error("Please enter a name before adding a new row.");
      lastRow.get("name")?.markAsTouched();
      return;
    }

    const netSalary = this.formGroup.get("salary")?.value;

    if (this.totalAmount > netSalary) {
      this.toastService.error("Total amount cannot exceed the net salary.");
      return;
    }

    const newRow = this.createBreakupItem();
    this.breakup.push(newRow);
    if (selected) {
      newRow.get("name")?.setValue(selected.name);
      newRow.get("nameReadonly")?.setValue(true);

      // this.selectedAllowances.push(selected);

      this.allowances = this.allowances.filter(
        (item) => item.id !== selected.id
      );

      if (selected.formula) {
        newRow.get("formula")?.setValue(selected.formula);
        newRow.get("calculationType")?.setValue("default");

        let evaluatedValue =Math.round( this.evaluateExpression(
          selected.formula,
          this.breakup.length - 1
        ));

        if (evaluatedValue < 0) {
          evaluatedValue = 0;
        }
       
        newRow.get("amount")?.setValue(evaluatedValue);

        // Update the variable value
        const variableName = selected.name.trim().replace(/\s+/g, "_");
        this.updateVariable(variableName, evaluatedValue);

        // Update dependent rows
      }
    }

    // Trigger updates for all dependent rows
    this.updateDependentRows(this.breakup.length - 1);

    this.calculateTotalAmount();

    this.showAllowanceSelect = false;
  }

  openAllowance(allowanceSelect: any): void {
    this.showAllowanceSelect = !this.showAllowanceSelect;
    setTimeout(() => {
      allowanceSelect.open();
    });
  }

  addDeduction(){
    const deductionsArray = this.formGroup.get("deductions") as FormArray;
    const row =  this.createDeductionRow( "", "none", "", 0);
    deductionsArray.push(row);
  }

  // Remove a row

  removeRow(index: number): void {
    if (index === 0) {
      this.toastService.error("The first row cannot be deleted.");
      return;
    }
  
    // Get the row's details
    const row = this.breakup.at(index);
    const rowName = row.get("name")?.value;
    const rowFormula = row.get("formula")?.value;
    const rowId = this.allowancesList.find((item) => item.name === rowName)?.id;

   
    this.breakup.removeAt(index);
  
   
    this.removeVariable(rowName);
  
   
    if (rowName && rowId) {
     
      const alreadyExists = this.allowances.some((item) => item.id === rowId);
      if (!alreadyExists) {
        this.allowances.push({
          id: rowId,
          name: rowName,
          formula: rowFormula || null,
        });
  
      
        this.allowances = [...this.allowances];

        // Sort the allowances array (optional)
        // this.allowances.sort((a, b) => a.id - b.id);
      }
  
      // Remove it from selectedAllowances
      // this.selectedAllowances = this.selectedAllowances.filter((item) => item.id !== rowId);
    }
  
    this.calculateTotalAmount();
  }
  
  

  // remove deduction
  removeDeductionRow(index: number, arrayName: string): void {
    const row = this.deductions.at(index); 
    const rowName = row.get("name")?.value;
    this.removeVariable(rowName)
    this.deductions.removeAt(index);
    this.calculateTotalAmount();
  }
  

  updateVariable(name: string, value: number): void {
    const sluggedName = name.trim().replace(/\s+/g, "_"); // Convert name to slug
    const variable = this.availableVariables.find(
      (v) => v.name === sluggedName
    );

    if (variable) {
      variable.value = value; // Update existing variable
    } else {
      this.availableVariables.push({ name: sluggedName, value }); // Add new variable if not found
    }

  }

  removeVariable(name: string): void {
    const index = this.availableVariables.findIndex((v) => v.name === name.trim().replace(/\s+/g, "_"));
   
    if (index !== -1) {
      this.availableVariables.splice(index, 1); // Remove the variable
    }
    if (this.dependencyMap[name]) {
      delete this.dependencyMap[name];
    }
  }

  addVariable(name: string, value: number): void {
    const existingVariable = this.availableVariables.find(
      (v) => v.name === name
    );
    if (!existingVariable) {
      this.availableVariables.push({ name, value });
    } else {
      existingVariable.value = value; // Update the value if already exists
    }
  }

 
  insertOperation(operation: string, rowIndex: number, isDeduction: boolean = false): void {
    const control = isDeduction ? this.deductions.at(rowIndex) : this.breakup.at(rowIndex);
    const currentFormula = control.get("formula")?.value || "";
    control.get("formula")?.setValue(currentFormula + ` ${operation} `);
  }

  insertVariable(
    variable: { name: string; value: number },
    rowIndex: number,
    isDeduction: boolean = false
  ): void {
    const control = isDeduction ? this.deductions.at(rowIndex) : this.breakup.at(rowIndex);
    const currentFormula = control.get("formula")?.value || "";
    control.get("formula")?.setValue(currentFormula + variable.name);
  }
// 
appendNumber(num: number, rowIndex: number, isDeduction: boolean = false): void {
  const control = isDeduction ? this.deductions.at(rowIndex) : this.breakup.at(rowIndex);
  const currentFormula = control.get("formula")?.value || "";
  control.get("formula")?.setValue(currentFormula + num.toString());
}

// Append a decimal point to the current formula
appendDecimal(rowIndex: number, isDeduction: boolean = false): void {
  const control = isDeduction ? this.deductions.at(rowIndex) : this.breakup.at(rowIndex);
  const currentFormula = control.get("formula")?.value || "";
  // Ensure there isn't already a decimal in the current numeric part
  const lastToken = currentFormula.split(/[\s\+\-\*\/\(\)]+/).pop() || "";
  if (!lastToken.includes(".")) {
    control.get("formula")?.setValue(currentFormula + ".");
  }
}

// Clear the current formula
clear(rowIndex: number, isDeduction: boolean = false): void {
  const control = isDeduction ? this.deductions.at(rowIndex) : this.breakup.at(rowIndex);
  control.get("formula")?.setValue("");
}
// 
  onFormulaInput(event: Event, rowIndex: number): void {
    const input = event.target as HTMLInputElement;
    const control = this.breakup.at(rowIndex);
    control.get("formula")?.setValue(input.value);
    this.evaluateFormula(rowIndex);
  }

  onFormulaInputDeduction(event: Event, rowIndex: number): void {
    const input = event.target as HTMLInputElement;
    const control = this.deductions.at(rowIndex);
    control.get("amount")?.setValue(input.value);
    this.updateVariable( control.get("name")?.value, Number(input.value));
  }



  validateTotal(): void {
    this.totalAmount = this.breakup.controls
      .map((control) => control.get("amount")?.value || 0)
      .reduce((acc, value) => acc + value, 0);

    if (this.totalAmount !== this.formGroup.get("salary")?.value) {
      this.totalError = true;
    } else {
      this.totalError = false;
    }
  }



  onCalculationTypeChange(
    event: Event,
    index: number,
    data: AbstractControl
  ): void {
    const formula = data.get("formula")?.value;
    const selectedType = (event.target as HTMLSelectElement).value;

    // Update the calculation type in the form control
    data.get("calculationType")?.setValue(selectedType);

   
    if (selectedType === "default") {
      // Extract the variable name
      const variableName = data.get("name")?.value.trim().replace(/\s+/g, "_");
     

      // Preprocess allowances to ensure matching format
      const preprocessedAllowances = this.allowancesList.map((allowance) => ({
        ...allowance,
        name: allowance.name.trim().replace(/\s+/g, "_"),
      }));

      // Match the allowance from the preprocessed list by name
      const matchedAllowance = preprocessedAllowances.find(
        (allowance) => allowance.name === variableName
      );

    

      // Ensure a formula exists in the matched allowance
      if (matchedAllowance && matchedAllowance.formula) {
        const formula = matchedAllowance.formula;

        // Evaluate the formula
        let evaluatedValue = Math.round(this.evaluateExpression(formula, index));

        if (evaluatedValue < 0) {
          evaluatedValue = 0;
        }

        // Update the current row's amount field
        data.get("amount")?.setValue(evaluatedValue);

        // Update the variable value for dependency tracking
        this.updateVariable(variableName, evaluatedValue);

        // Trigger updates for all dependent rows
        this.updateDependentRows(index);

        // Recalculate the total amount
        this.calculateTotalAmount();
      } else {
        console.warn(
          `No formula found for the selected allowance: ${variableName}`
        );
        this.toastService.error(
          `Formula not found for the selected type: ${variableName}`
        );
      }
    }

    if (selectedType === "custom" || selectedType === "formula") {
      // Clear any existing formula calculation if switching away from default
      data.get("amount")?.setValue(0);

      // Update the total amount
      this.calculateTotalAmount();
    }
  }

  evaluateFormula(rowIndex: number): void {
    const control = this.breakup.at(rowIndex);
    const formula = control.get("formula")?.value;

    try {
      const variableName = control.value.name.trim().replace(/\s+/g, "_"); // Handle spaces in names

      if (!variableName) {
        this.toastService.error("Please add Name before applying the formula");
        return;
      }

      // Evaluate the formula
      let evaluatedValue = Math.round(
        this.evaluateExpression(formula, rowIndex)
      );

      if (evaluatedValue < 0) {
        evaluatedValue = 0;
      }
     
      // Update the current row's amount
      control.get("amount")?.setValue(evaluatedValue);

      const calculationType = control.get("calculationType")?.value;
      if (calculationType == "formula") {
        // control.get("amount")?.disable({ onlySelf: true });
        control.get("nameReadonly")?.setValue(true);
      }

      // Update the variable value
      this.updateVariable(variableName, evaluatedValue);

      // Update dependent rows
      this.updateDependentRows(rowIndex);

      // Recalculate the total amount
      this.calculateTotalAmount();
    } catch (error) {
      console.error("Error evaluating formula:", error);
      this.toastService.error("Invalid formula. Please check and try again.");
    }
  }

  updateDependentRows(rowIndex: number): void {
    if (rowIndex === -2) {
      const netSalaryValue = this.formGroup.get("salary")?.value || 0;
  
      if (!this.dependencyMap["Net_Salary"] || !Array.isArray(this.dependencyMap["Net_Salary"])) {
        console.warn('"Net_Salary" is not defined in the dependency map or is not an array.');
        return;
      }
  
      Array.from(this.dependencyMap["Net_Salary"]).forEach((dependentRowIndex) => {
        if (typeof dependentRowIndex !== 'number' || dependentRowIndex < 0 || dependentRowIndex >= this.breakup.length) {
          console.error(`Invalid dependent row index: ${dependentRowIndex}`);
          return;
        }
  
        const dependentRow = this.breakup.at(dependentRowIndex) as FormGroup;
        if (!dependentRow) {
          console.error(`FormGroup not found for index: ${dependentRowIndex}`);
          return;
        }
  
        const dependentFormulaControl = dependentRow.get("formula");
        if (!dependentFormulaControl) {
          console.error(`"formula" control is missing in the FormGroup for index: ${dependentRowIndex}`);
          return;
        }
  
        const dependentFormula = dependentFormulaControl.value;
  
        if (dependentFormula) {
          let evaluatedValue = Math.round(
            this.evaluateExpression(dependentFormula, dependentRowIndex)
          );
  
          if (evaluatedValue < 0) {
            evaluatedValue = 0;
          }
  
          dependentRow.get("amount")?.setValue(evaluatedValue);
          dependentRow.get("amount")?.markAsDirty();
          dependentRow.get("amount")?.markAsTouched();
  
          // Recursively update dependent rows
          this.updateDependentRows(dependentRowIndex);
        }
      });
      return;
    }
  
    // Handle other rows
    const control = this.breakup.at(rowIndex) as FormGroup;
    if (!control) {
      console.error(`FormGroup not found for index: ${rowIndex}`);
      return;
    }
  
    const variableName = control.value.name.trim().replace(/\s+/g, "_");

    if (this.dependencyMap[variableName]) {
      Array.from(this.dependencyMap[variableName]).forEach((dependentRowIndex) => {
        const dependentRow = this.breakup.at(dependentRowIndex) as FormGroup;
        if (!dependentRow) {
          console.error(`FormGroup not found for index: ${dependentRowIndex}`);
          return;
        }
  
        const dependentFormulaControl = dependentRow.get("formula");
        if (!dependentFormulaControl) {
          console.error(`"formula" control is missing in the FormGroup for index: ${dependentRowIndex}`);
          return;
        }
        
        const dependentFormula = dependentFormulaControl.value;

        if (dependentFormula) {
          let evaluatedValue = Math.round(
            this.evaluateExpression(dependentFormula, dependentRowIndex)
          );

          if (evaluatedValue < 0) {
            evaluatedValue = 0;
          }
  
          dependentRow.get("amount")?.setValue(evaluatedValue);
          dependentRow.get("amount")?.markAsDirty();
          dependentRow.get("amount")?.markAsTouched();
  
        
          this.updateDependentRows(dependentRowIndex);
        }
      });
    }
  }
  

  evaluateExpression(
    expression: string,
    rowIndex: number,
    isDeduction: boolean = false
  ): number {
    const variables: Record<string, number> = {};

    // Extract variables from breakup controls
    this.breakup.controls.forEach((control, i) => {
      const variableName = control.value.name?.trim().replace(/\s+/g, "_");
      if (!variableName) return;

      const amount = control.get("amount")?.value || 0;
      variables[variableName] = amount;

      // Track dependencies
      if (!isDeduction && rowIndex !== i && expression.includes(variableName)) {
        if (!this.dependencyMap[variableName]) {
          this.dependencyMap[variableName] = new Set<number>();
        }
        this.dependencyMap[variableName].add(rowIndex);
      }
    });

    // Extract variables from deductions controls
    this.deductions.controls.forEach((control, i) => {
      const variableName = control.value.name?.trim().replace(/\s+/g, "_");
      if (!variableName) return;

      const amount = control.get("amount")?.value || 0;
      variables[variableName] = amount;

      // Track dependencies for deductions
      if (isDeduction && rowIndex !== i && expression.includes(variableName)) {
        if (!this.dependencyMap[variableName]) {
          this.dependencyMap[variableName] = new Set<number>();
        }
        this.dependencyMap[variableName].add(rowIndex);
      }
    });

    // Include variables from availableVariables
    this.availableVariables.forEach((variable) => {
      if (!(variable.name in variables)) {
        variables[variable.name] = variable.value || 0;
      }
    });

    // Replace placeholders with actual values
    let parsedExpression = expression.replace(
      /\b[A-Za-z][A-Za-z0-9_]*\b/g,
      (match) => (match in variables ? String(variables[match]) : "0")
    );

    // Handle percentage (%) operator
    parsedExpression = parsedExpression.replace(
      /(\d+(\.\d+)?)\s*%\s*(\d+(\.\d+)?)/g,
      (fullMatch, num1, _, num2) => `(${num1} * ${num2} / 100)`
    );

    try {
      return new Function("return " + parsedExpression)();
    } catch (error) {
      console.error("Invalid expression:", error);
      this.toastService.error("Invalid formula. Please check and try again.");
      return 0;
    }
  }

 
  onCalculationDeductionTypeChange( event: Event, index: number): void {
    const deductions = this.formGroup.get("deductions") as FormArray;
    const control = deductions.at(index) as FormGroup;
  
    const selectedType = (event.target as HTMLSelectElement).value;

    control.get("calculationType")?.setValue(selectedType);
    control.get("calculationType")?.markAsDirty();
    control.get("calculationType")?.markAsTouched();
    control.get("calculationType")?.updateValueAndValidity();

    this.calculateDeductions(index, true);
  }


  employeerPfAmount:any =0
  employeerEsiAmount:any = 0

  calculateDeductions(index: number, fromDropdownChange: boolean = false): void {
    const salary = this.formGroup.get("salary")?.value || 0;
    const breakup = this.formGroup.get("breakup") as FormArray;
    const deductions = this.formGroup.get("deductions") as FormArray;
    
    const control = deductions.at(index) as FormGroup;
    const name = control.get("name")?.value;
    const calculationType = control.get("calculationType")?.value;


  control.get("calculationType")?.markAsDirty();
  control.get("calculationType")?.markAsTouched();


  control.get("calculationType")?.updateValueAndValidity();

  if(!this.gernated && fromDropdownChange){
    if (name === "ESI" && this.salaryDetailData.netSalary > 21000) {
      this.toastService.error("ESI is not applicable for salary above Rs.21,000.");
      control.get("calculationType")?.setValue("none");
      control.get("amount")?.setValue(0); 
      this.employeerEsiAmount = 0;
      return;
    }
  }
  

    let amount = 0;

    // Handle input state based on calculation type
    // if (calculationType === "custom") {
    //   console.log(name,calculationType)
    //   control.get("amount")?.enable({ onlySelf: true });
    // } else {
    //   control.get("amount")?.disable();
    // }
  
    switch (calculationType) {
      case "none":
        amount = 0
        if(name === "PF"){
          this.employeerPfAmount =0
        }else if (name === "ESI"){
          this.employeerEsiAmount = 0
        }
       break;
      case "percentage":
        if (name === "PF") {
          const basicRow = breakup.controls.find((row) => row.get("name")?.value === "Basic");
          const basicSalary = basicRow?.get("amount")?.value || 0;
          amount = Math.round((basicSalary * 12) / 100);
          this.employeerPfAmount = amount
          control.get("formula")?.setValue('(Basic * 12) / 100');
        } else if (name === "ESI") {
          amount = Math.round((salary * 0.75) / 100);
          this.employeerEsiAmount = Math.round( (salary * 3.25) / 100);

          control.get("formula")?.setValue('(Net_Salary * 0.75) / 100');
        }
        break;
  
      case "formula":
        try {
          const formula = control.get("formula")?.value;
          if (formula) {
            const variables: Record<string, number> = {};
  
            breakup.controls.forEach((breakupControl) => {
              const varName = breakupControl.get("name")?.value?.trim().replace(/\s+/g, "_");
              if (varName) {
                variables[varName] = breakupControl.get("amount")?.value || 0;
              }
            });
  
            this.availableVariables.forEach((variable) => {
              if (!(variable.name in variables)) {
                variables[variable.name] = variable.value || 0;
              }
            });
  
            amount = Math.round(this.evaluateExpression(formula, -1, true));
            if (amount < 0) amount = 0;
          }
        } catch (error) {
          console.error("Formula evaluation error:", error);
          amount = 0;
        }
        break;
  
      case "custom":
        return;
  
      default:
        // if(!this.gernated){
          if (name === "Advance") {
            switch (calculationType) {
              case "100%":
                amount = this.totalAdvBal;
                break;
              case "50%":
                amount = Math.round(this.totalAdvBal * 0.5);
                break;
              case "custom":
                return;
            }
          } 
          else {
            amount = 0;
          }
        // }
       
    }
    if(this.gernated){
      control.get("amount")?.setValue(control.get("amount")?.value);
    }else{
      control.get("amount")?.setValue(amount);
    }
    
    control.get("amount")?.updateValueAndValidity(); // Ensure re-evaluation
    this.calculateTotalAmount();
  }
  


  evaluateDeductionFormula(rowIndex: number): void {
    const control = this.deductions.at(rowIndex);
    const formula = control.get("formula")?.value;

    try {
      const variableName = control.value.name.trim().replace(/\s+/g, "_");
  
      if (!variableName) {
        this.toastService.error("Please add Name before applying the formula");
        return;
      }
  
      // Evaluate the formula
      let evaluatedValue = Math.round(this.evaluateExpression(formula, rowIndex, true));

      if (evaluatedValue < 0) {
        evaluatedValue = 0;
      }
  
      // Update the current row's amount
      control.get("amount")?.setValue(evaluatedValue);
  
      const calculationType = control.get("calculationType")?.value;
      if(calculationType == 'formula') {
        // control.get("amount")?.disable({ onlySelf: true });
        control.get("nameReadonly")?.setValue(true);
      }
  
      // Update the variable value
      this.updateVariable(variableName, evaluatedValue);
  
      // Update dependent rows
      this.updateDependentDeductionRows(rowIndex);
  
      // Recalculate the total amount
      this.calculateTotalAmount();
    } catch (error) {
      console.error("Error evaluating formula:", error);
      this.toastService.error("Invalid formula. Please check and try again.");
    }
  }
  
  // Add method for updating dependent deduction rows
  updateDependentDeductionRows(rowIndex: number): void {
    const control = this.deductions.at(rowIndex) as FormGroup;
    const variableName = control.value.name.trim().replace(/\s+/g, "_");
  
    if (this.dependencyMap[variableName]) {
      Array.from(this.dependencyMap[variableName]).forEach((dependentRowIndex) => {
        const dependentRow = this.deductions.at(dependentRowIndex) as FormGroup;
        const dependentFormula = dependentRow.get("formula")?.value;
  
        if (dependentFormula) {
          let evaluatedValue = Math.round(this.evaluateExpression(dependentFormula, dependentRowIndex, true));

          if (evaluatedValue < 0) {
            evaluatedValue = 0;
          }
  
          dependentRow.get("amount")?.setValue(evaluatedValue);
          dependentRow.get("amount")?.markAsDirty();
          dependentRow.get("amount")?.markAsTouched();
  
          // Recursively update dependent rows
          this.updateDependentDeductionRows(dependentRowIndex);
        }
      });
    }
  }

  earningTotal:any
  deductionsTotal:any
  totalctc:any = 0
  calculateTotalAmount(): void {
    // Get breakup array and calculate the total from it
    const breakup = this.formGroup.get('breakup') as FormArray; 
     this.earningTotal = breakup.controls.reduce((total, control) => {
      return total + (control.get('amount')?.value || 0);
    }, 0);
  
    // Get deductions array and calculate the total from it
    const deductions = this.formGroup.get('deductions') as FormArray;
     this.deductionsTotal = deductions.controls.reduce((total, control) => {
      // if (control.get("name")?.value.toLowerCase() === 'esi') {
      //   this.employeerEsiAmount = ( control.get("amount")?.value * 3.25) / 100;
      //   console.log(this.employeerEsiAmount)
      // }
      // if (control.get("name")?.value.toLowerCase() === 'pf') {
      //   this.employeerPfAmount = control.get("amount")?.value;
      // }
      return total + (control.get('amount')?.value || 0);
    }, 0);

    this.totalctc = this.earningTotal +this.employeerEsiAmount +this.employeerPfAmount

   
    this.totalAmount = Math.round( this.earningTotal - this.deductionsTotal);

    const dataToEmit = {
      invoiceOfMonth:this.formattedDate,
      totalAdv: this.totalAdvBal.toFixed(2),
      paidDays:this.presentDays,
      totalamount :this.totalAmount.toFixed(2),
      earnTotal:this.earningTotal.toFixed(2),
      deductionsTotal:this.deductionsTotal.toFixed(2)
    }

    this.salaryInvoiceData.emit(dataToEmit)
  }

  convertNumberToWords(num: any): string {
    if (num === null || num === undefined || isNaN(num)) {
      return 'Invalid amount';
    }
  
    const a = [
      '', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
      'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen',
      'eighteen', 'nineteen'
    ];
    const b = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
    const scales = ['thousand', 'lakh', 'crore'];
  
    if (num === 0) return 'Zero';

    let isNegative = false;
    if (num < 0) {
      isNegative = true;
      num = Math.abs(num); // Convert negative number to positive for processing
    }
  
    let words = '';
  
    // Ensure the number is converted to a string and split for decimals
    const numStr = num.toString();
    const [integerPart, decimalPart] = numStr.split('.');
  
    const numberToWords = (n: number): string => {
      let word = '';
      if (n < 20) {
        word = a[n];
      } else if (n < 100) {
        word = b[Math.floor(n / 10)] + (n % 10 ? ' ' + a[n % 10] : '');
      } else if (n < 1000) {
        word = a[Math.floor(n / 100)] + ' hundred' + (n % 100 ? ' and ' + numberToWords(n % 100) : '');
      } else {
        for (let i = 0, divisor = 1000; i < scales.length; i++, divisor *= 100) {
          if (n < divisor * 100) {
            word = numberToWords(Math.floor(n / divisor)) + ' ' + scales[i] +
              (n % divisor ? ' ' + numberToWords(n % divisor) : '');
            break;
          }
        }
      }
      return word;
    };
  
    // Convert integer part to words
    words = numberToWords(parseInt(integerPart, 10));
  
    // Add decimal part if available
    if (decimalPart) {
      words += ` and ${numberToWords(parseInt(decimalPart, 10))} paise`;
    }
  
    // Capitalize the first letter
    return words.charAt(0).toUpperCase() + words.slice(1);
  }
}
