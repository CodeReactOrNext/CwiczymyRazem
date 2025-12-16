export interface SongTier {
  tier: 'S' | 'A' | 'B' | 'C' | 'D';
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
}

export const getSongTier = (rating: number): SongTier => {
  if (rating >= 9) {
    return {
      tier: 'S',
      label: 'S-Tier',
      color: '#FF7F7F', // Red
      bgColor: 'bg-red-500/15',
      borderColor: 'border-red-400/30',
      description: 'tier.legendary'
    };
  } else if (rating >= 7.5) {
    return {
      tier: 'A',
      label: 'A-Tier',
      color: '#FFBF7F', // Orange
      bgColor: 'bg-orange-500/15',
      borderColor: 'border-orange-400/30',
      description: 'tier.expert'
    };
  } else if (rating >= 6) {
    return {
      tier: 'B',
      label: 'B-Tier',
      color: '#FFFF7F', // Yellow
      bgColor: 'bg-yellow-500/15',
      borderColor: 'border-yellow-400/30',
      description: 'tier.advanced'
    };
  } else if (rating >= 4) {
    return {
      tier: 'C',
      label: 'C-Tier',
      color: '#7FFF7F', // Green
      bgColor: 'bg-green-500/15',
      borderColor: 'border-green-400/30',
      description: 'tier.intermediate'
    };
  } else {
    return {
      tier: 'D',
      label: 'D-Tier',
      color: '#7FFFFF', // Blue
      bgColor: 'bg-blue-500/15',
      borderColor: 'border-blue-400/30',
      description: 'tier.beginner'
    };
  }
};

export const getAllTiers = (): SongTier[] => {
  return [
    getSongTier(10), // S-Tier
    getSongTier(8),  // A-Tier
    getSongTier(6.5), // B-Tier
    getSongTier(5),  // C-Tier
    getSongTier(2),  // D-Tier
  ];
};

