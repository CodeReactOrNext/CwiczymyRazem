import { cn } from "assets/lib/utils";
import { UserLink } from "components/UserLink/UserLink";
import { useSupporterWall } from "feature/supportTeam/hooks/useSupporterWall";

interface SupporterStripProps {
  className?: string;
}

/**
 * The people already funding the project, as a row of faces next to the ask.
 *
 * Everybody is here, not a sample with a "+N" behind it: the row is the thank
 * you, and a supporter who lands on it should find their own face rather than
 * a counter they are folded into.
 *
 * Faces go through UserLink, so each one carries the gold ring and the stats
 * hover card the app puts on a player everywhere else — the card only fetches
 * once it is opened, so a long row costs nothing until someone points at it.
 *
 * Shares the wall's query, so the strip and the full list further down the page
 * cost one request between them.
 */
export const SupporterStrip = ({ className }: SupporterStripProps) => {
  const { members, isLoading } = useSupporterWall();

  if (isLoading) {
    return (
      <div className={cn("flex flex-wrap gap-2", className)} aria-hidden>
        {Array.from({ length: 8 }, (_, index) => (
          <div
            key={index}
            className='h-8 w-8 animate-pulse rounded-full bg-zinc-800/60'
          />
        ))}
      </div>
    );
  }

  // Nobody on the roster yet — an empty row under the pitch would only say the
  // project has no backers, which is not the thing to lead with.
  if (members.length === 0) return null;

  return (
    <div className={cn("min-w-0", className)}>
      {/* A label, not a link: the faces below are the way in, and the one page
          still carrying the full wall is a supporters-only tab. */}
      <p className='text-xs text-zinc-500'>
        Funded by{" "}
        <span className='font-semibold text-zinc-300'>
          {members.length} {members.length === 1 ? "player" : "players"}
        </span>
      </p>

      {/* Spaced rather than stacked: the rotating rims lose their shape once
          they overlap, and the ring is the whole point of showing faces here. */}
      <div className='mt-2.5 flex flex-wrap items-center gap-2'>
        {members.map((member) => (
          <UserLink
            key={member.uid}
            uid={member.uid}
            userName={member.displayName}
            avatarUrl={member.avatar}
            lvl={member.lvl ?? 0}
            size='xs'
            showName={false}
            className='transition-transform duration-300 hover:-translate-y-0.5'
          />
        ))}
      </div>
    </div>
  );
};
