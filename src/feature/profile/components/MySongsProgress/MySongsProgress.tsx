import { Card } from "assets/components/ui/card";
import { cn } from "assets/lib/utils";
import { getSongTier } from "feature/songs/utils/getSongTier";
import { calculateSkillPower } from "feature/songs/utils/difficulty.utils";
import type { Song } from "feature/songs/types/songs.type";
import { Music, Plus } from "lucide-react";
import Link from "next/link";

interface MySongsProgressProps {
    userSongs: {
        wantToLearn: Song[];
        learning: Song[];
        learned: Song[];
    };
    isOwnProfile: boolean;
}

export const MySongsProgress = ({ userSongs, isOwnProfile }: MySongsProgressProps) => {
    const totalSongs = userSongs.wantToLearn.length + userSongs.learning.length + userSongs.learned.length;
    
    if (totalSongs === 0) {
        const emptyContent = (
            <div className={cn(
                'rounded-lg bg-zinc-800/20 p-8 text-center border-2 border-dashed border-zinc-700/50 transition-all duration-300',
                isOwnProfile && "hover:border-cyan-500/50 hover:bg-zinc-800/40 group cursor-pointer"
            )}>
                <div className='relative mb-4'>
                    <div className='relative mx-auto h-16 w-16'>
                        <svg
                            className={cn(
                                'h-full w-full text-zinc-500 transition-all duration-300',
                                isOwnProfile && "group-hover:text-cyan-400 group-hover:scale-110"
                            )}
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'>
                            <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={1.5}
                                d='M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3'
                            />
                        </svg>
                        {isOwnProfile && (
                            <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500 text-black shadow-lg shadow-cyan-500/20 transition-transform duration-300 group-hover:scale-125 group-hover:rotate-90">
                                <Plus size={14} strokeWidth={3} />
                            </div>
                        )}
                    </div>
                </div>
                <h5 className={cn(
                    'mb-2 font-semibold text-white transition-colors',
                    isOwnProfile && "group-hover:text-cyan-400"
                )}>
                    {isOwnProfile ? "No songs" : "No songs yet"}
                </h5>
                <p className={cn(
                    'text-sm text-zinc-500 transition-colors',
                    isOwnProfile && "group-hover:text-zinc-400"
                )}>
                    {isOwnProfile ? "Add your first songs to the library" : "This user hasn't added any songs yet"}
                </p>
            </div>
        );

        return isOwnProfile ? (
            <Link href="/songs" className="block">
                {emptyContent}
            </Link>
        ) : emptyContent;
    }

    const learnedPercentage = totalSongs ? (userSongs.learned.length / totalSongs) * 100 : 0;
    const learningPercentage = totalSongs ? (userSongs.learning.length / totalSongs) * 100 : 0;
    
    const skillPower = calculateSkillPower(userSongs.learned);
    const playerTier = skillPower > 0 ? getSongTier(skillPower) : null;

    return (
        <div className='space-y-5'>
            <div className='flex items-center justify-between'>
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="p-1.5 rounded-sm bg-purple-500/10 text-purple-500">
                            <Music size={16} />
                        </div>
                        <h5 className='text-sm font-bold text-white tracking-wider'>
                            My Songs
                        </h5>
                    </div>
                    <div className='flex flex-wrap items-center gap-x-3 gap-y-1.5'>
                        <p className='text-xs font-bold text-zinc-400'>
                            {totalSongs} total
                        </p>
                        <span className="h-1 w-1 rounded-full bg-zinc-600 hidden sm:block" />
                        <p className='text-xs font-bold text-purple-400'>
                            {userSongs.wantToLearn.length} want to learn
                        </p>
                        <span className="h-1 w-1 rounded-full bg-zinc-600 hidden sm:block" />
                        <p className='text-xs font-bold text-cyan-400'>
                            {userSongs.learning.length} learning
                        </p>
                        <span className="h-1 w-1 rounded-full bg-zinc-600 hidden sm:block" />
                        <p className='text-xs font-bold text-emerald-400'>
                            {userSongs.learned.length} learned
                        </p>
                        {playerTier && (
                            <>
                                <span className="h-1 w-1 rounded-full bg-zinc-600 hidden sm:block" />
                                <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-bold text-zinc-500">
                                        Your Skill Level:
                                    </span>
                                    <span className={cn(
                                        "rounded-sm border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                                        playerTier.bgColor,
                                        playerTier.borderColor
                                    )}
                                    style={{
                                        color: playerTier.color,
                                        borderColor: playerTier.borderColor
                                    }}
                                    >
                                        {playerTier.tier}
                                    </span>
                                </div>
                            </>
                        )}
                    </div>
                </div>
                <div className='text-right'>
                    <div className='text-2xl font-black text-white'>
                        {learnedPercentage.toFixed(0)}%
                    </div>
                    <div className='text-[10px] font-bold uppercase tracking-tight text-zinc-500'>Completed</div>
                </div>
            </div>

            <div className='relative mb-3 h-2 w-full overflow-hidden rounded-full bg-zinc-700/50'>
                <div
                    className='absolute left-0 top-0 h-full bg-white transition-all duration-700'
                    style={{ width: `${learnedPercentage}%` }}></div>
                <div
                    className='absolute top-0 h-full bg-white/40 transition-all duration-700'
                    style={{
                        left: `${learnedPercentage}%`,
                        width: `${learningPercentage}%`,
                    }}></div>
            </div>
        </div>
    );
};
