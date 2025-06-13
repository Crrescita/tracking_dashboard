import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable, Inject } from "@angular/core";
import { Router } from "@angular/router";
import { environment } from "src/environments/environment";
import { User } from "./user";
import { ToastrService } from "ngx-toastr";

// Firebase
import { AngularFireAuth } from "@angular/fire/compat/auth";
import firebase from "firebase/compat/app";
import { AngularFireMessaging } from "@angular/fire/compat/messaging";
import { SwUpdate, VersionReadyEvent } from "@angular/service-worker";
import { filter } from "rxjs/operators";
import { catchError, map, tap } from "rxjs/operators";
import { BehaviorSubject, Observable, of, throwError } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class AuthService {
  apiUrl = environment.apiUrl;
  apifrontendUrl = environment.apifrontendUrl;
  headers = new HttpHeaders().set("Content-Type", "application/json");
  currentMessage = new BehaviorSubject<any>(null);

  constructor(
    private http: HttpClient,
    public router: Router,
    private afAuth: AngularFireAuth,
    private messaging: AngularFireMessaging,
    private swUpdate: SwUpdate
  ) {
    if (this.swUpdate.isEnabled) {
      this.swUpdate.versionUpdates
        .pipe(
          filter(
            (event): event is VersionReadyEvent =>
              event.type === "VERSION_READY"
          )
        )
        .subscribe(() => {
          if (confirm("New version available. Load new version?")) {
            window.location.reload();
          }
        });
    }
    this.messaging.messages.subscribe((message: any) => {
      console.log("Foreground message received:", message);
      this.currentMessage.next(message);
    });
  }

  requestPermission() {
    return this.messaging.requestPermission.pipe(
      tap(() => console.log("Notification permission granted.")),
      catchError((error) => {
        console.error("Unable to get permission to notify.", error);
        return throwError(error);
      })
    );
  }

  // receiveMessage() {
  //   return this.messaging.messages;
  // }

  receiveMessage() {
    // Handle incoming messages here
    this.messaging.messages.subscribe((payload) => {
      console.log("Message received: ", payload);
      this.currentMessage.next(payload);
    });
  }

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
