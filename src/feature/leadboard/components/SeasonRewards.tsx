import { cn } from "assets/lib/utils";
import { SEASON_FAME_REWARDS } from "constants/seasonRewards";
import { FameCoin } from "feature/arsenal/components/Workshop/FameCoin";
import { useTranslation } from "hooks/useTranslation";
import { useIntlLocale } from "lib/i18n/dateLocale";
import { useId } from "react";

/** Places shown as their own chip. The rest collapse into one range — the
 *  ladder sits in a hero banner, and a ten-row table costs more height than the
 *  banner has. The tail is flat enough that a range says everything rows would. */
const DETAILED_PLACES = 3;

/** Gold, silver, bronze. Places are written as `#1`, like the rank beside them,
 *  so the podium needs no medal emoji to read. */
const PODIUM_TONES = [
  "bg-amber-500/10 text-amber-300",
  "bg-zinc-400/10 text-zinc-200",
  "bg-orange-500/10 text-orange-300",
] as const;

export const SeasonRewards = () => {
  const { t } = useTranslation("leadboard");
  const intlLocale = useIntlLocale();
  const titleId = useId();
  const format = (fame: number) => fame.toLocaleString(intlLocale);
  const podium = SEASON_FAME_REWARDS.slice(0, DETAILED_PLACES);
  const tail = SEASON_FAME_REWARDS.slice(DETAILED_PLACES);

  return (
    <div className='flex flex-col gap-2'>
      <span id={titleId} className='text-xs font-semibold text-zinc-400'>
        {t("rewards.title")}
      </span>

      <ul aria-labelledby={titleId} className='flex flex-wrap items-center gap-2'>
        {podium.map((fame, i) => (
          <li
            key={i}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-semibold tabular-nums",
              PODIUM_TONES[i],
            )}>
            <span className='sr-only'>
              {t("rewards.place", { place: i + 1, fame: format(fame) })}
            </span>
            <span aria-hidden>#{i + 1}</span>
            <span aria-hidden className='flex items-center gap-1 text-zinc-100'>
              <FameCoin size={14} />
              {format(fame)}
            </span>
          </li>
        ))}

        {tail.length > 0 && (
          <li className='flex items-center gap-2 px-2 py-1.5 text-sm tabular-nums text-zinc-400'>
            <span className='sr-only'>
              {t("rewards.range", {
                from: DETAILED_PLACES + 1,
                to: SEASON_FAME_REWARDS.length,
                max: format(tail[0]),
                min: format(tail[tail.length - 1]),
              })}
            </span>
            <span aria-hidden>
              #{DETAILED_PLACES + 1}–{SEASON_FAME_REWARDS.length}
            </span>
            <span aria-hidden className='flex items-center gap-1'>
              <FameCoin size={13} />
              {format(tail[0])}–{format(tail[tail.length - 1])}
            </span>
          </li>
        )}
      </ul>
    </div>
  );
};
