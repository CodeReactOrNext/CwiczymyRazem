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
      color: '#FFD700', // Gold
      bgColor: 'bg-yellow-500/20',
      borderColor: 'border-yellow-500/50',
      description: 'Legendarny'
    };
  } else if (rating >= 7.5) {
    return {
      tier: 'A',
      label: 'A-Tier',
      color: '#FF6B6B', // Red
      bgColor: 'bg-red-500/20',
      borderColor: 'border-red-500/50',
      description: 'Ekspertowy'
    };
  } else if (rating >= 6) {
    return {
      tier: 'B',
      label: 'B-Tier',
      color: '#4ECDC4', // Teal
      bgColor: 'bg-teal-500/20',
      borderColor: 'border-teal-500/50',
      description: 'Zaawansowany'
    };
  } else if (rating >= 4) {
    return {
      tier: 'C',
      label: 'C-Tier',
      color: '#45B7D1', // Blue
      bgColor: 'bg-blue-500/20',
      borderColor: 'border-blue-500/50',
      description: 'Średniozaawansowany'
    };
  } else {
    return {
      tier: 'D',
      label: 'D-Tier',
      color: '#96CEB4', // Green
      bgColor: 'bg-green-500/20',
      borderColor: 'border-green-500/50',
      description: 'Początkujący'
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

