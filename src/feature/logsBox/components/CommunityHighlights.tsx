import { useQuery } from "@tanstack/react-query";
import { cn } from "assets/lib/utils";
import Avatar from "components/UI/Avatar";
import { ChallengeCover } from "feature/challenges/components/ChallengeCover";
import { useCurrentChallenge } from "feature/challenges/hooks/useChallenges";
import type { ChallengeSong } from "feature/challenges/types/challenge.types";
import { daysLeftInChallenge } from "feature/challenges/utils/challengeMonth";
import { SearchingDots } from "feature/duels/components/DuelBits";
import { useNow } from "feature/duels/hooks/useDuels";
import {
  fetchImprovOverview,
  improvOverviewQueryKey,
} from "feature/improv/services/improv.service";
import { youtubeThumbnail } from "feature/improv/utils/improvLink";
import { formatLogTime } from "feature/logs/utils/formatLogTime";
import type { AnyFirebaseLog } from "feature/logs/utils/groupConsecutiveLogs";
import {
  buildCommunityHighlights,
  type CommunityHighlight,
} from "feature/logsBox/utils/communityHighlights";
import { useTranslation } from "hooks/useTranslation";
import { useDateFnsLocale } from "lib/i18n/dateLocale";
import type { Translate } from "lib/i18n/translate";
import { ChevronRight, type LucideIcon, Shield, Skull } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

/** The strip is a glance, not the improv page: no need to keep it to the minute. */
const IMPROV_STALE_TIME = 10 * 60 * 1000;

interface CellText {
  label: string;
  title: string;
  href: string | null;
}

const cellText = (item: CommunityHighlight, t: Translate): CellText => {
  switch (item.kind) {
    case "improv":
      return {
        label: t("highlights.improv_label"),
        title: t("highlights.improv_title", { name: item.userName }),
        href: "/improv",
      };
    case "challenge":
      return {
        label: t("highlights.challenge_label"),
        title: t("highlights.challenge_title", {
          count: item.submissionCount,
        }),
        href: "/challenges",
      };
    case "duelWaiting":
      return {
        label: t("duel_waiting_label"),
        title: t("duel_waiting_title"),
        href: "/duels",
      };
    case "duelResult":
      return {
        label: t("duel_finished"),
        title: t(item.isDraw ? "highlights.duel_draw" : "highlights.duel_won", {
          winner: item.winner,
          loser: item.loser,
        }),
        href: "/duels",
      };
    case "boss":
      return {
        label: t("highlights.boss_label"),
        title: t("highlights.boss_title", {
          name: item.userName,
          boss: item.bossTitle,
          phase: item.phase,
        }),
        href: "/bosses",
      };
    case "guild":
    default:
      return {
        label: t("guild_level_up"),
        title: t("guild_reached_level", {
          guild: item.guildName,
          level: item.level,
        }),
        href: "/guilds",
      };
  }
};

const MEDIA_CLASS = "h-11 shrink-0 overflow-hidden rounded-lg bg-zinc-800";

/** A plain tile for the kinds that have no picture of their own. */
const IconTile = ({ children }: { children: React.ReactNode }) => (
  <span
    className={cn(
      MEDIA_CLASS,
      "flex w-11 items-center justify-center text-zinc-400",
    )}>
    {children}
  </span>
);

/** A player's face with a small mark of what they did in the corner. */
const PlayerTile = ({
  name,
  avatarUrl,
  mark: Mark,
  markClassName,
}: {
  name: string;
  avatarUrl: string | null;
  mark: LucideIcon;
  markClassName: string;
}) => (
  <span className='relative flex h-11 w-11 shrink-0 items-center justify-center'>
    <Avatar name={name} avatarURL={avatarUrl ?? undefined} size='sm' />
    <span className='absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-zinc-900'>
      <Mark className={cn("h-3 w-3", markClassName)} aria-hidden='true' />
    </span>
  </span>
);

/**
 * What a cell leads with — something real wherever there is something: the
 * backing track's thumbnail, the board's covers, the players' faces.
 */
const CellMedia = ({
  item,
  challengeSongs,
}: {
  item: CommunityHighlight;
  challengeSongs: ChallengeSong[];
}) => {
  switch (item.kind) {
    case "improv":
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={youtubeThumbnail(item.youtubeId)}
          alt=''
          loading='lazy'
          className={cn(MEDIA_CLASS, "w-[4.5rem] object-cover")}
        />
      );
    case "challenge":
      return (
        <ChallengeCover
          songs={challengeSongs}
          iconSize={18}
          className={cn(MEDIA_CLASS, "w-11")}
        />
      );
    case "duelWaiting":
      return (
        <IconTile>
          <SearchingDots />
        </IconTile>
      );
    case "duelResult":
      return (
        <span className='flex shrink-0 items-center -space-x-3' aria-hidden='true'>
          <Avatar
            name={item.winner}
            avatarURL={item.winnerAvatar ?? undefined}
            size='sm'
            className='relative z-10 rounded-full ring-2 ring-zinc-900'
          />
          <Avatar
            name={item.loser}
            avatarURL={item.loserAvatar ?? undefined}
            size='sm'
            className={cn("rounded-full", !item.isDraw && "opacity-60")}
          />
        </span>
      );
    case "boss":
      return (
        <PlayerTile
          name={item.userName}
          avatarUrl={item.avatarUrl}
          mark={Skull}
          markClassName='text-zinc-300'
        />
      );
    case "guild":
    default:
      return (
        <IconTile>
          <Shield className='h-5 w-5' aria-hidden='true' />
        </IconTile>
      );
  }
};

interface CommunityHighlightsProps {
  logs: AnyFirebaseLog[];
  currentUserId: string;
  className?: string;
}

/**
 * The freshest things going on in the community, as a row of cells sharing the
 * line with Live Now — so it costs the feed no height. Desktop only: the caller
 * hides it on phones and does not mount it there.
 */
export const CommunityHighlights = ({
  logs,
  currentUserId,
  className,
}: CommunityHighlightsProps) => {
  const { t } = useTranslation("feed");
  const locale = useDateFnsLocale();
  const now = useNow();

  // Same cache entry as the improv page, so a visit there refreshes this too.
  const { data: improv } = useQuery({
    queryKey: improvOverviewQueryKey(currentUserId || null),
    queryFn: fetchImprovOverview,
    enabled: !!currentUserId,
    staleTime: IMPROV_STALE_TIME,
    refetchOnWindowFocus: false,
  });
  const { data: challenge } = useCurrentChallenge();

  const highlights = useMemo(() => {
    const lastTake =
      improv?.round && improv.takes.length > 0
        ? improv.takes.reduce((latest, take) =>
            take.createdAt > latest.createdAt ? take : latest,
          )
        : null;

    return buildCommunityHighlights({
      logs,
      improvTake:
        lastTake && improv?.round
          ? {
              userName: lastTake.userName,
              createdAt: lastTake.createdAt,
              trackTitle: improv.round.title,
              youtubeId: improv.round.youtubeId,
            }
          : null,
      challenge: challenge
        ? {
            daysLeft: daysLeftInChallenge(challenge.id, new Date(now)),
            submissionCount: challenge.submissionCount ?? 0,
          }
        : null,
      now,
    });
  }, [logs, improv, challenge, now]);

  if (highlights.length === 0) return null;

  return (
    <div
      className={cn(
        "min-w-0 flex-1 grid-cols-3 gap-2 xl:grid-cols-4",
        className,
      )}>
      {highlights.map((item, index) => {
        const { label, title, href } = cellText(item, t);
        const isUrgent = item.kind === "challenge" && item.isUrgent;
        const meta =
          item.kind === "challenge"
            ? t("highlights.days_left", { count: item.daysLeft })
            : formatLogTime(new Date(item.at), new Date(now), {
                locale,
                justNow: t("just_now"),
              });

        const body = (
          <>
            <CellMedia item={item} challengeSongs={challenge?.songs ?? []} />
            <span className='flex min-w-0 flex-1 flex-col gap-1'>
              <span className='truncate text-xs font-medium text-zinc-400'>
                {label}
              </span>
              {/* Two lines before it is cut: on the narrower desktop row a
                  one-line title lost its second half ("posted a …"). */}
              <span className='line-clamp-2 text-sm font-semibold leading-snug text-zinc-100'>
                {title}
              </span>
              <span
                className={cn(
                  "truncate text-xs",
                  isUrgent ? "font-semibold text-orange-400" : "text-zinc-500",
                )}>
                {meta}
              </span>
            </span>
          </>
        );
        // The narrower desktop row fits three cells; the fourth waits for xl.
        const cellClass = cn(
          "flex min-w-0 items-center gap-3 rounded-lg bg-zinc-900/60 p-2.5 pr-3.5",
          index === 3 && "hidden xl:flex",
        );

        return href ? (
          <Link
            key={item.kind}
            href={href}
            title={title}
            className={cn(
              cellClass,
              "transition-colors hover:bg-zinc-800/70 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
            )}>
            {body}
            <ChevronRight
              aria-hidden
              className='h-4 w-4 shrink-0 text-zinc-400'
            />
          </Link>
        ) : (
          <div key={item.kind} title={title} className={cellClass}>
            {body}
          </div>
        );
      })}
    </div>
  );
};
