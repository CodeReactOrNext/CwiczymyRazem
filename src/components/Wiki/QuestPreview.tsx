import { Check } from "lucide-react";

import { AppScreen } from "./AppScreen";
import { parsePairs } from "./parseProps";

interface QuestPreviewProps {
  /** Pipe-separated `"Task::progress"` rows. Add `::done` as the progress to tick a row. */
  tasks: string;
  /** Reward line under the tasks, e.g. `"+10 points and +40 Fame"`. */
  reward: string;
  caption?: string;
}

/**
 * Mock of the Daily Quests card from the dashboard — three tasks and the reward
 * you claim once they're all ticked.
 */
export const QuestPreview = ({ tasks, reward, caption }: QuestPreviewProps) => {
  const rows = parsePairs(tasks);

  return (
    <AppScreen title='Daily Quests' caption={caption}>
      <div className='flex flex-col gap-2'>
        {rows.map((row) => {
          const isDone = row.description === "done";

          return (
            <div
              key={row.title}
              className='flex items-center justify-between gap-4 rounded bg-zinc-800/40 px-4 py-3'>
              <span className='text-sm font-medium text-zinc-200'>{row.title}</span>
              {isDone ? (
                <Check
                  className='h-4 w-4 shrink-0 text-emerald-400'
                  aria-label='Completed'
                />
              ) : (
                <span className='shrink-0 text-xs font-bold text-zinc-500'>
                  {row.description}
                </span>
              )}
            </div>
          );
        })}
      </div>
      <div className='mt-5 flex flex-wrap items-center justify-between gap-3'>
        <span className='text-xs text-zinc-400'>Complete all three to claim</span>
        <span className='rounded bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-400'>
          {reward}
        </span>
      </div>
    </AppScreen>
  );
};
