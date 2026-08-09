import { cn } from "assets/lib/utils";
import type { ConditionGrade } from "feature/arsenal/data/itemStats";
import { getConditionGrade } from "feature/arsenal/data/itemStats";
import { Check, Lock } from "lucide-react";
import type { ReactNode } from "react";

import { ConditionPath } from "./ConditionPath";

interface RewardPanelProps {
  accent: "cyan" | "emerald" | "purple";
  children: ReactNode;
}

const TINT = {
  cyan: "bg-cyan-500/[0.07]",
  emerald: "bg-emerald-500/[0.07]",
  purple: "bg-purple-500/[0.07]",
} as const;

/**
 * What the job gives back.
 *
 * Tinted, where the cost panel is dark. That single contrast is what tells the
 * player which half of the trade they are reading before they have read a word of
 * it — and it is the reason this dialog does not need more copy to explain itself.
 */
export const RewardPanel = ({ accent, children }: RewardPanelProps) => (
  <div className={cn("flex flex-col gap-5 rounded-lg p-6", TINT[accent])}>
    <span className='text-sm font-black tracking-wide text-zinc-200'>
      You get
    </span>
    {children}
  </div>
);

interface GateRowProps {
  ok: boolean;
  condition: number;
  /** The whole grade, not just its name — the path needs its key to mark a target. */
  required: ConditionGrade;
}

/**
 * The condition gate — a prerequisite, not a price, so it is neither gain nor
 * cost and sits between the two panels rather than inside either.
 *
 * Quiet when it is met, because a satisfied gate is not news. Loud when it is
 * not, because then it is the only thing standing in the way.
 */
export const GateRow = ({ ok, condition, required }: GateRowProps) => (
  <div
    className={cn(
      "flex flex-col gap-3 rounded-lg px-5 py-4",
      ok ? "bg-zinc-900/40" : "bg-amber-500/[0.07]",
    )}>
    <div className='flex flex-wrap items-center justify-between gap-x-4 gap-y-1'>
      <span className='flex items-center gap-2.5'>
        <span
          className={cn(
            "flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
            ok ? "bg-emerald-500/15" : "bg-amber-500/15",
          )}>
          {ok ? (
            <Check size={12} strokeWidth={3} className='text-emerald-400' />
          ) : (
            <Lock size={11} className='text-amber-400' />
          )}
        </span>
        <span className={cn("text-sm", ok ? "text-zinc-400" : "text-zinc-200")}>
          {ok
            ? `Condition is good enough — ${getConditionGrade(condition).label}`
            : `Needs ${required.label} condition first`}
        </span>
      </span>

      {!ok && (
        <span className='text-sm font-bold text-amber-400'>
          restore it first
        </span>
      )}
    </div>

    {!ok && <ConditionPath condition={condition} target={required.key} />}
  </div>
);
