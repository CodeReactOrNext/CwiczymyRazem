import { cn } from "assets/lib/utils";
import { useWorkBoard } from "feature/workBoard/hooks/useWorkBoard";
import type { WorkItem } from "feature/workBoard/types/workBoard.types";
import { Check, Hammer, ListOrdered } from "lucide-react";

const COLUMNS = [
  {
    key: "in_progress" as const,
    title: "In progress",
    blurb: "Being built right now.",
    icon: Hammer,
    tone: "text-amber-400",
  },
  {
    key: "queue" as const,
    title: "Queue",
    blurb: "Lined up next, in order.",
    icon: ListOrdered,
    tone: "text-cyan-400",
  },
  {
    key: "done" as const,
    title: "Done",
    blurb: "Shipped, newest first.",
    icon: Check,
    tone: "text-emerald-400",
  },
];

const Row = ({ item, muted }: { item: WorkItem; muted?: boolean }) => (
  <div className='rounded-lg bg-zinc-900/40 px-5 py-4'>
    <p
      className={cn(
        "text-sm font-bold",
        muted ? "text-zinc-400" : "text-zinc-100",
      )}>
      {item.title}
    </p>
    {item.note && <p className='mt-1 text-sm text-zinc-400'>{item.note}</p>}
  </div>
);

/**
 * What the owner is actually building, in the order it is being built. Read-only
 * on purpose: supporters shape the roadmap by backing ideas, and this board is
 * the honest answer to "so what is happening with it".
 */
export const WorkBoardTab = ({ enabled }: { enabled: boolean }) => {
  const { board, isLoading } = useWorkBoard(enabled);

  if (isLoading) {
    return (
      <div className='space-y-3'>
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className='h-16 animate-pulse rounded-lg bg-zinc-900/40'
          />
        ))}
      </div>
    );
  }

  const isEmpty = COLUMNS.every((column) => board[column.key].length === 0);

  if (isEmpty) {
    return (
      <div className='flex flex-col items-center rounded-lg bg-zinc-900/40 px-6 py-20 text-center'>
        <span className='mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-800/60 text-zinc-400'>
          <Hammer size={26} />
        </span>
        <h3 className='mb-2 text-lg font-bold text-zinc-100'>
          Nothing on the board yet
        </h3>
        <p className='max-w-sm text-sm text-zinc-400'>
          This is where the queue shows up once there is something in it.
        </p>
      </div>
    );
  }

  return (
    <div className='space-y-10'>
      {COLUMNS.map(({ key, title, blurb, icon: Icon, tone }) => {
        const items = board[key];
        if (items.length === 0) return null;

        return (
          <section key={key} className='space-y-4'>
            <div className='flex items-baseline gap-3'>
              <h3 className='flex items-center gap-2 text-sm font-bold text-zinc-200'>
                <Icon size={15} className={tone} />
                {title}
              </h3>
              <span className='text-xs text-zinc-500'>{blurb}</span>
            </div>

            <div className='space-y-2'>
              {items.map((item) => (
                <Row key={item.id} item={item} muted={key === "done"} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
};
