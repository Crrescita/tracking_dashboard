import { Component, OnInit } from "@angular/core";

@Component({
  selector: "app-about",
  templateUrl: "./about.component.html",
  styleUrl: "./about.component.scss",
})
export class AboutComponent implements OnInit {
  breadCrumbItems!: Array<{}>;

  sectionTitles: { [key: string]: string } = {
    sectionTwoTitle: "",
    sectionThreeTitle: "",
    sectionFourTitle: "",
    sectionFiveTitle: "",
    sectionSixTitle: "",
    sectionSevenTitle: "",
    sectionEightTitle: "",
  };
  // sectionTwoTitle: string = "";
  // sectionThreeTitle: string = "";
  // sectionFourTitle: string = "";
  // sectionFiveTitle: string = "";
  // sectionSixTitle: string = "";

  constructor() {}

  ngOnInit(): void {
    this.breadCrumbItems = [
      { label: "Pages", active: true },
      { label: "About Page", active: true },
    ];
  }

  handleTitleChange(section: string, newTitle: string) {
    this.sectionTitles[section] = newTitle;
  }
}
