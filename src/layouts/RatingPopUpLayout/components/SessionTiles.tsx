import { cn } from "assets/lib/utils";
import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface SessionTileProps {
  label: string;
  value: ReactNode;
  /** What is being counted, beside the number. */
  icon: ReactNode;
  tone?: "points" | "fame" | "plain";
  index: number;
}

const TONE = {
  points: { frame: "bg-cyan-400", label: "text-zinc-950", value: "text-cyan-400" },
  fame: { frame: "bg-amber-400", label: "text-zinc-950", value: "text-amber-400" },
  plain: { frame: "bg-zinc-700", label: "text-zinc-100", value: "text-zinc-100" },
} as const;

/** A solid frame in the number's own colour, its name on the band and the number on the dark face. */
const SessionTile = ({ label, value, icon, tone = "plain", index }: SessionTileProps) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ type: "spring", stiffness: 320, damping: 20, delay: 0.15 + index * 0.12 }}
    className={cn("flex min-w-0 flex-col rounded-lg p-1 pt-0 text-center", TONE[tone].frame)}>
    <span className={cn("truncate px-2 py-1.5 text-sm font-bold sm:text-base shortwide:py-1 shortwide:text-sm", TONE[tone].label)}>{label}</span>
    <div className='flex flex-1 flex-col items-center justify-center gap-2 rounded bg-zinc-950 px-2 py-4 sm:flex-row sm:gap-3 sm:py-6 shortwide:flex-row shortwide:gap-3 shortwide:py-2.5'>
      <span className='h-8 w-8 shrink-0 sm:h-10 sm:w-10 shortwide:h-8 shortwide:w-8'>{icon}</span>
      {/* Teko's digits sit high in their line; the padding centres them on the icon. */}
      <span
        className={cn(
          "flex items-baseline gap-1 pt-[0.15em] font-teko text-5xl font-semibold leading-[0.85] tabular-nums sm:text-6xl shortwide:text-5xl",
          TONE[tone].value,
        )}>
        {value}
      </span>
    </div>
  </motion.div>
);

interface SessionTilesProps {
  tiles: Omit<SessionTileProps, "index">[];
}

/** What the session came to: its numbers side by side, each in its own colour. */
export const SessionTiles = ({ tiles }: SessionTilesProps) => (
  <div className='grid w-full gap-2.5 sm:gap-4' style={{ gridTemplateColumns: `repeat(${tiles.length}, minmax(0, 1fr))` }}>
    {tiles.map((tile, index) => (
      <SessionTile key={tile.label} {...tile} index={index} />
    ))}
  </div>
);

/** A duration as big digits with small units, so the number leads and "min" follows. */
export const TileTime = ({ minutes }: { minutes: number }) => {
  const hours = Math.floor(minutes / 60);
  const unit = "text-xl font-medium text-zinc-400 sm:text-3xl shortwide:text-2xl";
  return (
    <>
      {hours > 0 && (
        <>
          {hours}
          <span className={unit}>h</span>
        </>
      )}
      {minutes % 60}
      <span className={unit}>min</span>
    </>
  );
};
