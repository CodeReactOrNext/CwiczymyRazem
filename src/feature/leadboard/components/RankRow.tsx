import { cn } from "assets/lib/utils";
import Avatar from "components/UI/Avatar";
import { GuildTagBadge } from "feature/guilds/components/GuildTagBadge";
import type { GuildBadge } from "feature/guilds/types/guild.types";
import {
  placeKeyClass,
  rankCardClass,
  type RankRowSurface,
  rankScoreClass,
} from "feature/leadboard/components/rankRowStyles";
import Link from "next/link";
import type { ReactNode } from "react";

export type RankRowDensity = "default" | "compact";

/** The line inside a ranking card, shared with placeholder rows (an open spot). */
export const rankRowLineClass = (density: RankRowDensity = "default") =>
  cn(
    "relative z-10 flex items-center gap-3 px-3",
    density === "compact" ? "py-2.5" : "py-3",
  );

interface RankRowProps {
  place: number;
  nick: string;
  avatarUrl?: string | null;
  /** Links the avatar and the name to the player's profile when given. */
  profileId?: string | null;
  isCurrentUser: boolean;
  /** The number the board is sorted by. */
  score: ReactNode;
  /** A quiet word under the score (hours, "ELO"...). */
  scoreLabel?: ReactNode;
  /** One quiet line under the name: level, record, effort. */
  meta?: ReactNode;
  guildBadge?: GuildBadge | null;
  density?: RankRowDensity;
  /** Medal keys and podium light for places 1–3. Off where a board drops them. */
  podium?: boolean;
  /** "bare" inside a card that already has a face (no card in card). */
  surface?: RankRowSurface;
  className?: string;
}

/**
 * One player on a board — place, who, score — on a single line. The same row
 * the main leaderboard shows on a phone, for every smaller board in the app.
 */
export const RankRow = ({
  place,
  nick,
  avatarUrl,
  profileId,
  isCurrentUser,
  score,
  scoreLabel,
  meta,
  guildBadge,
  density = "default",
  podium = true,
  surface = "card",
  className,
}: RankRowProps) => {
  const href = profileId ? `/user/${profileId}` : null;
  const avatar = (
    <Avatar avatarURL={avatarUrl || undefined} name={nick} size='sm' />
  );
  const nameClass = cn(
    "truncate text-sm font-bold tracking-tight",
    isCurrentUser ? "text-cyan-300" : "text-white",
  );

  return (
    <li className={cn("w-full", className)}>
      <div className={rankCardClass(place, isCurrentUser, podium, surface)}>
        <div className={rankRowLineClass(density)}>
          <span
            translate='no'
            className={cn(
              "h-7 w-8 text-xl",
              placeKeyClass(place, isCurrentUser, podium),
            )}>
            {place}
          </span>

          {href ? (
            <Link href={href} className='flex-shrink-0'>
              {avatar}
            </Link>
          ) : (
            <span className='flex flex-shrink-0'>{avatar}</span>
          )}

          <div className='flex min-w-0 flex-1 flex-col gap-0.5'>
            {href ? (
              <Link href={href} translate='no' className={nameClass}>
                {nick}
              </Link>
            ) : (
              <span translate='no' className={nameClass}>
                {nick}
              </span>
            )}

            {(meta || guildBadge?.tag) && (
              <div className='flex min-w-0 items-center gap-2 text-xs font-medium text-zinc-500'>
                {meta}
                {/* Sits outside the name's link — an anchor inside an
                    anchor is markup the browser silently rearranges. */}
                <GuildTagBadge badge={guildBadge} />
              </div>
            )}
          </div>

          <div className='flex flex-shrink-0 flex-col items-end gap-0.5'>
            <span
              className={rankScoreClass(
                place,
                isCurrentUser,
                "compact",
                podium,
              )}>
              {score}
            </span>
            {scoreLabel && (
              <span className='text-xs font-medium tabular-nums text-zinc-500'>
                {scoreLabel}
              </span>
            )}
          </div>
        </div>
      </div>
    </li>
  );
};
