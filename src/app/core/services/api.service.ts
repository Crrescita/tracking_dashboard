import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "src/environments/environment";
import { map, shareReplay, catchError } from "rxjs/operators";
import { Subject, of } from "rxjs"; // Add 'of' import here
import { tap } from "rxjs/operators";

@Injectable({ providedIn: "root" })
// interface CacheEntry {
//   data: Observable<any>;
//   expiry: number;
// }
export class ApiService {
  cache: { [key: string]: any } = {};
  cacheDuration = 2 * 60 * 1000;
  apiUrl = environment.apiUrl;

  private headers = new HttpHeaders({
    "Content-Type": "application/json; charset=utf-8",
  });
  constructor(private http: HttpClient) {
    const accessToken = localStorage.getItem("access_token");
    const userType = localStorage.getItem("userType");
    if (accessToken) {
      this.headers = this.headers.set("access_token", `Bearer ${accessToken}`);
      this.headers = this.headers.set("userType", `${userType}`);
    }
  }

  /***
   * Get
   */
  fetchBannerSection(token: String, id: number): Observable<any> {
    const httpOptions = {
      headers: new HttpHeaders({
        "Content-Type": "application/json",
        Authorization: "Auth " + token,
      }),
    };
    return this.http.get(this.apiUrl + "homebanner/" + id, httpOptions);
  }

  updateData(url: any, updatedData: any): Observable<any[]> {
    this.cache = {};
    return this.http.put<any[]>(this.apiUrl, updatedData);
  }

  deleteData(url: any): Observable<void> {
    this.cache = {};
    return this.http.delete<void>(url);
  }

  put(apiName: any, id: number, data: any): Observable<any> {
    const url = `${this.apiUrl + apiName}/${id}`;
    this.cache = {};
    return this.http.put<any>(url, data);
  }

  postwithid(apiName: any, id: number, data: any): Observable<any> {
    const url = `${this.apiUrl + apiName}/${id}`;
    return this.http.post<any>(url, data);
  }

  post(apiName: any, data: any): Observable<any> {
    const url = `${this.apiUrl + apiName}`;
    this.cache = {};
    return this.http.post<any>(url, data);
  }
  get(apiName: any, id: any): Observable<any> {
    const url = `${this.apiUrl + apiName}/${id}`;
    return this.http.get<any>(url);
  }

  // getwithoutid(apiName: any): Observable<any> {
  //   const url = `${this.apiUrl + apiName}`;
  //   return this.http.get<any>(url);
  // }

  getwithoutid(apiName: any): Observable<any> {
    const url = `${this.apiUrl + apiName}`;
    const now = Date.now();

    if (this.cache[url] && now - this.cache[url].expiry < this.cacheDuration) {
      // console.log("Serving data from cache:", this.cache[url].data);
      return this.cache[url].data;
    }

    // console.log("Fetching new data from API");

    // Fetch new data and update cache
    const observable = this.http.get(url).pipe(
      shareReplay(1),
      tap((data) => {
        this.cache[url] = {
          data: of(data), // Store observable in cache
          expiry: now + this.cacheDuration,
        };
        // console.log("New data cached:", data);
      }),
      catchError((error) => {
        delete this.cache[url];
        return of(error);
      })
    );

    this.cache[url] = {
      data: observable,
      expiry: now + this.cacheDuration,
    };

    return observable;
  }

  clearCache() {
    this.cache = {};
  }

  deleteWithId(apiName: any, id: number): Observable<any> {
    const url = `${this.apiUrl + apiName}/${id}`;
    this.cache = {};
    return this.http.delete<any>(url);
  }
}
