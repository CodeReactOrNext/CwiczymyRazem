import { cn } from "assets/lib/utils";
import { useArsenalLabels } from "feature/arsenal/hooks/useArsenalLabels";
import { getPityStatus } from "feature/arsenal/utils/pity";
import { Crown, Sparkles } from "lucide-react";

import type {
  CaseDefinition,
  CasePityCounters,
} from "../../types/arsenal.types";
import { RARITY_STYLES } from "../RarityBadge";

interface PityMeterProps {
  caseDef: CaseDefinition;
  counters: CasePityCounters;
  /** False when nothing new is within reach — a guarantee that cannot pay out is not printed. */
  showNew: boolean;
  className?: string;
}

/**
 * The guarantee counters of one case: how close the next open is to being owed
 * a model the player has never held, and a rarity of at least the case's top rule.
 *
 * A thick bar per rule that fills as bad luck accumulates, with the prize it is
 * filling toward on its end, so the counter reads as progress toward something
 * rather than as a tally of misses. When the next open is the owed one the whole
 * bar turns amber.
 */
export const PityMeter = ({
  caseDef,
  counters,
  showNew,
  className,
}: PityMeterProps) => {
  const labels = useArsenalLabels();
  const { t } = labels;
  const status = getPityStatus(caseDef, counters);
  const newWithin = caseDef.pity?.newWithin;
  const top = caseDef.pity?.top;

  const rows: {
    key: string;
    icon: typeof Sparkles;
    text: string;
    due: boolean;
    fill: number;
    color: string;
  }[] = [];

  if (showNew && newWithin && status.opensUntilNew !== null) {
    rows.push({
      key: "new",
      icon: Sparkles,
      text:
        status.opensUntilNew === 1
          ? t("cases.pity.new_next")
          : t("cases.pity.new", { count: status.opensUntilNew }),
      due: status.opensUntilNew === 1,
      fill: counters.sinceNew / Math.max(1, newWithin - 1),
      color: "#a1a1aa",
    });
  }

  if (top && status.opensUntilTop !== null) {
    rows.push({
      key: "top",
      icon: Crown,
      text:
        status.opensUntilTop === 1
          ? t("cases.pity.top_next", { rarity: labels.rarity(top.rarity) })
          : t("cases.pity.top", {
              rarity: labels.rarity(top.rarity),
              count: status.opensUntilTop,
            }),
      due: status.opensUntilTop === 1,
      fill: counters.sinceTop / Math.max(1, top.within - 1),
      color: RARITY_STYLES[top.rarity].baseColor,
    });
  }

  if (rows.length === 0) return null;

  return (
    <ul className={cn("flex flex-col gap-2", className)}>
      {rows.map(({ key, icon: Icon, text, due, fill, color: ruleColor }) => {
        const color = due ? "#fbbf24" : ruleColor;
        const width = Math.round(Math.min(1, fill) * 100);

        return (
          <li key={key} className='flex items-center'>
            <span className='relative h-5 min-w-0 flex-1 overflow-hidden rounded-full bg-arsenal-bg'>
              {width > 0 && (
                <>
                  {/* Mixed toward the card, so the line on it reads whatever
                      the rule's colour is — and in the light theme too. */}
                  <span
                    className='absolute inset-y-0 left-0 rounded-full transition-[width] duration-slow ease-out'
                    style={{
                      width: `${width}%`,
                      backgroundColor: `color-mix(in srgb, ${color} 55%, rgb(var(--c-zinc-900)))`,
                    }}
                  />
                  <span
                    aria-hidden
                    className='light-hide absolute left-2 top-[3px] h-[3px] rounded-full bg-white/30'
                    style={{ width: `calc(${width}% - 16px)` }}
                  />
                </>
              )}
              <span className='absolute inset-0 flex items-center justify-center pl-2 pr-4 text-[11px] font-semibold text-zinc-100'>
                <span className='truncate'>{text}</span>
              </span>
            </span>
            {/* What the bar is filling toward, sitting on its end. */}
            <span
              aria-hidden
              className='relative z-10 -ml-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-100'
              style={{
                backgroundColor: `color-mix(in srgb, ${color} 35%, rgb(var(--c-zinc-900)))`,
              }}>
              <Icon size={15} />
            </span>
          </li>
        );
      })}
    </ul>
  );
};
