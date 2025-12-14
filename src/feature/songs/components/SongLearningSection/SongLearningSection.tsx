import type { DropResult } from "@hello-pangea/dnd";
import { DragDropContext } from "@hello-pangea/dnd";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "assets/components/ui/tabs";
import { SongLearningStats } from "feature/songs/components/SongLearningStats/SongLearningStats";
import { SongStatusCard } from "feature/songs/components/SongStatusCard";
import { useSongsStatusChange } from "feature/songs/hooks/useSongsStatusChange";
import { getUserSongs } from "feature/songs/services/getUserSongs";
import type { Song, SongStatus } from "feature/songs/types/songs.type";
import { selectUserAuth } from "feature/user/store/userSlice";
import { useEffect, useState } from "react";
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

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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

  const MobileView = () => (
    <Tabs defaultValue="wantToLearn" className="w-full">
      <TabsList className="mb-4 grid w-full grid-cols-3 bg-slate-800/50">
        <TabsTrigger value="wantToLearn">{t("want_to_learn") as string}</TabsTrigger>
        <TabsTrigger value="learning">{t("learning") as string}</TabsTrigger>
        <TabsTrigger value="learned">{t("learned") as string}</TabsTrigger>
      </TabsList>
      
      <TabsContent value="wantToLearn">
        <SongStatusCard
          isLanding={isLanding}
          title={t("want_to_learn") as string}
          songs={userSongs.wantToLearn}
          droppableId='wantToLearn'
          onStatusChange={handleStatusChange}
          onSongRemove={handleSongRemoval}
          isMobile={true}
        />
      </TabsContent>
      <TabsContent value="learning">
        <SongStatusCard
          isLanding={isLanding}
          title={t("learning") as string}
          songs={userSongs.learning}
          droppableId='learning'
          onStatusChange={handleStatusChange}
          onSongRemove={handleSongRemoval}
          isMobile={true}
        />
      </TabsContent>
      <TabsContent value="learned">
        <SongStatusCard
          isLanding={isLanding}
          title={t("learned") as string}
          songs={userSongs.learned}
          droppableId='learned'
          onStatusChange={handleStatusChange}
          onSongRemove={handleSongRemoval}
          isMobile={true}
        />
      </TabsContent>
    </Tabs>
  );

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className='mb-6'>
        <SongLearningStats userSongs={userSongs} />
      </div>

      {isMobile ? (
        <MobileView />
      ) : (
        <div className='font-openSans grid grid-cols-1 gap-6 md:grid-cols-3'>
          <SongStatusCard
            isLanding={isLanding}
            title={t("want_to_learn") as string}
            songs={userSongs.wantToLearn}
            droppableId='wantToLearn'
            onStatusChange={handleStatusChange}
            onSongRemove={handleSongRemoval}
            isMobile={false}
          />
          <SongStatusCard
            isLanding={isLanding}
            title={t("learning") as string}
            songs={userSongs.learning}
            droppableId='learning'
            onStatusChange={handleStatusChange}
            onSongRemove={handleSongRemoval}
            isMobile={false}
          />
          <SongStatusCard
            isLanding={isLanding}
            title={t("learned") as string}
            songs={userSongs.learned}
            droppableId='learned'
            onStatusChange={handleStatusChange}
            onSongRemove={handleSongRemoval}
            isMobile={false}
          />
        </div>
      )}
    </DragDropContext>
  );
};
