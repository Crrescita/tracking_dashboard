import { Component, OnInit } from "@angular/core";
import { ApiService } from "../../../core/services/api.service";
import * as mapboxgl from "mapbox-gl";
interface AttendanceSeries {
  present: number[];
  absent: number[];
  onLeave: number[];
}
@Component({
  selector: "app-dashboard",
  templateUrl: "./dashboard.component.html",
  styleUrl: "./dashboard.component.scss",
})
export class DashboardComponent implements OnInit {
  spinnerStatus: boolean = false;
  upcomingHoliday: any[] = [];
  currentDateData: any;
  previousDateData: any;
  checkIn: any[] = [];
  checkOut: any[] = [];
  sortValue: any = "This week";
  currentTab = "check-in";
  weeklyAttendanceData: AttendanceSeries = {
    present: [],
    absent: [],
    onLeave: [],
  };
  basicChart: any = {
    series: [],
    chart: {},
    dataLabels: {},
    plotOptions: {},
    yaxis: {},
    legend: {},
    fill: {},
    stroke: {},
    tooltip: {},
    xaxis: {},
    colors: [],
  };

  // company
  company_id: any;
  company_name: any;
  company_logo: any;

  // map
  map!: mapboxgl.Map;
  markers: mapboxgl.Marker[] = [];

  // basicChart: any;

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    const data = localStorage.getItem("currentUser");

    if (data) {
      const user = JSON.parse(data);
      this.company_id = user.id;
      this.company_name = user.name;
      this.company_logo = user.logo;
    }
    if (this.company_id) {
      this.getTotalAttendance();
      this.getUpcomingHoilday();
      this.getCheckInOut();
      this.initializeDefaultMap();
      this.getWeeklyAttendanceData();
    }
  }

  getTotalAttendance() {
    this.toggleSpinner(true);
    this.api
      .getwithoutid(`getTotalAttendance?company_id=${this.company_id}`)
      .subscribe(
        (res: any) => {
          this.toggleSpinner(false);
          if (res && res.status) {
            this.currentDateData = res.currentDate.attendanceCount;
            this.previousDateData = res.previousDate.attendanceCount;
          } else {
            this.currentDateData = [];
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

  getWeeklyAttendanceData(weekOffset: number = 0) {
    this.toggleSpinner(true);
    this.api
      .getwithoutid(
        `getWeeklyAttendance?company_id=${this.company_id}&weekOffset=${weekOffset}`
      )
      .subscribe(
        (res: any) => {
          this.toggleSpinner(false);
          if (res && res.status) {
            this.weeklyAttendanceData = res.attendanceSeries;

            // Re-render the chart with the new data
            this._basicChart('["--tb-success", "--tb-danger", "--tb-warning"]');
          } else {
            this.weeklyAttendanceData = {
              present: [],
              absent: [],
              onLeave: [],
            };
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

  initializeDefaultMap() {
    this.map = new mapboxgl.Map({
      accessToken:
        "pk.eyJ1IjoiZ3VyamVldHYyIiwiYSI6ImNseWxiN3o5cDEzd3UyaXM0cmU3cm0zNnMifQ._-UTYeqo8cq1cH8vYy9Www",
      container: "map",
      style: "mapbox://styles/mapbox/streets-v11",
      center: [78.22773895317802, 26.22052522541971],
      zoom: 13,
    });

    this.map.addControl(new mapboxgl.NavigationControl());
  }

  toggleSpinner(isLoading: boolean) {
    this.spinnerStatus = isLoading;
  }

  getUpcomingHoilday() {
    this.toggleSpinner(true);
    this.api
      .getwithoutid(`getUpcomingHoliday?company_id=${this.company_id}`)
      .subscribe(
        (res: any) => {
          this.toggleSpinner(false);
          if (res && res.status) {
            this.upcomingHoliday = res.data;
          } else {
            this.upcomingHoliday = [];
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

  getCheckInOut() {
    this.toggleSpinner(true);
    this.api.getwithoutid(`checkInOut?company_id=${this.company_id}`).subscribe(
      async (res: any) => {
        this.toggleSpinner(false);
        if (res && res.status) {
          // Combine check-in and check-out address fetching
          const [checkInArray, checkOutArray] = await Promise.all([
            this.getAddressArray(res.checkInArray, "checkIn"),
            this.getAddressArray(res.checkOutArray, "checkOut"),
          ]);
          this.checkIn = checkInArray;
          this.checkOut = checkOutArray;

          // Add markers for check-in records
          this.addMarkersToMap(this.checkIn);
        } else {
          this.checkIn = [];
          this.checkOut = [];
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

  // Helper function to fetch addresses for both check-in and check-out arrays
  async getAddressArray(array: any[], type: string): Promise<any[]> {
    return await Promise.all(
      array.map(async (record) => {
        const lng =
          type === "checkIn" ? record.longCheckIn : record.longCheckOut;
        const lat = type === "checkIn" ? record.latCheckIn : record.latCheckOut;
        const address = await this.geocodeCoordinates(lng, lat);
        return { ...record, address }; // Add the address to the record
      })
    );
  }

  // Geocode using latitude and longitude
  geocodeCoordinates(lng: number, lat: number): Promise<string> {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=pk.eyJ1IjoiZ3VyamVldHYyIiwiYSI6ImNseWxiN3o5cDEzd3UyaXM0cmU3cm0zNnMifQ._-UTYeqo8cq1cH8vYy9Www`;

    return fetch(url)
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            `Error fetching geocode data: ${response.statusText}`
          );
        }
        return response.json();
      })
      .then((data) => {
        if (data.features && data.features.length > 0) {
          return data.features[0].place_name;
        } else {
          console.warn("No valid address found for coordinates:", lng, lat);
          return "";
        }
      })
      .catch((error) => {
        console.error("Error fetching address:", error);
        return "";
      });
  }

  // Add markers to the map for check-in/check-out records
  addMarkersToMap(recordsArray: any[]) {
    // Clear any existing markers
    this.clearMarkers();

    recordsArray.forEach((item, index) => {
      const imageUrl = item.image || "assets/images/users/avatar-1.jpg";

      // Create a marker element with employee image
      const markerElement = this.createMarkerElement(
        imageUrl,
        item.latestCheckStatus
      );

      // Create and add marker to the map
      const marker = new mapboxgl.Marker(markerElement)
        .setLngLat([item.longCheckIn, item.latCheckIn])
        .addTo(this.map);

      // Store marker for later use (e.g., when clicking on the employee list)
      this.markers.push(marker);

      // Attach a popup with the employee info
      const popupContent = `${item.name} <br> Checked in at ${item.checkInTime}`;

      this.attachPopup(marker, popupContent);
    });

    // Fit the map to include all markers
    this.fitMapToMarkers();
  }

  createMarkerElement(imageUrl: string, checkInStatus: any): HTMLElement {
    // Create a div element for the marker
    const el = document.createElement("div");
    el.className = "custom-marker";

    // Set styles for the marker
    el.style.width = "50px";
    el.style.height = "50px";
    el.style.borderRadius = "50%";
    el.style.overflow = "hidden";
    el.style.backgroundColor = "#ffffff";
    el.style.border =
      checkInStatus == "Check-in"
        ? "2px solid rgb(13 169 0)"
        : "2px solid rgb(255 58 0)";

    const img = document.createElement("img");
    img.src = imageUrl || "path/to/default-image.jpg";
    img.alt = "Employee Image";
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.objectFit = "cover";

    el.appendChild(img);

    return el;
  }

  // Attach a popup to a given marker
  attachPopup(marker: mapboxgl.Marker, content: string) {
    const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(content);
    marker.setPopup(popup);
  }

  // Adjust the map to fit all the markers
  fitMapToMarkers() {
    if (this.markers.length === 0) return;

    const bounds = new mapboxgl.LngLatBounds();
    this.markers.forEach((marker) => {
      bounds.extend(marker.getLngLat());
    });

    // Fit the map to the bounds with padding
    this.map.fitBounds(bounds, {
      padding: { top: 50, bottom: 50, left: 50, right: 50 },
      maxZoom: 15,
    });
  }

  // Clear all existing markers from the map
  clearMarkers() {
    this.markers.forEach((marker) => marker.remove());
    this.markers = [];
  }

  // Handle clicks on employee list to pop out corresponding marker
  onEmployeeClick(index: number) {
    const marker = this.markers[index];
    if (marker) {
      this.map.flyTo({
        center: marker.getLngLat(),
        zoom: 13,
      });
      marker.togglePopup(); // Show the popup
    }
  }

  handleError(error: any) {
    console.error(error);
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

  // Chart Colors Set+
  private getChartColorsArray(colors: any) {
    colors = JSON.parse(colors);
    return colors.map(function (value: any) {
      var newValue = value.replace(" ", "");
      if (newValue.indexOf(",") === -1) {
        var color = getComputedStyle(document.documentElement).getPropertyValue(
          newValue
        );
        if (color) {
          color = color.replace(" ", "");
          return color;
        } else return newValue;
      } else {
        var val = value.split(",");
        if (val.length == 2) {
          var rgbaColor = getComputedStyle(
            document.documentElement
          ).getPropertyValue(val[0]);
          rgbaColor = "rgba(" + rgbaColor + "," + val[1] + ")";
          return rgbaColor;
        } else {
          return newValue;
        }
      }
    });
  }

  private _basicChart(colors: any) {
    colors = this.getChartColorsArray(colors);

    // Safeguard in case weeklyAttendanceData is not defined or empty
    if (!this.weeklyAttendanceData) {
      this.weeklyAttendanceData = {
        present: [],
        absent: [],
        onLeave: [],
      };
    }

    // Initialize the basicChart data
    this.basicChart = {
      series: [
        {
          name: "Present",
          data: this.weeklyAttendanceData.present,
        },
        {
          name: "Absent",
          data: this.weeklyAttendanceData.absent,
        },
        {
          name: "On Leave",
          data: this.weeklyAttendanceData.onLeave,
        },
      ],
      chart: {
        height: 350,
        type: "bar",
        toolbar: {
          show: false,
        },
        animations: {
          enabled: true,
          easing: "easeinout",
          speed: 800,
          animateGradually: {
            enabled: true,
            delay: 150,
          },
          dynamicAnimation: {
            enabled: true,
            speed: 350,
          },
        },
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: "45%",
        },
      },
      dataLabels: {
        enabled: false,
      },
      stroke: {
        show: true,
        width: 2,
        colors: ["transparent"],
      },
      colors: colors,
      xaxis: {
        categories: ["Mon", "Tue", "Wed", "Thur", "Fri", "Sat", "Sun"],
      },
      yaxis: {
        title: {
          text: "No. of employees",
        },
      },
      grid: {
        borderColor: "#f1f1f1",
      },
      fill: {
        opacity: 1,
      },
      tooltip: {
        y: {
          formatter: function (val: any) {
            return val + " employees";
          },
        },
      },
    };

    // Make sure chart is re-rendered after initialization
    setTimeout(() => {
      window.dispatchEvent(new Event("resize"));
    }, 300);
  }

  sortBy(weekOffset: number, sortLabel: string) {
    this.sortValue = sortLabel; // Update the label in the dropdown
    this.getWeeklyAttendanceData(weekOffset); // Fetch data with the new week offset
  }
  changeTab(tab: string) {
    this.currentTab = tab;
  }
}
