import { Button } from "assets/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "assets/components/ui/dropdown-menu";
import { cn } from "assets/lib/utils";
import Avatar from "components/UI/Avatar";
import { formatDistanceToNow } from "date-fns";
import { useCommunityDrawer } from "feature/logsBox/hooks/useCommunityDrawer";
import { DailyResultBoard } from "feature/notifications/components/DailyResultBoard";
import { useAppNotifications } from "feature/notifications/hooks/useAppNotifications";
import {
  notificationChatTab,
  notificationHref,
  placeSuffix,
} from "feature/notifications/services/notification.service";
import { selectUserAuth } from "feature/user/store/userSlice";
import { useTranslation } from "hooks/useTranslation";
import { useDateFnsLocale } from "lib/i18n/dateLocale";
import { Interpolate } from "lib/i18n/Interpolate";
import type { Translate } from "lib/i18n/translate";
import {
  ArrowRight,
  AtSign,
  Bell,
  CheckCheck,
  Dumbbell,
  Gem,
  Heart,
  HeartHandshake,
  Hourglass,
  ListMusic,
  Map as MapIcon,
  Medal,
  MessageSquare,
  Reply,
  Store,
  Swords,
  Trophy,
  Zap,
} from "lucide-react";
import { useRouter } from "next/router";
import { type ReactNode, useState } from "react";
import { useAppSelector } from "store/hooks";

const chatLabel = (verb: "mentioned" | "replied") =>
  function ChatNotificationLabel(n: any, t: Translate) {
    return (
      <span>
    {t(`bell.chat.${verb}_${n.chatPath?.startsWith("guilds/") ? "guild" : "chat"}`)}
    {n.messageSnippet && (
      <span className='mt-1 block truncate text-xs italic text-zinc-500'>
        &ldquo;{n.messageSnippet}&rdquo;
      </span>
    )}
      </span>
    );
  };

// The tint behind each type's icon, in the colour of what the notification is about (Fame amber,
// social cyan, success emerald) rather than a solid fill with a white glyph.
const toneClass = {
  cyan: "bg-cyan-500/10 text-cyan-400",
  amber: "bg-amber-500/10 text-amber-400",
  emerald: "bg-emerald-500/10 text-emerald-400",
  orange: "bg-orange-500/10 text-orange-400",
  rose: "bg-rose-500/10 text-rose-400",
  zinc: "bg-zinc-800 text-zinc-400",
};

const typeConfig = {
  chat_mention: {
    icon: <AtSign />,
    tone: "cyan",
    label: chatLabel("mentioned"),
  },
  chat_reply: {
    icon: <Reply />,
    tone: "cyan",
    label: chatLabel("replied"),
  },
  like: {
    icon: <Heart className='fill-current' />,
    tone: "rose",
    label: (_n: any, t: Translate) => t("bell.like"),
  },
  comment: {
    icon: <MessageSquare className='fill-current' />,
    tone: "cyan",
    label: (_n: any, t: Translate) => t("bell.comment"),
  },
  reaction: {
    icon: <img src='/images/coin.png' alt='' className='object-contain' />,
    tone: "amber",
    // Reactions recorded before the amount was stored have no number to show, so they just say
    // what happened instead of quoting one that was never actually awarded.
    label: (n: any, t: Translate) =>
      n.fameAwarded ? (
        <span className='inline-flex items-center gap-1'>
          {t("bell.reaction_fame", { fame: n.fameAwarded })}
          <img
            src='/images/coin.png'
            alt='coin'
            className='h-3 w-3 object-contain'
          />
        </span>
      ) : (
        t("bell.reaction")
      ),
  },
  season_reward: {
    icon: <Trophy className='fill-current' />,
    tone: "amber",
    label: (n: any, t: Translate) =>
      t("bell.season_reward", {
        fame: n.fameAwarded,
        place: t("bell.ordinal", { place: n.place, suffix: placeSuffix(n.place) }),
      }),
  },
  season_start: {
    icon: <Zap className='fill-current' />,
    tone: "emerald",
    label: (_n: any, t: Translate) => t("bell.season_start"),
  },
  marketplace_sold: {
    icon: <Store />,
    tone: "amber",
    label: (n: any, t: Translate) => (
      <span className='inline-flex flex-wrap items-center gap-1'>
        <Interpolate
          text={t("bell.sold")}
          values={{
            item: n.itemName ? <span className='font-semibold text-zinc-100'>{n.itemName}</span> : t("bell.item"),
            fame: `+${n.fameAwarded}`,
          }}
        />
        <img
          src='/images/coin.png'
          alt='coin'
          className='h-3 w-3 object-contain'
        />
      </span>
    ),
  },
  playlist_saved: {
    icon: <ListMusic />,
    tone: "emerald",
    label: (n: any, t: Translate) => (
      <span className='inline-flex flex-wrap items-center gap-1'>
        <Interpolate
          text={t("bell.playlist_saved")}
          values={{ name: n.playlistName ? <span className='font-semibold text-zinc-100'>{n.playlistName}</span> : "" }}
        />{" "}
        {t("bell.you_got", { fame: n.fameAwarded })}
        <img
          src='/images/coin.png'
          alt='coin'
          className='h-3 w-3 object-contain'
        />
      </span>
    ),
  },
  playlist_liked: {
    icon: <Heart className='fill-current' />,
    tone: "rose",
    label: (n: any, t: Translate) => (
      <span className='inline-flex flex-wrap items-center gap-1'>
        <Interpolate
          text={t("bell.playlist_liked")}
          values={{ name: n.playlistName ? <span className='font-semibold text-zinc-100'>{n.playlistName}</span> : "" }}
        />{" "}
        {t("bell.you_got", { fame: n.fameAwarded })}
        <img
          src='/images/coin.png'
          alt='coin'
          className='h-3 w-3 object-contain'
        />
      </span>
    ),
  },
  exercise_thanked: {
    icon: <HeartHandshake />,
    tone: "amber",
    label: (n: any, t: Translate) => (
      <span className='inline-flex flex-wrap items-center gap-1'>
        <Interpolate
          text={t("bell.exercise_thanked")}
          values={{ name: n.exerciseTitle ? <span className='font-semibold text-zinc-100'>{n.exerciseTitle}</span> : t("bell.exercise_thanked_fallback") }}
        />{" "}
        {t("bell.you_got", { fame: n.fameAwarded })}
        <img
          src='/images/coin.png'
          alt='coin'
          className='h-3 w-3 object-contain'
        />
      </span>
    ),
  },
  exercise_completed: {
    icon: <Dumbbell />,
    tone: "emerald",
    label: (n: any, t: Translate) => (
      <span className='inline-flex flex-wrap items-center gap-1'>
        <Interpolate
          text={t("bell.exercise_completed")}
          values={{ name: n.exerciseTitle ? <span className='font-semibold text-zinc-100'>{n.exerciseTitle}</span> : "" }}
        />{" "}
        {t("bell.you_got", { fame: n.fameAwarded })}
        <img
          src='/images/coin.png'
          alt='coin'
          className='h-3 w-3 object-contain'
        />
      </span>
    ),
  },
  daily_exercise_win: {
    icon: <Trophy className='fill-current' />,
    tone: "amber",
    label: (n: any, t: Translate) => (
      <span>
        <Interpolate
          text={t("bell.daily_win")}
          values={{ prize: <span className='font-semibold text-zinc-100'>{n.prizeName ?? t("bell.your_prize")}</span> }}
        />
      </span>
    ),
  },
  daily_exercise_place: {
    icon: <Medal />,
    tone: "cyan",
    label: (n: any, t: Translate) => (
      <span>
        <Interpolate
          text={t(n.players ? "bell.daily_place_of" : "bell.daily_place")}
          values={{
            place: <span className='font-semibold text-zinc-100'>{t("bell.ordinal", { place: n.place, suffix: placeSuffix(n.place) })}</span>,
            players: <span className='font-semibold text-zinc-100'>{n.players}</span>,
          }}
        />
        {n.exerciseTitle && (
          <span className='mt-1 block truncate text-xs text-zinc-500'>
            {n.exerciseTitle}
          </span>
        )}
      </span>
    ),
  },
  duel_matched: {
    icon: <Swords />,
    tone: "cyan",
    label: (n: any, t: Translate) => (
      <span>
        {t("bell.duel_matched")}
        {n.exerciseTitle && (
          <span className='mt-1 block truncate text-xs text-zinc-500'>
            {n.exerciseTitle}
          </span>
        )}
      </span>
    ),
  },
  duel_reminder: {
    icon: <Hourglass />,
    tone: "orange",
    label: (n: any, t: Translate) => (
      <span>
        {t("bell.duel_reminder")}
        {n.exerciseTitle && (
          <span className='mt-1 block truncate text-xs text-zinc-500'>
            {n.exerciseTitle}
          </span>
        )}
      </span>
    ),
  },
  duel_result: {
    icon: <Swords />,
    tone: "zinc",
    label: (n: any, t: Translate) => (
      <span>
        <Interpolate
          text={t(`bell.duel_${n.duelResult ?? "void"}`)}
          values={{ name: <span className='font-semibold text-zinc-100'>{n.opponentName ?? "?"}</span> }}
        />
        {!!n.ratingDelta && (
          <span
            className={cn(
              "ml-1.5 font-semibold tabular-nums",
              n.ratingDelta > 0 ? "text-emerald-400" : "text-zinc-400",
            )}>
            {n.ratingDelta > 0 ? "+" : ""}
            {n.ratingDelta} ELO
          </span>
        )}
      </span>
    ),
  },
  roadmap_ready: {
    icon: <MapIcon />,
    tone: "cyan",
    label: (n: any, t: Translate) => (
      <span>
        {t("bell.roadmap_ready")}
        {n.roadmapGoal ? (
          <>
            {": "}
            <span className='font-semibold text-zinc-100'>{n.roadmapGoal}</span>
          </>
        ) : null}
      </span>
    ),
  },
} satisfies Record<
  string,
  {
    icon: ReactNode;
    tone: keyof typeof toneClass;
    label: (n: any, t: Translate) => ReactNode;
  }
>;

export const NotificationsBell = () => {
  const { t } = useTranslation("notifications");
  const dateFnsLocale = useDateFnsLocale();
  const userId = useAppSelector(selectUserAuth);
  const { notifications, unreadCount, markAsRead, markAllAsRead, isLoading } =
    useAppNotifications(userId);
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const openCommunityTab = useCommunityDrawer((state) => state.openTab);

  const handleNotificationClick = (n: any) => {
    markAsRead(n.id);
    const chatTab = notificationChatTab(n);
    if (chatTab) {
      setIsOpen(false);
      openCommunityTab(chatTab);
      return;
    }
    const href = notificationHref(n);
    if (href) {
      setIsOpen(false);
      router.push(href);
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant='subtle'
          size='icon'
          aria-label={unreadCount > 0 ? t("bell.aria_unread", { count: unreadCount }) : t("bell.aria")}
          className='group h-11 w-11 data-[state=open]:bg-white/15'>
          <Bell
            className={cn(
              "text-zinc-400 transition-colors group-hover:text-white",
              "group-data-[state=open]:text-white",
            )}
          />
          {unreadCount > 0 && (
            <span className='absolute right-0.5 top-0.5 flex h-5 min-w-5 select-none items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold leading-none text-white'>
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      {/* Portalled outside the app's theme wrapper, so it brings `dark-theme` along — without it
          the initial-avatar fill (`bg-tertiary-400`) resolves to nothing and the letter vanishes.
          The base menu's zoom scales from the centre, which on a panel this tall reads as the
          whole thing swelling; it only fades and drops in from under the bell instead. */}
      <DropdownMenuContent
        className='dark-theme w-[380px] max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-lg border-white/10 bg-zinc-900 p-0 text-zinc-100 shadow-none data-[state=closed]:duration-base data-[state=open]:duration-base data-[state=closed]:zoom-out-100 data-[state=open]:zoom-in-100'
        align='start'
        sideOffset={10}
        collisionPadding={12}>
        {/* Header */}
        <div className='flex items-center justify-between gap-3 px-4 pb-2 pt-4'>
          <div className='flex items-center gap-2'>
            <h3 className='text-sm font-semibold text-zinc-100'>
              {t("bell.title")}
            </h3>
            {unreadCount > 0 && (
              <span className='rounded bg-cyan-500/10 px-1.5 py-0.5 text-xs font-semibold tabular-nums text-cyan-400'>
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={(e) => {
                e.preventDefault();
                markAllAsRead();
              }}
              className='flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'>
              <CheckCheck className='h-3.5 w-3.5' />
              {t("bell.mark_all_read")}
            </button>
          )}
        </div>

        {/* List */}
        <div className='max-h-[60vh] overflow-y-auto [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1.5'>
          {isLoading ? (
            <div className='flex flex-col gap-1 p-2'>
              {[1, 2, 3].map((i) => (
                <div key={i} className='flex animate-pulse items-start gap-3 p-3'>
                  <div className='h-10 w-10 shrink-0 rounded-full bg-zinc-800' />
                  <div className='flex-1 space-y-2 pt-1'>
                    <div className='h-3 w-3/4 rounded bg-zinc-800' />
                    <div className='h-3 w-1/2 rounded bg-zinc-800' />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className='flex flex-col items-center gap-4 px-6 pb-14 pt-10 text-center'>
              <div className='rounded-full bg-zinc-800/60 p-4 text-zinc-500'>
                <Bell className='h-6 w-6' />
              </div>
              <div>
                <p className='text-sm font-medium text-zinc-200'>
                  {t("bell.empty_title")}
                </p>
                <p className='mt-1 text-xs text-zinc-400'>
                  {t("bell.empty_body")}
                </p>
              </div>
            </div>
          ) : (
            <div className='flex flex-col gap-1 p-2'>
              {notifications.map((n) => {
                const config =
                  typeConfig[n.type as keyof typeof typeConfig] ??
                  typeConfig.reaction;
                const isSystemNotif =
                  n.type === "season_reward" ||
                  n.type === "season_start" ||
                  n.type === "roadmap_ready" ||
                  n.type === "daily_exercise_win" ||
                  n.type === "daily_exercise_place" ||
                  n.type === "duel_matched" ||
                  n.type === "duel_reminder" ||
                  n.type === "duel_result" ||
                  // Legacy marketplace sales stored without a buyer fall back to
                  // the system (Store) icon; new ones show the buyer's avatar.
                  (n.type === "marketplace_sold" && !n.senderName);
                return (
                  <button
                    key={n.id}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-lg p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                      n.isRead
                        ? "hover:bg-zinc-800/40"
                        : "bg-cyan-500/10 hover:bg-cyan-500/15",
                    )}
                    onClick={() => handleNotificationClick(n)}>
                    {/* Avatar or system icon + type badge */}
                    <div className='relative h-10 w-10 shrink-0'>
                      {isSystemNotif ? (
                        <div
                          className={cn(
                            "absolute inset-0 flex items-center justify-center rounded-full [&>*]:h-4 [&>*]:w-4",
                            toneClass[config.tone],
                          )}>
                          {config.icon}
                        </div>
                      ) : (
                        <>
                          <div className='absolute inset-0'>
                            <Avatar
                              name={n.senderName ?? ""}
                              avatarURL={n.senderAvatarUrl || undefined}
                              size='sm'
                            />
                          </div>
                          {n.type !== "reaction" && (
                            // A solid disc under the tint, so the badge reads the same over any photo.
                            <div className='absolute -bottom-1 -right-1 z-10 h-5 w-5 rounded-full bg-zinc-900 ring-2 ring-zinc-900'>
                              <div
                                className={cn(
                                  "flex h-full w-full items-center justify-center rounded-full [&>*]:h-3 [&>*]:w-3",
                                  toneClass[config.tone],
                                )}>
                                {config.icon}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* Content */}
                    <div className='min-w-0 flex-1'>
                      <p
                        className={cn(
                          "text-sm leading-snug",
                          n.isRead ? "text-zinc-400" : "text-zinc-200",
                        )}>
                        {!isSystemNotif && n.senderName && (
                          <>
                            <span className='font-semibold text-zinc-100'>
                              {n.senderName}
                            </span>{" "}
                          </>
                        )}
                        {config.label(n, t)}
                      </p>
                      {n.recordingTitle && n.type !== "reaction" && (
                        <p className='mt-1 truncate text-xs italic text-zinc-500'>
                          &ldquo;{n.recordingTitle}&rdquo;
                        </p>
                      )}
                      {(n.type === "daily_exercise_win" ||
                        n.type === "daily_exercise_place") &&
                        !!n.board?.length &&
                        n.place !== undefined && (
                          <DailyResultBoard board={n.board} place={n.place} score={n.score} t={t} />
                        )}
                      {n.type === "season_reward" && (
                        <p className='mt-1 flex items-center gap-1 text-xs text-amber-400/70'>
                          <Gem className='h-3 w-3' />
                          {t("bell.season", { id: n.seasonId })}
                        </p>
                      )}
                      {(n.type === "like" || n.type === "comment") &&
                        n.recordingId && (
                          <p className='mt-1 flex items-center gap-1 text-xs font-medium text-cyan-400/80'>
                            {t("bell.open_recording")}
                            <ArrowRight className='h-3 w-3' />
                          </p>
                        )}
                      {n.type === "marketplace_sold" && (
                        <p className='mt-1 flex items-center gap-1 text-xs font-medium text-amber-400/80'>
                          {t("bell.open_market")}
                          <ArrowRight className='h-3 w-3' />
                        </p>
                      )}
                      {(n.type === "playlist_saved" ||
                        n.type === "playlist_liked") &&
                        n.playlistId && (
                          <p className='mt-1 flex items-center gap-1 text-xs font-medium text-emerald-400/80'>
                            {t("bell.open_playlist")}
                            <ArrowRight className='h-3 w-3' />
                          </p>
                        )}
                      {(n.type === "exercise_thanked" ||
                        n.type === "exercise_completed") && (
                        <p className='mt-1 flex items-center gap-1 text-xs font-medium text-cyan-400/80'>
                          {t("bell.open_library")}
                          <ArrowRight className='h-3 w-3' />
                        </p>
                      )}
                      {n.type === "roadmap_ready" && n.roadmapId && (
                        <p className='mt-1 flex items-center gap-1 text-xs font-medium text-cyan-400/80'>
                          {t("bell.open_roadmap")}
                          <ArrowRight className='h-3 w-3' />
                        </p>
                      )}
                      {n.type === "daily_exercise_win" && (
                        <p className='mt-1 flex items-center gap-1 text-xs font-medium text-amber-400/80'>
                          {t("bell.open_arsenal")}
                          <ArrowRight className='h-3 w-3' />
                        </p>
                      )}
                      {n.type === "daily_exercise_place" && (
                        <p className='mt-1 flex items-center gap-1 text-xs font-medium text-cyan-400/80'>
                          {t("bell.play_today")}
                          <ArrowRight className='h-3 w-3' />
                        </p>
                      )}
                      {(n.type === "duel_matched" ||
                        n.type === "duel_reminder" ||
                        n.type === "duel_result") && (
                        <p className='mt-1 flex items-center gap-1 text-xs font-medium text-cyan-400/80'>
                          {t("bell.open_duel")}
                          <ArrowRight className='h-3 w-3' />
                        </p>
                      )}
                      <p
                        className={cn(
                          "mt-1.5 text-xs",
                          n.isRead ? "text-zinc-500" : "font-medium text-cyan-400",
                        )}>
                        {n.timestamp?.toDate
                          ? formatDistanceToNow(n.timestamp.toDate(), {
                              addSuffix: true,
                              locale: dateFnsLocale,
                            })
                          : t("bell.just_now")}
                      </p>
                    </div>

                    {/* Unread indicator */}
                    {!n.isRead && (
                      <div className='mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-cyan-400' />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
