import { Component, OnInit } from "@angular/core";

@Component({
  selector: "app-contact",

  templateUrl: "./contact.component.html",
  styleUrl: "./contact.component.scss",
})
export class ContactComponent implements OnInit {
  breadCrumbItems!: Array<{}>;
  sectionTitles: { [key: string]: string } = {
    sectionTwoTitle: "",
    sectionThreeTitle: "",
    sectionFourTitle: "",
    sectionFiveTitle: "",
    sectionSixTitle: "",
  };

  constructor() {}

  ngOnInit(): void {
    this.breadCrumbItems = [
      { label: "Pages", active: true },
      { label: "Contact Page", active: true },
    ];
  }

  handleTitleChange(section: string, newTitle: string) {
    this.sectionTitles[section] = newTitle;
  }
}
