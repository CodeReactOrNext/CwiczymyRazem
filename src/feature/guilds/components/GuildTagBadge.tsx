import { cn } from "assets/lib/utils";
import { findCosmetic } from "feature/guilds/data/guildCosmetics";
import type { GuildBadge } from "feature/guilds/types/guild.types";
import { frameStyle } from "feature/guilds/utils/guildCosmetics.style";
import Link from "next/link";

/**
 * A member's guild tag, drawn the way their guild pays for it to be drawn.
 *
 * This is the whole reason the cosmetics exist: a colour nobody outside the
 * guilds page ever saw would be a colour nobody would buy. So the badge is one
 * component, fed from the copy of the guild's kit that rides along on every
 * user document, and dropped into anywhere the app already prints a name.
 *
 * It renders nothing at all — not a placeholder, not a gap — for a player with
 * no guild, because most rows on a leaderboard are exactly that and a column of
 * empty slots would cost more than the badge is worth.
 */

interface GuildTagBadgeProps {
  badge: GuildBadge | null | undefined;
  /** `sm` for dense rows, `md` beside a heading. */
  size?: "sm" | "md";
  /** Links to the guilds page unless this is switched off (inside another link). */
  linked?: boolean;
  className?: string;
}

export const GuildTagBadge = ({
  badge,
  size = "sm",
  linked = true,
  className,
}: GuildTagBadgeProps) => {
  if (!badge?.tag) return null;

  const accent = findCosmetic(badge.accent);
  const hex = accent?.hex ?? "#a1a1aa";

  const body = (
    <span
      translate='no'
      title={`Guild: ${badge.tag}`}
      style={frameStyle(badge.frame, hex)}
      className={cn(
        "inline-flex shrink-0 items-center rounded font-black tracking-wider",
        size === "sm" ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-1 text-[11px]",
        className,
      )}>
      {badge.tag}
    </span>
  );

  // Not a link when it already sits inside one — a leaderboard row wraps the
  // whole name in an anchor, and an anchor inside an anchor is invalid markup
  // the browser silently rearranges.
  if (!linked) return body;

  return (
    <Link
      href='/guilds'
      className='inline-flex transition-opacity focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:opacity-80'>
      {body}
    </Link>
  );
};
