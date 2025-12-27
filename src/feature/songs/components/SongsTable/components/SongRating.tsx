// Module-level cache for cooldowns (persists across re-renders but resets on reload)
const ratingCooldowns = new Map<string, number>();

import { rateSongDifficulty } from "feature/songs/services/rateSongDifficulty";
import type { Song } from "feature/songs/types/songs.type";
import { selectUserAuth, selectUserAvatar } from "feature/user/store/userSlice";
import { Star, Loader2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { useQueryClient } from "@tanstack/react-query";
import { rateSong } from "feature/user/store/userSlice.asyncThunk";
import { cn } from "assets/lib/utils";

interface SongRatingInterface {
  song: Song;
  refreshTable: () => void;
  tierColor?: string;
}

export const SongRating = ({ song, refreshTable, tierColor }: SongRatingInterface) => {
  const userId = useAppSelector(selectUserAuth);
  const avatar = useAppSelector(selectUserAvatar);
  const { t } = useTranslation("songs");
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  const userRating = song?.difficulties?.find((d) => d.userId === userId);
  const isRated = !!userRating;

  const [ratingHover, setRatingHover] = useState<{
    songId: string;
    rating: number;
  } | null>(null);
  const [isRatingLoading, setIsRatingLoading] = useState(false);

  const handleRating = async (
    songId: string,
    title: string,
    artist: string,
    rating: number,
    manualTier?: string
  ) => {
    if (!userId) {
      return;
    }

    // 1. Check existing legacy cooldown (15s)
    if (userRating) {
      let lastRatedDate: Date;
      if (userRating.date && typeof userRating.date.toDate === 'function') {
        lastRatedDate = userRating.date.toDate();
      } else if (userRating.date && typeof userRating.date === 'object' && 'seconds' in userRating.date) {
         lastRatedDate = new Date((userRating.date as any).seconds * 1000);
      } else {
         lastRatedDate = new Date(userRating.date);
      }
      
      const now = new Date();
      const timeDiff = now.getTime() - lastRatedDate.getTime();
      const fifteenSeconds = 15 * 1000;

      if (timeDiff < fifteenSeconds) {
        const remaining = Math.ceil((fifteenSeconds - timeDiff) / 1000);
        toast.warning(`Wait ${remaining}s before rating this song again.`);
        return;
      }
    }

    // 2. Check 15s client-side cooldown
    const lastClickTime = ratingCooldowns.get(songId);
    const now = Date.now();
    if (lastClickTime && now - lastClickTime < 15000) {
       const remaining = Math.ceil((15000 - (now - lastClickTime)) / 1000);
       toast.warning(`Wait ${remaining}s before rating this song again.`);
       return;
    }

    try {
      setIsRatingLoading(true);
      
      const isNewRating = !isRated;

      const resultAction = await dispatch(rateSong({
        songId,
        rating,
        title,
        artist,
        avatarUrl: avatar,
        isNewRating,
        tier: manualTier
      }));


      if (rateSong.fulfilled.match(resultAction)) {
        toast.success(isNewRating ? "+5 Points! Rating updated." : "Rating updated.");
        ratingCooldowns.set(songId, Date.now());

        queryClient.setQueriesData({ queryKey: ['songs'] }, (oldData: any) => {
          if (!oldData || !oldData.songs) return oldData;
          
          return {
            ...oldData,
            songs: oldData.songs.map((s: Song) => {
              if (s.id === songId) {
                const { difficulties, avgDifficulty, tier } = resultAction.payload;
                return {
                  ...s,
                  difficulties,
                  avgDifficulty,
                  tier: tier || s.tier
                };
              }
              return s;
            })
          };
        });
      } else {
        throw new Error("Rating failed");
      }

    } catch (error) {
      toast.error(t("error_rating"));
    } finally {
      setIsRatingLoading(false);
    }
  };

  const tiers = [
    { id: 'S', color: '#FF7F7F' },
    { id: 'A', color: '#FFBF7F' },
    { id: 'B', color: '#FFFF7F' },
    { id: 'C', color: '#7FFF7F' },
    { id: 'D', color: '#7FFFFF' }
  ];

  return (
    <div className='flex flex-col gap-4'>
      <div className='flex items-center gap-1'>
        {[...Array(10)].map((_, i) => {
          const avgRating = song.avgDifficulty || 0;
          const ratingValue = i + 1;

          const currentUserRatingValue = song?.difficulties?.find(
            (d) => d.userId === userId
          )?.rating;

          const isHovered =
            ratingHover?.songId === song.id && ratingHover.rating >= ratingValue;

          const showUserRating =
            !ratingHover?.songId && currentUserRatingValue && currentUserRatingValue >= ratingValue;

          const showAvgRating = avgRating >= ratingValue;

          return (
            <div key={i + song.id} className='relative'>
              <Star
                className={`h-4 w-4 ${
                  showAvgRating
                    ? "opacity-100"
                    : "fill-muted text-muted-foreground opacity-30"
                }`}
                style={showAvgRating ? { fill: tierColor, color: tierColor } : {}}
              />
              <Star
                className={`absolute inset-0 h-4 w-4 transition-all ${
                  isHovered || showUserRating
                    ? "scale-125 opacity-100"
                    : "fill-transparent text-transparent opacity-0"
                } ${isRatingLoading ? "cursor-not-allowed" : "cursor-pointer"}`}
                style={(isHovered || showUserRating) ? { fill: tierColor, color: tierColor, filter: `drop-shadow(0 0 5px ${tierColor}40)` } : {}}
                onClick={() =>
                  !isRatingLoading && handleRating(song.id, song.title, song.artist, ratingValue)
                }
                onMouseEnter={() =>
                  !isRatingLoading && setRatingHover({
                    songId: song.id,
                    rating: ratingValue,
                  })
                }
                onMouseLeave={() => setRatingHover(null)}
              />
            </div>
          );
        })}
        {isRatingLoading && <Loader2 className="h-4 w-4 animate-spin text-cyan-500 ml-2" />}
        <div className='mt-1 text-sm text-muted-foreground'>
          ({song.difficulties?.length})
        </div>{" "}
        <div className='mt-1 w-[30px] text-sm text-primary'>
          {ratingHover?.songId === song.id && `${ratingHover.rating}/10`}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Manual Tier Override</span>
        <div className="flex gap-2">
            {tiers.map((t) => {
                const isActive = (song as any).tier === t.id;
                return (
                    <button
                        key={t.id}
                        disabled={isRatingLoading}
                        onClick={() => {
                            const currentRating = song?.difficulties?.find(d => d.userId === userId)?.rating || 0;
                            handleRating(song.id, song.title, song.artist, currentRating, t.id);
                        }}
                        className={cn(
                            "flex h-9 w-9 items-center justify-center rounded-lg border-2 text-xs font-black transition-all active:scale-95",
                            isActive ? "shadow-lg scale-105" : "border-white/5 opacity-40 grayscale hover:opacity-100 hover:grayscale-0"
                        )}
                        style={{
                            borderColor: isActive ? t.color : "transparent",
                            backgroundColor: isActive ? `${t.color}15` : "rgba(255,255,255,0.02)",
                            color: isActive ? t.color : "inherit",
                        }}
                    >
                        {t.id}
                    </button>
                )
            })}
        </div>
      </div>

      {isRated && <span className="text-[10px] text-green-500 font-medium">Song Rated</span>}
    </div>
  );
};
