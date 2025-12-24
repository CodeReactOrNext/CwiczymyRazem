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
            className="flex h-7 w-7 items-center justify-center rounded-lg border text-[10px] font-black shadow-lg backdrop-blur-xl"
            style={{
                borderColor: `${tier.color}40`,
                backgroundColor: `rgba(10, 10, 10, 0.9)`,
                color: tier.color,
            }}
        >
            {tier.tier}
        </div>
    );
};
