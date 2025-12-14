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
      color: '#F59E0B', // Dark amber (warning)
      bgColor: 'bg-amber-500/15',
      borderColor: 'border-amber-400/30',
      description: 'tier.legendary'
    };
  } else if (rating >= 7.5) {
    return {
      tier: 'A',
      label: 'A-Tier',
      color: '#EF4444', // Dark red (error)
      bgColor: 'bg-red-500/15',
      borderColor: 'border-red-400/30',
      description: 'tier.expert'
    };
  } else if (rating >= 6) {
    return {
      tier: 'B',
      label: 'B-Tier',
      color: '#22D3EE', // Dark cyan (info)
      bgColor: 'bg-cyan-500/15',
      borderColor: 'border-cyan-400/30',
      description: 'tier.advanced'
    };
  } else if (rating >= 4) {
    return {
      tier: 'C',
      label: 'C-Tier',
      color: '#06B6D4', // Darker cyan (primary)
      bgColor: 'bg-cyan-600/15',
      borderColor: 'border-cyan-500/30',
      description: 'tier.intermediate'
    };
  } else {
    return {
      tier: 'D',
      label: 'D-Tier',
      color: '#10B981', // Dark emerald (success)
      bgColor: 'bg-emerald-500/15',
      borderColor: 'border-emerald-400/30',
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

