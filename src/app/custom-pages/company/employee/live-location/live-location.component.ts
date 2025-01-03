import {
  Component,
  OnInit,
  Input,
  SimpleChanges,
  OnChanges,
} from "@angular/core";
import * as mapboxgl from "mapbox-gl";
import { ApiService } from "../../../../core/services/api.service";
import { ActivatedRoute, Router } from "@angular/router";
import { ToastrService } from "ngx-toastr";
import { AuthService } from "../../../../core/services/custom-pages/auth.service";
import { Location } from "@angular/common";

@Component({
  selector: "app-live-location",
  templateUrl: "./live-location.component.html",
  styleUrl: "./live-location.component.scss",
})
export class LiveLocationComponent implements OnInit {
  breadCrumbItems!: Array<{}>;
  @Input() companyId!: string;
  @Input() emp_image!: string;
  @Input() employeeChange: any;
  urlId: number | null = null;
  livemap!: mapboxgl.Map;
  marker!: mapboxgl.Marker;
  employeeDetail: any;
  selectedDate: Date = new Date();
  formattedDate: any;
  address: any;
  selectedEmployeeId: number | null = null;
  liveCoordinates: any;
  spinnerStatus: boolean = false;
  isRotatinglive = false;
  employeeDataList: any = [];
  private refreshInterval = 30000;
  private liveLocationTimeout: any;

  constructor(
    private api: ApiService,
    private route: ActivatedRoute,
    private router: Router,
    public toastService: ToastrService,
    private authService: AuthService,
    private location: Location
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes["employeeChange"] &&
      !changes["employeeChange"].isFirstChange()
    ) {
      const newUrlId = changes["employeeChange"].currentValue;

      this.urlId = newUrlId;

      // this.scheduleNextUpdate();
    }
  }

  ngOnDestroy() {
    if (this.livemap) {
      this.livemap.remove();
    }
    if (this.liveLocationTimeout) {
      clearTimeout(this.liveLocationTimeout);
    }
  }

  ngOnInit(): void {
    this.breadCrumbItems = [
      { label: "Employee Management" },
      { label: "Live Location", active: true },
    ];

    const data = localStorage.getItem("currentUser");
    if (data) {
      const user = JSON.parse(data);
      this.companyId = user.id;
    }

    this.route.params.subscribe((params) => {
      this.urlId = params["id"] ? Number(params["id"]) : null;
    });

    this.selectedEmployeeId = this.urlId || this.employeeDataList[0]?.id;

    if (this.urlId && this.companyId) {
      this.getemployeeData();
      this.refreshTimeline();
      this.employeegetDataList();
    }

    // this.route.params.subscribe((params) => {
    //   this.urlId = params["id"] ? Number(params["id"]) : null;
    //   console.log(this.urlId);
    //   if (this.urlId) {
    //     this.selectedEmployeeId = this.urlId;
    //     this.employeegetDataList();
    //     this.getemployeeData();
    //     this.refreshTimeline();
    //   }
    // });

    this.authService.requestPermission();

    this.authService.receiveMessage();

    this.authService.currentMessage.subscribe((message) => {
      if (message) {
      }
    });

    this.selectedDate = new Date();

    if (this.selectedDate) {
      this.formattedDate = this.formatDate(this.selectedDate);
    }

    // if (this.companyId) {
    //   this.scheduleNextUpdate();
    // }
    this.initializeMap();
  }

  handleEmployeeChange(event: Event): void {
    const newEmployeeId = +(event.target as HTMLSelectElement).value; // Get new employee ID as a number

    if (newEmployeeId) {
      this.router.navigate([`/live-location/${newEmployeeId}`]);
      this.urlId = newEmployeeId;

      this.getemployeeData();
      this.refreshTimeline();
    }
  }

  getemployeeData() {
    this.toggleSpinner(true);
    this.api.get("employees", this.urlId).subscribe(
      (res: any) => {
        if (res && res.status) {
          this.toggleSpinner(false);
          this.employeeDetail = res.data[0];

          // this.companyId = this.employeeDetail.company_id;

          if (this.employeeDetail.image) {
            this.emp_image = this.employeeDetail.image;
          } else {
            this.emp_image = "assets/images/users/avatar-1.jpg";
          }
        } else {
          this.handleError("Unexpected response format");
        }
      },
      (error) => {
        this.handleError(
          error.message || "An error occurred while fetching data"
        );
      }
    );
  }

  employeegetDataList() {
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

  refreshTimeline() {
    this.isRotatinglive = true;
    this.requestLiveLocation();
    setTimeout(() => {
      this.isRotatinglive = false;
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
  }

  requestLiveLocation() {
    this.toggleSpinner(true);
    const fcm_token = localStorage.getItem("fcm_token");

    const url = `requestLiveLocation`;
    const data = {
      emp_id: this.urlId,
      fcm_token: fcm_token,
      type: 1,
    };
    this.api.post(url, data).subscribe(
      (res: any) => {
        this.toggleSpinner(false);
        if (res && res.status) {
          this.toastService.success("Location update Successfully");
          this.getLiveLocation();
          // setTimeout(() => {
          //   this.getLiveLocation();
          // }, 2000);
        }
      },
      (error) => {
        this.toggleSpinner(false);
        this.handleError(
          error.message || "An error occurred while fetching data"
        );
        // this.scheduleNextUpdate();
      }
    );
  }
  getLiveLocation() {
    this.toggleSpinner(true);
    const url = `getEmpLiveLocation?emp_id=${this.urlId}&company_id=${this.companyId}&date=${this.formattedDate}`;
    this.api.getwithoutid(url).subscribe(
      (res: any) => {
        this.toggleSpinner(false);
        if (res && res.status) {
          this.liveCoordinates = res.data;

          this.addMarkerToMap(this.liveCoordinates);
        } else {
          this.liveCoordinates = [];
        }
        // this.scheduleNextUpdate();
      },
      (error) => {
        this.toggleSpinner(false);
        this.handleError(
          error.message || "An error occurred while fetching data"
        );
        // this.scheduleNextUpdate();
      }
    );
  }

  // private scheduleNextUpdate() {
  //   this.liveLocationTimeout = setTimeout(() => {
  //     this.getLiveLocation();
  //   }, this.refreshInterval);
  // }

  handleError(error: any) {
    this.toggleSpinner(false);
    console.error(error);
  }

  initializeMap() {
    (mapboxgl as any).accessToken =
      "pk.eyJ1IjoiZ3VyamVldHYyIiwiYSI6ImNseWxiN3o5cDEzd3UyaXM0cmU3cm0zNnMifQ._-UTYeqo8cq1cH8vYy9Www";
    this.livemap = new mapboxgl.Map({
      container: "mapId",
      style: "mapbox://styles/mapbox/streets-v11",
      center: [78.22773895317802, 26.22052522541971],
      zoom: 5,
    });

    window.addEventListener("resize", () => {
      this.livemap.resize();
    });

    this.livemap.on("load", (event) => {
      this.livemap.resize();
    });

    this.livemap.addControl(new mapboxgl.NavigationControl());
  }

  async addMarkerToMap(coordinates: any) {
    if (!coordinates) return;

    const lngLat: [number, number] = [
      coordinates.longitude,
      coordinates.latitude,
    ];

    try {
      this.address = await this.geocodeCoordinates(
        coordinates.longitude,
        coordinates.latitude
      );

      // const popup = new mapboxgl.Popup({ offset: 25 }).setText(
      //   `Address: ${this.address}\Battery Percentage: ${coordinates.battery_status}`
      // );

      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(
        ` <p>Address: ${this.address}</p>
          <p>Battery Percentage: ${coordinates.battery_status}</p>
         `
      );

      // Create a DOM element for the marker
      const el = document.createElement("div");
      el.className = "custom-marker";
      el.style.backgroundImage = `url(${this.emp_image})`;
      el.style.width = "42px";
      el.style.height = "42px";
      el.style.backgroundSize = "100%";
      el.style.borderRadius = "50%";

      // new mapboxgl.Marker(el).setLngLat(lngLat).setPopup(popup).addTo(this.map);

      const marker = new mapboxgl.Marker(el)
        .setLngLat(lngLat)
        .setPopup(popup)
        .addTo(this.livemap);

      // Show the popup by default
      marker.togglePopup();

      // Center the map on the marker
      this.livemap.flyTo({ center: lngLat, zoom: 14 });
    } catch (error) {
      console.error("Error adding marker to map:", error);
    }
  }

  geocodeCoordinates(lng: number, lat: number): Promise<string> {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=pk.eyJ1IjoiZ3VyamVldHYyIiwiYSI6ImNseWxiN3o5cDEzd3UyaXM0cmU3cm0zNnMifQ._-UTYeqo8cq1cH8vYy9Www`;

    return fetch(url)
      .then((response) => response.json())
      .then((data) => {
        return data.features[0].place_name;
      })
      .catch((error) => {
        console.error("Error fetching address:", error);
        return "Unknown location";
      });
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

  goBack(): void {
    this.location.back();
  }
}
