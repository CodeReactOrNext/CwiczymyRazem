export interface DifficultyRating {
  rating: number;
}

export const calculateAverageDifficulty = (difficulties: DifficultyRating[]): number => {
  if (!difficulties?.length) return 0;
  return (
    difficulties.reduce((acc, curr) => acc + curr.rating, 0) /
    difficulties.length
  );
};

export const getTierFromDifficulty = (difficulty: number): string => {
  if (difficulty >= 9) return "S";
  if (difficulty >= 7.5) return "A";
  if (difficulty >= 6) return "B";
  if (difficulty >= 4) return "C";
  return "D";
};
