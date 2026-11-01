import { cn } from "assets/lib/utils";
import type { Song } from "feature/songs/types/songs.type";
import { getSongTier, getTierImage } from "feature/songs/utils/getSongTier";

type Tier = ReturnType<typeof getSongTier>;

interface TierPickProps {
    tier: Tier;
    className?: string;
    style?: React.CSSProperties;
}

/** The tier as a guitar-pick image; size it with h-/w- classes. */
export const TierPick = ({ tier, className, style }: TierPickProps) => (
    <img
        src={getTierImage(tier.tier)}
        alt={tier.label}
        draggable={false}
        className={cn("h-8 w-8 shrink-0 select-none object-contain", className)}
        style={style}
    />
);

interface TierBadgeProps {
    song?: Pick<Song, "tier" | "avgDifficulty">;
    difficulty?: number;
    className?: string;
    style?: React.CSSProperties;
}

export const TierBadge = ({ song, difficulty, className, style }: TierBadgeProps) => {
    const avgDifficulty = difficulty ?? song?.avgDifficulty ?? 0;
    const tier = getSongTier(avgDifficulty === 0 ? "?" : (song?.tier || avgDifficulty));

    return <TierPick tier={tier} className={className} style={style} />;
};
