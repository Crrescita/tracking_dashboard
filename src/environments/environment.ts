// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  defaultauth: "fakebackend",
  apiUrl: "http://localhost:3000/admin/",
  // apifrontendUrl: "http://localhost:3000/frontend/",
  // apiUrl: "https://trackingapi.crrescita.com/admin/",
  apifrontendUrl: "https://trackingapi.crrescita.com/frontend/",
  // firebaseConfig: {
  //   apiKey: "AIzaSyCqS9cSPrDCNSQ-Ku2kZf5DBWjPPv7hvcA",
  //   authDomain: "test-demo-774f8.firebaseapp.com",
  //   databaseURL: "https://test-demo-774f8-default-rtdb.firebaseio.com",
  //   projectId: "test-demo-774f8",
  //   storageBucket: "test-demo-774f8.appspot.com",
  //   messagingSenderId: "916438010670",
  //   appId: "1:916438010670:web:c70cf404da6c0fe7b048bf",
  //   measurementId: "G-1N6FB2GG55",
  // },

  // working mine

  // firebaseConfig: {
  //   apiKey: "AIzaSyCgv0M0OycO8Q5IclQ6Koe8CSSBnaRaJ9s",
  //   authDomain: "location-tracker-17a8e.firebaseapp.com",
  //   projectId: "location-tracker-17a8e",
  //   storageBucket: "location-tracker-17a8e.appspot.com",
  //   messagingSenderId: "691315287200",
  //   appId: "1:691315287200:web:975c7c891fdbc654c995c5",
  //   measurementId: "G-1BYNWW0039",
  // },

  firebaseConfig: {
    apiKey: "AIzaSyCgv0M0OycO8Q5IclQ6Koe8CSSBnaRaJ9s",
    authDomain: "location-tracker-17a8e.firebaseapp.com",
    projectId: "location-tracker-17a8e",
    storageBucket: "location-tracker-17a8e.appspot.com",
    messagingSenderId: "691315287200",
    appId: "1:691315287200:web:975c7c891fdbc654c995c5",
    measurementId: "G-1BYNWW0039",
  },

  mapbox: {
    accessToken:
      "pk.eyJ1IjoiZ3VyamVldHYyIiwiYSI6ImNseW1sazg0cjAyOTEya3M3emFka24xbWUifQ.zNaqdcWcDsvtQz6g5xkdHg",
  },
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
import "zone.js/plugins/zone-error"; // Included with Angular CLI.
