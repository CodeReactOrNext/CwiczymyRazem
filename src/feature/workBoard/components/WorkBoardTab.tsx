import { cn } from "assets/lib/utils";
import { useWorkBoard } from "feature/workBoard/hooks/useWorkBoard";
import type { WorkItem } from "feature/workBoard/types/workBoard.types";
import { splitWorkTitle } from "feature/workBoard/utils/workBoard.utils";
import {
  Check,
  Hammer,
  Lightbulb,
  ListOrdered,
  Map as MapIcon,
} from "lucide-react";
import { useState } from "react";

const COLUMNS = [
  {
    key: "in_progress" as const,
    title: "In progress",
    blurb: "Being built now",
    icon: Hammer,
    tone: "text-amber-400",
  },
  {
    key: "queue" as const,
    title: "Queue",
    blurb: "Up next, in order",
    icon: ListOrdered,
    tone: "text-cyan-400",
  },
  {
    key: "done" as const,
    title: "Done",
    blurb: "Shipped, newest first",
    icon: Check,
    tone: "text-emerald-400",
  },
];

/** How many shipped items show before the rest fold away. */
const DONE_VISIBLE = 8;

const shortDate = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
      })
    : null;

const Row = ({
  item,
  column,
  position,
}: {
  item: WorkItem;
  column: (typeof COLUMNS)[number]["key"];
  /** 1-based place in the queue; only the queue is numbered. */
  position?: number;
}) => {
  const { title, isRoadmap } = splitWorkTitle(item.title);
  const done = column === "done";
  const shipped = done ? shortDate(item.completedAt) : null;

  return (
    <li className='flex gap-3 rounded-lg bg-zinc-800/40 px-4 py-3'>
      {position !== undefined && (
        <span className='w-4 shrink-0 text-right text-sm font-bold tabular-nums text-zinc-500'>
          {position}
        </span>
      )}
      {done && <Check size={15} className='mt-0.5 shrink-0 text-emerald-400' />}

      <div className='min-w-0 flex-1'>
        <p
          className={cn(
            "text-sm font-semibold leading-snug",
            done ? "text-zinc-400" : "text-zinc-100",
          )}>
          {title}
        </p>
        {item.note && (
          <p className='mt-1 text-sm leading-relaxed text-zinc-500'>
            {item.note}
          </p>
        )}

        {(isRoadmap || item.ideaId || shipped) && (
          <div className='mt-2 flex flex-wrap items-center gap-1.5'>
            {isRoadmap && (
              <span className='inline-flex items-center gap-1 rounded bg-zinc-900/60 px-1.5 py-0.5 text-xs text-zinc-400'>
                <MapIcon size={11} />
                Roadmap
              </span>
            )}
            {item.ideaId && (
              <span
                title='Came from a supporter idea'
                className='inline-flex items-center gap-1 rounded bg-cyan-500/10 px-1.5 py-0.5 text-xs text-cyan-300'>
                <Lightbulb size={11} />
                Supporter idea
              </span>
            )}
            {shipped && (
              <span className='text-xs text-zinc-500'>{shipped}</span>
            )}
          </div>
        )}
      </div>
    </li>
  );
};

const Column = ({
  column,
  items,
}: {
  column: (typeof COLUMNS)[number];
  items: WorkItem[];
}) => {
  const [showAll, setShowAll] = useState(false);
  const { key, title, blurb, icon: Icon, tone } = column;
  const folds = key === "done" && items.length > DONE_VISIBLE;
  const shown = folds && !showAll ? items.slice(0, DONE_VISIBLE) : items;

  return (
    <section className='space-y-4 rounded-lg bg-zinc-900/40 p-4'>
      <header className='px-1'>
        <h3 className='flex items-center gap-2 text-base font-bold text-white'>
          <Icon size={16} className={tone} />
          {title}
          <span className='rounded bg-zinc-800/60 px-1.5 py-0.5 text-xs font-semibold tabular-nums text-zinc-400'>
            {items.length}
          </span>
        </h3>
        <p className='mt-0.5 text-xs text-zinc-500'>{blurb}</p>
      </header>

      {items.length === 0 ? (
        <p className='px-1 py-6 text-center text-sm text-zinc-600'>
          Nothing here
        </p>
      ) : (
        <ol className='space-y-2'>
          {shown.map((item, index) => (
            <Row
              key={item.id}
              item={item}
              column={key}
              position={key === "queue" ? index + 1 : undefined}
            />
          ))}
        </ol>
      )}

      {folds && (
        <button
          type='button'
          onClick={() => setShowAll((all) => !all)}
          className='w-full rounded-lg py-2 text-sm font-semibold text-cyan-400 transition-colors hover:text-cyan-300'>
          {showAll ? "Show less" : `Show all ${items.length}`}
        </button>
      )}
    </section>
  );
};

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
    // Side by side on a wide screen: three short columns read as a board, where
    // three full-width lists read as one long page of mostly empty rows.
    <div className='grid items-start gap-4 lg:grid-cols-3'>
      {COLUMNS.map((column) => (
        <Column key={column.key} column={column} items={board[column.key]} />
      ))}
    </div>
  );
};
