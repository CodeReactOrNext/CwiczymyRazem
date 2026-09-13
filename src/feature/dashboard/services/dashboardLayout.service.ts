import type { DashboardLayout } from "feature/dashboard/types/dashboard.types";
import {
  DEFAULT_LAYOUT,
  normalizeLayout,
} from "feature/dashboard/utils/dashboardLayout";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "utils/firebase/client/firebase.utils";

/**
 * Home layout lives next to the other per-user preferences
 * (`settings/practiceLevels`, `settings/promptConfig`) — a small doc of its
 * own, so reading the profile never drags the layout along and vice versa.
 */
const docRef = (uid: string) => doc(db, "users", uid, "settings", "dashboard");

export const firebaseGetDashboardLayout = async (
  uid: string,
): Promise<DashboardLayout> => {
  const snap = await getDoc(docRef(uid));
  if (!snap.exists()) return normalizeLayout(DEFAULT_LAYOUT);
  return normalizeLayout(snap.data());
};

export const firebaseSaveDashboardLayout = async (
  uid: string,
  layout: DashboardLayout,
): Promise<void> => {
  await setDoc(
    docRef(uid),
    {
      version: layout.version,
      widgets: layout.widgets.map(({ id, size }) => ({ id, size })),
      shortcuts: [...layout.shortcuts],
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
};
