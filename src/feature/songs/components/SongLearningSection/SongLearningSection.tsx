import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "assets/components/ui/tabs";
import { cn } from "assets/lib/utils";
import { SongLearningStats } from "feature/songs/components/SongLearningStats/SongLearningStats";
import { SongStatusCard } from "feature/songs/components/SongStatusCard";
import { STATUS_CONFIG } from "feature/songs/constants/statusConfig";
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
  
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
         distance: 8,
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

  const findContainer = (id: string): SongStatus | undefined => {
    if (userSongs.wantToLearn.find((s) => s.id === id)) return "wantToLearn";
    if (userSongs.learning.find((s) => s.id === id)) return "learning";
    if (userSongs.learned.find((s) => s.id === id)) return "learned";
    // Check if id matches a container ID directly (for dropped-on-empty)
    if (id === "wantToLearn" || id === "learning" || id === "learned") return id as SongStatus;
    
    return undefined;
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    const activeId = active.id as string;
    const overId = over?.id as string;

    setActiveId(null);

    if (!overId) return;

    const activeContainer = findContainer(activeId);
    let overContainer = findContainer(overId);

    // If still undefined, maybe it's dropping over the container itself (handled in findContainer but just to be safe)
    if (!overContainer) {
        if (["wantToLearn", "learning", "learned"].includes(overId)) {
             overContainer = overId as SongStatus;
        } else {
             return;
        }
    }

    if (!activeContainer || !overContainer) return;

    const activeItems = userSongs[activeContainer];
    const overItems = userSongs[overContainer];
    
    const activeIndex = activeItems.findIndex((s) => s.id === activeId);
    const overIndex = overItems.findIndex((s) => s.id === overId);

    let newIndex;
    if (overIndex >= 0) {
        newIndex = overIndex;
    } else {
        // Dropped on container
        newIndex = overItems.length + 1;
    }

    if (activeContainer !== overContainer) {
        // Moving between containers
        const activeSong = activeItems[activeIndex];
        const newActiveItems = [...activeItems];
        newActiveItems.splice(activeIndex, 1);
        
        const newOverItems = [...overItems];
        newOverItems.splice(newIndex > newOverItems.length ? newOverItems.length : newIndex, 0, activeSong);

        onChange({
            ...userSongs,
            [activeContainer]: newActiveItems,
            [overContainer]: newOverItems,
        });

        // API Update
        try {
            await handleStatusChange(
              activeId,
              overContainer,
              activeSong.title,
              activeSong.artist
            );
          } catch (error) {
            const songs = await getUserSongs(userId);
            onChange(songs);
          }

    } else {
        // Reordering in same container
        if (activeIndex !== overIndex) {
             const newItems = arrayMove(activeItems, activeIndex, overIndex);
             onChange({
                ...userSongs,
                [activeContainer]: newItems
             });
             // Note: Persisting reorder within same status might need API support if order matters in DB.
             // For now we just update UI state.
        }
    }
  };

  const getActiveSong = () => {
      if (!activeId) return null;
      const allSongs = [...userSongs.wantToLearn, ...userSongs.learning, ...userSongs.learned];
      return allSongs.find(s => s.id === activeId);
  }
  
  const activeSong = getActiveSong();
  const activeContainer = activeId ? findContainer(activeId) : null;
  const activeConfig = activeContainer ? STATUS_CONFIG[activeContainer] : null;

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
    <DndContext 
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
    >
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
      
      <DragOverlay>
        {activeSong && activeConfig ? (
             <div className="group relative flex flex-col gap-2 rounded-lg border border-white/10 bg-zinc-900/95 pointer-events-none p-3 shadow-2xl ring-2 ring-cyan-500/50 opacity-95 rotate-1 cursor-grabbing w-[280px]">
                 <div className="flex items-center gap-3">
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md border border-white/10 shadow-lg">
                      {activeSong.coverUrl ? (
                        <img src={activeSong.coverUrl} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-zinc-800">
                           <activeConfig.icon className={cn("h-4 w-4", activeConfig.color)} />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-white">{activeSong.title}</p>
                      <p className="truncate text-xs text-zinc-400">{activeSong.artist}</p>
                    </div>
                  </div>
             </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
