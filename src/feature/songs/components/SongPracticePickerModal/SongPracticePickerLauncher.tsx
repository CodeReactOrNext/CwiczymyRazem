import { useQuery, useQueryClient } from "@tanstack/react-query";
import { SongPracticePickerModal } from "feature/songs/components/SongPracticePickerModal/SongPracticePickerModal";
import { useSong } from "feature/songs/hooks/useSong";
import {
  attachGpFileToSong,
  detachGpFileFromSong,
  getUserSongProgress,
} from "feature/songs/services/userSongProgress.service";
import { selectUserInfo } from "feature/user/store/userSlice";
import { useEffect } from "react";
import { toast } from "sonner";
import { useAppSelector } from "store/hooks";

interface SongPracticePickerLauncherProps {
  /** The song to practise; `null` keeps the picker closed. */
  songId: string | null;
  userId: string;
  onClose: () => void;
}

/**
 * The practice-mode chooser for screens that only hold a song snapshot (the
 * challenge card on Home). It fetches the full song and this player's progress
 * on that one song when opened, instead of the whole progress collection the
 * songs page loads up front.
 */
export const SongPracticePickerLauncher = ({
  songId,
  userId,
  onClose,
}: SongPracticePickerLauncherProps) => {
  const queryClient = useQueryClient();
  const userInfo = useAppSelector(selectUserInfo);
  const isPremium =
    userInfo?.role === "pro" ||
    userInfo?.role === "master" ||
    userInfo?.role === "admin";

  const { data: song, isFetched: isSongFetched } = useSong(songId);
  const progressKey = ["songProgress", userId, songId];
  const { data: progress, isFetched: isProgressFetched } = useQuery({
    queryKey: progressKey,
    // Progress only preselects the arrangement and GP file — without it the
    // picker still works, so a failed read must not hold it closed.
    queryFn: () =>
      getUserSongProgress(userId, songId as string).catch(() => null),
    enabled: !!songId,
  });

  const isMissing = !!songId && isSongFetched && !song;
  useEffect(() => {
    if (!isMissing) return;
    toast.error("Song not found");
    onClose();
  }, [isMissing, onClose]);

  // The picker seeds its arrangement from progress on mount, so it waits for both.
  if (!songId || !song || !isProgressFetched) return null;

  const refreshProgress = () =>
    queryClient.invalidateQueries({ queryKey: progressKey });

  return (
    <SongPracticePickerModal
      song={song}
      userId={userId}
      isPremium={isPremium}
      progress={progress ?? null}
      onAttachGpFile={async (id, gpFileId, gpFileName, trackIndex) => {
        await attachGpFileToSong(userId, id, gpFileId, gpFileName, trackIndex);
        await refreshProgress();
      }}
      onDetachGpFile={async (id) => {
        await detachGpFileFromSong(userId, id);
        await refreshProgress();
      }}
      onClose={onClose}
    />
  );
};
