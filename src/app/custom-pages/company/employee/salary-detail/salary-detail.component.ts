import {
  Component,
  Input,
  Output,
  EventEmitter,
  HostListener,
} from "@angular/core";
import {
  FormGroup,
  FormArray,
  FormBuilder,
  Validators,
  AbstractControl,
} from "@angular/forms";
import { ToastrService } from "ngx-toastr";
import { ApiService } from "../../../../core/services/api.service";
import { NgSelectComponent } from "@ng-select/ng-select";

@Component({
  selector: "app-salary-detail",
  templateUrl: "./salary-detail.component.html",
  styleUrl: "./salary-detail.component.scss",
})
export class SalaryDetailComponent {
  @Input() urlId: number | null = null;
  @Output() salaryDataFetched = new EventEmitter<boolean>();
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
  salaryForm!: FormGroup;

  totalAmount = 0;
  totalError = false;

  // allowances = [
  //   { id: 1, name: "HRA" },
  //   { id: 2, name: "DA" },
  //   { id: 3, name: "Travel Allowance" },
  //   { id: 4, name: "Medical Allowance" },
  // ];
  allowances = [
    { id: 1, name: "HRA", formula: "Basic * 0.4" },
    { id: 2, name: "Travel Allowance", formula: "Basic / 2" },
  ];
  allowancesList = [
    { id: 1, name: "HRA", formula: "Basic * 0.4" },
    { id: 2, name: "Travel Allowance", formula: "Basic / 2" },
  ];
  selectedAllowances: any[] = [];
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
  ) {}

  ngOnInit(): void {
    this.formGroup = this.formBuilder.group(
      {
        salary: ["", [Validators.required, Validators.min(0)]],
        // basic_salary: ["", [Validators.required, Validators.min(0)]],
        breakup: this.formBuilder.array([this.createPermanentRow()]),
      }
      // { validators: this.salaryValidator }
    );

    if (this.urlId) {
      this.getSalaryDetail();
    }
  }

  get breakup(): FormArray {
    return this.formGroup.get("breakup") as FormArray;
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
      amount: [0, [Validators.required, Validators.min(0)]],
      nameReadonly: [false],
    });
  }

  getSalaryDetail() {
    this.toggleSpinner(true);
    const url = `salaryDetail?emp_id=${this.urlId}`;
    this.api.getwithoutid(url).subscribe(
      (res: any) => {
        if (res && res.status) {
          const data = res.data[0];
          this.toggleSpinner(false);
          // this.formGroup.patchValue({
          //   salary: data.salary,
          // });
          // this.addVariable("netSalary", data.salary);
          // this.updateVariable("Net_Salary", data.salary);

          const netSalary = Number(data.salary);

          if (!isNaN(netSalary)) {
            this.formGroup.patchValue({ salary: netSalary });
            this.updateVariable("Net Salary", netSalary);
          } else {
            console.error("Invalid Net_Salary value:", data.salary);
            this.toastService.error("Invalid salary value received.");
          }
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
        console.log(this.f);
        // const formData = this.createFormData();
        // if (this.urlId) {
        //   this.update(formData);
        // } else {
        //   this.add(formData);
        // }
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
      // company_id: this.company_id,
      salary: this.f["salary"].value,
      basic_salary: this.f["basic_salary"].value,
    };
    return formData;
  }

  add(formData: any) {
    this.api.post("salaryDetail", formData).subscribe(
      (res: any) => this.handleResponse(res),
      (error) => this.handleError(error)
    );
  }

  update(formData: any) {
    const id = this.urlId as number;
    this.api.put("salaryDetail", id, formData).subscribe(
      (res: any) => this.handleResponse(res),
      (error) => this.handleError(error)
    );
  }

  handleResponse(res: any) {
    this.toggleSpinner(false);
    if (res["status"] === true) {
      // this.formGroup.reset();
      this.toastService.success("Data Saved Successfully!!");
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

  // addRow(selected: any): void {
  //   const lastRow = this.breakup.at(this.breakup.length - 1);

  //   if (!lastRow.get("amount")?.value || lastRow.get("amount")?.value <= 0) {
  //     this.toastService.error(
  //       "Please enter a valid amount before adding a new row."
  //     );
  //     lastRow.get("amount")?.markAsTouched();
  //     return;
  //   }

  //   if (
  //     !lastRow.get("name")?.value ||
  //     lastRow.get("name")?.value.trim() === ""
  //   ) {
  //     this.toastService.error("Please enter a name before adding a new row.");
  //     lastRow.get("name")?.markAsTouched();
  //     return;
  //   }

  //   this.calculateTotalAmount();

  //   const netSalary = this.formGroup.get("salary")?.value;
  //   if (this.totalAmount > netSalary) {
  //     this.toastService.error("Total amount cannot exceed the net salary.");
  //     return;
  //   }

  //   const newRow = this.createBreakupItem();
  //   console.log(newRow);
  //   if (selected) {
  //     newRow.get("name")?.setValue(selected.name);
  //     newRow.get("nameReadonly")?.setValue(true);

  //     this.selectedAllowances.push(selected);

  //     this.allowances = this.allowances.filter(
  //       (item) => item.id !== selected.id
  //     );

  //     if (selected.formula) {
  //       newRow.get("formula")?.setValue(selected.formula);

  //       newRow.get("calculationType")?.setValue("default");

  //       const evaluatedValue = this.evaluateExpression(
  //         selected.formula,
  //         this.breakup.length - 1
  //       );

  //       newRow.get("amount")?.setValue(evaluatedValue);
  //       console.log(this.breakup.length);
  //       this.calculateTotalAmount();
  //     }

  //     // if (selected?.formula) {
  //     //   newRow.get('formula')?.setValue(selected.formula);
  //     //   newRow.get('calculationType')?.setValue('default');
  //     // } else {
  //     //   newRow.get('calculationType')?.setValue('custom');
  //     // }
  //   }

  //   this.breakup.push(newRow);
  //   this.showAllowanceSelect = false;
  // }

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

      this.selectedAllowances.push(selected);

      this.allowances = this.allowances.filter(
        (item) => item.id !== selected.id
      );

      if (selected.formula) {
        newRow.get("formula")?.setValue(selected.formula);
        newRow.get("calculationType")?.setValue("default");

        const evaluatedValue = this.evaluateExpression(
          selected.formula,
          this.breakup.length - 1
        );
        console.log(evaluatedValue, selected.formula, this.breakup.length - 1);
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

  // Remove a row

  removeRow(index: number): void {
    if (index === 0) {
      this.toastService.error("The first row cannot be deleted.");
      return;
    }

    const rowDescription = this.breakup.at(index).get("name")?.value;

    this.removeVariable(rowDescription);

    this.breakup.removeAt(index);
    this.calculateTotalAmount();
  }

  // removeRow(index: number): void {
  //   if (index === 0) {
  //     this.toastService.error("The first row cannot be deleted.");
  //     return;
  //   }

  //   const rowDescription = this.breakup.at(index).get("name")?.value;

  //   // Remove dependencies
  //   if (rowDescription && this.dependencyMap[rowDescription]) {
  //     delete this.dependencyMap[rowDescription];
  //   }

  //   this.breakup.removeAt(index);
  //   this.calculateTotalAmount();
  // }

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
    console.log(this.availableVariables);
  }

  removeVariable(name: string): void {
    const index = this.availableVariables.findIndex((v) => v.name === name);
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

  insertOperation(operation: string, rowIndex: number): void {
    const control = this.breakup.at(rowIndex);
    const currentFormula = control.get("formula")?.value || "";
    control.get("formula")?.setValue(currentFormula + ` ${operation} `);
  }

  insertVariable(
    variable: { name: string; value: number },
    rowIndex: number
  ): void {
    const control = this.breakup.at(rowIndex);
    const currentFormula = control.get("formula")?.value || "";
    control.get("formula")?.setValue(currentFormula + variable.name);
  }

  onFormulaInput(event: Event, rowIndex: number): void {
    const input = event.target as HTMLInputElement;
    const control = this.breakup.at(rowIndex);
    control.get("formula")?.setValue(input.value);
    this.evaluateFormula(rowIndex);
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

  // onCalculationTypeChange(event: Event, index: number): void {
  //   const control = this.breakup.at(index); // Get the FormGroup for the current row
  //   const selectedValue = (event.target as HTMLSelectElement).value;

  //   control.get("calculationType")?.setValue(selectedValue);

  //   if (selectedValue === "custom") {
  //     control.get("formula")?.setValue("");
  //   }
  // }

  onCalculationTypeChange(
    event: Event,
    index: number,
    data: AbstractControl
  ): void {
    const formula = data.get("formula")?.value;
    const selectedType = (event.target as HTMLSelectElement).value;

    // Update the calculation type in the form control
    data.get("calculationType")?.setValue(selectedType);

    // if (selectedType === "default" && formula) {

    //   const variableName = data.get("name")?.value.trim().replace(/\s+/g, "_");
    //   const evaluatedValue = this.evaluateExpression(formula, index);

    //   // Update the variable value
    //   this.updateVariable(variableName, evaluatedValue);

    //   // Trigger updates for all dependent rows
    //   this.updateDependentRows(index);

    //   this.calculateTotalAmount();
    // }

    if (selectedType === "default") {
      // Extract the variable name
      const variableName = data.get("name")?.value.trim().replace(/\s+/g, "_");
      console.log("Variable Name:", variableName);
      console.log("Allowances:", this.allowances);

      // Preprocess allowances to ensure matching format
      const preprocessedAllowances = this.allowancesList.map((allowance) => ({
        ...allowance,
        name: allowance.name.trim().replace(/\s+/g, "_"),
      }));

      // Match the allowance from the preprocessed list by name
      const matchedAllowance = preprocessedAllowances.find(
        (allowance) => allowance.name === variableName
      );

      console.log("Matched Allowance:", matchedAllowance);

      // Ensure a formula exists in the matched allowance
      if (matchedAllowance && matchedAllowance.formula) {
        const formula = matchedAllowance.formula;

        // Evaluate the formula
        const evaluatedValue = this.evaluateExpression(formula, index);

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
    console.log("rowIndex", rowIndex);
    console.log(formula);

    try {
      const variableName = control.value.name.trim().replace(/\s+/g, "_"); // Handle spaces in names

      if (!variableName) {
        this.toastService.error("Please add Name before applying the formula");
        return;
      }

      // Evaluate the formula
      const evaluatedValue = this.evaluateExpression(formula, rowIndex);

      // Update the current row's amount
      control.get("amount")?.setValue(evaluatedValue);

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

  // updateDependentRows(rowIndex: number): void {
  //   const control = this.breakup.at(rowIndex);
  //   console.log(this.breakup, this.dependencyMap);
  //   const formula = control.get("formula")?.value;
  //   const variableName = control.value.name.trim().replace(/\s+/g, "_"); // Handle spaces in names

  //   // Check if there are dependencies for this variable name
  //   if (this.dependencyMap[variableName]) {
  //     this.dependencyMap[variableName].forEach((dependentRowIndex) => {
  //       console.log(`Re-evaluating dependent row: ${dependentRowIndex}`);

  //       const dependentRow = this.breakup.at(dependentRowIndex);
  //       const dependentFormula = dependentRow.get("formula")?.value;

  //       // Re-evaluate the dependent row's formula with updated values
  //       const evaluatedValue = this.evaluateExpression(
  //         dependentFormula,
  //         dependentRowIndex
  //       );
  //       dependentRow.get("amount")?.setValue(evaluatedValue);

  //       // Update the variable value for the dependent row
  //       const dependentVariableName = dependentRow.value.name
  //         ?.trim()
  //         .replace(/\s+/g, "_");
  //       if (dependentVariableName) {
  //         this.updateVariable(dependentVariableName, evaluatedValue);
  //       }
  //     });
  //   }
  // }

  updateDependentRows(rowIndex: number): void {
    const control = this.breakup.at(rowIndex);
    const variableName = control.value.name.trim().replace(/\s+/g, "_");

    console.log(`Updating dependent rows for: ${variableName}`);
    console.log(this.dependencyMap);
    if (this.dependencyMap[variableName]) {
      Array.from(this.dependencyMap[variableName]).forEach(
        (dependentRowIndex) => {
          const dependentRow = this.breakup.at(dependentRowIndex);
          const dependentFormula = dependentRow.get("formula")?.value;

          console.log(
            `Recalculating row: ${dependentRowIndex}, Formula: ${dependentFormula}`
          );

          if (dependentFormula) {
            const evaluatedValue = this.evaluateExpression(
              dependentFormula,
              dependentRowIndex
            );

            console.log(
              `Evaluated Value for row ${dependentRowIndex}: ${evaluatedValue}`
            );

            dependentRow.get("amount")?.setValue(evaluatedValue);
            dependentRow.get("amount")?.markAsDirty();
            dependentRow.get("amount")?.markAsTouched();

            // Recursively update this dependent row's dependencies
            this.updateDependentRows(dependentRowIndex);
          }
        }
      );
    }
  }

  // evaluateExpression(expression: string, rowIndex: number): number {
  //   const variables: Record<string, number> = {};

  //   // First, update the variables (amounts from controls) for all rows
  //   this.breakup.controls.forEach((control, i) => {
  //     const variableName = control.value.name?.trim().replace(/\s+/g, "_"); // Handle spaces
  //     if (!variableName) return;

  //     const amount = control.get("amount")?.value || 0;
  //     variables[variableName] = amount;

  //     // Track dependencies for the current expression
  //     if (rowIndex !== i && expression.includes(variableName)) {
  //       if (!this.dependencyMap[variableName]) {
  //         this.dependencyMap[variableName] = new Set<number>();
  //       }
  //       this.dependencyMap[variableName].add(rowIndex); // Add dependency
  //       console.log(this.dependencyMap);
  //     }

  //     console.log(
  //       `Variable ${variableName} at row ${i}: ${variables[variableName]}`
  //     );
  //   });

  //   // Add predefined variables (if any)
  //   this.availableVariables.forEach((variable) => {
  //     const variableName = variable.name.trim().replace(/\s+/g, "_"); // Handle spaces
  //     variables[variableName] = variable.value;
  //   });

  //   // Replace placeholders with actual values
  //   let parsedExpression = expression.replace(
  //     /\b[A-Za-z][A-Za-z0-9_]*\b/g, // Match variable names
  //     (match) => (match in variables ? String(variables[match]) : "0")
  //   );

  //   // Handle percentage (%) operator
  //   parsedExpression = parsedExpression.replace(
  //     /(\d+(\.\d+)?)\s*%\s*(\d+(\.\d+)?)/g,
  //     (fullMatch, num1, decimal1, num2, decimal2) => `(${num1} * ${num2} / 100)`
  //   );

  //   console.log(`Parsed expression for row ${rowIndex}: ${parsedExpression}`);
  //   // this.calculateTotalAmount();
  //   // Safely evaluate the expression using Function
  //   try {
  //     return new Function("return " + parsedExpression)();
  //   } catch (error) {
  //     throw new Error("Invalid expression");
  //   }
  // }

  // evaluateExpression(expression: string, rowIndex: number): number {
  //   const variables: Record<string, number> = {};

  //   this.breakup.controls.forEach((control, i) => {
  //     const variableName = control.value.name?.trim().replace(/\s+/g, "_");
  //     if (!variableName) return;

  //     const amount = control.get("amount")?.value || 0;
  //     variables[variableName] = amount;

  //     // Track dependencies
  //     if (rowIndex !== i && expression.includes(variableName)) {
  //       if (!this.dependencyMap[variableName]) {
  //         this.dependencyMap[variableName] = new Set<number>();
  //       }
  //       this.dependencyMap[variableName].add(rowIndex);
  //     }
  //   });

  //   // Replace placeholders with actual values
  //   let parsedExpression = expression.replace(
  //     /\b[A-Za-z][A-Za-z0-9_]*\b/g,
  //     (match) => (match in variables ? String(variables[match]) : "0")
  //   );
  //   console.log(parsedExpression);
  //   // Handle percentage (%) operator
  //   parsedExpression = parsedExpression.replace(
  //     /(\d+(\.\d+)?)\s*%\s*(\d+(\.\d+)?)/g,
  //     (fullMatch, num1, _, num2) => `(${num1} * ${num2} / 100)`
  //   );
  //   console.log(parsedExpression);
  //   try {
  //     return new Function("return " + parsedExpression)();
  //   } catch (error) {
  //     console.error("Invalid expression:", error);
  //     this.toastService.error("Invalid formula. Please check and try again.");
  //     return 0;
  //   }
  // }

  evaluateExpression(expression: string, rowIndex: number): number {
    const variables: Record<string, number> = {};

    // Extract variables from breakup controls
    this.breakup.controls.forEach((control, i) => {
      const variableName = control.value.name?.trim().replace(/\s+/g, "_");
      if (!variableName) return;

      const amount = control.get("amount")?.value || 0;
      variables[variableName] = amount;

      // Track dependencies
      if (rowIndex !== i && expression.includes(variableName)) {
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

    console.log("Variables before parsing:", variables);

    // Replace placeholders with actual values
    let parsedExpression = expression.replace(
      /\b[A-Za-z][A-Za-z0-9_]*\b/g,
      (match) => (match in variables ? String(variables[match]) : "0")
    );
    console.log("Parsed Expression (before %):", parsedExpression);

    // Handle percentage (%) operator
    parsedExpression = parsedExpression.replace(
      /(\d+(\.\d+)?)\s*%\s*(\d+(\.\d+)?)/g,
      (fullMatch, num1, _, num2) => `(${num1} * ${num2} / 100)`
    );
    console.log("Parsed Expression (after %):", parsedExpression);

    try {
      return new Function("return " + parsedExpression)();
    } catch (error) {
      console.error("Invalid expression:", error);
      this.toastService.error("Invalid formula. Please check and try again.");
      return 0;
    }
  }

  calculateTotalAmount(): void {
    this.totalAmount = this.breakup.controls
      .map((control) => control.get("amount")?.value || 0)
      .reduce((acc, value) => acc + value, 0);
  }
}
