import { cn } from "assets/lib/utils";

import type { GuitarRarity } from "../types/arsenal.types";
import { RARITY_STYLES } from "./RarityBadge";

interface LevelEmblemProps {
  level: number;
  rarity: GuitarRarity;
  size?: number;
  /** Muted treatment for the "before" half of a before → after pair. */
  dimmed?: boolean;
  title?: string;
  className?: string;
}

/**
 * The rarity-ringed level badge from the item cards.
 *
 * Shared rather than copied so the workshop's before → after preview shows the
 * player the exact emblem they will see on the card afterwards — a different
 * shape for the same number would read as a different stat.
 */
export const LevelEmblem = ({
  level,
  rarity,
  size = 38,
  dimmed = false,
  title,
  className,
}: LevelEmblemProps) => {
  const rs = RARITY_STYLES[rarity];

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-full",
        className,
      )}
      style={{
        width: size,
        height: size,
        background: "radial-gradient(circle at 50% 35%, #1c1c22, #0d0d10)",
        border: `1.5px solid ${dimmed ? "#3f3f46" : rs.baseColor}`,
        boxShadow: dimmed
          ? "inset 0 0 6px rgba(0,0,0,0.6)"
          : `0 0 10px ${rs.baseColor}55, inset 0 0 6px rgba(0,0,0,0.6)`,
        opacity: dimmed ? 0.65 : 1,
      }}
      title={title}>
      <span
        className={cn(
          "font-black leading-none",
          dimmed ? "text-zinc-400" : "text-white",
        )}
        style={{ fontSize: Math.round(size * 0.39) }}>
        {level}
      </span>
    </div>
  );
};
