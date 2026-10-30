import { PRESSABLE } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import type { ConditionGrade } from "feature/arsenal/data/itemStats";
import { getConditionGrade } from "feature/arsenal/data/itemStats";
import { useArsenalLabels } from "feature/arsenal/hooks/useArsenalLabels";
import { ArrowRight, Check, Lock } from "lucide-react";

import { ConditionPath } from "./ConditionPath";

interface GateRowProps {
  ok: boolean;
  condition: number;
  /** The whole grade, not just its name — the path needs its key to mark a target. */
  required: ConditionGrade;
  /** Hands the player to the restoration that clears the gate. */
  onRestore?: () => void;
}

/**
 * The condition gate — a prerequisite, not a price, so it is neither gain nor
 * cost and sits between the two panels rather than inside either.
 *
 * Quiet when it is met, because a satisfied gate is not news. Loud when it is
 * not, because then it is the only thing standing in the way — so it says what
 * to do about it and offers the way there.
 */
export const GateRow = ({
  ok,
  condition,
  required,
  onRestore,
}: GateRowProps) => {
  const labels = useArsenalLabels();
  const { t } = labels;

  return ok ? (
    <div className='flex items-center gap-2.5 rounded-lg bg-zinc-900/40 px-5 py-3'>
      <span className='flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15'>
        <Check size={12} strokeWidth={3} className='text-emerald-400' />
      </span>
      <span className='text-sm text-zinc-400'>
        {t("workshop.condition_ok", {
          grade: labels.condition(getConditionGrade(condition)),
        })}
      </span>
    </div>
  ) : (
    <div className='flex flex-col gap-4 rounded-lg bg-amber-500/[0.08] p-5 sm:flex-row sm:items-center sm:gap-5'>
      <span className='flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-amber-500/15'>
        <Lock size={20} className='text-amber-400' />
      </span>
      <div className='flex min-w-0 flex-1 flex-col gap-3'>
        <div className='flex flex-col gap-0.5'>
          <span className='text-base font-semibold text-amber-300'>
            {t("workshop.restore_first", { grade: labels.condition(required) })}
          </span>
          <span className='text-sm text-zinc-400'>
            {t("workshop.requires_condition", { grade: labels.condition(required) })}
          </span>
        </div>
        <ConditionPath condition={condition} target={required.key} />
      </div>
      {onRestore && (
        <button
          type='button'
          onClick={onRestore}
          className={cn(PRESSABLE, "flex shrink-0 items-center gap-2 self-start rounded-lg bg-amber-500/15 px-4 py-2.5 text-sm font-bold text-amber-300 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-400 hover:bg-amber-500/25 sm:self-center border-b-black/30")}>
          {t("workshop.go_to_restoration")}
          <ArrowRight size={15} />
        </button>
      )}
    </div>
  );
};
