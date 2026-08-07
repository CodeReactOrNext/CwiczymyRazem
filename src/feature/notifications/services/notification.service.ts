import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "utils/firebase/client/firebase.utils";

type NotificationType =
  | "like"
  | "comment"
  | "reaction"
  | "season_reward"
  | "season_start"
  | "marketplace_sold"
  | "playlist_saved"
  | "playlist_liked"
  | "exercise_thanked"
  | "exercise_completed";

export interface AppNotification {
  id: string;
  userId: string; // Recipient
  type: NotificationType;
  senderId?: string;
  senderName?: string;
  senderAvatarUrl?: string | null;
  senderFrame?: number;
  recordingId?: string;
  recordingTitle?: string;
  // Season reward fields
  fameAwarded?: number;
  place?: number;
  seasonId?: string;
  // Marketplace sale fields
  itemName?: string;
  itemImageId?: number | string;
  itemType?: "guitar" | "effect";
  itemRarity?: string;
  // Playlist save/like fields
  playlistId?: string;
  playlistName?: string;
  // Community exercise thank/completion fields
  exerciseId?: string;
  exerciseTitle?: string;
  timestamp: any;
  isRead: boolean;
}

const addNotification = async (
  notification: Omit<AppNotification, "id" | "timestamp" | "isRead">,
) => {
  // Basic avoid self-notification
  if (notification.userId === notification.senderId) return;

  await addDoc(collection(db, "notifications"), {
    ...notification,
    isRead: false,
    timestamp: serverTimestamp(),
  });
};

export const placeSuffix = (place: number) => {
  if (place === 1) return "st";
  if (place === 2) return "nd";
  if (place === 3) return "rd";
  return "th";
};

/** Where (if anywhere) a notification deep-links to when opened. */
export const notificationHref = (n: AppNotification): string | null => {
  if (n.type === "marketplace_sold") return "/arsenal?tab=market";
  if (
    (n.type === "playlist_saved" || n.type === "playlist_liked") &&
    n.playlistId
  )
    return `/songs?view=playlists&playlistId=${n.playlistId}`;
  if (n.type === "exercise_thanked" || n.type === "exercise_completed")
    return "/profile/skills?tab=community";
  return null;
};

/** Plain-text title/body for surfaces that can't render the bell's JSX labels (OS notifications, emails). */
export const notificationText = (
  n: AppNotification,
): { title: string; body: string } => {
  const sender = n.senderName ? `${n.senderName} ` : "";
  switch (n.type) {
    case "like":
      return {
        title: "New like",
        body: `${sender}liked your recording${n.recordingTitle ? ` "${n.recordingTitle}"` : ""}`,
      };
    case "comment":
      return {
        title: "New comment",
        body: `${sender}commented on your recording${n.recordingTitle ? ` "${n.recordingTitle}"` : ""}`,
      };
    case "reaction":
      return {
        title: "You got motivated!",
        // Reactions recorded before the amount was stored can't report one, so they stay silent
        // about it rather than quoting a number that was never actually awarded.
        body: `${sender}motivated you${n.fameAwarded ? ` and gave you +${n.fameAwarded}` : ""}`,
      };
    case "season_reward":
      return {
        title: "Season reward",
        body: `You earned ${n.fameAwarded} fame for ${n.place}${placeSuffix(n.place ?? 0)} place!`,
      };
    case "season_start":
      return {
        title: "New season!",
        body: "A new season has started! Start practicing and fight for top 5.",
      };
    case "marketplace_sold":
      return {
        title: "Item sold",
        body: `${sender}bought your ${n.itemName ?? "item"} for +${n.fameAwarded}`,
      };
    case "playlist_saved":
      return {
        title: "Playlist saved",
        body: `${sender}saved your playlist${n.playlistName ? ` "${n.playlistName}"` : ""} — you got +${n.fameAwarded}`,
      };
    case "playlist_liked":
      return {
        title: "Playlist liked",
        body: `${sender}liked your playlist${n.playlistName ? ` "${n.playlistName}"` : ""} — you got +${n.fameAwarded}`,
      };
    case "exercise_thanked":
      return {
        title: "Thanks!",
        body: `${sender}thanked you for ${n.exerciseTitle ?? "your exercise"} — you got +${n.fameAwarded}`,
      };
    case "exercise_completed":
      return {
        title: "Exercise practiced",
        body: `${sender}practiced your exercise${n.exerciseTitle ? ` "${n.exerciseTitle}"` : ""} — you got +${n.fameAwarded}`,
      };
    default:
      return {
        title: "Riff Quest",
        body: "You have new activity on Riff Quest.",
      };
  }
};

export const markNotificationAsRead = async (notificationId: string) => {
  const notificationRef = doc(db, "notifications", notificationId);
  await updateDoc(notificationRef, { isRead: true });
};

export const markAllNotificationsAsRead = async (userId: string) => {
  const q = query(
    collection(db, "notifications"),
    where("userId", "==", userId),
    where("isRead", "==", false),
  );
  const snapshot = await getDocs(q);

  const batch = writeBatch(db);
  snapshot.docs.forEach((doc) => {
    batch.update(doc.ref, { isRead: true });
  });

  await batch.commit();
};
