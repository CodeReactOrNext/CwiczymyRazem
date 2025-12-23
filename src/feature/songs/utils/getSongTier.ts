import { getTierFromDifficulty } from "./difficulty.utils";

export interface SongTier {
  tier: 'S' | 'A' | 'B' | 'C' | 'D';
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
}

export const getSongTier = (rating: number): SongTier => {
  const tier = getTierFromDifficulty(rating);

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
    default:
      return {
        tier: 'D',
        label: 'D-Tier',
        color: '#7FFFFF',
        bgColor: 'bg-blue-500/15',
        borderColor: 'border-blue-400/30',
        description: 'tier.beginner'
      };
  }
};

export const getAllTiers = (): SongTier[] => {
  return [
    getSongTier(10),
    getSongTier(8),
    getSongTier(6.5),
    getSongTier(5),
    getSongTier(2),
  ];
};

