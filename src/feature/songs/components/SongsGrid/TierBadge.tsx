import { cn } from "assets/lib/utils";
import type { Song } from "feature/songs/types/songs.type";
import { getSongTier } from "feature/songs/utils/getSongTier";

interface TierBadgeProps {
    song?: Song;
    difficulty?: number;
    className?: string;
    style?: React.CSSProperties;
}

export const TierBadge = ({ song, difficulty, className, style }: TierBadgeProps) => {
    const avgDifficulty = difficulty ?? song?.avgDifficulty ?? 0;
    const tier = getSongTier(avgDifficulty === 0 ? "?" : (song?.tier || avgDifficulty));

    return (
        <div 
            className={cn("flex h-7 w-7 items-center justify-center rounded-lg border text-[10px] font-black shadow-lg backdrop-blur-xl", className)}
            style={{
                borderColor: `${tier.color}40`,
                backgroundColor: `rgba(10, 10, 10, 0.9)`,
                color: tier.color,
                ...style
            }}
        >
            {tier.tier}
        </div>
    );
};
