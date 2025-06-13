import { Component } from '@angular/core';

@Component({
  selector: 'app-employee-thankyou',
  templateUrl: './employee-thankyou.component.html',
  styleUrl: './employee-thankyou.component.scss'
})
export class EmployeeThankyouComponent {
  year: number = new Date().getFullYear();
}
