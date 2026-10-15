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
 * A thin bar per rule that fills as bad luck accumulates, so the counter reads as
 * progress toward something rather than as a tally of misses. When the next open
 * is the owed one the line says so in amber, which is the only colour here.
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
    <ul className={cn("flex flex-col gap-2.5", className)}>
      {rows.map(({ key, icon: Icon, text, due, fill, color }) => (
        <li key={key} className='flex flex-col gap-1.5'>
          <span
            className={cn(
              "flex items-center gap-2 text-xs font-medium",
              due ? "text-amber-400" : "text-zinc-400",
            )}>
            <Icon size={12} aria-hidden />
            {text}
          </span>
          <span className='h-1 w-full overflow-hidden rounded-full bg-black/40'>
            <span
              className='block h-full rounded-full transition-[width] duration-slow'
              style={{
                width: `${Math.round(Math.min(1, fill) * 100)}%`,
                backgroundColor: due ? "#fbbf24" : color,
                opacity: due ? 1 : 0.7,
              }}
            />
          </span>
        </li>
      ))}
    </ul>
  );
};
