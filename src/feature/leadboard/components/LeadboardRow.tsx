import { cn } from "assets/lib/utils";
import { DaySinceMessage } from "components/DaySince/DaySince";
import Avatar from "components/UI/Avatar";
import type { ArsenalUserData } from "feature/arsenal/types/arsenal.types";
import { GuildTagBadge } from "feature/guilds/components/GuildTagBadge";
import type { GuildBadge } from "feature/guilds/types/guild.types";
import { AchievementsCarousel } from "feature/leadboard/components/AchievementsCarousel";
import { RigGuitarsPreview } from "feature/leadboard/components/RigGuitarsPreview";
import { useTranslation } from "hooks/useTranslation";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import type { StatisticsDataInterface } from "types/api.types";
import { convertMsToWholeHours } from "utils/converter/timeConverter";

interface LeadboardColumnProps {
  place: number;
  nick: string;
  statistics: StatisticsDataInterface;
  userAvatar?: string;
  profileId?: string;
  currentUserId: string | null;
  variant?: "default" | "gear";
  rigLevel?: number;
  guitarsOwned?: number;
  effectsOwned?: number;
  arsenal?: Partial<ArsenalUserData>;
  /** The guild kit this player wears, if they are in a guild. */
  guildBadge?: GuildBadge;
}

export const LeadboardRow = ({
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

  const shortenNick = (nick: string) => {
    const MAX_SHOW_NICK_LENGTH = 16;
    if (!nick) {
      return null;
    }
    if (nick.length > MAX_SHOW_NICK_LENGTH) {
      return (
        <span data-tip={nick}>
          {nick.substring(0, MAX_SHOW_NICK_LENGTH) + "..."}
        </span>
      );
    }
    return nick;
  };

  return (
    <li className='w-full'>
      <div
        className={cn(
          "relative overflow-hidden rounded-xl transition-background glass-card sm:rounded-2xl",
          profileId === currentUserId
            ? "light-tint bg-gradient-to-r from-cyan-900/20 via-zinc-900/60 to-cyan-900/20"
            : "hover:glass-card-hover",
        )}>
        {/* --- Mobile Layout (<640px) ---
            One line per player, read like a table row: place, who, score.
            Achievements and the rig preview stay on wider screens. */}
        <div className='relative z-10 flex items-center gap-3 px-3 py-2.5 sm:hidden'>
          <span
            translate='no'
            className={cn(
              "min-w-[2rem] flex-shrink-0 text-center text-sm font-black italic tabular-nums tracking-tighter",
              isCurrentUser
                ? "text-cyan-400"
                : place <= 3
                  ? "text-zinc-100"
                  : "text-zinc-500",
            )}>
            #{place}
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
                isCurrentUser ? "text-cyan-400" : "text-white",
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
                "text-base font-black tabular-nums leading-tight tracking-tight",
                isCurrentUser ? "text-cyan-400" : "text-zinc-100",
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

        <div className='relative z-10 hidden items-center gap-3 p-4 sm:flex sm:gap-5 sm:p-5 lg:gap-8 lg:p-6'>
          <div
            translate='no'
            className={`flex h-10 w-10 flex-shrink-0 items-center justify-center text-lg font-black italic tracking-tighter sm:h-12 sm:w-12 sm:text-xl lg:h-14 lg:w-14 lg:text-2xl ${
              profileId === currentUserId
                ? "text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.3)]"
                : place <= 3
                  ? "text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]"
                  : "text-zinc-500 group-hover:text-zinc-400"
            }`}>
            #{place}
          </div>

          {/* Avatar */}
          <Link href={`/user/${profileId}`} className='flex-shrink-0'>
            <div className='relative transition-transform duration-base'>
              <Avatar
                avatarURL={userAvatar}
                name={nick}
              />
            </div>
          </Link>

          {/* User Info */}
          <div className='min-w-0 flex-1'>
            <div className='mb-1.5 flex flex-wrap items-center gap-x-4 gap-y-1'>
              <Link
                href={`/user/${profileId}`}
                className='group/link flex min-w-0 items-center gap-2'>
                <h3
                  translate='no'
                  className={`truncate text-lg font-bold tracking-tight transition-colors group-hover/link:underline lg:text-xl ${
                    profileId === currentUserId
                      ? "text-cyan-300"
                      : "text-zinc-200 group-hover:text-white"
                  }`}>
                  {shortenNick(nick)}
                </h3>
                <ExternalLink size='1em' className='flex-shrink-0 text-xs opacity-30 transition-all duration-base group-hover/link:opacity-100 sm:text-sm' />
              </Link>

              <div
                translate='no'
                className={`flex w-fit flex-shrink-0 items-center gap-1.5 rounded-sm px-3 py-1 ${
                  profileId === currentUserId
                    ? "bg-cyan-500/10 text-cyan-300 ring-1 ring-cyan-500/30"
                    : "bg-zinc-800 text-zinc-400 ring-1 ring-white/5"
                }`}>
                <span className='text-xs font-bold opacity-70'>
                  LVL
                </span>
                <span className='text-base font-bold'>{statistics.lvl}</span>
              </div>

              <GuildTagBadge badge={guildBadge} size='md' />
            </div>

            <div translate='no' className='font-medium'>
              <DaySinceMessage date={new Date(statistics.lastReportDate)} />
            </div>
          </div>

          {/* Stats */}
          {variant === "gear" ? (
            <div className='flex items-center gap-8 lg:gap-12'>
              <div className='text-center'>
                <div
                  className={`text-xl font-black tracking-tight lg:text-2xl ${
                    profileId === currentUserId
                      ? "text-cyan-300"
                      : "text-white transition-transform duration-base"
                  }`}>
                  {rigLevel.toLocaleString()}
                </div>
                <div className='text-[10px] font-bold tracking-wider text-zinc-500 group-hover:text-zinc-400'>
                  {t("rig_level")}
                </div>
              </div>

              <div className='text-center'>
                <div
                  className={`text-xl font-bold lg:text-2xl ${
                    profileId === currentUserId
                      ? "text-cyan-300"
                      : "text-zinc-300 group-hover:text-white"
                  }`}>
                  {guitarsOwned}
                </div>
                <div className='text-[10px] font-bold tracking-wider text-zinc-500 group-hover:text-zinc-400'>
                  {t("guitars")}
                </div>
              </div>

              <div className='text-center'>
                <div
                  className={`text-xl font-bold lg:text-2xl ${
                    profileId === currentUserId
                      ? "text-cyan-300"
                      : "text-zinc-300 group-hover:text-white"
                  }`}>
                  {effectsOwned}
                </div>
                <div className='text-[10px] font-bold tracking-wider text-zinc-500 group-hover:text-zinc-400'>
                  {t("effects")}
                </div>
              </div>
            </div>
          ) : (
            <div className='flex items-center gap-8 lg:gap-12'>
              <div className='text-center'>
                <div
                  className={`text-xl font-black tracking-tight lg:text-2xl ${
                    profileId === currentUserId
                      ? "text-cyan-300"
                      : "text-white transition-transform duration-base"
                  }`}>
                  {statistics.points.toLocaleString()}
                </div>
                <div className='text-[10px] font-bold tracking-wider text-zinc-500 group-hover:text-zinc-400'>
                  {t("points")}
                </div>
              </div>

              <div className='text-center'>
                <div
                  className={`text-xl font-bold lg:text-2xl ${
                    profileId === currentUserId
                      ? "text-cyan-300"
                      : "text-zinc-300 group-hover:text-white"
                  }`}>
                  {practiceHours}
                </div>
                <div className='text-[10px] font-bold tracking-wider text-zinc-500 group-hover:text-zinc-400'>
                  {t("exercise_time")}
                </div>
              </div>
            </div>
          )}

          {/* Rig Guitars / Achievements - Desktop */}
          {variant === "gear" ? (
            <div className='hidden flex-shrink-0 opacity-90 transition-opacity duration-base group-hover:opacity-100 xl:block'>
              <RigGuitarsPreview arsenal={arsenal} />
            </div>
          ) : (
            <div className='hidden flex-shrink-0 opacity-80 transition-opacity duration-base group-hover:opacity-100 xl:block'>
              <AchievementsCarousel achievements={statistics.achievements} />
            </div>
          )}
        </div>
      </div>
    </li>
  );
};
