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
            className={cn("flex h-8 w-8 items-center justify-center rounded-[4px] border text-xs font-black bg-zinc-900", className)}
            style={{
                borderColor: `${tier.color}30`,
                color: tier.color,
                ...style
            }}
        >
            {tier.tier}
        </div>
    );
};
