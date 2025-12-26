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
import { updateUserSongOrder } from "feature/songs/services/updateUserSongOrder";
import { selectUserAuth } from "feature/user/store/userSlice";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Music, Plus } from "lucide-react";
import Link from "next/link";
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

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (!userId) {
    return null;
  }

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

    // Reset over container state
    setActiveOverContainer(null);

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

        // API Update: Log + Status Change
        try {
            await handleStatusChange(
              activeId,
              overContainer,
              activeSong.title,
              activeSong.artist,
              { skipOptimisticUpdate: true, skipRefetch: true }
            );
            
            // Persist order for BOTH lists to ensure gaps are closed and new item has correct index
            await updateUserSongOrder(userId, newActiveItems);
            await updateUserSongOrder(userId, newOverItems);

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
             
             // Persist new order (No logs)
             updateUserSongOrder(userId, newItems);
        }
    }
  };

  const [activeOverContainer, setActiveOverContainer] = useState<SongStatus | null>(null);

  const handleDragOver = (event: any) => {
    const { over } = event;
    const overId = over?.id;
    if (!overId) {
      setActiveOverContainer(null);
      return;
    }
    const container = findContainer(overId);
    setActiveOverContainer(container || null);
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
      <TabsList className="mb-6 grid w-full grid-cols-3 bg-zinc-900/50 p-1.5 h-auto rounded-xl border border-white/5">
        <TabsTrigger 
          value="wantToLearn" 
          className="flex flex-col gap-1.5 items-center py-3 rounded-lg data-[state=active]:bg-zinc-800 data-[state=active]:text-white transition-all"
        >
            <span className="text-[11px] font-bold uppercase tracking-wider opacity-70">{t("want_to_learn") as string}</span>
            <span className="text-lg font-black leading-none">{userSongs.wantToLearn.length}</span>
        </TabsTrigger>
        <TabsTrigger 
          value="learning" 
          className="flex flex-col gap-1.5 items-center py-3 rounded-lg data-[state=active]:bg-zinc-800 data-[state=active]:text-white transition-all"
        >
            <span className="text-[11px] font-bold uppercase tracking-wider opacity-70">{t("learning") as string}</span>
            <span className="text-lg font-black leading-none">{userSongs.learning.length}</span>
        </TabsTrigger>
        <TabsTrigger 
          value="learned" 
          className="flex flex-col gap-1.5 items-center py-3 rounded-lg data-[state=active]:bg-zinc-800 data-[state=active]:text-white transition-all"
        >
            <span className="text-[11px] font-bold uppercase tracking-wider opacity-70">{t("learned") as string}</span>
            <span className="text-lg font-black leading-none">{userSongs.learned.length}</span>
        </TabsTrigger>
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
          hideHeaderOnMobile={true}
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
          hideHeaderOnMobile={true}
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
          hideHeaderOnMobile={true}
        />
      </TabsContent>
    </Tabs>
  );

  return (
    <DndContext 
        sensors={isMobile ? undefined : sensors}
        collisionDetection={closestCorners}
        onDragStart={isMobile ? undefined : handleDragStart}
        onDragEnd={isMobile ? undefined : handleDragEnd}
        onDragOver={isMobile ? undefined : handleDragOver}
    >
      <div className='mb-6'>
        <SongLearningStats userSongs={userSongs} />
      </div>

      {userSongs.wantToLearn.length === 0 && userSongs.learning.length === 0 && userSongs.learned.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-white/5 bg-zinc-900/10 p-12 text-center backdrop-blur-sm animate-in fade-in zoom-in duration-500">
           <div className="relative mb-6">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-zinc-800/50 text-zinc-500">
                <Music size={40} />
              </div>
              <div className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500 text-black shadow-lg shadow-cyan-500/20">
                <Plus size={18} strokeWidth={3} />
              </div>
           </div>
           <h3 className="text-xl font-bold text-white mb-2">Build your practice list</h3>
           <p className="max-w-md text-sm text-zinc-400 mb-8">
             Your song board is empty. Add songs from the library to track your progress and manage your learning journey.
           </p>
           <Link href="/songs?view=library">
              <button className="h-12 rounded-xl bg-cyan-500 hover:bg-cyan-600 px-8 text-black font-bold transition-all active:scale-95 shadow-lg shadow-cyan-500/10">
                Browse Library
              </button>
           </Link>
        </div>
      ) : isMobile ? (
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
            isDropTarget={activeOverContainer === 'wantToLearn'}
          />
          <SongStatusCard
            isLanding={isLanding}
            title={t("learning") as string}
            songs={userSongs.learning}
            droppableId='learning'
            onStatusChange={handleStatusChange}
            onSongRemove={handleSongRemoval}
            isMobile={false}
            isDropTarget={activeOverContainer === 'learning'}
          />
          <SongStatusCard
            isLanding={isLanding}
            title={t("learned") as string}
            songs={userSongs.learned}
            droppableId='learned'
            onStatusChange={handleStatusChange}
            onSongRemove={handleSongRemoval}
            isMobile={false}
            isDropTarget={activeOverContainer === 'learned'}
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
