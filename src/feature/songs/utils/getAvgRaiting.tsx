import { Song } from "utils/firebase/client/firebase.types";

export const getAverageDifficulty = (difficulties: Song["difficulties"]) => {
  if (!difficulties?.length) return 0;
  return (
    difficulties.reduce((acc, curr) => acc + curr.rating, 0) /
    difficulties.length
  );
};
