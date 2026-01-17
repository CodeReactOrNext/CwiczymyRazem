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

/**
 * Calculates a "Skill Power" score that rewards both peak difficulty 
 * and repertoire volume.
 * 
 * Formula: [ Sum(Top10_Difficulty_i * Weight_i) / Sum(Weights) ] + (TotalSongs * 0.02)
 */
export const calculateSkillPower = (learnedSongs: { avgDifficulty?: number }[]): number => {
  const songsWithDifficulty = learnedSongs
    .filter(s => (s.avgDifficulty || 0) > 0)
    .sort((a, b) => (b.avgDifficulty || 0) - (a.avgDifficulty || 0));

  if (songsWithDifficulty.length === 0) return 0;

  // 1. Weighted Peak (Top 10)
  const topN = songsWithDifficulty.slice(0, 10);
  let weightedSum = 0;
  let weightSum = 0;

  topN.forEach((song, index) => {
    const weight = 1 - index * 0.1; // 1.0, 0.9, 0.8 ... 0.1
    weightedSum += (song.avgDifficulty || 0) * weight;
    weightSum += weight;
  });

  const baseScore = weightedSum / weightSum;

  // 2. Volume Bonus (Reduced to 0.01)
  const volumeBonus = Math.min(learnedSongs.length * 0.01, 2.0);
  const rawPower = baseScore + volumeBonus;

  // 3. Tier Gating (New)
  // You cannot be in a Tier higher than what your hardest song suggests.
  // Example: Max diff 3.9 (D) -> Final power cannot be 4.0+ (C).
  const maxDiff = songsWithDifficulty[0].avgDifficulty || 0;

  let gateCeiling = 10;
  if (maxDiff < 4) gateCeiling = 4;
  else if (maxDiff < 6) gateCeiling = 6;
  else if (maxDiff < 7.5) gateCeiling = 7.5;
  else if (maxDiff < 9) gateCeiling = 9;

  // We allow the score to reach the *threshold* of the next tier but not cross it 
  // without a song from that tier. We use a tiny epsilon to keep it visual.
  return Math.min(rawPower, gateCeiling - 0.01);
};
