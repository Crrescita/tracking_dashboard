import { Injectable } from "@angular/core";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

@Injectable({
  providedIn: "root",
})
export class ExcelService {
  constructor() {}

  exportAsExcelFile(data: any[], excelFileName: string): void {
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
    const workbook: XLSX.WorkBook = {
      Sheets: { data: worksheet },
      SheetNames: ["data"],
    };
    const excelBuffer: any = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    this.saveAsExcelFile(excelBuffer, excelFileName);
  }

  private saveAsExcelFile(buffer: any, fileName: string): void {
    const data: Blob = new Blob([buffer], { type: EXCEL_TYPE });
    saveAs(data, `${fileName}_${new Date().getTime()}${EXCEL_EXTENSION}`);
  }

  exportToExcel(departments: any[], designations: any[]) {
    // Create sample data
    const data = [
      {
        Name: "John Doe",
        Address: "123 St, City",
        DOB: "1990-02-15",
        Email: "john@example.com",
        Mobile: "9876543210",
        Status: "Active",
        Gender: "Male",
        State: "State1",
        City: "City1",
        Zip_Code: "123456",
        Designation: "",
        Department: "",
        Joining_Date: "2024-10-01",
        Password: "123456",
        Confirm_Password: "123456",
      },
      {
        Name: "Jane Smith",
        Address: "456 Ave, City",
        DOB: "1992-05-20",
        Email: "jane@example.com",
        Mobile: "9876543211",
        Status: "Active",
        Gender: "Female",
        State: "State2",
        City: "City2",
        Zip_Code: "654321",
        Designation: "",
        Department: "",
        Joining_Date: "2024-09-15",
        Password: "123456",
        Confirm_Password: "123456",
      },
    ];

    // Create the worksheet from data
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);

    // Add dropdowns (Data validation)
    const departmentOptions = departments.map((d) => d.name).join(",");
    const designationOptions = designations.map((d) => d.name).join(",");

    console.log(departmentOptions);
    // Apply dropdown for Designation (column 11) and Department (column 12)
    worksheet["!dataValidation"] = [
      {
        sqref: "K2:K100", // Column K (Designation) for 100 rows
        type: "list",
        formula1: `"${designationOptions}"`,
        showDropDown: true,
      },
      {
        sqref: "L2:L100", // Column L (Department) for 100 rows
        type: "list",
        formula1: `"${departmentOptions}"`,
        showDropDown: true,
      },
    ];
    console.log(worksheet);
    // Create a new workbook and add the worksheet
    const workbook: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "EmployeeData");

    // Export the workbook
    XLSX.writeFile(workbook, "EmployeeData.xlsx");
  }

  createSampleExcel(departments: any[], designations: any[]) {
    const employeeData = [
      [
        "Name *",
        "Employee ID *",
        "Email *",
        "Mobile *",
        "Date of Birth (YYYY-MM-DD)",
        "Joining Date (YYYY-MM-DD)",
        "Department ID *",
        "Designation ID *",
        "Gender * (Male/Female/Other)",
        "Address",
        "City",
        "Zip Code",
        "State",
        "Status * (Active/Inactive)",
        "Password",
      ],
      // Sample row for user reference
      [
        "John Doe",
        "EMPID123",
        "john.doe@example.com",
        "9876543210",
        "1990-01-01",
        "2022-01-01",
        "101",
        "201",
        "Male",
        "123 Main St",
        "A",
        "123456",
        "",
        "Active",
        "123456",
      ],
    ];

    // Sample Data Sheet (Sheet 2)
    const departmentHeader = ["ID", "Department"];
    const departmentRows = departments.map((dep) => [dep.id, dep.name]);

    const designationHeader = ["ID", "Designation"];
    const designationRows = designations.map((des) => [des.id, des.name]);

    const sampleData = [
      ["Department IDs"],
      departmentHeader,
      ...departmentRows,
      [],
      ["Designation IDs"],
      designationHeader,
      ...designationRows,
    ];

    // Create the workbook and sheets
    const wb = XLSX.utils.book_new();
    const employeeSheet = XLSX.utils.aoa_to_sheet(employeeData);
    const sampleDataSheet = XLSX.utils.aoa_to_sheet(sampleData);

    // Add both sheets to the workbook
    XLSX.utils.book_append_sheet(wb, employeeSheet, "Employee Data");
    XLSX.utils.book_append_sheet(wb, sampleDataSheet, "Designations Data");

    // Create and save the Excel file
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], { type: "application/octet-stream" });
    saveAs(blob, "Employee_Sample.xlsx");
  }
}

const EXCEL_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8";
const EXCEL_EXTENSION = ".xlsx";
