import { removeUserSong } from "feature/songs/services/removeUserSong";
import { updateSongStatus } from "feature/songs/services/udateSongStatus";
import type { Song, SongStatus } from "feature/songs/types/songs.type";
import { selectUserAuth, selectUserAvatar } from "feature/user/store/userSlice";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useAppSelector } from "store/hooks";

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

  const handleStatusChange = async (
    songId: string,
    newStatus: SongStatus,
    title: string,
    artist: string
  ) => {
    if (!userId) {
      toast.error(t("must_be_logged_in"));
      return;
    }

    try {
      await updateSongStatus(userId, songId, title, artist, newStatus, avatar);

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

      if (onTableStatusChange) {
        await onTableStatusChange();
      }

      toast.success(t("status_updated"));
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
      await removeUserSong(userId, songId);

      const newUserSongs = {
        wantToLearn: userSongs.wantToLearn.filter((song) => song.id !== songId),
        learning: userSongs.learning.filter((song) => song.id !== songId),
        learned: userSongs.learned.filter((song) => song.id !== songId),
      };

      onChange(newUserSongs);
      toast.success(t("song_removed"));
    } catch (error) {
      toast.error(t("error_removing_song"));
    }
  };

  return { handleStatusChange, handleSongRemoval };
};
