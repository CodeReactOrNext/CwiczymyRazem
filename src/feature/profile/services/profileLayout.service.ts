import type { ProfileLayoutConfig } from "feature/profile/types/profileLayout.types";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "utils/firebase/client/firebase.utils";

/**
 * Written onto the user document itself (not `settings/*`): visitors already
 * read that document to draw the profile, so the layout rides along for free.
 */
export const firebaseSaveProfileLayout = async (
  uid: string,
  layout: ProfileLayoutConfig,
): Promise<void> => {
  await updateDoc(doc(db, "users", uid), {
    profileLayout: {
      version: layout.version,
      sections: layout.sections.map(({ id, size }) => ({ id, size })),
      facts: [...layout.facts],
      badges: [...layout.badges],
      accent: layout.accent,
      tagline: layout.tagline,
      about: layout.about,
    },
  });
};
