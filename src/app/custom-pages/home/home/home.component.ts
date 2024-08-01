import { Component, OnInit } from "@angular/core";

@Component({
  selector: "app-home",
  templateUrl: "./home.component.html",
  styleUrl: "./home.component.scss",
})
export class HomeComponent implements OnInit {
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
      { label: "Home Page", active: true },
    ];
  }

  handleTitleChange(section: string, newTitle: string) {
    this.sectionTitles[section] = newTitle;
  }
}
