import { Component, ViewChild } from "@angular/core";
import {
  CalendarOptions,
  EventApi,
  EventClickArg,
  EventInput,
} from "@fullcalendar/core";
import interactionPlugin from "@fullcalendar/interaction";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import { ApiService } from "../../../../core/services/api.service";
import { ActivatedRoute } from "@angular/router";
import { ModalDirective } from "ngx-bootstrap/modal";
import { FormGroup, FormBuilder, Validators } from "@angular/forms";

@Component({
  selector: "app-atten-calender",
  templateUrl: "./atten-calender.component.html",
  styleUrl: "./atten-calender.component.scss",
})
export class AttenCalenderComponent {
  calendarEvents!: EventInput[];
  spinnerStatus: boolean = false;

  attendanceData: any = [];
  attendanceDataList: any = [];
  checkIndetails: any = {};

  urlId: number | null = null;
  company_id: number | null = null;

  events: any;

  // modal
  @ViewChild("eventModal", { static: false }) eventModal?: ModalDirective;
  isEditMode: boolean = false;
  submitted = false;
  newEventDate: any;
  editEvent: any;

  // form
  formGroup!: FormGroup;

  constructor(
    private api: ApiService,
    private route: ActivatedRoute,
    private formBuilder: FormBuilder
  ) {}

  ngOnInit(): void {
    this.formGroup = this.formBuilder.group({
      check_in_time: ["", [Validators.required]],
      check_out_time: ["", [Validators.required]],
    });

    this.route.params.subscribe((params) => {
      params["id"];
    });

    this.route.params.subscribe((params) => {
      this.urlId = params["id"] ? Number(params["id"]) : null;
      this.company_id = params["company_id"]
        ? Number(params["company_id"])
        : null;
    });
    //Called after the constructor, initializing input properties, and the first call to ngOnChanges.
    //Add 'implements OnInit' to the class.

    if (this.urlId && this.company_id) {
      this.getCheckInDetail();
    }
  }

  toggleSpinner(isLoading: boolean) {
    this.spinnerStatus = isLoading;
  }

  getCheckInDetail() {
    this.toggleSpinner(true);
    this.api
      .getwithoutid(
        `checkInDetailAllDate?emp_id=${this.urlId}&company_id=${this.company_id}`
      )
      .subscribe(
        (res: any) => {
          this.toggleSpinner(false);
          if (res && res.status) {
            this.checkIndetails = res.data;

            // Transform data into calendar events format
            const events = this.checkIndetails.checkInsByDate.flatMap(
              (dateInfo: any) => {
                return {
                  title: `${this.formatTime(dateInfo.earliestCheckInTime)} - ${
                    this.formatTime(dateInfo.latestCheckOutTime) || "Ongoing"
                  }`,
                  start: `${dateInfo.date}T${dateInfo.earliestCheckInTime}`,
                  end: dateInfo.latestCheckOutTime
                    ? `${dateInfo.date}T${dateInfo.latestCheckOutTime}`
                    : null,
                  extendedProps: {
                    earliestCheckInTime: this.formatTime(
                      dateInfo.earliestCheckInTime
                    ),
                    latestCheckOutTime: this.formatTime(
                      dateInfo.latestCheckOutTime
                    ),
                    totalDuration: dateInfo.total_duration,
                    checkin_status: dateInfo.checkin_status,
                    timeDifferencev2: dateInfo.timeDifferencev2,
                  },
                  className: "bg-warning-subtle",
                };
              }
            );

            // Update calendar options dynamically
            this.calendarOptions = {
              ...this.calendarOptions,
              events: events,
            };
          } else {
            this.checkIndetails = null;
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

  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, listPlugin, interactionPlugin, timeGridPlugin],
    headerToolbar: {
      right: "dayGridMonth,dayGridWeek,dayGridDay,listWeek",
      center: "title",
      left: "prev,next today",
    },
    initialView: "dayGridMonth",
    themeSystem: "bootstrap",
    timeZone: "local",
    // droppable: true,
    // editable: true,
    selectable: true,
    navLinks: true,
    eventResizableFromStart: true,

    eventClick: this.handleEventClick.bind(this),
    events: [], // This will be updated dynamically
    eventContent: function (arg) {
      const { extendedProps } = arg.event;

      return {
        html: `

          <div >

           <b>Check-in:</b> ${extendedProps["earliestCheckInTime"]} <br>
            <b>Check-out:</b> ${
              extendedProps["latestCheckOutTime"] || "Ongoing"
            } <br>
            <b>Total Duration:</b>   ${extendedProps["totalDuration"]}

          </div>
        `,
      };
    },
  };

  handleError(error: any) {
    this.toggleSpinner(false);
  }

  formatTime(time: string | null): string {
    if (!time) {
      return "Invalid time";
    }

    // Assuming time format is "HH:mm:ss" or similar
    const [hour, minute, second] = time.split(":");
    const period = +hour >= 12 ? "PM" : "AM";
    const formattedHour = +hour % 12 || 12; // Convert hour to 12-hour format

    return `${formattedHour}:${minute} ${period}`;
  }

  /**
   * Event click modal show
   */
  handleEventClick(clickInfo: EventClickArg) {
    console.log(clickInfo);
    this.isEditMode = true;
    this.editEvent = clickInfo.event;
    console.log(this.editEvent);
    this.eventModal?.show();

    setTimeout(() => {
      (document.querySelector(".event-details") as HTMLElement).style.display =
        "block";
      (document.querySelector(".event-form") as HTMLElement).style.display =
        "none";

      document.getElementById("btn-delete-event")?.classList.remove("d-none");

      var editbtn = document.querySelector(
        "#edit-event-btn"
      ) as HTMLAreaElement;
      editbtn.innerHTML = "edit";

      (document.getElementById("btn-save-event") as HTMLElement).setAttribute(
        "hidden",
        "true"
      );

      // var modaltitle = document.querySelector(
      //   ".modal-title"
      // ) as HTMLAreaElement;
      // modaltitle.innerHTML = this.editEvent.title;
    }, 100);

    // this.formData = this.formBuilder.group({
    //   title: clickInfo.event.title,
    //   category: clickInfo.event.classNames[0],
    //   location: clickInfo.event.extendedProps['location'],
    //   description: clickInfo.event.extendedProps['description'],
    //   date: clickInfo.event.start,
    //   start: (clickInfo.event.start ? clickInfo.event.start : ''),
    //   end: (clickInfo.event.end ? clickInfo.event.end : '')
    // });

    this.formGroup = this.formBuilder.group({
      check_in_time: clickInfo.event.extendedProps["earliestCheckInTime"],
      check_out_time: clickInfo.event.extendedProps["latestCheckOutTime"],
    });
  }

  showeditEvent() {
    if (document.querySelector("#edit-event-btn")?.innerHTML == "cancel") {
      this.eventModal?.hide();
    } else {
      (document.querySelector(".event-details") as HTMLElement).style.display =
        "none";
      (document.querySelector(".event-form") as HTMLElement).style.display =
        "block";
      (
        document.getElementById("btn-save-event") as HTMLElement
      ).removeAttribute("hidden");
      var modalbtn = document.querySelector(
        "#btn-save-event"
      ) as HTMLAreaElement;
      modalbtn.innerHTML = "Update Event";
      var editbtn = document.querySelector(
        "#edit-event-btn"
      ) as HTMLAreaElement;
      editbtn.innerHTML = "cancel";
    }
  }
}
