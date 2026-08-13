import { UserTooltip } from "components/UserTooltip/UserTooltip";
import { SupportAvatarRing } from "feature/supportTeam/components/SupportAvatarRing";
import { SupportMark } from "feature/supportTeam/components/SupportBadge";
import { useSupportTeam } from "feature/supportTeam/hooks/useSupportTeam";
import { sortSupportFirst } from "feature/supportTeam/utils/supportTeam.utils";
import { motion } from "framer-motion";
import { useOnlineUsers } from "hooks/useOnlineUsers";
import { Monitor } from "lucide-react";
import Link from "next/link";

export const OnlineUsers = () => {
    const { onlineUsers, isDbEnabled } = useOnlineUsers();
    const { isSupport, getSupportMember } = useSupportTeam();

    if (!isDbEnabled || onlineUsers.length === 0) return null;

    // Filter unique users by UID to prevent duplicates
    const uniqueUsers = onlineUsers.filter((v,i,a)=>a.findIndex(t=>(t.uid===v.uid))===i);

    // Supporters lead the stack: they sit on top of the overlap, so their gold
    // ring stays whole instead of being clipped by the next avatar.
    const displayUsers = sortSupportFirst(uniqueUsers, isSupport).slice(0, 8);
    const remainingCount = uniqueUsers.length - 8;

    return (
        <div className="flex flex-col gap-3">
             <div className="flex items-center gap-2 mb-1 px-1">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[12px] font-bold  tracking-[0.1em] text-zinc-500">
                    Live Now ({uniqueUsers.length})
                </span>
            </div>
            <div className="flex items-center pl-2">
                {displayUsers.map((user, i) => {
                    const isPracticing = !!user.currentActivity;
                    const supportMember = getSupportMember(user.uid);

                    const avatar = (
                        <div className={`
                            relative h-10 w-10 rounded-full bg-zinc-800 overflow-hidden shadow-xl transition-all duration-300
                            ${supportMember ? "" : `ring-2 ${isPracticing ? "ring-cyan-500" : "ring-zinc-900"}`}
                        `}>
                             {user.avatar ? (
                                <img src={user.avatar} alt={user.displayName} className="h-full w-full object-cover" />
                             ) : (
                                <div className="h-full w-full flex items-center justify-center bg-zinc-700 text-xs font-bold text-zinc-300">
                                    {user.displayName?.[0] || "?"}
                                </div>
                             )}
                        </div>
                    );

                    return (
                        <div
                            key={user.uid}
                            className="relative -ml-3 first:ml-0 hover:z-20 transition-all duration-300"
                            style={{ zIndex: displayUsers.length - i }}
                        >
                            <UserTooltip userId={user.uid} currentActivity={user.currentActivity}>
                                <Link href={`/user/${user.uid}`}>
                                    <div className="cursor-pointer relative transition-transform duration-300 hover:scale-110 hover:-translate-y-1">
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
                                                className={`absolute -inset-1 rounded-full z-0 ${supportMember ? "bg-amber-400" : "bg-cyan-500"}`}
                                            />
                                        )}

                                        {supportMember ? (
                                            <SupportAvatarRing>{avatar}</SupportAvatarRing>
                                        ) : (
                                            avatar
                                        )}

                                        {/* Bottom-right: heart mark for supporters, plain state dot for
                                        everyone else — the rotating ring already says "online" for them. */}
                                        {supportMember ? (
                                            <SupportMark
                                                member={supportMember}
                                                className="absolute -bottom-0.5 -right-0.5"
                                            />
                                        ) : (
                                            <div className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-zinc-950 ${isPracticing ? 'bg-cyan-500' : 'bg-emerald-500'}`}>
                                                {isPracticing && (
                                                    <div className="absolute inset-0 rounded-full bg-white animate-ping opacity-75" />
                                                )}
                                            </div>
                                        )}

                                        {/* Desktop app badge — top-right: the left edge of every
                                        avatar but the first sits under its higher z-indexed
                                        neighbor in the stack, so bottom-left gets hidden there. */}
                                        {user.platform === "desktop" && (
                                            <div
                                                className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-zinc-950 bg-zinc-800"
                                                title="Using the desktop app">
                                                <Monitor className="h-2 w-2 text-zinc-400" strokeWidth={2.5} />
                                            </div>
                                        )}
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

