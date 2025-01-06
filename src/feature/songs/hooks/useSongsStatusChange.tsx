import { selectUserAuth } from "feature/user/store/userSlice";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useAppSelector } from "store/hooks";
import { Song, SongStatus } from "utils/firebase/client/firebase.types";
import { updateSongStatus } from "utils/firebase/client/firebase.utils";

export const useSongsStatusChange = ({
  onChange,
  userSongs,
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
}) => {
  const { t } = useTranslation("songs");
  const userId = useAppSelector(selectUserAuth);

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

    const allSongs = userSongs.wantToLearn.concat(
      userSongs.learning,
      userSongs.learned
    );

    try {
      await updateSongStatus(userId, songId, title, artist, newStatus);
      const updatedSong = allSongs.find((song) => song.id === songId);

      if (!updatedSong) {
        return;
      }
      const oldStatus = Object.keys(userSongs).find((status) =>
        userSongs[status as SongStatus].some((song) => song.id === songId)
      );
      if (oldStatus) {
        const updatedOldField = userSongs[oldStatus as SongStatus].filter(
          (song) => song.id !== songId
        );
        userSongs[oldStatus as SongStatus] = updatedOldField;
      }

      const updatedNewField = [...userSongs[newStatus], updatedSong];
      const newUserSongs = { ...userSongs, [newStatus]: updatedNewField };
      onChange(newUserSongs);

      toast.success(t("status_updated"));
    } catch (error) {
      toast.error(t("error_updating_status"));
    }
  };

  return { handleStatusChange };
};
