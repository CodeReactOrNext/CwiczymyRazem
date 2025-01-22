import { getAverageDifficulty } from "feature/songs/utils/getAvgRaiting";
import { selectUserAuth } from "feature/user/store/userSlice";
import { Star } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useAppSelector } from "store/hooks";
import type { Song } from "utils/firebase/client/firebase.types";
import { rateSongDifficulty } from "utils/firebase/client/firebase.utils";

interface SongRatingInterface {
  song: Song;
  refreshTable: () => void;
}
export const SongRating = ({ song, refreshTable }: SongRatingInterface) => {
  const userId = useAppSelector(selectUserAuth);
  const { t } = useTranslation("songs");

  const [ratingHover, setRatingHover] = useState<{
    songId: string;
    rating: number;
  } | null>(null);

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
      await rateSongDifficulty(songId, userId, rating, title, artist);
      refreshTable();
      toast.success(t("rating_updated"));
    } catch (error) {
      toast.error(t("error_rating"));
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
                    ? "fill-yellow-300 text-yellow-300"
                    : "fill-muted text-muted-foreground"
                }`}
              />
              <Star
                className={`absolute inset-0 h-4 w-4 cursor-pointer ${
                  isHovered || showUserRating
                    ? "scale-110 fill-primary text-primary "
                    : "fill-transparent text-transparent"
                }`}
                onClick={() =>
                  handleRating(song.id, song.title, song.artist, i + 1)
                }
                onMouseEnter={() =>
                  setRatingHover({
                    songId: song.id,
                    rating: i + 1,
                  })
                }
                onMouseLeave={() => setRatingHover(null)}
              />
            </div>
          );
        })}
        <div className='mt-1 text-sm text-muted-foreground'>
          ({song.difficulties.length})
        </div>{" "}
        <div className='mt-1 w-[30px] text-sm text-primary'>
          {ratingHover?.songId === song.id && `${ratingHover.rating}/10`}
        </div>
      </div>
    </div>
  );
};
