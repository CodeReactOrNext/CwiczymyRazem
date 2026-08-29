/* eslint-disable @next/next/no-img-element */
import { cn } from "assets/lib/utils";
import { crestStyle } from "feature/guilds/utils/guildCosmetics.style";

interface GuildCrestProps {
  /** The uploaded picture, if the guild has one. */
  logo?: string | null;
  /** Worn in its place when it has not — a guild always has a tag. */
  tag: string;
  /**
   * The guild's bought colour. Takes over from `isMine` when there is one: a
   * guild that has paid for a colour should be that colour on everybody's
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
    style={accentHex && !logo ? crestStyle(accentHex) : undefined}
    className={cn(
      "flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg text-[11px] font-black tracking-wider",
      !accentHex &&
        (isMine
          ? "bg-cyan-500/15 text-cyan-300"
          : "bg-zinc-800/60 text-zinc-400"),
      accentHex && "bg-zinc-800/60",
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
