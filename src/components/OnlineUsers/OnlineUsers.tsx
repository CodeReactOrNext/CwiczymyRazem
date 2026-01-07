import { useOnlineUsers } from "hooks/useOnlineUsers";
import { UserTooltip } from "components/UserTooltip/UserTooltip";
import Link from "next/link";

export const OnlineUsers = () => {
    const { onlineUsers, isDbEnabled } = useOnlineUsers();

    if (!isDbEnabled || onlineUsers.length === 0) return null;

    // Filter unique users by UID to prevent duplicates
    const uniqueUsers = onlineUsers.filter((v,i,a)=>a.findIndex(t=>(t.uid===v.uid))===i);

    const displayUsers = uniqueUsers.slice(0, 5);
    const remainingCount = uniqueUsers.length - 5;

    return (
        <div 
            className="flex flex-col gap-3 p-3 mt-4 rounded-xl bg-gradient-to-br from-zinc-900/50 to-zinc-900/80 backdrop-blur-sm"
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="text-xs font-bold text-zinc-300 uppercase tracking-wide">Online Now</span>
                </div>
                <span className="text-[10px] font-medium text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded border border-emerald-400/20">
                    {uniqueUsers.length} active
                </span>
            </div>
            
            <div className="flex items-center pl-2">
                {displayUsers.map((user, i) => (
                    <div 
                        key={user.uid} 
                        className="relative -ml-2 hover:z-10 transition-all duration-300 hover:scale-110 hover:-translate-y-1" 
                        style={{ zIndex: displayUsers.length - i }}
                    >
                        <UserTooltip userId={user.uid}>
                            <Link href={`/user/${user.uid}`}>
                                <div className="cursor-pointer relative">
                                    <div className="h-8 w-8 rounded-full ring-2 ring-zinc-900 bg-zinc-800 overflow-hidden shadow-sm">
                                         {user.avatar ? (
                                            <img src={user.avatar} alt={user.displayName} className="h-full w-full object-cover" />
                                         ) : (
                                            <div className="h-full w-full flex items-center justify-center bg-zinc-700 text-[10px] font-bold text-zinc-300">
                                                {user.displayName?.[0] || "?"}
                                            </div>
                                         )}
                                    </div>
                                    {/* Status dot */}
                                    <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-zinc-900 bg-emerald-500"></div>
                                </div>
                            </Link>
                        </UserTooltip>
                    </div>
                ))}
                {remainingCount > 0 && (
                    <div className="relative -ml-2 z-0 h-8 w-8 flex items-center justify-center rounded-full bg-zinc-800 ring-2 ring-zinc-900 text-[10px] font-bold text-zinc-400">
                        +{remainingCount}
                    </div>
                )}
            </div>
        </div>
    );
};
