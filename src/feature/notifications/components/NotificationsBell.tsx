import { Bell, MessageSquare, Heart, CheckCircle2, Clock, Zap } from "lucide-react";
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
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "assets/components/ui/dropdown-menu";

export const NotificationsBell = () => {
    const userId = useAppSelector(selectUserAuth);
    const { notifications, unreadCount, markAsRead, markAllAsRead, isLoading } = useAppNotifications(userId);
    const [isOpen, setIsOpen] = useState(false);

    const handleNotificationClick = (id: string) => {
        markAsRead(id);
    };

    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                <button className="relative p-2 rounded-full hover:bg-white/10 transition-colors group">
                    <Bell className={cn("h-5 w-5 text-zinc-400 group-hover:text-white transition-colors", unreadCount > 0 && "text-cyan-400")} />
                    {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-zinc-900 group-hover:ring-zinc-800">
                            {unreadCount}
                        </span>
                    )}
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80 bg-zinc-950 border-white/10 text-white p-0 overflow-hidden shadow-2xl" align="end" sideOffset={8}>
                <div className="flex items-center justify-between p-4 bg-zinc-900/50">
                    <DropdownMenuLabel className="p-0 font-bold">Notifications</DropdownMenuLabel>
                    {unreadCount > 0 && (
                        <button 
                            onClick={(e) => { e.preventDefault(); markAllAsRead(); }}
                            className="text-[10px] font-black uppercase tracking-widest text-cyan-400 hover:text-cyan-300 transition-colors"
                        >
                            Mark all as read
                        </button>
                    )}
                </div>
                <DropdownMenuSeparator className="bg-white/5 m-0" />
                <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                    {isLoading ? (
                        <div className="p-8 text-center text-zinc-500 text-sm">Loading...</div>
                    ) : notifications.length === 0 ? (
                        <div className="p-12 text-center flex flex-col items-center gap-3">
                            <div className="p-3 rounded-full bg-zinc-900 text-zinc-700">
                                <Bell className="h-6 w-6" />
                            </div>
                            <p className="text-sm text-zinc-500 italic">No notifications yet</p>
                        </div>
                    ) : (
                        notifications.map((n) => (
                            <DropdownMenuItem 
                                key={n.id} 
                                className={cn(
                                    "p-4 flex gap-3 cursor-pointer outline-none focus:bg-white/5 transition-colors border-b border-white/5 last:border-0",
                                    !n.isRead && "bg-cyan-500/5 hover:bg-cyan-500/10"
                                )}
                                onClick={() => handleNotificationClick(n.id)}
                            >
                                <div className="relative shrink-0">
                                    <div className="transform scale-[0.85] origin-top-left">
                                        <Avatar 
                                            name={n.senderName} 
                                            avatarURL={n.senderAvatarUrl || undefined} 
                                            lvl={n.senderFrame}
                                            size="sm"
                                        />
                                    </div>
                                    <div className={cn(
                                        "absolute -bottom-1 -right-1 h-4 w-4 rounded-full flex items-center justify-center",
                                        n.type === "like" ? "bg-red-500" : n.type === "comment" ? "bg-cyan-500" : "bg-yellow-500"
                                    )}>
                                        {n.type === "like" ? <Heart className="h-2 w-2 text-white fill-current" /> : n.type === "comment" ? <MessageSquare className="h-2 w-2 text-white fill-current" /> : <Zap className="h-2 w-2 text-white fill-current" />}
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs text-zinc-300 leading-normal">
                                        <span className="font-bold text-white">{n.senderName}</span>
                                        {" "}
                                        {n.type === "like" ? "liked your recording" : n.type === "comment" ? "commented on your recording" : "reacted to your activity on logs"}
                                    </p>
                                    {n.recordingTitle && n.type !== "reaction" && (
                                        <p className="text-[10px] italic text-zinc-500 truncate mt-0.5">
                                            "{n.recordingTitle}"
                                        </p>
                                    )}
                                    <div className="flex items-center gap-1 mt-1">
                                        <Clock className="h-2 w-2 text-zinc-600" />
                                        <span className="text-[10px] text-zinc-600">
                                            {n.timestamp?.toDate ? formatDistanceToNow(n.timestamp.toDate(), { addSuffix: true }) : "just now"}
                                        </span>
                                    </div>
                                </div>
                                {!n.isRead && <div className="h-2 w-2 rounded-full bg-cyan-500 shrink-0" />}
                            </DropdownMenuItem>
                        ))
                    )}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
