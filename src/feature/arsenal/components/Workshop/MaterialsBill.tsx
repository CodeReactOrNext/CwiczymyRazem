import { cn } from "assets/lib/utils";
import type { RecipeLine } from "feature/arsenal/data/workshop";
import { CircleAlert, CircleCheck } from "lucide-react";

import { PartRow } from "../Parts/PartRow";

interface MaterialsBillProps {
  recipe: RecipeLine[];
  /** The job's name, for the "after …" note on each line — e.g. `"restoration"`. */
  job: string;
  /** What the status says once every line is covered — e.g. "Ready to restore". */
  readyLabel: string;
}

/**
 * The parts a job takes, with one verdict over the list.
 *
 * The verdict is the thing the player came to read — can I do this or not —
 * so it sits in the heading, in the colour of the answer, and every line
 * beneath it is read as a ledger: what is asked, what is held, what is left.
 */
export const MaterialsBill = ({
  recipe,
  job,
  readyLabel,
}: MaterialsBillProps) => {
  const short = recipe.filter((line) => !line.ok).length;
  const ready = short === 0;

  return (
    <div className='flex flex-col gap-4'>
      <div className='flex flex-wrap items-center justify-between gap-x-4 gap-y-1'>
        <span className='text-base font-semibold text-zinc-100'>
          Materials required
        </span>
        <span
          className={cn(
            "flex items-center gap-2 text-sm font-bold",
            ready ? "text-emerald-400" : "text-amber-400",
          )}>
          {ready ? <CircleCheck size={18} /> : <CircleAlert size={18} />}
          {ready
            ? readyLabel
            : `${short} ${short === 1 ? "part" : "parts"} short`}
        </span>
      </div>

      <div className='flex flex-col gap-2'>
        {recipe.map((line, i) => (
          <PartRow
            key={`${line.partId}:${line.tier}`}
            partId={line.partId}
            tier={line.tier}
            need={line.need}
            have={line.have}
            index={i}
            ledger={job}
          />
        ))}
      </div>
    </div>
  );
};
