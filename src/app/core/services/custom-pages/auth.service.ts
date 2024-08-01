import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { environment } from "src/environments/environment";
import { User } from "./user";
import { ToastrService } from "ngx-toastr";

@Injectable({
  providedIn: "root",
})
export class AuthService {
  apiUrl = environment.apiUrl;
  apifrontendUrl = environment.apifrontendUrl;
  headers = new HttpHeaders().set("Content-Type", "application/json");

  constructor(private http: HttpClient, public router: Router) {}

  // log-in
  logIn(user: User) {
    return this.http.post<any>(this.apiUrl + "login", user);
  }
  getToken() {
    return localStorage.getItem("access_token");
  }

  getuserType() {
    return localStorage.getItem("userType") || "";
  }

  isLoggedIn(): boolean {
    let authToken = localStorage.getItem("access_token");
    return authToken !== null ? true : false;
  }

  doLogout() {
    let removeToken = localStorage.removeItem("access_token");
    let removeCurrentUser = localStorage.removeItem("currentUser");
    if (removeToken == null && removeCurrentUser == null) {
      let user = localStorage.getItem("userType");
      if (user == "administrator") {
        this.router.navigate(["/auth/login"]);
      } else {
        this.router.navigate(["/auth/company-login"]);
      }
      localStorage.removeItem("userType");
    }
  }

  forgetPass(email: any) {
    return this.http.post<any>(this.apiUrl + "forgetPass", email);
  }

  resetPass(data: any) {
    return this.http.post<any>(this.apiUrl + "resetPass", data);
  }

  resetPassEmployee(data: any) {
    return this.http.post<any>(this.apifrontendUrl + "resetPassword", data);
  }

  updateProfileDetails(data: any) {
    return this.http.post<any>(this.apiUrl + "update_details", data);
  }

  updatePassword(data: any) {
    return this.http.post<any>(this.apiUrl + "update_password", data);
  }
}
