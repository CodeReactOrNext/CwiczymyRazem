import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "utils/firebase/client/firebase.utils";
import type { SeasonDataInterface } from "types/api.types";

export const getCurrentSeason = async () => {
  try {
    const now = new Date();
    const seasonId = `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, "0")}`;

    const seasonRef = doc(db, "seasons", seasonId);
    const seasonDoc = await getDoc(seasonRef);

    if (!seasonDoc.exists()) {
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const seasonData = {
        seasonId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        isActive: true,
        name: `Season ${seasonId}`,
      };

      await setDoc(seasonRef, seasonData);
      return seasonData;
    }

    return { seasonId, ...seasonDoc.data() } as SeasonDataInterface;
  } catch (error) {
    throw error;
  }
};
