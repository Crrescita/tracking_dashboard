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
  get(apiName: any, id: any, params?: any): Observable<any> {
    let url = `${this.apiUrl + apiName}/${id}`;
    if (params) {
      const queryParams = new URLSearchParams(params).toString();
      url += `?${queryParams}`;
    }

    return this.http.get<any>(url);
  }

  getwithoutcache(apiName: any): Observable<any> {
    const url = `${this.apiUrl + apiName}`;
    return this.http.get<any>(url);
  }

  getwithoutid(apiName: any): Observable<any> {
    const url = `${this.apiUrl + apiName}`;
    const now = Date.now();

    if (this.cache[url] && now - this.cache[url].expiry < this.cacheDuration) {
      return this.cache[url].data;
    }

    const observable = this.http.get(url).pipe(
      shareReplay(1),
      tap((data) => {
        this.cache[url] = {
          data: of(data),
          expiry: now + this.cacheDuration,
        };
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

  // getwithoutid(apiName: any): Observable<any> {
  //   const url = `${this.apiUrl}${apiName}`;
  //   const now = Date.now();

  //   // Check if the cache exists and is still valid
  //   if (this.cache[url] && now < this.cache[url].expiry) {
  //     // Return the cached data
  //     return of(this.cache[url].data); // Emit cached data as an observable
  //   }

  //   // Fetch new data from the API
  //   return this.http.get(url).pipe(
  //     shareReplay(1),
  //     tap((data) => {
  //       // Update the cache with new data and set the expiry
  //       this.cache[url] = {
  //         data: data, // Store the raw data, not the observable
  //         expiry: now + this.cacheDuration,
  //       };
  //     }),
  //     catchError((error) => {
  //       // Handle the error
  //       delete this.cache[url]; // Optionally clear the cache on error
  //       return of(error); // Return the error as observable
  //     })
  //   );
  // }

  clearCache() {
    this.cache = {};
  }

  deleteWithId(apiName: any, id: number): Observable<any> {
    const url = `${this.apiUrl + apiName}/${id}`;
    this.cache = {};
    return this.http.delete<any>(url);
  }
}
