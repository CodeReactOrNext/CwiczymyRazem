import { cn } from "assets/lib/utils";
import type { Backer } from "feature/supporterPanel/types/supporterPanel.types";
import { useState } from "react";

/**
 * Who put tokens behind this, by name.
 *
 * A bare count told a supporter their vote had landed somewhere and nothing
 * else. Naming the room is the point of a board bought with donations: it says
 * whose idea carried, and who carried it — which is the whole thing a token
 * buys.
 */

/** How many names fit before the row starts eating the card. */
const VISIBLE = 6;

const Bubble = ({ backer }: { backer: Backer }) =>
  backer.avatar ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={backer.avatar}
      alt=''
      loading='lazy'
      // Somebody else's host; no need to tell them where it is being viewed.
      referrerPolicy='no-referrer'
      className='h-5 w-5 shrink-0 rounded-full bg-zinc-800 object-cover'
    />
  ) : (
    <span className='flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-700 text-[10px] font-bold text-zinc-300'>
      {backer.name.charAt(0)}
    </span>
  );

const CHIP =
  "inline-flex items-center gap-1.5 rounded-full py-1 pl-1 pr-2.5 text-xs";

interface BackerRowProps {
  backers: Backer[];
  /** What the item's own counter says — the list can be shorter than it. */
  total: number;
  /** Whoever is reading, so their own chip reads as theirs. */
  myUid: string;
  className?: string;
}

export const BackerRow = ({
  backers,
  total,
  myUid,
  className,
}: BackerRowProps) => {
  const [expanded, setExpanded] = useState(false);

  if (total <= 0 && backers.length === 0) return null;

  // A board older than the ledger read, or one trimmed by its ceiling, still
  // owes an honest count — so the names never claim to be the whole room.
  if (backers.length === 0) {
    return (
      <p className={cn("text-xs text-zinc-500", className)}>
        Backed by {total} {total === 1 ? "supporter" : "supporters"}
      </p>
    );
  }

  const shown = expanded ? backers : backers.slice(0, VISIBLE);
  const held = backers.length - shown.length;
  const unlisted = Math.max(0, total - backers.length);

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      <span className='mr-0.5 text-xs text-zinc-500'>Backed by</span>

      {shown.map((backer) => {
        const isMe = backer.uid === myUid;

        return (
          <span
            key={backer.uid}
            title={`${backer.name} put ${backer.weight} in`}
            className={cn(
              CHIP,
              isMe
                ? "bg-cyan-950/40 text-cyan-300"
                : "bg-zinc-800/50 text-zinc-300",
            )}>
            <Bubble backer={backer} />
            <span className='max-w-[10rem] truncate font-medium'>
              {isMe ? "You" : backer.name}
            </span>
            {backer.weight > 1 && (
              <span
                className={cn(
                  "font-bold tabular-nums",
                  isMe ? "text-cyan-400" : "text-zinc-500",
                )}>
                {backer.weight}
              </span>
            )}
          </span>
        );
      })}

      {held > 0 && (
        <button
          type='button'
          onClick={() => setExpanded(true)}
          className={cn(
            CHIP,
            "pl-2.5 font-medium text-zinc-400 transition-colors",
            "bg-zinc-800/50 hover:bg-zinc-800 hover:text-zinc-200",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          )}>
          +{held + unlisted} more
        </button>
      )}

      {held === 0 && unlisted > 0 && (
        <span className={cn(CHIP, "bg-zinc-800/50 pl-2.5 text-zinc-400")}>
          +{unlisted}
        </span>
      )}
    </div>
  );
};
