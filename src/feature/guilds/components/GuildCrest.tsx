/* eslint-disable @next/next/no-img-element */
import { cn } from "assets/lib/utils";
import { crestStyle } from "feature/guilds/utils/guildCosmetics.style";

interface GuildCrestProps {
  /** The uploaded picture, if the guild has one. */
  logo?: string | null;
  /** Worn in its place when it has not — a guild always has a tag. */
  tag: string;
  /**
   * The guild's chosen colour. Takes over from `isMine` when there is one: a
   * guild that has picked a colour should be that colour on everybody's
   * screen, not cyan on its own members' and grey on everyone else's.
   */
  accentHex?: string | null;
  /** Cyan for the caller's own guild, plain for everyone else's. */
  isMine?: boolean;
  className?: string;
}

/**
 * The square a guild is recognised by: its picture, or its tag when there is
 * none. One component so the card, the panel and anything after them cannot
 * disagree about what a guild looks like.
 *
 * The square is solid. It hangs half over the guild's banner, and a see-through
 * one there would print the pattern straight through the initials.
 */
export const GuildCrest = ({
  logo,
  tag,
  accentHex,
  isMine = false,
  className,
}: GuildCrestProps) => (
  <span
    // The colour is skipped entirely behind a picture — a tint under an opaque
    // image is paint nobody sees.
    style={
      logo
        ? undefined
        : crestStyle(accentHex ?? (isMine ? "#22d3ee" : "#a1a1aa"))
    }
    className={cn(
      "flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-zinc-900 text-[11px] font-black tracking-wider",
      className,
    )}>
    {logo ? (
      <img
        src={logo}
        alt=''
        referrerPolicy='no-referrer'
        className='h-full w-full object-cover'
      />
    ) : (
      tag
    )}
  </span>
);
