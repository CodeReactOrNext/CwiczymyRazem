import { useTranslation } from "hooks/useTranslation";
import { getPointsToLvlUp } from "utils/gameLogic";

const RADIUS = 24;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * The player's level for the Home hero.
 *
 * `ring` — the same three lines as the Song tier and ELO beside it: label, a
 * 56px figure, then the value under it. The ring is drawn in palette colours so
 * it follows the light theme on its own.
 *
 * `bar` — for the strip under the hero's stage, where the level takes the room
 * the other two leave: the level and the XP on one line, the progress as a bar
 * across the whole width.
 */
export const HeroLevelStat = ({
  lvl,
  points,
  variant = "ring",
  barColor,
}: {
  lvl: number;
  points: number;
  variant?: "ring" | "bar";
  /** Fill of the bar when it is not the app's cyan — a profile's own accent. */
  barColor?: string;
}) => {
  const { t } = useTranslation("profile");
  const lvlXpStart = getPointsToLvlUp(lvl - 1);
  const lvlXpEnd = getPointsToLvlUp(lvl);

  let effectivePts = points;
  if (points < lvlXpStart && lvl > 1) effectivePts += lvlXpStart;

  const ptsInLevel = Math.max(0, effectivePts - lvlXpStart);
  const lvlRange = Math.max(1, lvlXpEnd - lvlXpStart);
  const progress = Math.min(Math.max(ptsInLevel / lvlRange, 0), 1);
  const xp = t("landing.xp", {
    current: ptsInLevel.toLocaleString(),
    total: lvlRange.toLocaleString(),
  });

  if (variant === "bar") {
    return (
      <div className='flex min-w-0 flex-1 flex-col gap-2.5'>
        <div className='flex items-baseline justify-between gap-4'>
          <span className='text-sm font-bold text-zinc-50'>
            {t("landing.level")} {lvl}
          </span>
          <span className='whitespace-nowrap text-xs font-medium tabular-nums text-zinc-400'>
            {xp}
          </span>
        </div>
        {/* A thick, fully rounded bar whose fill carries a lighter strip along
            its top — the lit, glossy progress of a game, not a hairline. The
            strip is the whole effect: no glow around the bar. */}
        <div
          role='img'
          aria-label={xp}
          className='h-3 overflow-hidden rounded-full bg-zinc-700'>
          {progress > 0 && (
            <div
              className='bar-shine h-full min-w-3 rounded-full bg-cyan-400 [--shine-inset:6px]'
              style={{
                width: `${progress * 100}%`,
                backgroundColor: barColor,
              }}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className='relative flex flex-col items-center gap-1.5 p-1'>
      <span className='text-xs font-semibold text-zinc-400'>
        {t("landing.level")}
      </span>
      <svg
        viewBox='0 0 56 56'
        className='h-14 w-14 shrink-0'
        role='img'
        aria-label={`${t("landing.level")} ${lvl}`}>
        <circle
          cx='28'
          cy='28'
          r={RADIUS}
          fill='none'
          strokeWidth='6'
          className='stroke-zinc-700'
        />
        <circle
          cx='28'
          cy='28'
          r={RADIUS}
          fill='none'
          strokeWidth='6'
          strokeLinecap='round'
          strokeDasharray={`${CIRCUMFERENCE * progress} ${CIRCUMFERENCE}`}
          transform='rotate(-90 28 28)'
          className='stroke-cyan-400'
        />
        <text
          x='28'
          y='34.5'
          textAnchor='middle'
          fontSize='19'
          fontWeight='700'
          className='fill-zinc-50'>
          {lvl}
        </text>
      </svg>
      <span className='whitespace-nowrap text-[11px] font-medium tabular-nums text-zinc-400'>
        {xp}
      </span>
    </div>
  );
};
