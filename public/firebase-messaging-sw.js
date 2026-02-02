importScripts("https://www.gstatic.com/firebasejs/9.13.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.13.0/firebase-messaging-compat.js");

// Initialize the Firebase app in the service worker by passing in the
// messagingSenderId.
firebase.initializeApp({
  apiKey: "ignored-by-service-worker",
  authDomain: "ignored-by-service-worker",
  projectId: "ignored-by-service-worker",
  storageBucket: "ignored-by-service-worker",
  messagingSenderId: "700690997105", 
  appId: "ignored-by-service-worker",
});

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log(
    "[firebase-messaging-sw.js] Received background message ",
    payload
  );
  // Customize notification here
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: "/icons/icon-192x192.png", // Assuming this exists or similar
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
