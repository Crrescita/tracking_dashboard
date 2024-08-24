import {
  Component,
  OnInit,
  Input,
  ChangeDetectorRef,
  OnDestroy,
} from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { ApiService } from "../../../../core/services/api.service";
import { BsDatepickerConfig } from "ngx-bootstrap/datepicker";
import * as mapboxgl from "mapbox-gl";
import { Subject } from "rxjs";
import { debounceTime } from "rxjs/operators";

@Component({
  selector: "app-timeline",
  templateUrl: "./timeline.component.html",
  styleUrls: ["./timeline.component.scss"],
})
export class TimelineComponent implements OnInit, OnDestroy {
  @Input() companyId!: string;
  urlId: number | null = null;

  bsConfig?: Partial<BsDatepickerConfig>;
  private dateChangeSubject = new Subject<Date>();

  submitted: boolean = false;
  spinnerStatus: boolean = false;
  saveButtonActive: boolean = true;

  employeeTimeline: any[] = [];
  employeeTimelinev2: any[] = [];

  selectedDate: Date = new Date();
  formattedDate: string = "";

  map!: mapboxgl.Map;
  markers: mapboxgl.Marker[] = [];

  marker!: mapboxgl.Marker;

  selectedItem: any = null;
  totaldistanceToshow: string | null = null;

  checkIndetails: any = {};
  formattedTotalTime: string | null = null;

  selectedInterval: number = 15;
  intervalTimeCoordinates: any[] = [];
  isRotating = false;

  constructor(
    private route: ActivatedRoute,
    private api: ApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cdr.detectChanges();

    this.bsConfig = {
      dateInputFormat: "DD-MMM-YY",
      showWeekNumbers: false,
    };

    this.route.params.subscribe((params) => {
      this.urlId = params["id"] ? Number(params["id"]) : null;
      if (this.urlId && this.companyId) {
        this.getemployeeTimeline();
        this.getCheckInDetail();
      }
    });

    // Subscribe to the date change subject
    this.dateChangeSubject.pipe(debounceTime(300)).subscribe((newDate) => {
      this.handleDateChange(newDate);
    });

    if (this.selectedDate) {
      this.formattedDate = this.formatDate(this.selectedDate);
    }
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
    }
  }

  onIntervalChange() {
    this.initializeMap();
  }

  onDateChange(newDate: Date): void {
    this.dateChangeSubject.next(newDate);
  }

  handleDateChange(newDate: Date): void {
    this.selectedDate = newDate;
    this.formattedDate = this.formatDate(newDate);
    this.getemployeeTimeline();
    this.getCheckInDetail();
  }

  refreshTimeline() {
    this.isRotating = true;
    this.getemployeeTimeline();
    setTimeout(() => {
      this.isRotating = false;
    }, 500);
  }

  formatDate(date: Date): string {
    if (!date) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  toggleSpinner(isLoading: boolean) {
    this.spinnerStatus = isLoading;
    this.saveButtonActive = !isLoading;
    this.submitted = isLoading;
  }

  getCheckInDetail() {
    this.toggleSpinner(true);
    this.api
      .getwithoutid(
        `checkInDetail?emp_id=${this.urlId}&company_id=${this.companyId}&date=${this.formattedDate}`
      )
      .subscribe(
        (res: any) => {
          this.toggleSpinner(false);
          if (res && res.status) {
            this.checkIndetails = res.data[0];
            if (
              this.checkIndetails?.check_in_time &&
              this.checkIndetails?.check_out_time
            ) {
              this.formattedTotalTime = this.calculateTotalTime(
                this.checkIndetails.check_in_time,
                this.checkIndetails.check_out_time
              );
            }
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

  getemployeeTimeline() {
    this.toggleSpinner(true);
    this.api
      .getwithoutid(
        `getCoordinatesv2?emp_id=${this.urlId}&company_id=${this.companyId}&date=${this.formattedDate}`
      )
      .subscribe(
        (res: any) => {
          this.toggleSpinner(false);

          if (res && res.status && res.data.length > 0) {
            this.employeeTimelinev2 = res.data.map((item: any) => {
              item.formattedTime = this.formatTime(item.time);
              return item;
            });
            console.log(this.employeeTimelinev2);
          } else {
            this.employeeTimelinev2 = [];
          }
        },
        (error) => {
          this.toggleSpinner(false);
          this.employeeTimelinev2 = [];

          this.handleError(
            error.message || "An error occurred while fetching data"
          );
        }
      );

    this.api
      .getwithoutid(
        `getCoordinates?emp_id=${this.urlId}&company_id=${this.companyId}&date=${this.formattedDate}`
      )
      .subscribe(
        (res: any) => {
          this.toggleSpinner(false);

          if (res && res.status && res.data.length > 0) {
            this.employeeTimeline = res.data.map((item: any) => {
              item.formattedTime = this.formatTime(item.time);
              return item;
            });

            if (this.employeeTimeline.length > 0) {
              this.initializeMap();

              let totalDistance = 0;
              for (let i = 1; i < this.employeeTimeline.length; i++) {
                totalDistance += this.calculateDistance(
                  this.employeeTimeline[i - 1].latitude,
                  this.employeeTimeline[i - 1].longitude,
                  this.employeeTimeline[i].latitude,
                  this.employeeTimeline[i].longitude
                );
              }

              const timeSpent = this.calculateTimeSpent();
              const restPeriods = this.calculateRestPeriods();

              this.totaldistanceToshow = totalDistance.toFixed(1);

              console.log("Total Distance:", totalDistance, "km");
              console.log("Time Spent:", timeSpent);
              console.log("Rest Periods:", restPeriods);
            }
          } else {
            this.employeeTimeline = [];
            this.intervalTimeCoordinates = [];
            this.totaldistanceToshow = null;
          }
        },
        (error) => {
          this.toggleSpinner(false);
          this.employeeTimeline = [];

          this.initializeDefaultMap();
          this.handleError(
            error.message || "An error occurred while fetching data"
          );
        }
      );
  }

  filterCoordinatesByInterval(startTime: string, interval: number) {
    const [startHours, startMinutes, startSeconds] = startTime
      .split(":")
      .map(Number);
    const startTimeInSeconds =
      startHours * 3600 + startMinutes * 60 + startSeconds;

    const filteredCoordinates: any[] = [];
    let currentTimeInSeconds = startTimeInSeconds;

    const getTotalSeconds = (time: string) => {
      const [hours, minutes, seconds] = time.split(":").map(Number);
      return hours * 3600 + minutes * 60 + seconds;
    };

    const formatTime = (seconds: number) => {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const remainingSeconds = seconds % 60;
      return `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
    };

    const endTimeInSeconds = getTotalSeconds(
      this.employeeTimeline[this.employeeTimeline.length - 1].time
    );

    const startCoordinate = this.employeeTimeline[0];
    filteredCoordinates.push({ start: startCoordinate, end: startCoordinate });

    while (currentTimeInSeconds <= endTimeInSeconds) {
      currentTimeInSeconds += interval * 60;

      const endCoordinate = this.employeeTimeline.find(
        (item) => getTotalSeconds(item.time) >= currentTimeInSeconds
      );

      if (endCoordinate) {
        const lastSegment = filteredCoordinates[filteredCoordinates.length - 1];
        if (!lastSegment || lastSegment.end.id !== endCoordinate.id) {
          filteredCoordinates.push({
            start: filteredCoordinates[filteredCoordinates.length - 1].end,
            end: endCoordinate,
          });
        }
      } else {
        break;
      }
    }

    const lastCoordinate =
      this.employeeTimeline[this.employeeTimeline.length - 1];
    if (
      filteredCoordinates.length === 0 ||
      filteredCoordinates[filteredCoordinates.length - 1].end.id !==
        lastCoordinate.id
    ) {
      filteredCoordinates.push({
        start:
          filteredCoordinates.length > 0
            ? filteredCoordinates[filteredCoordinates.length - 1].end
            : lastCoordinate,
        end: lastCoordinate,
      });
    }

    this.intervalTimeCoordinates = filteredCoordinates;
    return filteredCoordinates;
  }

  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const toRad = (x: number) => (x * Math.PI) / 180;

    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat) * Math.sin(dLat) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon) *
        Math.sin(dLon);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;
    return d;
  }

  calculateTimeSpent() {
    let drivingTime = 0;
    let walkingTime = 0;
    let stationaryTime = 0;

    for (let i = 1; i < this.employeeTimeline.length; i++) {
      const current = this.employeeTimeline[i];
      const previous = this.employeeTimeline[i - 1];

      const distance = this.calculateDistance(
        previous.latitude,
        previous.longitude,
        current.latitude,
        current.longitude
      );
      const timeDiff = this.getTimeDifferenceInSeconds(
        previous.formattedTime,
        current.formattedTime
      );

      const speed = distance / (timeDiff / 3600);

      if (speed > 25) {
        drivingTime += timeDiff;
      } else if (speed > 5 && speed <= 25) {
        walkingTime += timeDiff;
      } else {
        stationaryTime += timeDiff;
      }
    }

    return {
      drivingTime: this.formatDuration(drivingTime),
      walkingTime: this.formatDuration(walkingTime),
      stationaryTime: this.formatDuration(stationaryTime),
    };
  }

  calculateRestPeriods() {
    const restPeriods = [];

    for (let i = 1; i < this.employeeTimeline.length; i++) {
      const current = this.employeeTimeline[i];
      const previous = this.employeeTimeline[i - 1];

      const timeDiff = this.getTimeDifferenceInSeconds(
        previous.formattedTime,
        current.formattedTime
      );

      if (timeDiff > 5 * 60) {
        restPeriods.push({
          startTime: previous.formattedTime,
          endTime: current.formattedTime,
          duration: this.formatDuration(timeDiff),
        });
      }
    }

    return restPeriods;
  }

  getTimeDifferenceInSeconds(startTime: string, endTime: string): number {
    const [startHours, startMinutes, startSeconds] = startTime
      .split(":")
      .map(Number);
    const [endHours, endMinutes, endSeconds] = endTime.split(":").map(Number);

    const startInSeconds = startHours * 3600 + startMinutes * 60 + startSeconds;
    const endInSeconds = endHours * 3600 + endMinutes * 60 + endSeconds;

    return endInSeconds - startInSeconds;
  }

  formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  }

  formatTime(time: string): string {
    if (!time) return "";
    const [hours, minutes, seconds] = time.split(":").map(Number);
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }

  calculateTotalTime(checkInTime: string, checkOutTime: string): string {
    const [checkInHours, checkInMinutes, checkInSeconds] = checkInTime
      .split(":")
      .map(Number);
    const [checkOutHours, checkOutMinutes, checkOutSeconds] = checkOutTime
      .split(":")
      .map(Number);

    const checkInTotalSeconds =
      checkInHours * 3600 + checkInMinutes * 60 + checkInSeconds;
    const checkOutTotalSeconds =
      checkOutHours * 3600 + checkOutMinutes * 60 + checkOutSeconds;

    const totalTimeInSeconds = checkOutTotalSeconds - checkInTotalSeconds;

    return this.formatDuration(totalTimeInSeconds);
  }

  initializeMap() {
    if (this.map) {
      this.map.remove();
    }

    this.map = new mapboxgl.Map({
      container: "map",
      style: "mapbox://styles/mapbox/streets-v11",
      center: [
        this.employeeTimeline[0].longitude,
        this.employeeTimeline[0].latitude,
      ],
      zoom: 12,
    });

    this.addMarkers();
  }

  initializeDefaultMap() {
    if (this.map) {
      this.map.remove();
    }

    this.map = new mapboxgl.Map({
      container: "map",
      style: "mapbox://styles/mapbox/streets-v11",
      center: [78.4867, 17.385], // Default to Hyderabad coordinates
      zoom: 12,
    });
  }

  addMarkers() {
    this.markers.forEach((marker) => marker.remove());
    this.markers = [];

    this.intervalTimeCoordinates.forEach((segment) => {
      const startMarker = new mapboxgl.Marker()
        .setLngLat([segment.start.longitude, segment.start.latitude])
        .addTo(this.map);
      this.markers.push(startMarker);

      const endMarker = new mapboxgl.Marker()
        .setLngLat([segment.end.longitude, segment.end.latitude])
        .addTo(this.map);
      this.markers.push(endMarker);
    });
  }

  updateMarkerAndPath(lng: number, lat: number, item: any) {
    // Remove existing marker and path
    if (this.marker) {
      this.marker.remove();
    }

    // Create new marker with red color
    this.marker = new mapboxgl.Marker({ color: "#ffc703" })
      .setLngLat([lng, lat])
      .addTo(this.map);

    // Create a new popup
    const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(
      `<h6>${item.end.formattedTime}</h6>
        <p>Battery Percentage: ${item.end.battery_status}%</p>
        <p>Address: ${item.end.address}</p>`
    );

    // Attach the popup to the marker
    this.marker.setPopup(popup);

    // Update the selected item
    this.selectedItem = item;
  }

  getBatteryClass(batteryStatus: number): string {
    if (batteryStatus >= 75) {
      return "battery-high";
    } else if (batteryStatus >= 35) {
      return "battery-mid";
    } else {
      return "battery-low";
    }
  }

  handleError(errorMessage: string) {
    // Handle error display, such as showing a message to the user
    console.error(errorMessage);
  }
}
