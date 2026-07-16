import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "assets/components/ui/dropdown-menu";
import { cn } from "assets/lib/utils";
import Avatar from "components/UI/Avatar";
import { formatDistanceToNow } from "date-fns";
import { useAppNotifications } from "feature/notifications/hooks/useAppNotifications";
import { selectUserAuth } from "feature/user/store/userSlice";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Bell,
  Clock,
  Dumbbell,
  Gem,
  Heart,
  HeartHandshake,
  ListMusic,
  MessageSquare,
  Store,
  Trophy,
  Zap,
} from "lucide-react";
import { useRouter } from "next/router";
import { useRef, useState } from "react";
import { useAppSelector } from "store/hooks";

const placeSuffix = (place: number) => {
  if (place === 1) return "st";
  if (place === 2) return "nd";
  if (place === 3) return "rd";
  return "th";
};

const typeConfig = {
  like: {
    icon: <Heart className='h-3 w-3 fill-current text-white' />,
    bg: "bg-red-500",
    label: (_n: any) => "liked your recording",
  },
  comment: {
    icon: <MessageSquare className='h-3 w-3 fill-current text-white' />,
    bg: "bg-cyan-500",
    label: (_n: any) => "commented on your recording",
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
    label: (_n: any) => (
      <span className='inline-flex items-center gap-1'>
        motivated you and gave you +10
        <img
          src='/images/coin.png'
          alt='coin'
          className='h-3 w-3 object-contain'
        />
      </span>
    ),
  },
  season_reward: {
    icon: <Trophy className='h-3 w-3 fill-current text-white' />,
    bg: "bg-amber-500",
    label: (n: any) =>
      `You earned ${n.fameAwarded} fame for ${n.place}${placeSuffix(n.place)} place!`,
  },
  season_start: {
    icon: <Zap className='h-3 w-3 fill-current text-white' />,
    bg: "bg-green-500",
    label: (_n: any) => "A new season has started!",
  },
  marketplace_sold: {
    icon: <Store className='h-3 w-3 text-white' />,
    bg: "bg-amber-500",
    label: (n: any) => (
      <span className='inline-flex flex-wrap items-center gap-1'>
        bought your{" "}
        {n.itemName ? (
          <span className='font-semibold text-white'>{n.itemName}</span>
        ) : (
          "item"
        )}{" "}
        for +{n.fameAwarded}
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
    label: (n: any) => (
      <span className='inline-flex flex-wrap items-center gap-1'>
        saved your playlist{" "}
        {n.playlistName ? (
          <span className='font-semibold text-white'>{n.playlistName}</span>
        ) : (
          ""
        )}{" "}
        — you got +{n.fameAwarded}
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
    label: (n: any) => (
      <span className='inline-flex flex-wrap items-center gap-1'>
        liked your playlist{" "}
        {n.playlistName ? (
          <span className='font-semibold text-white'>{n.playlistName}</span>
        ) : (
          ""
        )}{" "}
        — you got +{n.fameAwarded}
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
    label: (n: any) => (
      <span className='inline-flex flex-wrap items-center gap-1'>
        thanked you for{" "}
        {n.exerciseTitle ? (
          <span className='font-semibold text-white'>{n.exerciseTitle}</span>
        ) : (
          "your exercise"
        )}{" "}
        — you got +{n.fameAwarded}
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
    label: (n: any) => (
      <span className='inline-flex flex-wrap items-center gap-1'>
        practiced your exercise{" "}
        {n.exerciseTitle ? (
          <span className='font-semibold text-white'>{n.exerciseTitle}</span>
        ) : (
          ""
        )}{" "}
        — you got +{n.fameAwarded}
        <img
          src='/images/coin.png'
          alt='coin'
          className='h-3 w-3 object-contain'
        />
      </span>
    ),
  },
};

export const NotificationsBell = () => {
  const userId = useAppSelector(selectUserAuth);
  const { notifications, unreadCount, markAsRead, markAllAsRead, isLoading } =
    useAppNotifications(userId);
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  // Where (if anywhere) a notification deep-links when clicked.
  const notificationHref = (n: any): string | null => {
    if (n.type === "marketplace_sold") return "/arsenal?tab=market";
    if (
      (n.type === "playlist_saved" || n.type === "playlist_liked") &&
      n.playlistId
    )
      return `/songs?view=playlists&playlistId=${n.playlistId}`;
    if (n.type === "exercise_thanked" || n.type === "exercise_completed")
      return "/profile/skills?tab=community";
    return null;
  };

  const handleNotificationClick = (n: any) => {
    markAsRead(n.id);
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
          className='group relative flex items-center gap-2 overflow-hidden rounded-[8px] bg-white/5 px-2.5 py-2 outline-none transition-colors focus-visible:ring-1 focus-visible:ring-white/20 data-[state=open]:bg-white/10 data-[state=open]:ring-1 data-[state=open]:ring-white/15 hover:bg-white/10'>
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
            <span className='flex h-5 min-w-[20px] select-none items-center justify-center rounded-[4px] bg-red-500/20 px-1.5 text-[12px] font-bold text-red-400'>
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
                Notifications
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
              Mark all read
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
                  No notifications yet
                </p>
                <p className='mt-1 text-xs text-zinc-600'>
                  Activity from friends will appear here
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
                        {config.label(n)}
                      </p>
                      {n.recordingTitle && n.type !== "reaction" && (
                        <p className='mt-1 truncate text-xs italic text-zinc-500'>
                          &ldquo;{n.recordingTitle}&rdquo;
                        </p>
                      )}
                      {n.type === "season_reward" && (
                        <p className='mt-1 flex items-center gap-1 text-xs text-amber-400/70'>
                          <Gem className='h-3 w-3' />
                          Season {n.seasonId}
                        </p>
                      )}
                      {n.type === "marketplace_sold" && (
                        <p className='mt-1 flex items-center gap-1 text-xs font-medium text-amber-400/80'>
                          Open Market
                          <ArrowRight className='h-3 w-3' />
                        </p>
                      )}
                      {(n.type === "playlist_saved" ||
                        n.type === "playlist_liked") &&
                        n.playlistId && (
                          <p className='mt-1 flex items-center gap-1 text-xs font-medium text-emerald-400/80'>
                            Open playlist
                            <ArrowRight className='h-3 w-3' />
                          </p>
                        )}
                      {(n.type === "exercise_thanked" ||
                        n.type === "exercise_completed") && (
                        <p className='mt-1 flex items-center gap-1 text-xs font-medium text-cyan-400/80'>
                          Open Community library
                          <ArrowRight className='h-3 w-3' />
                        </p>
                      )}
                      <div className='mt-1.5 flex items-center gap-1.5'>
                        <Clock className='h-3 w-3 text-zinc-600' />
                        <span className='text-xs text-zinc-600'>
                          {n.timestamp?.toDate
                            ? formatDistanceToNow(n.timestamp.toDate(), {
                                addSuffix: true,
                              })
                            : "just now"}
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
