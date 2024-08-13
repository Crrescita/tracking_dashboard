import { Component } from "@angular/core";
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

  constructor(private api: ApiService, private route: ActivatedRoute) {}

  ngOnInit(): void {
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
    this.getAttendance();
    if (this.urlId && this.company_id) {
      this.getCheckInDetail();
    }
  }

  toggleSpinner(isLoading: boolean) {
    this.spinnerStatus = isLoading;
  }

  getAttendance() {
    this.toggleSpinner(true);
    const url = `getAttendence?company_id=1&date=2024-08-10`;
    this.api.getwithoutid(url).subscribe(
      (res: any) => {
        this.toggleSpinner(false);
        if (res && res.status) {
          this.attendanceData = res.data || [];
          this.attendanceDataList = res.data || [];
          // this.attendanceCount = res.attendenceCount || [];

          // this.updatePagination();
          // this.updateDisplayedItems();
        } else {
          this.attendanceData = [];
          this.attendanceDataList = [];
          // this.attendanceCount = [];
          this.toggleSpinner(false);
        }
      },
      (error) => {
        this.handleError(
          error.message || "An error occurred while fetching data"
        );
      }
    );
  }

  // getCheckInDetail() {
  //   this.toggleSpinner(true);
  //   this.api
  //     .getwithoutid(
  //       `checkInDetailAllDate?emp_id=${this.urlId}&company_id=${this.company_id}`
  //     )
  //     .subscribe(
  //       (res: any) => {
  //         this.toggleSpinner(false);
  //         if (res && res.status) {
  //           this.checkIndetails = res.data;
  //           console.log(this.checkIndetails);

  //           // Transform data into calendar events format
  //           const events = this.checkIndetails.checkInsByDate.flatMap(
  //             (dateInfo: any) => {
  //               console.log(dateInfo);
  //               return {
  //                 title: `Check-in: ${
  //                   dateInfo.earliestCheckInTime
  //                 } - Check-out: ${dateInfo.latestCheckOutTime || "Ongoing"}`,
  //                 start: `${dateInfo.date}T${dateInfo.earliestCheckInTime}`,
  //                 end: dateInfo.latestCheckOutTime
  //                   ? `${dateInfo.date}T${dateInfo.latestCheckOutTime}`
  //                   : null,
  //                 extendedProps: {
  //                   earliestCheckInTime: dateInfo.earliestCheckInTime,
  //                   latestCheckOutTime: dateInfo.latestCheckOutTime,
  //                   totalDuration: dateInfo.totalDuration,
  //                 },
  //               };

  //               return dateInfo.checkIns.map((checkIn: any) => {
  //                 return {
  //                   title: `Check-in: ${checkIn.check_in_time} - Check-out: ${
  //                     checkIn.check_out_time || "Ongoing"
  //                   }`,
  //                   start: `${dateInfo.date}T${checkIn.check_in_time}`,
  //                   end: checkIn.check_out_time
  //                     ? `${dateInfo.date}T${checkIn.check_out_time}`
  //                     : null,
  //                   extendedProps: {
  //                     earliestCheckInTime: dateInfo.earliestCheckInTime,
  //                     latestCheckOutTime: dateInfo.latestCheckOutTime,
  //                     totalDuration: dateInfo.totalDuration,
  //                   },
  //                 };
  //               });
  //             }
  //           );

  //           // Update calendar options dynamically
  //           this.calendarOptions = {
  //             ...this.calendarOptions,
  //             events: events,
  //           };
  //         } else {
  //           this.checkIndetails = null;
  //         }
  //       },
  //       (error) => {
  //         this.toggleSpinner(false);
  //         this.handleError(
  //           error.message || "An error occurred while fetching data"
  //         );
  //       }
  //     );
  // }

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
            console.log(this.checkIndetails);

            // Transform data into calendar events format
            const events = this.checkIndetails.checkInsByDate.flatMap(
              (dateInfo: any) => {
                return {
                  title: `${dateInfo.earliestCheckInTime} - ${
                    dateInfo.latestCheckOutTime || "Ongoing"
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
                    totalDuration: dateInfo.totalDuration,
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
}
