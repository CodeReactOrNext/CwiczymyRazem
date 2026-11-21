import { cn } from "assets/lib/utils";
import Avatar from "components/UI/Avatar";
import type { ArsenalUserData } from "feature/arsenal/types/arsenal.types";
import { GuildTagBadge } from "feature/guilds/components/GuildTagBadge";
import type { GuildBadge } from "feature/guilds/types/guild.types";
import { RigGuitarsPreview } from "feature/leadboard/components/RigGuitarsPreview";
import { useTranslation } from "hooks/useTranslation";
import Link from "next/link";
import type { StatisticsDataInterface } from "types/api.types";
import { convertMsToWholeHours } from "utils/converter/timeConverter";

export type LeadboardRowVariant = "default" | "gear";

/**
 * Column tracks of the desktop row, shared with the header above the list so
 * each label sits over its numbers: place, avatar, player, then the stats.
 * The rig preview only has room from `xl` up.
 */
export const LEADBOARD_ROW_GRID: Record<LeadboardRowVariant, string> = {
  default:
    "sm:grid-cols-[2.5rem_3.5rem_minmax(0,1fr)_7.5rem_5rem] lg:grid-cols-[2.5rem_3.5rem_minmax(0,1fr)_9rem_6.5rem]",
  gear: "sm:grid-cols-[2.5rem_3.5rem_minmax(0,1fr)_7rem_3.5rem_3.5rem] xl:grid-cols-[2.5rem_3.5rem_minmax(0,1fr)_7.5rem_3.75rem_3.75rem_8.25rem]",
};

/** Medal keys for the podium: face, lip and ink. Everyone else gets zinc. */
const PODIUM_KEY: Record<number, string> = {
  1: "border-b-amber-700 bg-amber-400 text-zinc-950",
  2: "border-b-zinc-500 bg-zinc-300 text-zinc-950",
  3: "border-b-orange-700 bg-orange-400 text-zinc-950",
};

/** The same medal as light falling on the card from the left. */
const PODIUM_LIGHT: Record<number, string> = {
  1: "from-amber-400/15",
  2: "from-zinc-300/10",
  3: "from-orange-400/10",
};

/** Rows slide in one after another; this is the step between two of them. */
const ENTER_STAGGER_MS = 28;

interface LeadboardColumnProps {
  /** Position in the visible list, for the staggered entrance. */
  order?: number;
  place: number;
  nick: string;
  statistics: StatisticsDataInterface;
  userAvatar?: string;
  profileId?: string;
  currentUserId: string | null;
  variant?: LeadboardRowVariant;
  rigLevel?: number;
  guitarsOwned?: number;
  effectsOwned?: number;
  arsenal?: Partial<ArsenalUserData>;
  /** The guild kit this player wears, if they are in a guild. */
  guildBadge?: GuildBadge;
}

export const LeadboardRow = ({
  order = 0,
  place,
  nick,
  statistics,
  userAvatar,
  profileId,
  currentUserId,
  variant = "default",
  rigLevel = 0,
  guitarsOwned = 0,
  effectsOwned = 0,
  arsenal,
  guildBadge,
}: LeadboardColumnProps) => {
  const { t } = useTranslation("leadboard");
  const { lvl, time } = statistics;
  const practiceHours = convertMsToWholeHours(
    time.creativity + time.hearing + time.technique + time.theory,
  );

  const isCurrentUser = profileId === currentUserId;

  const isPodium = place <= 3;
  const accentText = isCurrentUser
    ? "text-cyan-300"
    : place === 1
      ? "text-amber-400"
      : "text-zinc-100";

  // The place is a key, like every control in the app: a face and a lip. It
  // labels the row and is not a button, so it never moves.
  const placeKeyClass = cn(
    "flex flex-shrink-0 items-center justify-center rounded-[0.625rem] border-b-[3px] pt-0.5 font-teko font-semibold tabular-nums leading-none",
    PODIUM_KEY[place] ??
      cn(
        "border-b-black/40 bg-zinc-800 bg-clip-padding",
        isCurrentUser ? "text-cyan-300" : "text-zinc-300",
      ),
  );
  // The number the board is sorted by, set like a scoreboard.
  const leadNumberClass = cn(
    "pt-1 text-right font-teko font-semibold tabular-nums leading-none",
    isPodium ? "text-4xl" : "text-3xl",
    accentText,
  );
  const sideNumberClass =
    "text-right text-sm font-semibold tabular-nums text-zinc-400";

  return (
    <li
      className='w-full duration-slow animate-in fade-in slide-in-from-bottom-2 fill-mode-backwards motion-reduce:animate-none'
      style={{ animationDelay: `${order * ENTER_STAGGER_MS}ms` }}>
      <div
        className={cn(
          "relative overflow-hidden rounded-xl transition-background glass-card hover:glass-card-hover",
          isCurrentUser
            ? "light-tint bg-gradient-to-r from-cyan-400/15 to-cyan-400/5"
            : isPodium &&
                cn(
                  "light-tint bg-gradient-to-r via-transparent to-transparent",
                  PODIUM_LIGHT[place],
                ),
        )}>
        {/* --- Mobile Layout (<640px) ---
            One line per player, read like a table row: place, who, score.
            Achievements and the rig preview stay on wider screens. */}
        <div className='relative z-10 flex items-center gap-3 px-3 py-3 sm:hidden'>
          <span
            translate='no'
            className={cn("h-7 w-8 text-xl", placeKeyClass)}>
            {place}
          </span>

          <Link href={`/user/${profileId}`} className='flex-shrink-0'>
            <Avatar
              avatarURL={userAvatar}
              name={nick}
              size='sm'
            />
          </Link>

          <div className='flex min-w-0 flex-1 flex-col gap-0.5'>
            <Link
              href={`/user/${profileId}`}
              translate='no'
              className={cn(
                "truncate text-sm font-bold tracking-tight",
                isCurrentUser ? "text-cyan-300" : "text-white",
              )}>
              {nick}
            </Link>

            <div className='flex min-w-0 items-center gap-2 text-xs font-medium text-zinc-500'>
              <span translate='no' className='flex-shrink-0 tabular-nums'>
                LVL {lvl}
              </span>
              {/* Sits outside the name's link — an anchor inside an
                  anchor is markup the browser silently rearranges. */}
              <GuildTagBadge badge={guildBadge} />
              {variant === "gear" && (
                <span className='truncate tabular-nums'>
                  {guitarsOwned} {t("guitars")} · {effectsOwned} {t("effects")}
                </span>
              )}
            </div>
          </div>

          <div className='flex flex-shrink-0 flex-col items-end gap-0.5'>
            <span
              className={cn(
                "pt-0.5 font-teko text-2xl font-semibold tabular-nums leading-none",
                accentText,
              )}>
              {variant === "gear"
                ? rigLevel.toLocaleString()
                : statistics.points.toLocaleString()}
            </span>
            <span className='text-xs font-medium tabular-nums text-zinc-500'>
              {variant === "gear" ? t("rig_level") : practiceHours}
            </span>
          </div>
        </div>

        {/* --- Desktop Layout (>=640px) ---
            A low card on fixed column tracks: the labels live once in the
            header above the list, and the numbers line up down the page. */}
        <div
          className={cn(
            "relative z-10 hidden items-center gap-x-5 px-5 sm:grid",
            isPodium ? "h-24" : "h-[5.25rem]",
            LEADBOARD_ROW_GRID[variant],
          )}>
          <span
            translate='no'
            className={cn("h-9 w-10 text-2xl", placeKeyClass)}>
            {place}
          </span>

          {/* The level rides on the corner of the portrait, as on a player
              card, instead of taking a slot beside the name. */}
          <Link href={`/user/${profileId}`} className='relative flex'>
            <Avatar
              avatarURL={userAvatar}
              name={nick}
              size='lg'
            />
            <span
              translate='no'
              title={t("player_level")}
              className={cn(
                "absolute -bottom-1.5 -right-2.5 z-20 min-w-[1.75rem] rounded-lg bg-zinc-950 px-1.5 pb-px pt-1 text-center font-teko text-xl font-semibold tabular-nums leading-none",
                isCurrentUser ? "text-cyan-300" : "text-zinc-200",
              )}>
              {lvl}
            </span>
          </Link>

          <div className='flex min-w-0 items-center gap-2.5 pl-2'>
            <Link
              href={`/user/${profileId}`}
              translate='no'
              title={nick}
              className={cn(
                "min-w-0 truncate font-bold tracking-tight hover:underline",
                isPodium ? "text-lg" : "text-base",
                isCurrentUser ? "text-cyan-300" : "text-zinc-100",
              )}>
              {nick}
            </Link>

            <GuildTagBadge badge={guildBadge} />
          </div>

          {variant === "gear" ? (
            <>
              <span className={leadNumberClass}>
                {rigLevel.toLocaleString()}
              </span>
              <span className={sideNumberClass}>{guitarsOwned}</span>
              <span className={sideNumberClass}>{effectsOwned}</span>
              <div className='hidden xl:block'>
                <RigGuitarsPreview arsenal={arsenal} />
              </div>
            </>
          ) : (
            <>
              <span className={leadNumberClass}>
                {statistics.points.toLocaleString()}
              </span>
              <span className={sideNumberClass}>{practiceHours}</span>
            </>
          )}
        </div>
      </div>
    </li>
  );
};
