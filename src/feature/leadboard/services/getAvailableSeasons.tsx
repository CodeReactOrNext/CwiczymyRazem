import { collection, getDocs } from "firebase/firestore";
import type { SeasonDataInterface } from "types/api.types";
import { db } from "utils/firebase/client/firebase.utils";

export const getAvailableSeasons = async () => {
  const seasonsRef = collection(db, "seasons");
  const seasonsSnapshot = await getDocs(seasonsRef);
  const seasons: SeasonDataInterface[] = [];

  seasonsSnapshot.forEach((doc) => {
    seasons.push(doc.data() as SeasonDataInterface);
  });

  return seasons.sort((a, b) => b.startDate.localeCompare(a.startDate));
};
