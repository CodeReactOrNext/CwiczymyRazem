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
            className="flex flex-col gap-3 p-3 mt-4"
        >
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
