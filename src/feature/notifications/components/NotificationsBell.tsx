import { Bell, MessageSquare, Heart, Clock, Gem, Trophy, Zap } from "lucide-react";
import { useState } from "react";
import { useAppNotifications } from "feature/notifications/hooks/useAppNotifications";
import { selectUserAuth } from "feature/user/store/userSlice";
import { useAppSelector } from "store/hooks";
import { cn } from "assets/lib/utils";
import Avatar from "components/UI/Avatar";
import { formatDistanceToNow } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "assets/components/ui/dropdown-menu";

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
    icon: <Zap className="h-3 w-3 text-white fill-current" />,
    bg: "bg-blue-500",
    label: (_n: any) => "reacted to your post",
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
};

export const NotificationsBell = () => {
  const userId = useAppSelector(selectUserAuth);
  const { notifications, unreadCount, markAsRead, markAllAsRead, isLoading } =
    useAppNotifications(userId);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <button className="relative p-2 rounded-full hover:bg-white/10 transition-colors group">
          <Bell
            className={cn(
              "h-5 w-5 text-zinc-400 group-hover:text-white transition-colors",
              unreadCount > 0 && "text-cyan-400"
            )}
          />
          {unreadCount > 0 && (
            <span className="absolute top-0.5 right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-cyan-500 px-1 text-[10px] font-bold text-white ring-2 ring-zinc-900">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-96 bg-zinc-900/95 backdrop-blur-xl border-white/10 text-white p-0 overflow-hidden shadow-2xl shadow-black/50"
        align="end"
        sideOffset={8}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <div>
            <h3 className="text-sm font-bold text-white">Notifications</h3>
            {unreadCount > 0 && (
              <p className="text-xs text-zinc-500 mt-0.5">
                {unreadCount} unread
              </p>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={(e) => {
                e.preventDefault();
                markAllAsRead();
              }}
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors px-3 py-1.5 rounded-lg hover:bg-cyan-500/10">
              Mark all as read
            </button>
          )}
        </div>

        {/* List */}
        <div className="max-h-[420px] overflow-y-auto">
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
                const isSystemNotif = n.type === "season_reward" || n.type === "season_start";
                return (
                  <button
                    key={n.id}
                    className={cn(
                      "w-full flex gap-4 items-start px-5 py-4 text-left transition-colors border-b border-white/5 last:border-0",
                      n.isRead
                        ? "hover:bg-white/5"
                        : "bg-cyan-500/5 hover:bg-cyan-500/8"
                    )}
                    onClick={() => markAsRead(n.id)}>
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
                              name={n.senderName}
                              avatarURL={n.senderAvatarUrl || undefined}
                              lvl={n.senderFrame}
                              size="sm"
                            />
                          </div>
                          <div
                            className={cn(
                              "absolute -bottom-1 -right-1 h-5 w-5 rounded-full flex items-center justify-center ring-2 ring-zinc-900/95 z-10",
                              config.bg
                            )}>
                            {config.icon}
                          </div>
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
                      <div className="h-2 w-2 rounded-full bg-cyan-400 shrink-0 mt-2" />
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
