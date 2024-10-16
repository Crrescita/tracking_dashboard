import {
  Component,
  OnInit,
  Input,
  SimpleChanges,
  OnChanges,
} from "@angular/core";
import * as mapboxgl from "mapbox-gl";
import { ApiService } from "../../../../core/services/api.service";
import { ActivatedRoute } from "@angular/router";

@Component({
  selector: "app-live-location",
  templateUrl: "./live-location.component.html",
  styleUrl: "./live-location.component.scss",
})
export class LiveLocationComponent implements OnInit {
  @Input() companyId!: string;
  @Input() emp_image!: string;
  @Input() employeeChange: any;
  urlId: number | null = null;
  livemap!: mapboxgl.Map;
  marker!: mapboxgl.Marker;

  selectedDate: Date = new Date();
  formattedDate: any;

  liveCoordinates: any;
  spinnerStatus: boolean = false;
  isRotatinglive = false;

  private refreshInterval = 30000;
  private liveLocationTimeout: any;

  constructor(private api: ApiService, private route: ActivatedRoute) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes["employeeChange"] &&
      !changes["employeeChange"].isFirstChange()
    ) {
      const newUrlId = changes["employeeChange"].currentValue;

      this.urlId = newUrlId;

      this.scheduleNextUpdate();
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
    this.selectedDate = new Date();

    if (this.selectedDate) {
      this.formattedDate = this.formatDate(this.selectedDate);
    }

    this.route.params.subscribe((params) => {
      this.urlId = params["id"] ? Number(params["id"]) : null;
    });
    if (this.companyId) {
      this.scheduleNextUpdate();
    }
    this.initializeMap();
  }

  refreshTimeline() {
    this.isRotatinglive = true;
    this.getLiveLocation();
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
        this.scheduleNextUpdate();
      },
      (error) => {
        this.toggleSpinner(false);
        this.handleError(
          error.message || "An error occurred while fetching data"
        );
        this.scheduleNextUpdate();
      }
    );
  }

  private scheduleNextUpdate() {
    this.liveLocationTimeout = setTimeout(() => {
      this.getLiveLocation();
    }, this.refreshInterval);
  }

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
      const address = await this.geocodeCoordinates(
        coordinates.longitude,
        coordinates.latitude
      );

      const popup = new mapboxgl.Popup({ offset: 25 }).setText(
        `Address: ${address}\nMotion: ${coordinates.motion}`
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
}
