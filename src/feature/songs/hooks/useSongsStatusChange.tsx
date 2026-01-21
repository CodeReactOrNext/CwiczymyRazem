import { removeUserSong } from "feature/songs/services/removeUserSong";
import { updateSongStatus } from "feature/songs/services/udateSongStatus";
import type { Song, SongStatus } from "feature/songs/types/songs.type";
import { selectUserAuth, selectUserAvatar, updatePoints } from "feature/user/store/userSlice";
import { updateQuestProgress } from "feature/user/store/userSlice.asyncThunk";
import { useTranslation } from "hooks/useTranslation";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "store/hooks";

export const useSongsStatusChange = ({
  onChange,
  userSongs,
  onTableStatusChange,
}: {
  userSongs: {
    wantToLearn: Song[];
    learning: Song[];
    learned: Song[];
  };
  onChange: ({
    wantToLearn,
    learned,
    learning,
  }: {
    wantToLearn: Song[];
    learning: Song[];
    learned: Song[];
  }) => void;
  onTableStatusChange?: () => void;
}) => {
  const { t } = useTranslation("songs");
  const userId = useAppSelector(selectUserAuth);
  const avatar = useAppSelector(selectUserAvatar);
  const dispatch = useAppDispatch();

  const handleStatusChange = async (
    songId: string,
    newStatus: SongStatus,
    title: string,
    artist: string,
    options?: { skipOptimisticUpdate?: boolean; skipRefetch?: boolean }
  ) => {
    if (!userId) {
      toast.error(t("must_be_logged_in"));
      return;
    }

    try {
      const result = await updateSongStatus(userId, songId, title, artist, newStatus, avatar);

      // Update Points in local store
      // Update Points in local store
      if (result.pointsAdded !== 0) {
        dispatch(updatePoints(result.pointsAdded));
      }

      if (newStatus === "wantToLearn") {
        dispatch(updateQuestProgress({ type: 'add_want_to_learn' }));
      }

      if (!options?.skipOptimisticUpdate) {
          const allSongs = [
            ...userSongs.wantToLearn,
            ...userSongs.learning,
            ...userSongs.learned,
          ];
          const updatedSong = allSongs.find((song) => song.id === songId);

          if (updatedSong) {
            const newUserSongs = {
              wantToLearn:
                newStatus === "wantToLearn"
                  ? [...userSongs.wantToLearn, updatedSong]
                  : userSongs.wantToLearn.filter((s) => s.id !== songId),
              learning:
                newStatus === "learning"
                  ? [...userSongs.learning, updatedSong]
                  : userSongs.learning.filter((s) => s.id !== songId),
              learned:
                newStatus === "learned"
                  ? [...userSongs.learned, updatedSong]
                  : userSongs.learned.filter((s) => s.id !== songId),
            };

            onChange(newUserSongs);
          }
      }

      if (onTableStatusChange && !options?.skipRefetch) {
        await onTableStatusChange();
      }

      const pointsMsg = result.pointsAdded !== 0 
        ? ` (${result.pointsAdded > 0 ? "+" : ""}${result.pointsAdded} pkt)` 
        : "";
      
      toast.success(`${t("status_updated")}${pointsMsg}`);
    } catch (error) {
      toast.error(t("error_updating_status"));
    }
  };

  const handleSongRemoval = async (songId: string) => {
    if (!userId) {
      toast.error(t("must_be_logged_in"));
      return;
    }

    try {
      const result = await removeUserSong(userId, songId);

      // Update Points in local store
      if (result.pointsAdded !== 0) {
        dispatch(updatePoints(result.pointsAdded));
      }

      const newUserSongs = {
        wantToLearn: userSongs.wantToLearn.filter((song) => song.id !== songId),
        learning: userSongs.learning.filter((song) => song.id !== songId),
        learned: userSongs.learned.filter((song) => song.id !== songId),
      };

      onChange(newUserSongs);
      
      const pointsMsg = result.pointsAdded !== 0 
        ? ` (${result.pointsAdded} pkt)` 
        : "";
        
      toast.success(`${t("song_removed")}${pointsMsg}`);
    } catch (error) {
      toast.error(t("error_removing_song"));
    }
  };

  return { handleStatusChange, handleSongRemoval };
};
