import { cn } from "assets/lib/utils";
import { CheckCircle2, CircleDashed, Zap } from "lucide-react";
import React from "react";

import type { StepStatus } from "../../../utils/stepStatus";

const OPTIONS: {
  status: StepStatus;
  label: string;
  Icon: typeof Zap;
  active: string;
}[] = [
  {
    status: "not-started",
    label: "Not yet",
    Icon: CircleDashed,
    active: "bg-zinc-800 text-zinc-100",
  },
  {
    status: "in-progress",
    label: "Practicing",
    Icon: Zap,
    active: "bg-amber-500/10 text-amber-400",
  },
  {
    status: "done",
    label: "Got it",
    Icon: CheckCircle2,
    active: "bg-emerald-500/10 text-emerald-400",
  },
];

interface StepStatusControlProps {
  value: StepStatus;
  onChange: (status: StepStatus) => void;
}

/** Manual status for a step with nothing to tick off — the player says where they are. */
export const StepStatusControl: React.FC<StepStatusControlProps> = ({
  value,
  onChange,
}) => (
  <section className='flex flex-col gap-3'>
    <div>
      <h3 className='text-sm font-semibold text-zinc-100'>
        Where are you with this?
      </h3>
      <p className='mt-1 text-xs leading-relaxed text-zinc-400'>
        This step has no exercise or lesson to tick off, so you set the status
        yourself.
      </p>
    </div>
    <div
      role='radiogroup'
      className='grid grid-cols-3 gap-1.5 rounded-lg bg-zinc-900/40 p-1.5'>
      {OPTIONS.map(({ status, label, Icon, active }) => {
        const isActive = value === status;
        return (
          <button
            key={status}
            type='button'
            role='radio'
            aria-checked={isActive}
            onClick={() => onChange(status)}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-lg px-2 py-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
              isActive
                ? active
                : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200",
            )}>
            <Icon className='h-4 w-4' />
            {label}
          </button>
        );
      })}
    </div>
  </section>
);
