import type { DropResult } from "@hello-pangea/dnd";
import { DragDropContext } from "@hello-pangea/dnd";
import { SongLearningStats } from "feature/songs/components/SongLearningStats/SongLearningStats";
import { SongStatusCard } from "feature/songs/components/SongStatusCard";
import { useSongsStatusChange } from "feature/songs/hooks/useSongsStatusChange";
import { getUserSongs } from "feature/songs/services/getUserSongs";
import type { Song, SongStatus } from "feature/songs/types/songs.type";
import { selectUserAuth } from "feature/user/store/userSlice";
import { useTranslation } from "react-i18next";
import { useAppSelector } from "store/hooks";

interface SongLearningSectionProps {
  isLanding: boolean;
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
  onStatusChange?: () => void;
}

export const SongLearningSection = ({
  userSongs,
  onChange,
  isLanding,
  onStatusChange,
}: SongLearningSectionProps) => {
  const { t } = useTranslation("songs");
  const userId = useAppSelector(selectUserAuth);
  const { handleStatusChange, handleSongRemoval } = useSongsStatusChange({
    onChange,
    userSongs,
    onTableStatusChange: onStatusChange,
  });

  if (!userId) {
    return null;
  }

  const handleDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;
    const newStatus = destination?.droppableId;
    const allSongs = userSongs.wantToLearn.concat(
      userSongs.learning,
      userSongs.learned
    );

    if (!destination || !newStatus) {
      return;
    }

    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    const songToMove = allSongs.find((song) => song.id === draggableId);
    if (!songToMove) {
      return;
    }

    const updatedSong = allSongs.find((song) => song.id === draggableId);

    if (!updatedSong) {
      return;
    }

    const oldStatus = Object.keys(userSongs).find((status) =>
      userSongs[status as SongStatus].some((song) => song.id === draggableId)
    );
    if (oldStatus) {
      const updatedOldField = userSongs[oldStatus as SongStatus].filter(
        (song) => song.id !== draggableId
      );
      userSongs[oldStatus as SongStatus] = updatedOldField;
    }

    const updatedNewField = [...userSongs[newStatus as SongStatus]];

    updatedNewField.splice(destination.index, 0, updatedSong);

    const newUserSongs = { ...userSongs, [newStatus]: updatedNewField };
    onChange(newUserSongs);

    try {
      await handleStatusChange(
        draggableId,
        destination.droppableId as SongStatus,
        songToMove.title,
        songToMove.artist
      );
    } catch (error) {
      const songs = await getUserSongs(userId);
      onChange(songs);
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      {isLanding && <SongLearningStats userSongs={userSongs} />}
      <div className='grid grid-cols-1 gap-5 font-openSans md:grid-cols-3'>
        <SongStatusCard
          isLanding={isLanding}
          title={t("want_to_learn")}
          songs={userSongs.wantToLearn}
          droppableId='wantToLearn'
          onStatusChange={handleStatusChange}
          onSongRemove={handleSongRemoval}
        />
        <SongStatusCard
          isLanding={isLanding}
          title={t("learning")}
          songs={userSongs.learning}
          droppableId='learning'
          onStatusChange={handleStatusChange}
          onSongRemove={handleSongRemoval}
        />
        <SongStatusCard
          isLanding={isLanding}
          title={t("learned")}
          songs={userSongs.learned}
          droppableId='learned'
          onStatusChange={handleStatusChange}
          onSongRemove={handleSongRemoval}
        />
      </div>
    </DragDropContext>
  );
};
