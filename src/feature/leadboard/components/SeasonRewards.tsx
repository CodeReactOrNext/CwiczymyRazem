import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { SEASON_FAME_REWARDS, SEASON_REWARD_PLACES } from "constants/seasonRewards";
import { FameCoin } from "feature/arsenal/components/Workshop/FameCoin";
import { useTranslation } from "hooks/useTranslation";
import { useIntlLocale } from "lib/i18n/dateLocale";
import { useId, useState } from "react";

/** Places listed one by one; the flat tail collapses into one range. */
const DETAILED_PLACES = 3;

/**
 * One line under the season's name — who gets paid — with the full ladder
 * folded behind a key. The amounts matter once, not on every visit.
 */
export const SeasonRewards = ({ className }: { className?: string }) => {
  const { t } = useTranslation("leadboard");
  const intlLocale = useIntlLocale();
  const listId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const format = (fame: number) => fame.toLocaleString(intlLocale);
  const podium = SEASON_FAME_REWARDS.slice(0, DETAILED_PLACES);
  const tail = SEASON_FAME_REWARDS.slice(DETAILED_PLACES);

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className='flex items-center gap-3'>
        <FameCoin size={16} />
        <span className='text-sm text-zinc-300'>
          {t("rewards.summary", { count: SEASON_REWARD_PLACES })}
        </span>
        <Button
          type='button'
          variant='ghost'
          size='sm'
          aria-expanded={isOpen}
          aria-controls={listId}
          onClick={() => setIsOpen(open => !open)}>
          {isOpen ? t("rewards.hide") : t("rewards.show")}
        </Button>
      </div>

      {isOpen && (
        <ul
          id={listId}
          className='flex flex-wrap items-center gap-x-5 gap-y-1 text-sm tabular-nums text-zinc-400'>
          {podium.map((fame, i) => (
            <li key={i} className='flex items-center gap-1.5'>
              <span className='sr-only'>
                {t("rewards.place", { place: i + 1, fame: format(fame) })}
              </span>
              <span aria-hidden>#{i + 1}</span>
              <span aria-hidden className='flex items-center gap-1 text-zinc-200'>
                <FameCoin size={13} />
                {format(fame)}
              </span>
            </li>
          ))}
          {tail.length > 0 && (
            <li className='flex items-center gap-1.5'>
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
              <span aria-hidden className='flex items-center gap-1 text-zinc-200'>
                <FameCoin size={13} />
                {format(tail[0])}–{format(tail[tail.length - 1])}
              </span>
            </li>
          )}
        </ul>
      )}
    </div>
  );
};
