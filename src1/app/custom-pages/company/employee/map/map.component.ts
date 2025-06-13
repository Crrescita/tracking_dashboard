import { Component, OnInit, Input, ChangeDetectorRef } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { ApiService } from "../../../../core/services/api.service";
import { BsDatepickerConfig } from "ngx-bootstrap/datepicker";
import * as mapboxgl from "mapbox-gl";
import { Subject } from "rxjs";
import { debounceTime } from "rxjs/operators";

@Component({
  selector: "app-map",
  templateUrl: "./map.component.html",
  styleUrl: "./map.component.scss",
})
export class MapComponent implements OnInit {
  @Input() companyId!: string;
  urlId: number | null = null;

  bsConfig?: Partial<BsDatepickerConfig>;
  private dateChangeSubject = new Subject<Date>();

  submitted: boolean = false;
  spinnerStatus: boolean = false;
  saveButtonActive: boolean = true;

  employeeTimeline: any[] = [];

  selectedDate: Date = new Date();
  formattedDate: any;

  mapv2!: mapboxgl.Map;

  markers: mapboxgl.Marker[] = [];
  marker!: mapboxgl.Marker;

  selectedItem: any = null;

  totaldistanceToshow: any;

  checkIndetails: any = {};
  formattedTotalTime: any;

  selectedInterval: number = 15;

  intervalTimeCoordinates: any[] = [];
  isRotating = false;
  notInMotionData: any[] = [];
  motionData: any[] = [];

  newarray: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private api: ApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnDestroy() {
    if (this.mapv2) {
      this.mapv2.remove();
    }
  }

  ngOnInit(): void {
    this.cdr.detectChanges();
    this.selectedDate = new Date();

    if (this.selectedDate) {
      this.formattedDate = this.formatDate(new Date());
    }

    this.bsConfig = {
      dateInputFormat: "DD-MMM-YY",
      showWeekNumbers: false,
    };

    this.route.params.subscribe((params) => {
      this.urlId = params["id"] ? Number(params["id"]) : null;
    });

    if (this.urlId && this.companyId) {
      this.getemployeeTimeline();
      this.getCheckInDetail();
    }

    // Subscribe to the date change subject
    this.dateChangeSubject.pipe(debounceTime(300)).subscribe((newDate) => {
      this.handleDateChange(newDate);
    });
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

  // api's method
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
            this.employeeTimeline = res.data.map((item: any) => {
              item.formattedTime = this.formatTime(item.time);
              return item;
            });

            if (this.employeeTimeline && this.employeeTimeline.length > 0) {
              this.initializeMap();

              // Calculate total distance
              let totalDistance = 0;
              for (let i = 1; i < this.employeeTimeline.length; i++) {
                totalDistance += this.calculateDistance(
                  this.employeeTimeline[i - 1].latitude,
                  this.employeeTimeline[i - 1].longitude,
                  this.employeeTimeline[i].latitude,
                  this.employeeTimeline[i].longitude
                );
              }

              // Calculate time spent in different modes
              // const timeSpent = this.calculateTimeSpent();
              // console.log(timeSpent);
              this.totaldistanceToshow = totalDistance.toFixed(1);
            } else {
              this.employeeTimeline = [];
              this.intervalTimeCoordinates = [];
              this.totaldistanceToshow = null;
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

  // calculate distance
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in kilometers
    return distance;
  }

  deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  // cal time
  calculateTimeSpent(): any {
    const timeSpent = {
      driving: 0,
      cycling: 0,
      walking: 0,
      stationary: 0,
    };

    for (let i = 1; i < this.employeeTimeline.length; i++) {
      const prevItem = this.employeeTimeline[i - 1];
      const currentItem = this.employeeTimeline[i];

      // Convert time strings to Date objects for calculation
      const prevDate = new Date(`1970-01-01T${prevItem.time}Z`);
      const currentDate = new Date(`1970-01-01T${currentItem.time}Z`);

      // Calculate time difference in minutes
      const timeDifference =
        (currentDate.getTime() - prevDate.getTime()) / 1000 / 60; // Time difference in minutes

      // Calculate distance between the two coordinates
      const distance = this.calculateDistance(
        prevItem.latitude,
        prevItem.longitude,
        currentItem.latitude,
        currentItem.longitude
      );

      // Calculate speed in km/h
      const speed = distance / (timeDifference / 60); // Speed in km/h

      // Determine the activity type based on speed
      if (speed > 25) {
        timeSpent.driving += timeDifference;
      } else if (speed > 15) {
        timeSpent.cycling += timeDifference;
      } else if (speed > 5) {
        timeSpent.walking += timeDifference;
      } else {
        timeSpent.stationary += timeDifference;
      }
    }

    // Convert time spent to hours and minutes format
    const formatTime = (minutes: number) => {
      const hours = Math.floor(minutes / 60);
      const mins = Math.round(minutes % 60);
      return `${hours} hours ${mins} minutes`;
    };

    return {
      driving: formatTime(timeSpent.driving),
      cycling: formatTime(timeSpent.cycling),
      walking: formatTime(timeSpent.walking),
      stationary: formatTime(timeSpent.stationary),
    };
  }

  // get address
  geocodeCoordinates(lng: number, lat: number): Promise<string> {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=pk.eyJ1IjoiZ3VyamVldHYyIiwiYSI6ImNseWxiN3o5cDEzd3UyaXM0cmU3cm0zNnMifQ._-UTYeqo8cq1cH8vYy9Www`;

    return fetch(url)
      .then((response) => response.json())
      .then((data) => {
        return data.features[0].place_name;
      })
      .catch((error) => {
        console.error("Error fetching address:", error);
        return "";
      });
  }

  // initializeMap() {
  //   this.mapv2 = new mapboxgl.Map({
  //     accessToken:
  //       "pk.eyJ1IjoiZ3VyamVldHYyIiwiYSI6ImNseWxiN3o5cDEzd3UyaXM0cmU3cm0zNnMifQ._-UTYeqo8cq1cH8vYy9Www",
  //     container: "mapv2",
  //     style: "mapbox://styles/mapbox/streets-v11",
  //     center: [78.22773895317802, 26.22052522541971],
  //     zoom: 5,
  //   });

  //   this.mapv2.addControl(new mapboxgl.NavigationControl());

  //   this.mapv2.on("load", () => {
  //     if (!this.employeeTimeline || this.employeeTimeline.length === 0) {
  //       console.error("Employee timeline data is empty or undefined.");
  //       return;
  //     }
  //     this.mapv2.resize();
  //     // console.log(this.employeeTimeline);
  //     // this.employeeTimeline.reverse();

  //     const geocodingPromises = this.employeeTimeline.map((coordinate: any) =>
  //       this.geocodeCoordinates(coordinate.longitude, coordinate.latitude)
  //     );

  //     Promise.all(geocodingPromises)
  //       .then((addresses) => {
  //         const processedTimeline = this.employeeTimeline.map(
  //           (coordinate: any, index: number) => {
  //             const firstCoordinate = this.employeeTimeline[0];
  //             const lastCoordinate =
  //               this.employeeTimeline[this.employeeTimeline.length - 1];

  //             // Create start marker
  //             const popupStart = new mapboxgl.Popup({ offset: 25 }).setHTML(
  //               `<h6>${firstCoordinate.formattedTime}</h6>
  //                     <p>Battery Percentage: ${firstCoordinate.battery_status}%</p>
  //                     <p>Address: ${firstCoordinate.address}</p>`
  //             );

  //             const markerStart = new mapboxgl.Marker({ color: "green" })
  //               .setLngLat([
  //                 firstCoordinate.longitude,
  //                 firstCoordinate.latitude,
  //               ])
  //               .setPopup(popupStart)
  //               .addTo(this.mapv2);

  //             // Create end marker
  //             const popupEnd = new mapboxgl.Popup({ offset: 25 }).setHTML(
  //               `<h6>${lastCoordinate.formattedTime}</h6>
  //                     <p>Battery Percentage: ${lastCoordinate.battery_status}%</p>
  //                     <p>Address: ${lastCoordinate.address}</p>`
  //             );

  //             const markerEnd = new mapboxgl.Marker({ color: "red" })
  //               .setLngLat([lastCoordinate.longitude, lastCoordinate.latitude])
  //               .setPopup(popupEnd)
  //               .addTo(this.mapv2);

  //             this.markers.push(markerStart, markerEnd);
  //             const address = addresses[index];
  //             const motionStatus =
  //               coordinate.cnt <= 10 ? "In Motion" : "Not In Motion";

  //             return {
  //               ...coordinate,
  //               address: address,
  //               motionStatus: motionStatus,
  //             };
  //           }
  //         );

  //         const coordinates: [number, number][] = processedTimeline.map(
  //           (coordinate: any) => [coordinate.longitude, coordinate.latitude]
  //         );

  //         const bounds = coordinates.reduce((bounds, coord) => {
  //           return bounds.extend(coord as [number, number]);
  //         }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));

  //         this.mapv2.fitBounds(bounds, {
  //           padding: 50,
  //         });

  //         this.newarray = processedTimeline;

  //         this.mapv2.addSource("route", {
  //           type: "geojson",
  //           data: {
  //             type: "Feature",
  //             properties: {},
  //             geometry: {
  //               type: "LineString",
  //               coordinates: coordinates,
  //             },
  //           },
  //         });

  //         this.mapv2.addLayer({
  //           id: "route",
  //           type: "line",
  //           source: "route",
  //           layout: {
  //             "line-join": "round",
  //             "line-cap": "round",
  //           },
  //           paint: {
  //             "line-color": "#0074D9",
  //             "line-width": 4,
  //           },
  //         });
  //       })
  //       .catch((error) => {
  //         console.error("Error fetching addresses:", error);
  //       });
  //   });
  // }

  initializeMap() {
    this.mapv2 = new mapboxgl.Map({
      accessToken:
        "pk.eyJ1IjoiZ3VyamVldHYyIiwiYSI6ImNseWxiN3o5cDEzd3UyaXM0cmU3cm0zNnMifQ._-UTYeqo8cq1cH8vYy9Www",
      container: "mapv2",
      style: "mapbox://styles/mapbox/streets-v11",
      center: [78.22773895317802, 26.22052522541971],
      zoom: 5,
    });

    this.mapv2.addControl(new mapboxgl.NavigationControl());

    this.mapv2.on("load", () => {
      if (!this.employeeTimeline || this.employeeTimeline.length === 0) {
        console.error("Employee timeline data is empty or undefined.");
        return;
      }
      this.mapv2.resize();

      // Filter the employee timeline to keep only relevant points
      const filteredTimeline = this.filterMotionTimeline(this.employeeTimeline);

      const geocodingPromises = filteredTimeline.map((coordinate: any) =>
        this.geocodeCoordinates(coordinate.longitude, coordinate.latitude)
      );

      Promise.all(geocodingPromises)
        .then((addresses) => {
          const processedTimeline = filteredTimeline.map(
            (coordinate: any, index: number) => {
              const firstCoordinate = filteredTimeline[0];
              const lastCoordinate =
                filteredTimeline[filteredTimeline.length - 1];

              // Create start marker
              const popupStart = new mapboxgl.Popup({ offset: 25 }).setHTML(
                `<h6>${firstCoordinate.formattedTime}</h6>
                            <p>Battery Percentage: ${firstCoordinate.battery_status}%</p>
                            <p>Address: ${firstCoordinate.address}</p>`
              );

              const markerStart = new mapboxgl.Marker({ color: "green" })
                .setLngLat([
                  firstCoordinate.longitude,
                  firstCoordinate.latitude,
                ])
                .setPopup(popupStart)
                .addTo(this.mapv2);

              // Create end marker
              const popupEnd = new mapboxgl.Popup({ offset: 25 }).setHTML(
                `<h6>${lastCoordinate.formattedTime}</h6>
                            <p>Battery Percentage: ${lastCoordinate.battery_status}%</p>
                            <p>Address: ${lastCoordinate.address}</p>`
              );

              const markerEnd = new mapboxgl.Marker({ color: "red" })
                .setLngLat([lastCoordinate.longitude, lastCoordinate.latitude])
                .setPopup(popupEnd)
                .addTo(this.mapv2);

              this.markers.push(markerStart, markerEnd);
              const address = addresses[index];

              return {
                ...coordinate,
                address: address,
              };
            }
          );

          const coordinates: [number, number][] = this.employeeTimeline.map(
            (coordinate: any) => [coordinate.longitude, coordinate.latitude]
          );

          const bounds = coordinates.reduce((bounds, coord) => {
            return bounds.extend(coord as [number, number]);
          }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));

          this.mapv2.fitBounds(bounds, {
            padding: 50,
          });

          this.newarray = processedTimeline;
          this.mapv2.addSource("route", {
            type: "geojson",
            data: {
              type: "Feature",
              properties: {},
              geometry: {
                type: "LineString",
                coordinates: coordinates,
              },
            },
          });

          this.mapv2.addLayer({
            id: "route",
            type: "line",
            source: "route",
            layout: {
              "line-join": "round",
              "line-cap": "round",
            },
            paint: {
              "line-color": "#0074D9",
              "line-width": 4,
            },
          });
        })
        .catch((error) => {
          console.error("Error fetching addresses:", error);
        });
    });
  }

  filterMotionTimeline(timeline: any[]) {
    const filteredTimeline: any[] = [];
    let inMotionStart = null;

    for (let i = 0; i < timeline.length; i++) {
      const current = timeline[i];
      const next = timeline[i + 1];
      const prev = timeline[i - 1];

      // Determine motion status
      current.motionStatus = current.cnt <= 10 ? "In Motion" : "Not In Motion";

      if (current.cnt >= 10) {
        filteredTimeline.push(current);
      } else if (current.cnt <= 10) {
        if (prev && prev.cnt >= 10 && next && next.cnt < 10) {
          filteredTimeline.push(current);
        }

        if (next && next.cnt > 10) {
          filteredTimeline.push(current);
        }
      }
    }

    return filteredTimeline;
  }

  initializeDefaultMap() {
    this.mapv2 = new mapboxgl.Map({
      accessToken:
        "pk.eyJ1IjoiZ3VyamVldHYyIiwiYSI6ImNseWxiN3o5cDEzd3UyaXM0cmU3cm0zNnMifQ._-UTYeqo8cq1cH8vYy9Www",
      container: "mapv2",
      style: "mapbox://styles/mapbox/streets-v11",
      center: [78.22773895317802, 26.22052522541971],
      zoom: 5,
    });
  }

  calculateTotalTime(checkInTime: string, checkOutTime: string): string {
    const checkIn = new Date(checkInTime);
    const checkOut = new Date(checkOutTime);

    const diffMs = Math.abs(checkOut.getTime() - checkIn.getTime());
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    return `${diffHrs}h ${diffMins}m`;
  }

  handleError(message: string) {
    alert(message);
  }

  onItemClick(item: any) {
    this.selectedItem = item;
    this.cdr.detectChanges(); // Force change detection to update the view
  }

  onClosePopup() {
    this.selectedItem = null;
  }

  updateMarkerAndPath(lng: number, lat: number, item: any) {
    // Remove existing marker and path
    if (this.marker) {
      this.marker.remove();
    }

    // Create new marker with red color
    this.marker = new mapboxgl.Marker({ color: "#ffc703" })
      .setLngLat([lng, lat])
      .addTo(this.mapv2);

    // Create a new popup
    const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(
      `<h6>${item.formattedTime}</h6>
        <p>Battery Percentage: ${item.battery_status}%</p>
        <p>Address: ${item.address}</p>`
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

  formatTime(time: string): string {
    // Assuming time format is "HH:mm:ss" or similar
    const [hour, minute, second] = time.split(":");
    const period = +hour >= 12 ? "PM" : "AM";
    const formattedHour = +hour % 12 || 12; // Convert hour to 12-hour format

    return `${formattedHour}:${minute} ${period}`;
  }
}
