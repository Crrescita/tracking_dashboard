import { AuthService } from "src/app/core/services/custom-pages/auth.service";
import { Injectable } from "@angular/core";
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpResponse,
  HttpErrorResponse,
} from "@angular/common/http";
import { Observable, throwError } from "rxjs";
import { catchError, tap } from "rxjs/operators";
import { ToastrService } from "ngx-toastr";

@Injectable()
export class ApiResponseInterceptor implements HttpInterceptor {
  private is403MessageDisplayed = false;
  constructor(
    private toasterService: ToastrService,
    private authService: AuthService
  ) {}

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      tap((event: HttpEvent<any>) => {
        if (event instanceof HttpResponse) {
          // Handle successful responses here
          this.handleSuccessfulResponse(event);
        }
      }),
      catchError((error: HttpErrorResponse) => {
        this.handleApiError(error);
        return throwError(error);
      })
    );
  }

  private handleSuccessfulResponse(response: HttpResponse<any>) {
    // Modify the success message here
    // const modifiedMessage = 'Modified Success Message: ' + response.body.message;
    // Show the modified success message using the toaster
    // this.toasterService.error(modifiedMessage);
    if (
      response.body.status !== true &&
      response.body.hasOwnProperty("error")
    ) {
      this.toasterService.error("Error-" + response.body.error);
    }
  }

  // private handleApiError(error: HttpErrorResponse) {
  //   console.log("hits", error.status);
  //   if (error && error.status && error.status === 400) {
  //     // Example: Handle 400 Bad Request
  //     this.toasterService.error("Bad Request: " + error.error.message);
  //   } else if (error && error.status && error.status === 401) {
  //     // Example: Handle 401 Unauthorized
  //     this.toasterService.error("Unauthorized: " + error.error.message);
  //   } else if (error.status === 500) {
  //     // Example: Handle 500 Unauthorized
  //     this.toasterService.error("Opps: " + error.error.error.message);
  //   }
  //   if (error && error.status && error.status === 403) {
  //     if (!this.is403MessageDisplayed) {
  //       this.toasterService.error(error.error.message);
  //       this.authService.doLogout();
  //       this.is403MessageDisplayed = true;
  //     }
  //   } else {
  //     // Default handling for other errors
  //     this.toasterService.error(
  //       "API call failed: " + error.error.error.message
  //     );
  //   }
  // }
  private handleApiError(error: HttpErrorResponse) {
    if (error && error.status) {
      switch (error.status) {
        case 400:
          this.toasterService.error(
            error.error.error
              ? "Error: " + error.error.error
              : "Bad Request: " + (error.error.message || "Bad request")
          );
          break;
        case 401:
          this.toasterService.error(
            "Unauthorized: " + (error.error.message || "Unauthorized")
          );
          break;
        case 403:
          if (!this.is403MessageDisplayed) {
            this.toasterService.error(error.error.message || "Forbidden");
            this.authService.doLogout();
            this.is403MessageDisplayed = true;
          }
          break;
        case 500:
          // Checking both error.error.message and error.error.error.message for nested errors
          const errorMessage =
            error.error?.error?.message ||
            error.error?.message ||
            "Internal Server Error";
          this.toasterService.error("Oops: " + errorMessage);
          break;
        default:
          this.toasterService.error(
            "API call failed: " +
              (error.error?.error?.message || "Unknown error")
          );
      }
    } else {
      // Handle cases where error or error.status might be undefined

      this.toasterService.error("An unknown error occurred");
    }
  }
}
