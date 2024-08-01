import { Component, OnInit } from "@angular/core";

@Component({
  selector: "app-service",
  templateUrl: "./service.component.html",
  styleUrl: "./service.component.scss",
})
export class ServiceComponent implements OnInit {
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
      { label: "Service Page", active: true },
    ];
  }

  handleTitleChange(section: string, newTitle: string) {
    this.sectionTitles[section] = newTitle;
  }
}
