import { cn } from "assets/lib/utils";
import { GuildBanner } from "feature/guilds/components/GuildBanner";
import { GuildCrest } from "feature/guilds/components/GuildCrest";
import { GuildLevelRing } from "feature/guilds/components/GuildLevelRing";
import { GuildTagBadge } from "feature/guilds/components/GuildTagBadge";
import { HonorMark } from "feature/guilds/components/HonorMark";
import type { Guild } from "feature/guilds/types/guild.types";
import {
  accentHex,
  equippedItem,
  motifIcons,
} from "feature/guilds/utils/guildCosmetics.utils";
import type { ReactNode } from "react";
import { auth } from "utils/firebase/client/firebase.utils";

interface GuildCoverProps {
  guild: Guild;
  /** `md` for a card in the list, `lg` for the top of the page. */
  size?: "md" | "lg";
  /** Under the name: seats, streak, whatever the place wants said there. */
  meta?: ReactNode;
  /** Level with the name, on the right: the way in or out. */
  actions?: ReactNode;
  /** Goes on the block under the strip — for padding, mostly. */
  className?: string;
}

/**
 * The top of a guild card: the banner across it, and the crest hanging off the
 * banner's lower edge with the name beside it.
 *
 * One component for the list, the kit's preview and the page header, so a
 * founder trying a banner on sees exactly the card everyone else will, and so
 * the three cannot drift apart over what a guild looks like.
 *
 * The crest is pulled up over the strip by half its height and the row is
 * aligned to its top, so the crest always sits half on the banner whatever is
 * beside it. Everything else in the row is padded down past the strip's edge,
 * so a name — however long, however it wraps — starts under the banner and
 * grows downwards into the card rather than upwards into the pattern.
 */
export const GuildCover = ({
  guild,
  size = "md",
  meta,
  actions,
  className,
}: GuildCoverProps) => {
  const hex = accentHex(guild.cosmetics);
  const banner = equippedItem(guild.cosmetics, "banner");
  const large = size === "lg";
  const Heading = large ? "h1" : "h3";

  // The caller's own uid never comes back from the API — see `GuildsState` —
  // so "am I a member here" is asked of the signed-in user against the
  // roster, the same way the rest of the client finds its own row. Honor is
  // per member and this badge is deliberately not the guild's total: it is
  // the one number on the banner that answers "what have *I* put in", so it
  // only ever shows for a guild the viewer actually belongs to.
  const myUid = auth.currentUser?.uid ?? null;
  const isMember =
    myUid !== null && guild.members.some((member) => member.uid === myUid);
  // A member with nothing put in yet still gets the badge, at zero — the
  // absence of an entry on the guild document is not a reason to hide it.
  const myHonor = isMember
    ? (guild.honor[myUid!] ?? { earned: 0, spent: 0, balance: 0 })
    : null;

  return (
    <>
      {/* The level rides the banner's right-hand side, halfway down, the way a
          level sits on a card in any game — so it is read as one before it is
          read at all, and it stays out of the crest's way on the left. My own
          honor sits right beside it, for the same reason: the one figure on
          this card that is mine rather than the guild's. */}
      <div className='relative'>
        <GuildBanner
          bannerId={banner.id}
          hex={hex}
          icons={motifIcons(guild.cosmetics)}
          className={large ? "h-28 sm:h-40" : "h-24 sm:h-28"}
        />
        <div
          className={cn(
            "absolute top-1/2 flex -translate-y-1/2 items-center gap-2",
            large ? "right-6 sm:right-8" : "right-4",
          )}>
          {myHonor && (
            <span
              title={`Your honor: ${myHonor.earned.toLocaleString()} earned · ${myHonor.balance.toLocaleString()} to spend on the shelf`}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-lg bg-zinc-950/75 font-bold tabular-nums text-purple-200",
                large ? "px-3 py-2 text-base" : "px-2 py-1.5 text-sm",
              )}>
              <HonorMark size={large ? 22 : 16} />
              {myHonor.earned.toLocaleString()}
            </span>
          )}
          <GuildLevelRing level={guild.level} size={large ? 72 : 48} />
        </div>
      </div>

      {/* The crest is the guild's face and is drawn at a size that says so:
          96px on a card, 128px at the top of the page, half of it hanging
          over the banner. The paddings under it keep the name just below the
          banner's edge at either size. */}
      <div className={cn("relative z-10 px-5", className)}>
        <div
          className={cn(
            "flex flex-col gap-x-5 gap-y-3 sm:flex-row sm:items-start sm:justify-between",
            large ? "-mt-12 sm:-mt-14" : "-mt-10 sm:-mt-12",
          )}>
          <div className='flex min-w-0 flex-1 items-start gap-5'>
            <GuildCrest
              logo={guild.logo}
              tag={guild.tag}
              accentHex={hex}
              className={
                large
                  ? "h-24 w-24 text-xl sm:h-32 sm:w-32 sm:text-2xl"
                  : "h-20 w-20 text-lg sm:h-24 sm:w-24 sm:text-xl"
              }
            />

            <div
              className={cn(
                "min-w-0 flex-1",
                large ? "pt-14 sm:pt-16" : "pt-12 sm:pt-14",
              )}>
              <Heading
                className={cn(
                  "flex flex-wrap items-center gap-2 font-bold text-zinc-100",
                  large ? "text-2xl" : "text-base",
                )}>
                <span className='min-w-0 break-words'>{guild.name}</span>
                {/* The crest has taken the tag's square, so the tag says itself
                    here — drawn by the same badge the leaderboard uses, so a
                    guild sees exactly what everyone else sees next to its
                    members' names. Behind a crest that already *is* the tag, a
                    second copy would be the same three letters printed twice. */}
                {guild.logo && (
                  <GuildTagBadge
                    badge={{
                      guildId: guild.id,
                      tag: guild.tag,
                      accent: guild.cosmetics.accent,
                      frame: guild.cosmetics.frame,
                      level: guild.level,
                    }}
                    size={large ? "md" : "sm"}
                    linked={false}
                  />
                )}
              </Heading>
              {meta && <div className='mt-1 text-xs text-zinc-500'>{meta}</div>}
            </div>
          </div>

          {/* Level with the name from sm up; on a phone the row is stacked and
              the actions sit under the name, with no banner to clear. */}
          {actions && (
            <div
              className={cn(
                "flex shrink-0 items-center gap-2",
                large ? "sm:pt-16" : "sm:pt-14",
              )}>
              {actions}
            </div>
          )}
        </div>
      </div>
    </>
  );
};
