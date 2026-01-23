import { UserTooltip } from "components/UserTooltip/UserTooltip";
import { useOnlineUsers } from "hooks/useOnlineUsers";
import Link from "next/link";
import { motion } from "framer-motion";
import { Music } from "lucide-react";

export const OnlineUsers = () => {
    const { onlineUsers, isDbEnabled } = useOnlineUsers();

    if (!isDbEnabled || onlineUsers.length === 0) return null;

    // Filter unique users by UID to prevent duplicates
    const uniqueUsers = onlineUsers.filter((v,i,a)=>a.findIndex(t=>(t.uid===v.uid))===i);

    const displayUsers = uniqueUsers.slice(0, 8);
    const remainingCount = uniqueUsers.length - 8;

    return (
        <div className="flex flex-col gap-3 p-3 mt-4">
             <div className="flex items-center gap-2 mb-1 px-1">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
                    Live Now ({uniqueUsers.length})
                </span>
            </div>
            <div className="flex items-center pl-2">
                {displayUsers.map((user, i) => {
                    const isPracticing = !!user.currentActivity;
                    
                    return (
                        <div 
                            key={user.uid} 
                            className="relative -ml-3 first:ml-0 hover:z-20 transition-all duration-300" 
                            style={{ zIndex: displayUsers.length - i }}
                        >
                            <UserTooltip userId={user.uid} currentActivity={user.currentActivity}>
                                <Link href={`/user/${user.uid}`}>
                                    <div className="cursor-pointer relative group">
                                        {/* Practicing Animation */}
                                        {isPracticing && (
                                            <motion.div 
                                                initial={{ scale: 0.8, opacity: 0 }}
                                                animate={{ 
                                                    scale: [1, 1.2, 1],
                                                    opacity: [0.5, 0.2, 0.5]
                                                }}
                                                transition={{ 
                                                    duration: 2, 
                                                    repeat: Infinity,
                                                    ease: "easeInOut" 
                                                }}
                                                className="absolute -inset-1 rounded-full bg-cyan-500 z-0"
                                            />
                                        )}
                                        
                                        <div className={`
                                            relative h-10 w-10 rounded-full ring-2 bg-zinc-800 overflow-hidden shadow-xl transition-all duration-300 group-hover:scale-110 group-hover:-translate-y-1
                                            ${isPracticing ? 'ring-cyan-500' : 'ring-zinc-900'}
                                        `}>
                                             {user.avatar ? (
                                                <img src={user.avatar} alt={user.displayName} className="h-full w-full object-cover" />
                                             ) : (
                                                <div className="h-full w-full flex items-center justify-center bg-zinc-700 text-xs font-bold text-zinc-300">
                                                    {user.displayName?.[0] || "?"}
                                                </div>
                                             )}
                                        </div>

                                        {/* Status Dot */}
                                        <div className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-zinc-950 ${isPracticing ? 'bg-cyan-500' : 'bg-emerald-500'}`}>
                                            {isPracticing && (
                                                <div className="absolute inset-0 rounded-full bg-white animate-ping opacity-75" />
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            </UserTooltip>
                        </div>
                    );
                })}
                {remainingCount > 0 && (
                    <div className="relative -ml-3 z-0 h-10 w-10 flex items-center justify-center rounded-full bg-zinc-800 ring-2 ring-zinc-950 text-[10px] font-black text-zinc-400 border border-white/5 shadow-xl">
                        +{remainingCount}
                    </div>
                )}
            </div>
        </div>
    );
};

