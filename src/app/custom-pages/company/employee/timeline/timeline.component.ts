import { Component, OnInit, Input, ChangeDetectorRef } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
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
  urlId: number | null = null;

  bsConfig?: Partial<BsDatepickerConfig>;
  private dateChangeSubject = new Subject<Date>();

  submitted: boolean = false;
  spinnerStatus: boolean = false;
  saveButtonActive: boolean = true;

  employeeTimeline: any[] = [];

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

  constructor(
    private route: ActivatedRoute,
    private api: ApiService,
    private cdr: ChangeDetectorRef
  ) {}

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
    // if (newDate && newDate !== this.selectedDate) {

    this.selectedDate = newDate;
    this.formattedDate = this.formatDate(newDate);
    this.getemployeeTimeline();
    this.getCheckInDetail();
    // }
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
              this.checkIndetails.check_in_time &&
              this.checkIndetails.check_out_time
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

              // Calculate time spent in different modes
              const timeSpent = this.calculateTimeSpent();

              this.totaldistanceToshow = totalDistance.toFixed(1);

              // console.log("Total Distance:", totalDistance, "km");
              // console.log("Time Spent:", timeSpent);

              // Display these results in the UI as needed
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

  // Filter coordinates based on the selected interval
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
    console.log(this.intervalTimeCoordinates);
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
      const timeDifference =
        (new Date(currentItem.time).getTime() -
          new Date(prevItem.time).getTime()) /
        1000 /
        60; // Time difference in minutes

      const distance = this.calculateDistance(
        prevItem.latitude,
        prevItem.longitude,
        currentItem.latitude,
        currentItem.longitude
      );
      const speed = distance / (timeDifference / 60); // Speed in km/h

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

    return timeSpent;
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

  // load map
  // initializeMap() {
  //   this.map = new mapboxgl.Map({
  //     accessToken:
  //       "pk.eyJ1IjoiZ3VyamVldHYyIiwiYSI6ImNseWxiN3o5cDEzd3UyaXM0cmU3cm0zNnMifQ._-UTYeqo8cq1cH8vYy9Www",
  //     container: "map",
  //     style: "mapbox://styles/mapbox/streets-v11",
  //     center: [78.22773895317802, 26.22052522541971],
  //     zoom: 5,
  //   });

  //   this.map.on("load", () => {
  //     const geocodingPromises: Promise<void>[] = [];

  //     this.employeeTimeline.forEach((item: any) => {
  //       const geocodingPromise = this.geocodeCoordinates(
  //         item.longitude,
  //         item.latitude
  //       )
  //         .then((address) => {
  //           item.address = address;
  //         })
  //         .catch((error) => {
  //           console.error("Error fetching address:", error);
  //         });

  //       geocodingPromises.push(geocodingPromise);
  //     });

  //     Promise.all(geocodingPromises)
  //       .then(() => {
  //         this.employeeTimeline.forEach((item: any, index: any) => {
  //           const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(
  //             `<h6>${item.formattedTime}</h6>
  //             <p>Battery Percentage: ${item.battery_status}%</p>
  //             <p>Address: ${item.address}</p>`
  //           );

  //           const marker = new mapboxgl.Marker()
  //             .setLngLat([item.longitude, item.latitude])
  //             .setPopup(popup)
  //             .addTo(this.map);

  //           this.markers.push(marker);

  //           if (index > 0) {
  //             const coordinates = [
  //               [
  //                 this.employeeTimeline[index - 1].longitude,
  //                 this.employeeTimeline[index - 1].latitude,
  //               ],
  //               [item.longitude, item.latitude],
  //             ];

  //             const layerId = `path-${index}`;
  //             this.removeLayerIfExists(layerId);

  //             this.map.addLayer({
  //               id: layerId,
  //               type: "line",
  //               source: {
  //                 type: "geojson",
  //                 data: {
  //                   type: "Feature",
  //                   properties: {},
  //                   geometry: {
  //                     type: "LineString",
  //                     coordinates: coordinates,
  //                   },
  //                 },
  //               },
  //               layout: {
  //                 "line-join": "round",
  //                 "line-cap": "round",
  //               },
  //               paint: {
  //                 "line-color": "#3887be",
  //                 "line-width": 8,
  //               },
  //             });
  //           }
  //         });

  //         const bounds = new mapboxgl.LngLatBounds();
  //         this.markers.forEach((marker) => bounds.extend(marker.getLngLat()));
  //         this.map.fitBounds(bounds, { padding: 50 });
  //       })
  //       .catch((error) => {
  //         console.error("Error fetching addresses:", error);
  //       });
  //   });
  // }

  // initializeMap() {
  //   this.map = new mapboxgl.Map({
  //     accessToken:
  //       "pk.eyJ1IjoiZ3VyamVldHYyIiwiYSI6ImNseWxiN3o5cDEzd3UyaXM0cmU3cm0zNnMifQ._-UTYeqo8cq1cH8vYy9Www",
  //     container: "map",
  //     style: "mapbox://styles/mapbox/streets-v11",
  //     center: [78.22773895317802, 26.22052522541971],
  //     zoom: 5,
  //   });

  //   this.map.on("load", () => {
  //     if (!this.employeeTimeline || this.employeeTimeline.length === 0) {
  //       console.error("Employee timeline data is empty or undefined.");
  //       return;
  //     }

  //     const filteredCoordinates = this.filterCoordinatesByInterval(
  //       this.employeeTimeline[0].time, // Get the time part from the first entry
  //       this.selectedInterval
  //     );

  //     const geocodingPromises = this.employeeTimeline.map((item) => {
  //       return this.geocodeCoordinates(item.longitude, item.latitude)
  //         .then((address) => {
  //           item.address = address;
  //         })
  //         .catch((error) => {
  //           console.error("Error fetching address:", error);
  //         });
  //     });

  //     Promise.all(geocodingPromises).then(() => {
  //       filteredCoordinates.forEach((segment, index) => {
  //         if (!segment.start || !segment.end) {
  //           console.error(
  //             `Segment at index ${index} is missing start or end coordinates.`
  //           );
  //           return;
  //         }

  //         // Create start marker
  //         const popupStart = new mapboxgl.Popup({ offset: 25 }).setHTML(
  //           `<h6>${segment.start.formattedTime}</h6>
  //                   <p>Battery Percentage: ${segment.start.battery_status}%</p>
  //                   <p>Address: ${segment.start.address}</p>`
  //         );

  //         const markerStart = new mapboxgl.Marker({ color: "green" })
  //           .setLngLat([segment.start.longitude, segment.start.latitude])
  //           .setPopup(popupStart)
  //           .addTo(this.map);

  //         // Create end marker
  //         const popupEnd = new mapboxgl.Popup({ offset: 25 }).setHTML(
  //           `<h6>${segment.end.formattedTime}</h6>
  //                   <p>Battery Percentage: ${segment.end.battery_status}%</p>
  //                   <p>Address: ${segment.end.address}</p>`
  //         );

  //         const markerEnd = new mapboxgl.Marker({ color: "red" })
  //           .setLngLat([segment.end.longitude, segment.end.latitude])
  //           .setPopup(popupEnd)
  //           .addTo(this.map);

  //         this.markers.push(markerStart, markerEnd);

  //         // Collect all intermediate coordinates for this segment
  //         const intermediateCoordinates = this.employeeTimeline
  //           .filter((item) => {
  //             const itemTime = this.getTimeInSeconds(item.time);
  //             const startTime = this.getTimeInSeconds(segment.start.time);
  //             const endTime = this.getTimeInSeconds(segment.end.time);
  //             return itemTime >= startTime && itemTime <= endTime;
  //           })
  //           .map((item) => [item.longitude, item.latitude]);

  //         // Ensure the path starts and ends at the correct coordinates
  //         if (
  //           intermediateCoordinates[0][0] !== segment.start.longitude ||
  //           intermediateCoordinates[0][1] !== segment.start.latitude
  //         ) {
  //           intermediateCoordinates.unshift([
  //             segment.start.longitude,
  //             segment.start.latitude,
  //           ]);
  //         }
  //         if (
  //           intermediateCoordinates[intermediateCoordinates.length - 1][0] !==
  //             segment.end.longitude ||
  //           intermediateCoordinates[intermediateCoordinates.length - 1][1] !==
  //             segment.end.latitude
  //         ) {
  //           intermediateCoordinates.push([
  //             segment.end.longitude,
  //             segment.end.latitude,
  //           ]);
  //         }

  //         // Add path to the map (No intermediate markers added)
  //         const layerId = `path-${index}`;
  //         this.removeLayerIfExists(layerId);

  //         this.map.addLayer({
  //           id: layerId,
  //           type: "line",
  //           source: {
  //             type: "geojson",
  //             data: {
  //               type: "Feature",
  //               properties: {},
  //               geometry: {
  //                 type: "LineString",
  //                 coordinates: intermediateCoordinates,
  //               },
  //             },
  //           },
  //           layout: {
  //             "line-join": "round",
  //             "line-cap": "round",
  //           },
  //           paint: {
  //             "line-color": "#3887be",
  //             "line-width": 8,
  //           },
  //         });
  //       });

  //       const bounds = new mapboxgl.LngLatBounds();
  //       this.markers.forEach((marker) => bounds.extend(marker.getLngLat()));
  //       this.map.fitBounds(bounds, { padding: 50 });
  //     });
  //   });
  // }

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

      const filteredCoordinates = this.filterCoordinatesByInterval(
        this.employeeTimeline[0].time, // Get the time part from the first entry
        this.selectedInterval
      );

      const geocodingPromises = this.employeeTimeline.map((item) => {
        return this.geocodeCoordinates(item.longitude, item.latitude)
          .then((address) => {
            item.address = address;
          })
          .catch((error) => {
            console.error("Error fetching address:", error);
          });
      });

      Promise.all(geocodingPromises).then(() => {
        // Only create markers for the first and last entries
        const firstCoordinate = this.employeeTimeline[0];
        const lastCoordinate =
          this.employeeTimeline[this.employeeTimeline.length - 1];

        // Create start marker
        const popupStart = new mapboxgl.Popup({ offset: 25 }).setHTML(
          `<h6>${firstCoordinate.formattedTime}</h6>
                <p>Battery Percentage: ${firstCoordinate.battery_status}%</p>
                <p>Address: ${firstCoordinate.address}</p>`
        );

        const markerStart = new mapboxgl.Marker({ color: "green" })
          .setLngLat([firstCoordinate.longitude, firstCoordinate.latitude])
          .setPopup(popupStart)
          .addTo(this.map);

        // Create end marker
        const popupEnd = new mapboxgl.Popup({ offset: 25 }).setHTML(
          `<h6>${lastCoordinate.formattedTime}</h6>
                <p>Battery Percentage: ${lastCoordinate.battery_status}%</p>
                <p>Address: ${lastCoordinate.address}</p>`
        );

        const markerEnd = new mapboxgl.Marker({ color: "red" })
          .setLngLat([lastCoordinate.longitude, lastCoordinate.latitude])
          .setPopup(popupEnd)
          .addTo(this.map);

        this.markers.push(markerStart, markerEnd);

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
            .map((item) => [item.longitude, item.latitude]);

          // Ensure the path starts and ends at the correct coordinates
          if (
            intermediateCoordinates[0][0] !== segment.start.longitude ||
            intermediateCoordinates[0][1] !== segment.start.latitude
          ) {
            intermediateCoordinates.unshift([
              segment.start.longitude,
              segment.start.latitude,
            ]);
          }
          if (
            intermediateCoordinates[intermediateCoordinates.length - 1][0] !==
              segment.end.longitude ||
            intermediateCoordinates[intermediateCoordinates.length - 1][1] !==
              segment.end.latitude
          ) {
            intermediateCoordinates.push([
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
                  coordinates: intermediateCoordinates,
                },
              },
            },
            layout: {
              "line-join": "round",
              "line-cap": "round",
            },
            paint: {
              "line-color": "#3887be",
              "line-width": 8,
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
}
