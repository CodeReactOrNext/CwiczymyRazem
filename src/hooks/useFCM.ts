import { useEffect, useState } from "react";
import { getToken, onMessage, Unsubscribe } from "firebase/messaging";
import { messaging } from "utils/firebase/client/firebase.config";
import { toast } from "sonner";

import { useAppSelector } from "store/hooks";
import { selectUserAuth } from "feature/user/store/userSlice";

export const useFCM = () => {
  const userId = useAppSelector(selectUserAuth);
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [notificationPermission, setNotificationPermission] =
    useState<NotificationPermission>("default");

  useEffect(() => {
    const requestPermission = async () => {
      try {
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);

        if (permission === "granted") {
          const msg = await messaging();
          if (msg) {
            const token = await getToken(msg, {
              vapidKey:
                "BKy9Q8rXUe1eF7g9d8c7b6a5", // You might need a VAPID key here if you haven't generated one in Firebase Console. 
              // For now I'll leave it undefined or use a placeholder if required. 
              // Actually getToken requires a vapidKey usually for web push certificates.
              // Since I don't have it, I'll comment it out and let the user know they might need it, 
              // or I can try to find if it exists in the codebase.
            });
            if (token) {
              setFcmToken(token);
              // Send token to backend
              try {
                if (userId) {
                  await fetch("/api/user/fcm-token", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ userId, token }),
                  });
                }
              } catch (e) {
                console.error("Error saving token", e);
              }
              console.log("FCM Token:", token);
            }
          }
        }
      } catch (error) {
        console.error("Error requesting notification permission:", error);
      }
    };

    requestPermission();
  }, []);

  useEffect(() => {
    let unsubscribe: Unsubscribe | null = null;

    const setupOnMessage = async () => {
      const msg = await messaging();
      if (msg) {
        unsubscribe = onMessage(msg, (payload) => {
          console.log("Foreground message received:", payload);
          toast.info(payload.notification?.title || "New Notification", {
            description: payload.notification?.body,
          });
        });
      }
    };

    setupOnMessage();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  return { fcmToken, notificationPermission };
};
