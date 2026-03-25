import { cn } from "assets/lib/utils";
import { TierBadge } from "feature/songs/components/SongsGrid/TierBadge";
import type { Song } from "feature/songs/types/songs.type";
import { calculateSkillPower } from "feature/songs/utils/difficulty.utils";
import { getAllTiers, getSongTier } from "feature/songs/utils/getSongTier";
import { selectUserAuth } from "feature/user/store/userSlice";
import { Music } from "lucide-react";
import { useMemo } from "react";
import { useAppSelector } from "store/hooks";

interface SongSkillShowcaseProps {
  userSongs:
    | {
        wantToLearn: Song[];
        learning: Song[];
        learned: Song[];
      }
    | undefined;
  profileUserId: string;
}

export const SongSkillShowcase = ({
  userSongs,
  profileUserId,
}: SongSkillShowcaseProps) => {
  const currentUserId = useAppSelector(selectUserAuth);
  const isOwnProfile = currentUserId === profileUserId;

  const { skillPower, playerTier, tierGroups } = useMemo(() => {
    if (!userSongs || userSongs.learned.length === 0) {
      return { skillPower: 0, playerTier: null, tierGroups: [] };
    }

    const skillPower = calculateSkillPower(userSongs.learned);
    const playerTier = skillPower > 0 ? getSongTier(skillPower) : null;

    const sortedLearned = [...userSongs.learned]
      .sort((a, b) => (b.avgDifficulty ?? 0) - (a.avgDifficulty ?? 0))
      .slice(0, 12);

    const allTiers = getAllTiers();
    const tierGroups = allTiers
      .map((t) => ({
        tier: t,
        songs: sortedLearned.filter((s) => {
          const songTier = getSongTier(s.avgDifficulty ?? 0);
          return songTier.tier === t.tier;
        }),
      }))
      .filter((g) => g.songs.length > 0);

    return { skillPower, playerTier, tierGroups };
  }, [userSongs]);

  if (isOwnProfile || !userSongs || userSongs.learned.length === 0) return null;

  return (
    <div className='rounded-2xl bg-zinc-900/30 p-6 backdrop-blur-sm'>
      {/* Header */}
      <div className='mb-6 flex items-center justify-between gap-4'>
        <div>
          <h2 className='text-2xl font-bold text-white'>Song Repertoire</h2>
          <p className='mt-1 text-sm text-zinc-400'>
            {userSongs.learned.length} songs learned
            {userSongs.learning.length > 0 && (
              <span className='ml-2 text-cyan-400'>
                · {userSongs.learning.length} in progress
              </span>
            )}
          </p>
        </div>

        {playerTier && (
          <div className='flex shrink-0 flex-col items-center gap-1.5'>
            <span className='text-[10px] font-semibold uppercase tracking-widest text-zinc-400'>Song tier</span>
            <div
              className='flex h-14 w-14 items-center justify-center rounded-xl border-2 text-2xl font-black shadow-lg'
              style={{
                color: playerTier.color,
                backgroundColor: 'rgba(10,10,10,0.9)',
                borderColor: `${playerTier.color}40`,
              }}>
              {playerTier.tier}
            </div>
            <span className='text-[11px] font-medium' style={{ color: playerTier.color }}>
              {playerTier.label}
            </span>
          </div>
        )}
      </div>

      {/* Tier Groups */}
      <div className='space-y-5'>
        {tierGroups.map(({ tier, songs }) => (
          <div key={tier.tier}>
            {/* Tier label row */}
            <div className='mb-2.5 flex items-center gap-3'>
              <div
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[11px] font-black",
                  tier.bgColor
                )}
                style={{ color: tier.color }}>
                {tier.tier}
              </div>
              <span
                className='text-[11px] font-black uppercase tracking-widest'
                style={{ color: tier.color }}>
                {tier.label}
              </span>
              <div
                className='h-px flex-1 rounded'
                style={{ backgroundColor: `${tier.color}20` }}
              />
              <span className='text-[11px] font-bold text-zinc-500'>
                {songs.length}
              </span>
            </div>

            {/* Songs grid */}
            <div className='grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3'>
              {songs.map((song) => (
                <div
                  key={song.id}
                  className='flex items-center gap-3 rounded-xl bg-zinc-800/20 p-3'>
                  {song.coverUrl ? (
                    <img
                      src={song.coverUrl}
                      alt={song.title}
                      className='h-10 w-10 shrink-0 rounded-lg object-cover'
                    />
                  ) : (
                    <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-700/30'>
                      <Music className='h-4 w-4 text-zinc-500' />
                    </div>
                  )}
                  <div className='min-w-0 flex-1'>
                    <p className='truncate text-sm font-semibold text-white'>
                      {song.title}
                    </p>
                    <p className='truncate text-xs text-zinc-400'>
                      {song.artist}
                    </p>
                  </div>
                  <TierBadge song={song} className='shrink-0' />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
