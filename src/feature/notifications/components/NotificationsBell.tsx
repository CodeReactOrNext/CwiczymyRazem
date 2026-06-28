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
import { ArrowRight,Bell, Clock, Gem, Heart, MessageSquare, Store,Trophy, Zap } from "lucide-react";
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
    icon: <Heart className="h-3 w-3 text-white fill-current" />,
    bg: "bg-red-500",
    label: (_n: any) => "liked your recording",
  },
  comment: {
    icon: <MessageSquare className="h-3 w-3 text-white fill-current" />,
    bg: "bg-cyan-500",
    label: (_n: any) => "commented on your recording",
  },
  reaction: {
    icon: <img src="/images/coin.png" alt="coin" className="h-3 w-3 object-contain" />,
    bg: "bg-amber-500/20",
    label: (_n: any) => (
      <span className="inline-flex items-center gap-1">
        motivated you and gave you +10
        <img src="/images/coin.png" alt="coin" className="h-3 w-3 object-contain" />
      </span>
    ),
  },
  season_reward: {
    icon: <Trophy className="h-3 w-3 text-white fill-current" />,
    bg: "bg-amber-500",
    label: (n: any) =>
      `You earned ${n.fameAwarded} fame for ${n.place}${placeSuffix(n.place)} place!`,
  },
  season_start: {
    icon: <Zap className="h-3 w-3 text-white fill-current" />,
    bg: "bg-green-500",
    label: (_n: any) => "A new season has started!",
  },
  marketplace_sold: {
    icon: <Store className="h-3 w-3 text-white" />,
    bg: "bg-amber-500",
    label: (n: any) => (
      <span className="inline-flex items-center gap-1 flex-wrap">
        Your {n.itemName ? <span className="font-semibold text-white">{n.itemName}</span> : "item"} sold for +{n.fameAwarded}
        <img src="/images/coin.png" alt="coin" className="h-3 w-3 object-contain" />
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
  const notificationHref = (n: any): string | null =>
    n.type === "marketplace_sold" ? "/arsenal?tab=market" : null;

  const handleNotificationClick = (n: any) => {
    markAsRead(n.id);
    const href = notificationHref(n);
    if (href) {
      setIsOpen(false);
      router.push(href);
    }
  };
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
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
          className="relative flex items-center gap-2 px-2.5 py-2 rounded-[8px] bg-white/5 hover:bg-white/10 transition-colors outline-none overflow-hidden focus-visible:ring-1 focus-visible:ring-white/20 data-[state=open]:bg-white/10 data-[state=open]:ring-1 data-[state=open]:ring-white/15 group">
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
                className="pointer-events-none absolute h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/50"
              />
            ))}
          </AnimatePresence>
          <Bell
            className={cn(
              "h-4 w-4 text-zinc-400 group-hover:text-white transition-colors",
              "group-data-[state=open]:text-white"
            )}
          />
          {unreadCount > 0 && (
            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-[4px] bg-red-500/20 px-1.5 text-[12px] font-bold text-red-400 select-none">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </motion.button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-[380px] max-w-[calc(100vw-1.5rem)] rounded-2xl bg-zinc-900/95 backdrop-blur-xl border border-white/10 text-white p-0 overflow-hidden shadow-2xl shadow-black/60"
        align="start"
        sideOffset={10}
        collisionPadding={12}>
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-4 py-3.5 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-zinc-300">
              <Bell className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold leading-none text-white">Notifications</h3>
              {unreadCount > 0 && (
                <p className="mt-1.5 text-[11px] font-medium text-zinc-500">
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
              className="shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-cyan-400 transition-colors hover:bg-cyan-500/10 hover:text-cyan-300">
              Mark all read
            </button>
          )}
        </div>

        {/* List */}
        <div className="max-h-[60vh] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-track]:bg-transparent">
          {isLoading ? (
            <div className="flex flex-col gap-3 p-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3 items-start animate-pulse">
                  <div className="h-10 w-10 rounded-full bg-zinc-800 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-zinc-800 rounded w-3/4" />
                    <div className="h-3 bg-zinc-800 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-16 text-center flex flex-col items-center gap-4">
              <div className="p-4 rounded-full bg-zinc-800/60 text-zinc-600">
                <Bell className="h-7 w-7" />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-400">
                  No notifications yet
                </p>
                <p className="text-xs text-zinc-600 mt-1">
                  Activity from friends will appear here
                </p>
              </div>
            </div>
          ) : (
            <div>
              {notifications.map((n) => {
                const config = typeConfig[n.type as keyof typeof typeConfig] ?? typeConfig.reaction;
                const isSystemNotif =
                  n.type === "season_reward" ||
                  n.type === "season_start" ||
                  n.type === "marketplace_sold";
                return (
                  <button
                    key={n.id}
                    className={cn(
                      "relative w-full flex gap-3.5 items-start px-4 py-3.5 text-left transition-colors border-b border-white/5 last:border-0",
                      n.isRead
                        ? "hover:bg-white/[0.04]"
                        : "bg-cyan-500/[0.06] hover:bg-cyan-500/[0.1] before:absolute before:left-0 before:top-0 before:h-full before:w-0.5 before:bg-cyan-400"
                    )}
                    onClick={() => handleNotificationClick(n)}>
                    {/* Avatar or system icon + type badge */}
                    <div className="relative w-10 h-10 shrink-0 mt-0.5">
                      {isSystemNotif ? (
                        <div className={cn("absolute inset-0 rounded-full flex items-center justify-center", config.bg)}>
                          {config.icon}
                        </div>
                      ) : (
                        <>
                          <div className="absolute inset-0">
                            <Avatar
                              name={n.senderName ?? ""}
                              avatarURL={n.senderAvatarUrl || undefined}
                              lvl={n.senderFrame}
                              size="sm"
                            />
                          </div>
                          {n.type !== "reaction" && (
                            <div
                              className={cn(
                                "absolute -bottom-1 -right-1 h-5 w-5 rounded-full flex items-center justify-center ring-2 ring-zinc-900/95 z-10",
                                config.bg
                              )}>
                              {config.icon}
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-zinc-300 leading-snug">
                        {!isSystemNotif && n.senderName && (
                          <>
                            <span className="font-semibold text-white">{n.senderName}</span>{" "}
                          </>
                        )}
                        {config.label(n)}
                      </p>
                      {n.recordingTitle && n.type !== "reaction" && (
                        <p className="text-xs text-zinc-500 truncate mt-1 italic">
                          &ldquo;{n.recordingTitle}&rdquo;
                        </p>
                      )}
                      {n.type === "season_reward" && (
                        <p className="text-xs text-amber-400/70 flex items-center gap-1 mt-1">
                          <Gem className="h-3 w-3" />
                          Season {n.seasonId}
                        </p>
                      )}
                      {n.type === "marketplace_sold" && (
                        <p className="text-xs text-amber-400/80 flex items-center gap-1 mt-1 font-medium">
                          Open Market
                          <ArrowRight className="h-3 w-3" />
                        </p>
                      )}
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <Clock className="h-3 w-3 text-zinc-600" />
                        <span className="text-xs text-zinc-600">
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
                      <div className="h-2 w-2 rounded-full bg-cyan-400 shrink-0 mt-2 shadow-[0_0_8px] shadow-cyan-400/50" />
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
