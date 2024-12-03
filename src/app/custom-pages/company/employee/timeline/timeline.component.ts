import {
  Component,
  OnInit,
  Input,
  ChangeDetectorRef,
  Output,
  EventEmitter,
} from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { ApiService } from "../../../../core/services/api.service";
import { BsDatepickerConfig } from "ngx-bootstrap/datepicker";
import * as mapboxgl from "mapbox-gl";
import { Subject } from "rxjs";
import { debounceTime } from "rxjs/operators";

@Component({
  selector: "app-timeline",
  templateUrl: "./timeline.component.html",
  styleUrl: "./timeline.component.scss",
})
export class TimelineComponent implements OnInit {
  @Input() companyId!: string;
  @Output() employeeChange = new EventEmitter<number>();
  urlId: number | null = null;
  selectedEmployeeId: number | null = null;

  bsConfig?: Partial<BsDatepickerConfig>;
  private dateChangeSubject = new Subject<Date>();

  submitted: boolean = false;
  spinnerStatus: boolean = false;
  saveButtonActive: boolean = true;

  employeeTimeline: any[] = [];
  employeeDataList: any = [];

  selectedDate: Date = new Date();
  formattedDate: any;

  map!: mapboxgl.Map;

  markers: mapboxgl.Marker[] = [];
  marker!: mapboxgl.Marker;

  selectedItem: any = null;

  totaldistanceToshow: any;

  checkIndetails: any = {};
  formattedTotalTime: any;

  selectedInterval: number = 15;

  intervalTimeCoordinates: any[] = [];
  isRotating = false;

  uniqueCoordinates: {
    longitude: number;
    latitude: number;
    address: string;
  }[] = [];

  constructor(
    private route: ActivatedRoute,
    private api: ApiService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
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

    this.selectedEmployeeId = this.urlId || this.employeeDataList[0]?.id;

    if (this.urlId && this.companyId) {
      this.getemployeeTimeline();
      this.getCheckInDetail();
      this.getemployeeData();
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
    // if (newDate && newDate !== this.selectedDate) {

    this.selectedDate = newDate;
    this.formattedDate = this.formatDate(newDate);
    this.getemployeeTimeline();
    this.getCheckInDetail();
    // }
  }

  refreshTimeline() {
    this.isRotating = true;
    this.getemployeeTimeline();
    setTimeout(() => {
      this.isRotating = false;
    }, 500);
  }

  // onDateChange(newDate: Date): void {
  //   console.log("dd", newDate);
  //   this.selectedDate = newDate;
  //   this.formattedDate = this.formatDate(newDate);
  //   this.getemployeeTimeline();
  //   // this.getCheckInDetail();
  // }

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

  getemployeeData() {
    this.toggleSpinner(true);
    const url = `employees?company_id=${this.companyId}`;
    this.api.getwithoutid(url).subscribe(
      (res: any) => {
        this.toggleSpinner(false);
        if (res && res.status) {
          this.employeeDataList = res.data || [];
        } else {
          this.employeeDataList = [];
          this.toggleSpinner(false);
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

              // Calculate time spent in different modes, including rest periods
              const timeSpent = this.calculateTimeSpent();
              const restPeriods = this.calculateRestPeriods(); // New method to calculate rest periods

              this.totaldistanceToshow = totalDistance.toFixed(1);

              // Display results as needed
              // console.log("Total Distance:", totalDistance, "km");
              // console.log("Time Spent:", timeSpent);
              // console.log("Rest Periods:", restPeriods);
            }
          } else {
            this.employeeTimeline = [];
            this.intervalTimeCoordinates = [];
            this.totaldistanceToshow = null;

            // this.initializeDefaultMap();
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

  // Filter coordinates based on the selected interval-not used
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

    // Add the first coordinate as the start
    const startCoordinate = this.employeeTimeline[0];
    filteredCoordinates.push({ start: startCoordinate, end: startCoordinate });

    while (currentTimeInSeconds <= endTimeInSeconds) {
      currentTimeInSeconds += interval * 60;

      const endCoordinate = this.employeeTimeline.find(
        (item) => getTotalSeconds(item.time) >= currentTimeInSeconds
      );

      if (endCoordinate) {
        // Check if the segment already exists to avoid duplication
        const lastSegment = filteredCoordinates[filteredCoordinates.length - 1];
        if (!lastSegment || lastSegment.end.id !== endCoordinate.id) {
          filteredCoordinates.push({
            start: filteredCoordinates[filteredCoordinates.length - 1].end,
            end: endCoordinate,
          });
        }
      } else {
        // If no further end coordinate is found, break the loop
        break;
      }
    }

    // Ensure the last coordinate is included
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

  // orignial
  initializeMap() {
    this.map = new mapboxgl.Map({
      accessToken:
        "pk.eyJ1IjoiZ3VyamVldHYyIiwiYSI6ImNseWxiN3o5cDEzd3UyaXM0cmU3cm0zNnMifQ._-UTYeqo8cq1cH8vYy9Www",
      container: "map",
      style: "mapbox://styles/mapbox/streets-v11",
      center: [78.22773895317802, 26.22052522541971],
      zoom: 5,
    });

    this.map.addControl(new mapboxgl.NavigationControl());

    this.map.on("load", () => {
      if (!this.employeeTimeline || this.employeeTimeline.length === 0) {
        console.error("Employee timeline data is empty or undefined.");
        return;
      }
      this.map.resize();
      const filteredCoordinates = this.filterCoordinatesByInterval(
        this.employeeTimeline[0].time,
        this.selectedInterval
      );

      const geocodingPromises = this.employeeTimeline.map((item) => {
        if (item.address) {
          // this.uniqueCoordinates.push({
          //   longitude: item.longitude,
          //   latitude: item.latitude,
          //   address: item.address,
          // });
          return Promise.resolve();
        } else {
          return this.geocodeCoordinates(item.longitude, item.latitude)
            .then((address) => {
              const isDuplicate = this.uniqueCoordinates.some(
                (coord) =>
                  coord.longitude === item.longitude &&
                  coord.latitude === item.latitude
              );

              if (!isDuplicate) {
                this.uniqueCoordinates.push({
                  longitude: item.longitude,
                  latitude: item.latitude,
                  address: address,
                });
              }

              item.address = address;
            })
            .catch((error) => {
              console.error("Error fetching address:", error);
            });
        }
      });

      Promise.all(geocodingPromises).then(() => {
        // this.sendCoordinatesToAPI(this.uniqueCoordinates);

        // Only create markers for the first and last entries
        const firstCoordinate = this.employeeTimeline[0];
        const lastCoordinate =
          this.employeeTimeline[this.employeeTimeline.length - 1];

        // Create start marker
        const popupStart = new mapboxgl.Popup({ offset: 25 }).setHTML(
          `<h6>${firstCoordinate.formattedTime}</h6>
              <p>Battery Percentage: ${firstCoordinate.battery_status}</p>
              <p>Address: ${firstCoordinate.address}</p>`
        );

        const markerStart = new mapboxgl.Marker({ color: "green" })
          .setLngLat([firstCoordinate.longitude, firstCoordinate.latitude])
          .setPopup(popupStart)
          .addTo(this.map);

        // Create end marker
        const popupEnd = new mapboxgl.Popup({ offset: 25 }).setHTML(
          `<h6>${lastCoordinate.formattedTime}</h6>
              <p>Battery Percentage: ${lastCoordinate.battery_status}</p>
              <p>Address: ${lastCoordinate.address}</p>`
        );

        const markerEnd = new mapboxgl.Marker({ color: "red" })
          .setLngLat([lastCoordinate.longitude, lastCoordinate.latitude])
          .setPopup(popupEnd)
          .addTo(this.map);

        this.markers.push(markerStart, markerEnd);

        // Display rest periods on the map
        const restPeriods = this.calculateRestPeriods();
        restPeriods.forEach((period, index) => {
          const popupRest = new mapboxgl.Popup({ offset: 25 }).setHTML(
            `<h6>Rest Period ${index + 1}</h6>
                  <p>Duration: ${period.duration}</p>
                  <p>From: ${period.startTime}</p>
                  <p>To: ${period.endTime}</p>
                  <p>Address: ${period.address}</p>`
          );

          const markerRest = new mapboxgl.Marker({ color: "blue" })
            .setLngLat([period.start.longitude, period.start.latitude])
            .setPopup(popupRest)
            .addTo(this.map);

          this.markers.push(markerRest);
        });

        filteredCoordinates.forEach((segment, index) => {
          if (!segment.start || !segment.end) {
            console.error(
              `Segment at index ${index} is missing start or end coordinates.`
            );
            return;
          }

          // Collect all intermediate coordinates for this segment
          const intermediateCoordinates = this.employeeTimeline
            .filter((item) => {
              const itemTime = this.getTimeInSeconds(item.time);
              const startTime = this.getTimeInSeconds(segment.start.time);
              const endTime = this.getTimeInSeconds(segment.end.time);
              return itemTime >= startTime && itemTime <= endTime;
            })
            .map((item) => [item.longitude, item.latitude, item.time]);

          // Remove consecutive duplicates while preserving time differences
          const uniqueCoordinates = intermediateCoordinates
            .filter(
              (coord, i, arr) =>
                i === 0 ||
                coord[0] !== arr[i - 1][0] ||
                coord[1] !== arr[i - 1][1] ||
                coord[2] !== arr[i - 1][2]
            )
            .map((coord) => [coord[0], coord[1]]);

          // Ensure the path starts and ends at the correct coordinates
          if (
            uniqueCoordinates[0][0] !== segment.start.longitude ||
            uniqueCoordinates[0][1] !== segment.start.latitude
          ) {
            uniqueCoordinates.unshift([
              segment.start.longitude,
              segment.start.latitude,
            ]);
          }
          if (
            uniqueCoordinates[uniqueCoordinates.length - 1][0] !==
              segment.end.longitude ||
            uniqueCoordinates[uniqueCoordinates.length - 1][1] !==
              segment.end.latitude
          ) {
            uniqueCoordinates.push([
              segment.end.longitude,
              segment.end.latitude,
            ]);
          }

          // Add path to the map
          const layerId = `path-${index}`;
          this.removeLayerIfExists(layerId);

          this.map.addLayer({
            id: layerId,
            type: "line",
            source: {
              type: "geojson",
              data: {
                type: "Feature",
                properties: {},
                geometry: {
                  type: "LineString",
                  coordinates: uniqueCoordinates,
                },
              },
            },
            layout: {
              "line-join": "round",
              "line-cap": "round",
            },
            paint: {
              "line-color": "#3887be",
              "line-width": 4,
            },
          });
        });

        // Fit the map bounds to include the markers
        const bounds = new mapboxgl.LngLatBounds();
        this.markers.forEach((marker) => bounds.extend(marker.getLngLat()));
        this.map.fitBounds(bounds, { padding: 50 });
      });
    });
  }

  // initializeMap() {
  //   this.map = new mapboxgl.Map({
  //     accessToken:
  //       "pk.eyJ1IjoiZ3VyamVldHYyIiwiYSI6ImNseWxiN3o5cDEzd3UyaXM0cmU3cm0zNnMifQ._-UTYeqo8cq1cH8vYy9Www",
  //     container: "map",
  //     style: "mapbox://styles/mapbox/streets-v12",
  //     center: [78.22773895317802, 26.22052522541971],
  //     zoom: 5,
  //   });

  //   this.map.addControl(new mapboxgl.NavigationControl());

  //   this.map.on("load", () => {
  //     if (!this.employeeTimeline || this.employeeTimeline.length === 0) {
  //       console.error("Employee timeline data is empty or undefined.");
  //       return;
  //     }
  //     this.map.resize();

  //     const filteredCoordinates = this.filterCoordinatesByInterval(
  //       this.employeeTimeline[0].time,
  //       this.selectedInterval
  //     );

  //     const geocodingPromises = this.employeeTimeline.map((item) => {
  //       if (item.address) {
  //         // this.uniqueCoordinates.push({
  //         //   longitude: item.longitude,
  //         //   latitude: item.latitude,
  //         //   address: item.address,
  //         // });
  //         return Promise.resolve();
  //       } else {
  //         return this.geocodeCoordinates(item.longitude, item.latitude)
  //           .then((address) => {
  //             const isDuplicate = this.uniqueCoordinates.some(
  //               (coord) =>
  //                 coord.longitude === item.longitude &&
  //                 coord.latitude === item.latitude
  //             );

  //             if (!isDuplicate) {
  //               this.uniqueCoordinates.push({
  //                 longitude: item.longitude,
  //                 latitude: item.latitude,
  //                 address: address,
  //               });
  //             }

  //             item.address = address;
  //           })
  //           .catch((error) => {
  //             console.error("Error fetching address:", error);
  //           });
  //       }
  //     });

  //     Promise.all(geocodingPromises).then(() => {
  //       // this.sendCoordinatesToAPI(this.uniqueCoordinates);

  //       // Only create markers for the first and last entries
  //       const firstCoordinate = this.employeeTimeline[0];
  //       const lastCoordinate =
  //         this.employeeTimeline[this.employeeTimeline.length - 1];

  //       // Create start marker
  //       const popupStart = new mapboxgl.Popup({ offset: 25 }).setHTML(
  //         `<h6>${firstCoordinate.formattedTime}</h6>
  //                   <p>Battery Percentage: ${firstCoordinate.battery_status}%</p>
  //                   <p>Address: ${firstCoordinate.address}</p>`
  //       );

  //       const markerStart = new mapboxgl.Marker({ color: "green" })
  //         .setLngLat([firstCoordinate.longitude, firstCoordinate.latitude])
  //         .setPopup(popupStart)
  //         .addTo(this.map);

  //       // Create end marker
  //       const popupEnd = new mapboxgl.Popup({ offset: 25 }).setHTML(
  //         `<h6>${lastCoordinate.formattedTime}</h6>
  //                   <p>Battery Percentage: ${lastCoordinate.battery_status}%</p>
  //                   <p>Address: ${lastCoordinate.address}</p>`
  //       );

  //       const markerEnd = new mapboxgl.Marker({ color: "red" })
  //         .setLngLat([lastCoordinate.longitude, lastCoordinate.latitude])
  //         .setPopup(popupEnd)
  //         .addTo(this.map);

  //       this.markers.push(markerStart, markerEnd);

  //       // Display rest periods on the map
  //       const restPeriods = this.calculateRestPeriods();
  //       restPeriods.forEach((period, index) => {
  //         const popupRest = new mapboxgl.Popup({ offset: 25 }).setHTML(
  //           `<h6>Rest Period ${index + 1}</h6>
  //                       <p>Duration: ${period.duration}</p>
  //                       <p>From: ${period.startTime}</p>
  //                       <p>To: ${period.endTime}</p>
  //                       <p>Address: ${period.address}</p>`
  //         );

  //         const markerRest = new mapboxgl.Marker({ color: "blue" })
  //           .setLngLat([period.start.longitude, period.start.latitude])
  //           .setPopup(popupRest)
  //           .addTo(this.map);

  //         this.markers.push(markerRest);
  //       });

  //       filteredCoordinates.forEach((segment, index) => {
  //         if (!segment.start || !segment.end) {
  //           console.error(
  //             `Segment at index ${index} is missing start or end coordinates.`
  //           );
  //           return;
  //         }

  //         // Collect all intermediate coordinates for this segment
  //         const intermediateCoordinates = this.employeeTimeline
  //           .filter((item) => {
  //             const itemTime = this.getTimeInSeconds(item.time);
  //             const startTime = this.getTimeInSeconds(segment.start.time);
  //             const endTime = this.getTimeInSeconds(segment.end.time);
  //             return itemTime >= startTime && itemTime <= endTime;
  //           })
  //           .map((item) => [item.longitude, item.latitude, item.time]);

  //         // Remove consecutive duplicates while preserving time differences
  //         const uniqueCoordinates = intermediateCoordinates
  //           .filter(
  //             (coord, i, arr) =>
  //               i === 0 ||
  //               coord[0] !== arr[i - 1][0] ||
  //               coord[1] !== arr[i - 1][1] ||
  //               coord[2] !== arr[i - 1][2]
  //           )
  //           .map((coord) => [coord[0], coord[1]]);

  //         // Ensure the path starts and ends at the correct coordinates
  //         if (
  //           uniqueCoordinates[0][0] !== segment.start.longitude ||
  //           uniqueCoordinates[0][1] !== segment.start.latitude
  //         ) {
  //           uniqueCoordinates.unshift([
  //             segment.start.longitude,
  //             segment.start.latitude,
  //           ]);
  //         }
  //         if (
  //           uniqueCoordinates[uniqueCoordinates.length - 1][0] !==
  //             segment.end.longitude ||
  //           uniqueCoordinates[uniqueCoordinates.length - 1][1] !==
  //             segment.end.latitude
  //         ) {
  //           uniqueCoordinates.push([
  //             segment.end.longitude,
  //             segment.end.latitude,
  //           ]);
  //         }
  //       });
  //     });

  //     // Collect all coordinates
  //     const coordinates: Array<[number, number]> = this.employeeTimeline.map(
  //       (item) => [item.longitude, item.latitude]
  //     );

  //     // Divide coordinates into chunks of 25
  //     const coordinateChunks = this.chunkArray(coordinates, 25);

  //     // Get the route for each chunk and combine them
  //     this.getCombinedRoute(coordinateChunks).then((fullRoute) => {
  //       if (fullRoute.length === 0) {
  //         console.error("No route found.");
  //         return;
  //       }

  //       // Create a GeoJSON line from the combined route
  //       const geojson: GeoJSON.Feature<GeoJSON.LineString> = {
  //         type: "Feature",
  //         properties: {},
  //         geometry: {
  //           type: "LineString",
  //           coordinates: fullRoute,
  //         },
  //       };

  //       if (this.map.getLayer("route")) {
  //         this.map.removeLayer("route"); // Remove the layer if it exists
  //         this.map.removeSource("route"); // Remove the source associated with the layer
  //       }
  //       // Add the path to the map
  //       this.map.addLayer({
  //         id: "route",
  //         type: "line",
  //         source: {
  //           type: "geojson",
  //           data: geojson,
  //         },
  //         layout: {
  //           "line-join": "round",
  //           "line-cap": "round",
  //         },
  //         paint: {
  //           "line-color": "#3887be",
  //           "line-width": 4,
  //         },
  //       });

  //       // Fit the map bounds to include the route
  //       const bounds = new mapboxgl.LngLatBounds();
  //       fullRoute.forEach((coord: [number, number]) => bounds.extend(coord));
  //       this.map.fitBounds(bounds, { padding: 50 });
  //     });
  //   });
  // }

  // Helper function to divide an array into chunks
  chunkArray(array: Array<any>, chunkSize: number): Array<Array<any>> {
    const results = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      results.push(array.slice(i, i + chunkSize));
    }
    return results;
  }

  // Fetch the combined route for chunks of coordinates
  getCombinedRoute(
    chunks: Array<Array<[number, number]>>
  ): Promise<Array<[number, number]>> {
    const routePromises = chunks.map((chunk) => this.getOptimizedRoute(chunk));
    return Promise.all(routePromises).then((routes) => {
      // Combine all route segments into one array
      const combinedRoute: Array<[number, number]> = [];
      routes.forEach((route) => {
        if (route.length > 0) {
          combinedRoute.push(...route);
        }
      });
      console.log(combinedRoute);
      return combinedRoute;
    });
  }

  // Fetch the optimized route using Mapbox Map Matching API for a chunk of coordinates
  getOptimizedRoute(
    coordinates: Array<[number, number]>
  ): Promise<Array<[number, number]>> {
    const coordinatesString = coordinates
      .map((coord) => coord.join(","))
      .join(";");
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coordinatesString}?geometries=polyline6&overview=full&access_token=${mapboxgl.accessToken}`;
    // const url = `https://api.mapbox.com/directions/v5/mapbox/driving/77.0797%2C28.479321%3B77.076151%2C28.477595%3B77.07613%2C28.477595%3B77.07615%2C28.477605%3B77.07615%2C28.477594%3B77.076129%2C28.477578?alternatives=true&geometries=geojson&language=en&overview=full&steps=true&access_token=pk.eyJ1IjoiZ3VyamVldHYyIiwiYSI6ImNseWxiN3o5cDEzd3UyaXM0cmU3cm0zNnMifQ._-UTYeqo8cq1cH8vYy9Www`;
    return fetch(url)
      .then((response) => response.json())
      .then((data) => {
        // console.log(data);
        if (data.matchings && data.matchings.length > 0) {
          // Return the coordinates for the first matching route
          return data.matchings[0].geometry.coordinates as Array<
            [number, number]
          >;
        } else {
          throw new Error("No matching route found");
        }
      })
      .catch((error) => {
        console.error("Error fetching matching route:", error);
        return []; // Return an empty array in case of error
      });
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

  calculateRestPeriods() {
    const restPeriods = [];
    const thresholdDistance = 0.02; // Approx. 20 meters, adjust as needed
    let startRest = null;

    for (let i = 1; i < this.employeeTimeline.length; i++) {
      const prevCoord = this.employeeTimeline[i - 1];
      const currCoord = this.employeeTimeline[i];
      const distance = this.calculateDistance(
        prevCoord.latitude,
        prevCoord.longitude,
        currCoord.latitude,
        currCoord.longitude
      );

      if (distance <= thresholdDistance) {
        if (!startRest) {
          startRest = prevCoord;
        }
      } else {
        if (startRest) {
          const durationInSeconds =
            this.getTimeInSeconds(currCoord.time) -
            this.getTimeInSeconds(startRest.time);

          const durationInMinutes = durationInSeconds / 60;
          if (durationInMinutes >= 5) {
            restPeriods.push({
              ...startRest,
              start: startRest,
              end: currCoord,
              duration: this.formatDuration(durationInSeconds), // Format to hh:mm:ss
              durationInMinutes: durationInMinutes.toFixed(1), // To display minutes if needed
              startTime: this.formatTime(startRest.time), // Formatted start time
              endTime: this.formatTime(currCoord.time), // Formatted end time
            });
          }
          startRest = null;
        }
      }
    }

    return restPeriods;
  }

  // Helper function to format duration in hh:mm:ss
  formatDuration(totalSeconds: number): string {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);

    return `${this.pad(hours)}:${this.pad(minutes)}:${this.pad(seconds)}`;
  }

  // Helper function to pad numbers to two digits (e.g., 05, 09)
  pad(num: number): string {
    return num.toString().padStart(2, "0");
  }

  // Utility function to convert HH:mm:ss to total seconds
  getTimeInSeconds(time: string) {
    const [hours, minutes, seconds] = time.split(":").map(Number);
    return hours * 3600 + minutes * 60 + seconds;
  }
  // Helper function to remove existing layers
  removeLayerIfExists(layerId: string) {
    if (this.map.getLayer(layerId)) {
      this.map.removeLayer(layerId);
    }
    if (this.map.getSource(layerId)) {
      this.map.removeSource(layerId);
    }
  }

  initializeDefaultMap() {
    this.map = new mapboxgl.Map({
      accessToken:
        "pk.eyJ1IjoiZ3VyamVldHYyIiwiYSI6ImNseWxiN3o5cDEzd3UyaXM0cmU3cm0zNnMifQ._-UTYeqo8cq1cH8vYy9Www",
      container: "map",
      style: "mapbox://styles/mapbox/streets-v11",
      center: [78.9629, 20.5937],
      zoom: 13,
    });
    this.map.addControl(new mapboxgl.NavigationControl());
  }

  formatTime(time: string): string {
    // Assuming time format is "HH:mm:ss" or similar
    const [hour, minute, second] = time.split(":");
    const period = +hour >= 12 ? "PM" : "AM";
    const formattedHour = +hour % 12 || 12; // Convert hour to 12-hour format

    return `${formattedHour}:${minute} ${period}`;
  }

  handleError(error: any) {
    this.toggleSpinner(false);
  }

  // map

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
        <p>Battery Percentage: ${item.end.battery_status}</p>
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

  // total time
  calculateTotalTime(checkInTime: string, checkOutTime: string): string {
    const [checkInHour, checkInMinute] = checkInTime.split(":").map(Number);
    const [checkOutHour, checkOutMinute] = checkOutTime.split(":").map(Number);

    const checkInDate = new Date();
    checkInDate.setHours(checkInHour, checkInMinute, 0);

    const checkOutDate = new Date();
    checkOutDate.setHours(checkOutHour, checkOutMinute, 0);

    const diffInMs = checkOutDate.getTime() - checkInDate.getTime();
    const diffInMinutes = Math.floor(diffInMs / 60000);

    const hours = Math.floor(diffInMinutes / 60);
    const minutes = diffInMinutes % 60;

    return `${hours}h ${minutes}m`;
  }

  sendCoordinatesToAPI(
    coordinates: { longitude: number; latitude: number; address: string }[]
  ) {
    this.api.post("address", coordinates).subscribe(
      (res: any) => {},

      (error) => this.handleError(error)
    );
  }

  // onEmployeeChange(event: Event): void {
  //   const selectedId = (event.target as HTMLSelectElement).value;
  //   this.router
  //     .navigate([`/employee-detail/${selectedId}`], {
  //       queryParams: { tab: "timeline" },
  //     })
  //     .then(() => {
  //       // Force reload after navigation is complete
  //       window.location.reload();
  //     });
  // }

  handleEmployeeChange(event: Event): void {
    const newEmployeeId = +(event.target as HTMLSelectElement).value; // Get new employee ID
    this.router.navigate([`/employee-detail/${newEmployeeId}`], {
      queryParams: { tab: "timeline" },
    });

    this.urlId = newEmployeeId;

    this.employeeChange.emit(newEmployeeId); // Emit the new ID to parent
    this.getemployeeTimeline();
    this.getCheckInDetail();
  }
}
