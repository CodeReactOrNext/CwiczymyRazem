import type { DashboardLayout } from "feature/dashboard/types/dashboard.types";
import { normalizeLayout } from "feature/dashboard/utils/dashboardLayout";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "utils/firebase/client/firebase.utils";

/**
 * Home layout lives next to the other per-user preferences
 * (`settings/practiceLevels`, `settings/promptConfig`) — a small doc of its
 * own, so reading the profile never drags the layout along and vice versa.
 */
const docRef = (uid: string) => doc(db, "users", uid, "settings", "dashboard");

/**
 * Null means the player has never saved a layout, which is not the same as
 * having saved the default one: Home picks the unsaved layout by how long the
 * account has been practising (see defaultLayoutFor).
 */
export const firebaseGetDashboardLayout = async (
  uid: string,
): Promise<DashboardLayout | null> => {
  const snap = await getDoc(docRef(uid));
  if (!snap.exists()) return null;
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
      customShortcuts: layout.customShortcuts.map(({ id, label, href }) => ({
        id,
        label,
        href,
      })),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
};
