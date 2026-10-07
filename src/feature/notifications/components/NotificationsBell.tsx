import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "assets/components/ui/dropdown-menu";
import { cn } from "assets/lib/utils";
import Avatar from "components/UI/Avatar";
import { formatDistanceToNow } from "date-fns";
import { useCommunityDrawer } from "feature/logsBox/hooks/useCommunityDrawer";
import { useAppNotifications } from "feature/notifications/hooks/useAppNotifications";
import {
  notificationChatTab,
  notificationHref,
  placeSuffix,
} from "feature/notifications/services/notification.service";
import { selectUserAuth } from "feature/user/store/userSlice";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "hooks/useTranslation";
import { useDateFnsLocale } from "lib/i18n/dateLocale";
import { Interpolate } from "lib/i18n/Interpolate";
import type { Translate } from "lib/i18n/translate";
import {
  ArrowRight,
  AtSign,
  Bell,
  Clock,
  Dumbbell,
  Gem,
  Heart,
  HeartHandshake,
  ListMusic,
  Map as MapIcon,
  Medal,
  MessageSquare,
  Reply,
  Store,
  Trophy,
  Zap,
} from "lucide-react";
import { useRouter } from "next/router";
import { useRef, useState } from "react";
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

const typeConfig = {
  chat_mention: {
    icon: <AtSign className='h-3 w-3 text-white' />,
    bg: "bg-cyan-500",
    label: chatLabel("mentioned"),
  },
  chat_reply: {
    icon: <Reply className='h-3 w-3 text-white' />,
    bg: "bg-cyan-500",
    label: chatLabel("replied"),
  },
  like: {
    icon: <Heart className='h-3 w-3 fill-current text-white' />,
    bg: "bg-red-500",
    label: (_n: any, t: Translate) => t("bell.like"),
  },
  comment: {
    icon: <MessageSquare className='h-3 w-3 fill-current text-white' />,
    bg: "bg-cyan-500",
    label: (_n: any, t: Translate) => t("bell.comment"),
  },
  reaction: {
    icon: (
      <img
        src='/images/coin.png'
        alt='coin'
        className='h-3 w-3 object-contain'
      />
    ),
    bg: "bg-amber-500/20",
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
    icon: <Trophy className='h-3 w-3 fill-current text-white' />,
    bg: "bg-amber-500",
    label: (n: any, t: Translate) =>
      t("bell.season_reward", {
        fame: n.fameAwarded,
        place: t("bell.ordinal", { place: n.place, suffix: placeSuffix(n.place) }),
      }),
  },
  season_start: {
    icon: <Zap className='h-3 w-3 fill-current text-white' />,
    bg: "bg-green-500",
    label: (_n: any, t: Translate) => t("bell.season_start"),
  },
  marketplace_sold: {
    icon: <Store className='h-3 w-3 text-white' />,
    bg: "bg-amber-500",
    label: (n: any, t: Translate) => (
      <span className='inline-flex flex-wrap items-center gap-1'>
        <Interpolate
          text={t("bell.sold")}
          values={{
            item: n.itemName ? <span className='font-semibold text-white'>{n.itemName}</span> : t("bell.item"),
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
    icon: <ListMusic className='h-3 w-3 text-white' />,
    bg: "bg-emerald-500",
    label: (n: any, t: Translate) => (
      <span className='inline-flex flex-wrap items-center gap-1'>
        <Interpolate
          text={t("bell.playlist_saved")}
          values={{ name: n.playlistName ? <span className='font-semibold text-white'>{n.playlistName}</span> : "" }}
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
    icon: <Heart className='h-3 w-3 fill-current text-white' />,
    bg: "bg-rose-500",
    label: (n: any, t: Translate) => (
      <span className='inline-flex flex-wrap items-center gap-1'>
        <Interpolate
          text={t("bell.playlist_liked")}
          values={{ name: n.playlistName ? <span className='font-semibold text-white'>{n.playlistName}</span> : "" }}
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
    icon: <HeartHandshake className='h-3 w-3 text-white' />,
    bg: "bg-amber-500",
    label: (n: any, t: Translate) => (
      <span className='inline-flex flex-wrap items-center gap-1'>
        <Interpolate
          text={t("bell.exercise_thanked")}
          values={{ name: n.exerciseTitle ? <span className='font-semibold text-white'>{n.exerciseTitle}</span> : t("bell.exercise_thanked_fallback") }}
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
    icon: <Dumbbell className='h-3 w-3 text-white' />,
    bg: "bg-emerald-500",
    label: (n: any, t: Translate) => (
      <span className='inline-flex flex-wrap items-center gap-1'>
        <Interpolate
          text={t("bell.exercise_completed")}
          values={{ name: n.exerciseTitle ? <span className='font-semibold text-white'>{n.exerciseTitle}</span> : "" }}
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
    icon: <Trophy className='h-3 w-3 fill-current text-white' />,
    bg: "bg-amber-500",
    label: (n: any, t: Translate) => (
      <span>
        <Interpolate
          text={t("bell.daily_win")}
          values={{ prize: <span className='font-semibold text-white'>{n.prizeName ?? t("bell.your_prize")}</span> }}
        />
      </span>
    ),
  },
  daily_exercise_place: {
    icon: <Medal className='h-3 w-3 text-white' />,
    bg: "bg-cyan-500",
    label: (n: any, t: Translate) => (
      <span>
        <Interpolate
          text={t("bell.daily_place")}
          values={{
            place: <span className='font-semibold text-white'>{t("bell.ordinal", { place: n.place, suffix: placeSuffix(n.place) })}</span>,
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
  roadmap_ready: {
    icon: <MapIcon className='h-3 w-3 text-white' />,
    bg: "bg-cyan-500",
    label: (n: any, t: Translate) => (
      <span>
        {t("bell.roadmap_ready")}
        {n.roadmapGoal ? (
          <>
            {": "}
            <span className='font-semibold text-white'>{n.roadmapGoal}</span>
          </>
        ) : null}
      </span>
    ),
  },
};

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
  const [ripples, setRipples] = useState<
    { id: number; x: number; y: number }[]
  >([]);
  const rippleId = useRef(0);

  const spawnRipple = (e: React.PointerEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const id = rippleId.current++;
    setRipples((prev) => [
      ...prev,
      { id, x: e.clientX - rect.left, y: e.clientY - rect.top },
    ]);
  };

  const removeRipple = (id: number) =>
    setRipples((prev) => prev.filter((r) => r.id !== id));

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <motion.button
          onPointerDown={spawnRipple}
          whileTap={{ scale: 0.88 }}
          transition={{ type: "spring", stiffness: 500, damping: 25 }}
          aria-label={unreadCount > 0 ? t("bell.aria_unread", { count: unreadCount }) : t("bell.aria")}
          className='group relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-[8px] bg-white/5 outline-none transition-colors focus-visible:ring-1 focus-visible:ring-white/20 data-[state=open]:bg-white/10 data-[state=open]:ring-1 data-[state=open]:ring-white/15 hover:bg-white/10'>
          <AnimatePresence>
            {ripples.map((r) => (
              <motion.span
                key={r.id}
                initial={{ scale: 0, opacity: 0.6 }}
                animate={{ scale: 2.5, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.55, ease: "easeOut" }}
                onAnimationComplete={() => removeRipple(r.id)}
                style={{ left: r.x, top: r.y }}
                className='pointer-events-none absolute h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/50'
              />
            ))}
          </AnimatePresence>
          <Bell
            className={cn(
              "h-4 w-4 text-zinc-400 transition-colors group-hover:text-white",
              "group-data-[state=open]:text-white",
            )}
          />
          {unreadCount > 0 && (
            <span className='absolute right-0.5 top-0.5 flex h-4 min-w-[16px] select-none items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white'>
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </motion.button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className='w-[380px] max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/95 p-0 text-white shadow-2xl shadow-black/60 backdrop-blur-xl'
        align='start'
        sideOffset={10}
        collisionPadding={12}>
        {/* Header */}
        <div className='flex items-center justify-between gap-3 border-b border-white/10 bg-white/[0.02] px-4 py-3.5'>
          <div className='flex items-center gap-2.5'>
            <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-zinc-300'>
              <Bell className='h-4 w-4' />
            </div>
            <div>
              <h3 className='text-sm font-bold leading-none text-white'>
                {t("bell.title")}
              </h3>
              {unreadCount > 0 && (
                <p className='mt-1.5 text-[11px] font-medium text-zinc-500'>
                  {unreadCount} unread
                </p>
              )}
            </div>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={(e) => {
                e.preventDefault();
                markAllAsRead();
              }}
              className='shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-cyan-400 transition-colors hover:bg-cyan-500/10 hover:text-cyan-300'>
              {t("bell.mark_all_read")}
            </button>
          )}
        </div>

        {/* List */}
        <div className='max-h-[60vh] overflow-y-auto [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1.5'>
          {isLoading ? (
            <div className='flex flex-col gap-3 p-4'>
              {[1, 2, 3].map((i) => (
                <div key={i} className='flex animate-pulse items-start gap-3'>
                  <div className='h-10 w-10 shrink-0 rounded-full bg-zinc-800' />
                  <div className='flex-1 space-y-2'>
                    <div className='h-3 w-3/4 rounded bg-zinc-800' />
                    <div className='h-3 w-1/2 rounded bg-zinc-800' />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className='flex flex-col items-center gap-4 py-16 text-center'>
              <div className='rounded-full bg-zinc-800/60 p-4 text-zinc-600'>
                <Bell className='h-7 w-7' />
              </div>
              <div>
                <p className='text-sm font-medium text-zinc-400'>
                  {t("bell.empty_title")}
                </p>
                <p className='mt-1 text-xs text-zinc-600'>
                  {t("bell.empty_body")}
                </p>
              </div>
            </div>
          ) : (
            <div>
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
                  // Legacy marketplace sales stored without a buyer fall back to
                  // the system (Store) icon; new ones show the buyer's avatar.
                  (n.type === "marketplace_sold" && !n.senderName);
                return (
                  <button
                    key={n.id}
                    className={cn(
                      "relative flex w-full items-start gap-3.5 border-b border-white/5 px-4 py-3.5 text-left transition-colors last:border-0",
                      n.isRead
                        ? "hover:bg-white/[0.04]"
                        : "bg-cyan-500/[0.06] before:absolute before:left-0 before:top-0 before:h-full before:w-0.5 before:bg-cyan-400 hover:bg-cyan-500/[0.1]",
                    )}
                    onClick={() => handleNotificationClick(n)}>
                    {/* Avatar or system icon + type badge */}
                    <div className='relative mt-0.5 h-10 w-10 shrink-0'>
                      {isSystemNotif ? (
                        <div
                          className={cn(
                            "absolute inset-0 flex items-center justify-center rounded-full",
                            config.bg,
                          )}>
                          {config.icon}
                        </div>
                      ) : (
                        <>
                          <div className='absolute inset-0'>
                            <Avatar
                              name={n.senderName ?? ""}
                              avatarURL={n.senderAvatarUrl || undefined}
                              lvl={n.senderFrame}
                              size='sm'
                            />
                          </div>
                          {n.type !== "reaction" && (
                            <div
                              className={cn(
                                "absolute -bottom-1 -right-1 z-10 flex h-5 w-5 items-center justify-center rounded-full ring-2 ring-zinc-900/95",
                                config.bg,
                              )}>
                              {config.icon}
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* Content */}
                    <div className='min-w-0 flex-1'>
                      <p className='text-sm leading-snug text-zinc-300'>
                        {!isSystemNotif && n.senderName && (
                          <>
                            <span className='font-semibold text-white'>
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
                      <div className='mt-1.5 flex items-center gap-1.5'>
                        <Clock className='h-3 w-3 text-zinc-600' />
                        <span className='text-xs text-zinc-600'>
                          {n.timestamp?.toDate
                            ? formatDistanceToNow(n.timestamp.toDate(), {
                                addSuffix: true,
                                locale: dateFnsLocale,
                              })
                            : t("bell.just_now")}
                        </span>
                      </div>
                    </div>

                    {/* Unread indicator */}
                    {!n.isRead && (
                      <div className='mt-2 h-2 w-2 shrink-0 rounded-full bg-cyan-400 shadow-[0_0_8px] shadow-cyan-400/50' />
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
