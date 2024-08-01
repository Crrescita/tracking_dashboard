import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "src/environments/environment";

@Injectable({ providedIn: "root" })
export class ApiService {
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

  updateBannerSection(url: any, newData: any, id: number): Observable<any[]> {
    return this.http.patch<any[]>(this.apiUrl + "homebanner/" + id, newData);
  }

  updateData(url: any, updatedData: any): Observable<any[]> {
    return this.http.put<any[]>(this.apiUrl, updatedData);
  }

  deleteData(url: any): Observable<void> {
    return this.http.delete<void>(url);
  }

  put(apiName: any, id: number, data: any): Observable<any> {
    const url = `${this.apiUrl + apiName}/${id}`;
    return this.http.put<any>(url, data);
  }

  postwithid(apiName: any, id: number, data: any): Observable<any> {
    const url = `${this.apiUrl + apiName}/${id}`;
    return this.http.post<any>(url, data);
  }

  post(apiName: any, data: any): Observable<any> {
    console.log(data);
    const url = `${this.apiUrl + apiName}`;
    return this.http.post<any>(url, data);
  }
  get(apiName: any, id: any): Observable<any> {
    const url = `${this.apiUrl + apiName}/${id}`;
    return this.http.get<any>(url);
  }

  getwithoutid(apiName: any): Observable<any> {
    const url = `${this.apiUrl + apiName}`;
    return this.http.get<any>(url);
  }

  deleteWithId(apiName: any, id: number): Observable<any> {
    const url = `${this.apiUrl + apiName}/${id}`;
    return this.http.delete<any>(url);
  }

  // updateBannerSection(
  //   url: string,
  //   newData: any,
  //   id: number
  // ): Observable<any[]> {
  //   return this.http.patch<any[]>(`${this.apiUrl}homebanner/${id}`, newData, {
  //     headers: this.headers,
  //   });
  // }

  // updateData(url: string, updatedData: any): Observable<any[]> {
  //   return this.http.put<any[]>(this.apiUrl, updatedData, {
  //     headers: this.headers,
  //   });
  // }

  // deleteData(url: string): Observable<void> {
  //   return this.http.delete<void>(url, { headers: this.headers });
  // }

  // patch(apiName: string, id: number, data: any): Observable<any> {
  //   const url = `${this.apiUrl + apiName}/${id}`;
  //   return this.http.patch<any>(url, data, { headers: this.headers });
  // }

  // postwithid(apiName: string, id: number, data: any): Observable<any> {
  //   const url = `${this.apiUrl + apiName}/${id}`;
  //   return this.http.post<any>(url, data, { headers: this.headers });
  // }

  // post(apiName: string, data: any): Observable<any> {
  //   const url = `${this.apiUrl + apiName}`;
  //   return this.http.post<any>(url, data, { headers: this.headers });
  // }

  // get(apiName: string, id: any): Observable<any> {
  //   const url = `${this.apiUrl + apiName}/${id}`;
  //   return this.http.get<any>(url, { headers: this.headers });
  // }

  // getwithoutid(apiName: string): Observable<any> {
  //   const url = `${this.apiUrl + apiName}`;
  //   return this.http.get<any>(url, { headers: this.headers });
  // }

  // deleteWithId(apiName: string, id: number): Observable<any> {
  //   const url = `${this.apiUrl + apiName}/${id}`;
  //   return this.http.delete<any>(url, { headers: this.headers });
  // }
}
