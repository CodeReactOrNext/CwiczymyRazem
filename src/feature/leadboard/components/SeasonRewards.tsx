import { cn } from "assets/lib/utils";
import { placeSuffix, SEASON_FAME_REWARDS } from "constants/seasonRewards";
import { FameCoin } from "feature/arsenal/components/Workshop/FameCoin";

/** Places shown as their own badge. The rest collapse into one range — the
 *  ladder sits in a hero banner, and a ten-row table costs more height than the
 *  banner has. The tail is flat enough that a range says everything rows would. */
const DETAILED_PLACES = 3;

const TONES = [
  { medal: "👑", bg: "bg-amber-400/10", text: "text-amber-300" },
  { medal: "🥈", bg: "bg-zinc-400/10", text: "text-zinc-200" },
  { medal: "🥉", bg: "bg-orange-500/10", text: "text-orange-300" },
] as const;

const ordinal = (place: number): string => `${place}${placeSuffix(place)}`;

export const SeasonRewards = () => {
  const detailed = SEASON_FAME_REWARDS.slice(0, DETAILED_PLACES);
  const tail = SEASON_FAME_REWARDS.slice(DETAILED_PLACES);

  return (
    <div className='flex flex-wrap items-center gap-x-2 gap-y-2'>
      <span className='text-xs text-zinc-500'>Season rewards</span>

      <ul className='flex flex-wrap items-center gap-2'>
        {detailed.map((fame, i) => {
          const tone = TONES[i];
          return (
            <li
              key={i}
              aria-label={`${ordinal(i + 1)} place, ${fame.toLocaleString()} fame`}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5",
                tone.bg,
              )}>
              <span aria-hidden className='text-sm leading-none'>
                {tone.medal}
              </span>
              <FameCoin size={13} />
              <span
                className={cn(
                  "text-sm font-bold tabular-nums leading-none",
                  tone.text,
                )}>
                {fame.toLocaleString()}
              </span>
            </li>
          );
        })}

        {tail.length > 0 && (
          <li
            aria-label={`${ordinal(DETAILED_PLACES + 1)} to ${ordinal(
              SEASON_FAME_REWARDS.length,
            )} place, ${tail[0].toLocaleString()} down to ${tail[
              tail.length - 1
            ].toLocaleString()} fame`}
            className='flex items-center gap-1.5 px-1.5 py-1.5 text-xs text-zinc-500'>
            <span aria-hidden>
              {ordinal(DETAILED_PLACES + 1)}–
              {ordinal(SEASON_FAME_REWARDS.length)}
            </span>
            <FameCoin size={11} />
            <span aria-hidden className='tabular-nums'>
              {tail[0].toLocaleString()}–
              {tail[tail.length - 1].toLocaleString()}
            </span>
          </li>
        )}
      </ul>
    </div>
  );
};
