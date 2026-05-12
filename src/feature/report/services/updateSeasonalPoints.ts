import { getCurrentSeason } from "feature/leadboard/services/getCurrentSeason";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "utils/firebase/client/firebase.utils";

export const updateSeasonalPoints = async (
  userId: string,
  pointsDelta: number
) => {
  const season = await getCurrentSeason();
  const userSeasonRef = doc(db, "seasons", season.seasonId, "users", userId);
  const userSeasonDoc = await getDoc(userSeasonRef);

  const userDocRef = doc(db, "users", userId);
  const userDoc = await getDoc(userDocRef);
  const userData = userDoc.data();

  const currentSeasonData = userSeasonDoc.exists()
    ? userSeasonDoc.data()
    : {
      points: 0,
      sessionCount: 0,
      time: {
        creativity: 0,
        hearing: 0,
        technique: 0,
        theory: 0,
        longestSession: 0,
      },
      achievements: [],
    };

  await setDoc(userSeasonRef, {
    ...currentSeasonData,
    points: (currentSeasonData.points || 0) + pointsDelta,
    displayName: userData?.displayName || "Unknown User",
    avatar: userData?.avatar || "",
    selectedFrame: userData?.selectedFrame || 0,
    selectedGuitar: userData?.selectedGuitar || "",
    selectedGuitarYear: userData?.selectedGuitarYear || 0,
    selectedGuitarCountry: userData?.selectedGuitarCountry || "",
    seasonId: season.seasonId,
  }, { merge: true });
};
