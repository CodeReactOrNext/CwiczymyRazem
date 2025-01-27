import type { Song } from "feature/songs/types/songs.type";

export const getAverageDifficulty = (difficulties: Song["difficulties"]) => {
  if (!difficulties?.length) return 0;
  return (
    difficulties.reduce((acc, curr) => acc + curr.rating, 0) /
    difficulties.length
  );
};
