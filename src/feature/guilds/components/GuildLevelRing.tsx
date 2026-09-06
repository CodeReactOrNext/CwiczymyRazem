import { cn } from "assets/lib/utils";
import { GUILD_LAP_SIZE } from "feature/guilds/data/guildQuests";

/**
 * The guild's level as a ring: the number in the middle, and around it how far
 * through the current lap of fifty quests the guild is.
 *
 * Worn on the top-right corner of the banner, where a level sits on a card in
 * every game a member has played, so it needs no label to be read as one. The
 * ring's arc is worked out from the level alone — laps clear in order, so the
 * level modulo fifty is exactly how many quests of the current lap are done —
 * which is what lets the same ring go on a card in the guild list, where only
 * the guild document is to hand.
 */
export const GuildLevelRing = ({
  level,
  size = 64,
  className,
}: {
  level: number;
  /** Diameter in pixels. Below 56 the "lvl" caption is dropped for room. */
  size?: number;
  className?: string;
}) => {
  const safe = Math.max(0, Math.floor(Number(level) || 0));
  const onLap = safe % GUILD_LAP_SIZE;
  const fraction = onLap / GUILD_LAP_SIZE;

  const stroke = size >= 56 ? 4 : 3;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const roomy = size >= 56;

  return (
    <div
      role='img'
      aria-label={`Guild level ${safe}, ${onLap} of ${GUILD_LAP_SIZE} quests cleared on this lap`}
      title={`Guild level ${safe} · ${onLap} of ${GUILD_LAP_SIZE} quests on this lap`}
      style={{ width: size, height: size }}
      className={cn(
        "relative flex shrink-0 items-center justify-center rounded-full bg-zinc-950/75",
        className,
      )}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        aria-hidden
        className='absolute inset-0 -rotate-90'>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill='none'
          stroke='rgba(255,255,255,0.08)'
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill='none'
          stroke='#22d3ee'
          strokeWidth={stroke}
          strokeLinecap='round'
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - fraction)}
          className='transition-[stroke-dashoffset] duration-500'
        />
      </svg>

      <span className='relative flex flex-col items-center leading-none'>
        {roomy && (
          <span className='text-[8px] font-semibold text-cyan-300/80'>lvl</span>
        )}
        <span
          className={cn(
            "font-bold tabular-nums text-zinc-100",
            roomy ? "mt-0.5 text-xl" : "text-sm",
          )}>
          {safe}
        </span>
      </span>
    </div>
  );
};
