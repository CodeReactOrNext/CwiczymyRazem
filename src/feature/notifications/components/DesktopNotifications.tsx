import { useAppNotifications } from "feature/notifications/hooks/useAppNotifications";
import {
  notificationHref,
  notificationText,
} from "feature/notifications/services/notification.service";
import { selectUserAuth } from "feature/user/store/userSlice";
import { useRouter } from "next/router";
import { useEffect, useRef } from "react";
import { useAppSelector } from "store/hooks";

/**
 * Desktop-shell glue, mounted once in _app (see components/ElectronIntegrations).
 * Renders nothing — on every change of the existing in-app notification feed
 * (feature/notifications/hooks/useAppNotifications, backed by a live Firestore
 * listener), pops a native OS toast for items that just arrived. No-op on the
 * web build, where `window.electronApp` is undefined; the bell dropdown
 * already covers that surface there.
 */
export const DesktopNotifications = () => {
  const userId = useAppSelector(selectUserAuth);
  const { notifications, markAsRead } = useAppNotifications(userId);
  const router = useRouter();
  // null until the first snapshot is seen — that snapshot seeds the set
  // instead of firing a toast burst for pre-existing unread history.
  const seenIds = useRef<Set<string> | null>(null);

  useEffect(() => {
    seenIds.current = null;
  }, [userId]);

  useEffect(() => {
    if (!window.electronApp?.isAvailable || notifications.length === 0) return;

    if (seenIds.current === null) {
      seenIds.current = new Set(notifications.map((n) => n.id));
      return;
    }

    notifications.forEach((n) => {
      if (n.isRead || seenIds.current!.has(n.id)) return;
      seenIds.current!.add(n.id);

      const { title, body } = notificationText(n);
      const toast = new Notification(title, {
        body,
        icon: "/favicon/android-chrome-192x192.png",
      });
      toast.onclick = () => {
        window.focus();
        markAsRead(n.id);
        const href = notificationHref(n);
        if (href) router.push(href);
      };
    });
  }, [notifications, router, markAsRead]);

  return null;
};
