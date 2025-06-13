import { NgModule, isDevMode } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import {
  HttpClientModule,
  HttpClient,
  HTTP_INTERCEPTORS,
} from "@angular/common/http";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
// auth
import { AngularFireModule } from "@angular/fire/compat";
import { AngularFireMessagingModule } from "@angular/fire/compat/messaging";
import { AngularFireAuthModule } from "@angular/fire/compat/auth";
// Page Route
import { AppRoutingModule } from "./app-routing.module";
import { LayoutsModule } from "./layouts/layouts.module";
import { ToastrModule } from "ngx-toastr";

// Laguage
import { TranslateModule, TranslateLoader } from "@ngx-translate/core";
import { TranslateHttpLoader } from "@ngx-translate/http-loader";
// Store
import { StoreModule } from "@ngrx/store";
import { EffectsModule } from "@ngrx/effects";
import { StoreDevtoolsModule } from "@ngrx/store-devtools";
// component
import { AppComponent } from "./app.component";
import { AuthlayoutComponent } from "./authlayout/authlayout.component";
import { environment } from "src/environments/environment";
import { rootReducer } from "./store";
import { ErrorInterceptor } from "./core/helpers/error.interceptor";
import { JwtInterceptor } from "./core/helpers/jwt.interceptor";
import { AuthenticationEffects } from "./store/Authentication/authentication.effects";
import { initFirebaseBackend } from "./authUtils";
import { AuthInterceptor } from "./core/services/custom-pages/authconfig.interceptor";
import { ApiResponseInterceptor } from "./api-response.interceptor";
import { ServiceWorkerModule } from "@angular/service-worker";

export function createTranslateLoader(http: HttpClient): any {
  return new TranslateHttpLoader(http, "assets/i18n/", ".json");
}
if (environment.defaultauth === "firebase") {
  initFirebaseBackend(environment.firebaseConfig);
} else {
  // fakebackendInterceptor;
}

@NgModule({
  declarations: [AppComponent, AuthlayoutComponent],
  imports: [
    TranslateModule.forRoot({
      defaultLanguage: "en",
      loader: {
        provide: TranslateLoader,
        useFactory: createTranslateLoader,
        deps: [HttpClient],
      },
    }),
    StoreModule.forRoot(rootReducer),
    StoreDevtoolsModule.instrument({
      maxAge: 25, // Retains last 25 states
      logOnly: environment.production, // Restrict extension to log-only mode
    }),

    EffectsModule.forRoot([AuthenticationEffects]),
    AngularFireModule.initializeApp(environment.firebaseConfig),
    AngularFireMessagingModule,
    HttpClientModule,
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    LayoutsModule,
    ToastrModule.forRoot(),
    FormsModule,
    ReactiveFormsModule,
    AngularFireAuthModule,
    ServiceWorkerModule.register("ngsw-worker.js", {
      enabled: environment.production,
      // Register the ServiceWorker as soon as the application is stable
      // or after 30 seconds (whichever comes first).
      registrationStrategy: "registerWhenStable:30000",
    }),
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
    // {
    //   provide: HTTP_INTERCEPTORS,
    //   useClass: fakebackendInterceptor,
    //   multi: true,
    // },
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ApiResponseInterceptor,
      multi: true,
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
