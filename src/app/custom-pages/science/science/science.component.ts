import { Component, OnInit } from "@angular/core";

@Component({
  selector: "app-science",
  templateUrl: "./science.component.html",
  styleUrl: "./science.component.scss",
})
export class ScienceComponent implements OnInit {
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

  constructor() {}

  ngOnInit(): void {
    this.breadCrumbItems = [
      { label: "Pages", active: true },
      { label: "Science", active: true },
    ];
  }

  handleTitleChange(section: string, newTitle: string) {
    this.sectionTitles[section] = newTitle;
  }
}
