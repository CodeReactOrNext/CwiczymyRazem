import { rateSongDifficulty } from "feature/songs/services/rateSongDifficulty";
import type { Song } from "feature/songs/types/songs.type";
import { getAverageDifficulty } from "feature/songs/utils/getAvgRaiting";
import { selectUserAuth, selectUserAvatar } from "feature/user/store/userSlice";
import { Star, Loader2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useAppSelector } from "store/hooks";

interface SongRatingInterface {
  song: Song;
  refreshTable: () => void;
  tierColor?: string;
}
export const SongRating = ({ song, refreshTable, tierColor }: SongRatingInterface) => {
  const userId = useAppSelector(selectUserAuth);
  const avatar = useAppSelector(selectUserAvatar);
  const { t } = useTranslation("songs");

  const [ratingHover, setRatingHover] = useState<{
    songId: string;
    rating: number;
  } | null>(null);
  const [isRatingLoading, setIsRatingLoading] = useState(false);

  const handleRating = async (
    songId: string,
    title: string,
    artist: string,
    rating: number
  ) => {
    if (!userId) {
      return;
    }

    const userRating = song?.difficulties?.find((d) => d.userId === userId);

    if (userRating) {
      const lastRatedDate = new Date(userRating.date.toDate());
      const now = new Date();

      const timeDiff = now.getTime() - lastRatedDate.getTime();
      const oneHour = 60 * 60 * 1000;

      if (timeDiff < oneHour) {
        toast.warning(t("wait_one_hour"));
        return;
      }
    }

    try {
      setIsRatingLoading(true);
      await rateSongDifficulty(songId, userId, rating, title, artist, avatar);
      refreshTable();
      toast.success(t("rating_updated"));
    } catch (error) {
      toast.error(t("error_rating"));
    } finally {
      setIsRatingLoading(false);
    }
  };

  return (
    <div>
      <div className='flex items-center gap-1'>
        {[...Array(10)].map((_, i) => {
          const avgRating = getAverageDifficulty(song.difficulties);

          const userRating = song?.difficulties?.find(
            (d) => d.userId === userId
          )?.rating;

          const isHovered =
            ratingHover?.songId === song.id && ratingHover.rating >= i + 1;

          const showUserRating =
            !ratingHover?.songId && userRating && userRating >= i + 1;

          const showAvgRating = avgRating >= i + 1;

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
                  !isRatingLoading && handleRating(song.id, song.title, song.artist, i + 1)
                }
                onMouseEnter={() =>
                  !isRatingLoading && setRatingHover({
                    songId: song.id,
                    rating: i + 1,
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
    </div>
  );
};
