import { getTierFromDifficulty } from "./difficulty.utils";

export interface SongTier {
  tier: 'S' | 'A' | 'B' | 'C' | 'D' | '?';
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
}

export const getSongTier = (ratingOrTier: number | string): SongTier => {
  const tier = typeof ratingOrTier === 'string'
    ? ratingOrTier as 'S' | 'A' | 'B' | 'C' | 'D' | '?'
    : getTierFromDifficulty(ratingOrTier);

  switch (tier) {
    case 'S':
      return {
        tier: 'S',
        label: 'S-Tier',
        color: '#FF7F7F',
        bgColor: 'bg-red-500/15',
        borderColor: 'border-red-400/30',
        description: 'tier.legendary'
      };
    case 'A':
      return {
        tier: 'A',
        label: 'A-Tier',
        color: '#FFBF7F',
        bgColor: 'bg-orange-500/15',
        borderColor: 'border-orange-400/30',
        description: 'tier.expert'
      };
    case 'B':
      return {
        tier: 'B',
        label: 'B-Tier',
        color: '#FFFF7F',
        bgColor: 'bg-yellow-500/15',
        borderColor: 'border-yellow-400/30',
        description: 'tier.advanced'
      };
    case 'C':
      return {
        tier: 'C',
        label: 'C-Tier',
        color: '#7FFF7F',
        bgColor: 'bg-green-500/15',
        borderColor: 'border-green-400/30',
        description: 'tier.intermediate'
      };
    case 'D':
      return {
        tier: 'D',
        label: 'D-Tier',
        color: '#7FFFFF',
        bgColor: 'bg-blue-500/15',
        borderColor: 'border-blue-400/30',
        description: 'tier.beginner'
      };
    default:
      return {
        tier: '?',
        label: 'Unrated',
        color: '#A1A1AA',
        bgColor: 'bg-zinc-500/15',
        borderColor: 'border-zinc-400/30',
        description: 'tier.unrated'
      };
  }
};

let memoizedTiers: SongTier[] | null = null;

export const getAllTiers = (): SongTier[] => {
  if (memoizedTiers) return memoizedTiers;

  memoizedTiers = [
    getSongTier(10),
    getSongTier(8),
    getSongTier(6.5),
    getSongTier(5),
    getSongTier(2),
    getSongTier(0),
  ];

  return memoizedTiers;
};

