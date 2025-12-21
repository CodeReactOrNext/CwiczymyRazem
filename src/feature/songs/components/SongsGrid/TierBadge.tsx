import { Song } from "feature/songs/types/songs.type";
import { getSongTier } from "feature/songs/utils/getSongTier";

interface TierBadgeProps {
    song: Song;
}

export const TierBadge = ({ song }: TierBadgeProps) => {
    const avgDifficulty = song.avgDifficulty || 0;
    const tier = getSongTier(avgDifficulty);

    return (
        <div 
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-xs font-black shadow-lg"
            style={{
                borderColor: `${tier.color}30`,
                backgroundColor: `${tier.color}10`,
                color: tier.color,
                boxShadow: `0 4px 12px ${tier.color}15`
            }}
        >
            {tier.tier}
        </div>
    );
};
