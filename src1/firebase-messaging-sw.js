importScripts(
  "https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js"
);

// Initialize Firebase app in the service worker
firebase.initializeApp({
  apiKey: "AIzaSyCgv0M0OycO8Q5IclQ6Koe8CSSBnaRaJ9s",
  authDomain: "location-tracker-17a8e.firebaseapp.com",
  projectId: "location-tracker-17a8e",
  storageBucket: "location-tracker-17a8e.appspot.com",
  messagingSenderId: "691315287200",
  appId: "1:691315287200:web:975c7c891fdbc654c995c5",
  measurementId: "G-1BYNWW0039",
});

const messaging = firebase.messaging();

// Handle background message
messaging.onBackgroundMessage(function (payload) {
  console.log(
    "[firebase-messaging-sw.js] Received background message ",
    payload
  );
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: "/firebase-logo.png",
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
