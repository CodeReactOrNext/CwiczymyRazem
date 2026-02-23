import type {
  DragEndEvent,
  DragStartEvent} from "@dnd-kit/core";
import {
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { Input } from "assets/components/ui/input";
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
import { updateUserSongOrder } from "feature/songs/services/updateUserSongOrder";
import type { Song, SongStatus } from "feature/songs/types/songs.type";
import { getAllTiers } from "feature/songs/utils/getSongTier";
import { selectUserAuth } from "feature/user/store/userSlice";
import { useTranslation } from "hooks/useTranslation";
import {
  Search,
  X
} from "lucide-react";
import { Music, Plus } from "lucide-react";
import Link from "next/link";
import posthog from "posthog-js";
import { useEffect, useMemo,useState } from "react";
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

const FilterBar = ({ 
  searchQuery, 
  setSearchQuery, 
  tierFilters, 
  setTierFilters, 
  t 
}: { 
  searchQuery: string; 
  setSearchQuery: (v: string) => void; 
  tierFilters: string[]; 
  setTierFilters: (v: string[] | ((p: string[]) => string[])) => void;
  t: any;
}) => {
  const hasActiveFilters = searchQuery.length > 0 || tierFilters.length > 0;
  
  return (
    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between animate-in slide-in-from-top-2 duration-500 will-change-transform">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <Input 
          placeholder={t("search_placeholder", "Search title or artist...") as string}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 h-11 bg-zinc-900/50 border-white/5 focus-visible:ring-cyan-500/30 focus-visible:border-cyan-500/50 shadow-sm transition-all text-[13px] font-medium"
        />
        {searchQuery && (
          <button 
            onClick={() => setSearchQuery("")} 
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-zinc-800 text-zinc-500 hover:text-white transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="flex flex-col items-start gap-2">
         <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600">Filters</span>
            {hasActiveFilters && (
                <button 
                   onClick={() => { 
                      posthog.capture("song_management_action", { action: "reset_filters" });
                      setSearchQuery(""); 
                      setTierFilters([]); 
                   }}
                   className="text-[10px] font-bold uppercase tracking-wider text-red-400 hover:text-red-300 transition-colors"
                >
                  Reset
                </button>
            )}
         </div>
         <div className="flex flex-wrap items-center gap-1.5">
            {getAllTiers().map((tier) => {
                const isActive = tierFilters.includes(tier.tier);
                return (
                    <button
                        key={tier.tier}
                        onClick={() => {
                            if (!isActive) {
                                posthog.capture("song_management_action", { action: "filter_tier", tier: tier.tier });
                            }
                            setTierFilters(prev => 
                                isActive ? prev.filter(t => t !== tier.tier) : [...prev, tier.tier]
                            );
                        }}
                        className={cn(
                             "flex h-8 items-center justify-center rounded-lg border px-3 text-[11px] font-black uppercase tracking-wider transition-all",
                             isActive 
                               ? "shadow-md scale-105" 
                               : "border-white/5 bg-zinc-900/40 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
                        )}
                        style={isActive ? {
                            borderColor: tier.color,
                            backgroundColor: `${tier.color}15`,
                            color: tier.color,
                            boxShadow: `0 0 15px ${tier.color}15`
                        } : {}}
                    >
                        {tier.tier}
                    </button>
                )
            })}
         </div>
      </div>
    </div>
  );
};

const EmptyState = () => (
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
        <button 
          onClick={() => posthog.capture("song_management_action", { action: "browse_library_empty" })}
          className="h-12 rounded-xl bg-cyan-500 hover:bg-cyan-600 px-8 text-black font-bold transition-all active:scale-95 shadow-lg shadow-cyan-500/10"
        >
          Browse Library
        </button>
      </Link>
  </div>
);

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

  // --- Filtering State ---
  const [searchQuery, setSearchQuery] = useState("");
  const [tierFilters, setTierFilters] = useState<string[]>([]);
  const _hasActiveFilters = searchQuery.length > 0 || tierFilters.length > 0;

  const filteredSongs = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    const hasTierFilters = tierFilters.length > 0;

    const filterFn = (song: Song) => {
      // 1. Text Search
      const matchesSearch =
        !query ||
        song.title.toLowerCase().includes(query) ||
        song.artist.toLowerCase().includes(query);

      // 2. Tier Filter
      const matchesTier =
        !hasTierFilters || (song.tier && tierFilters.includes(song.tier));

      return matchesSearch && matchesTier;
    };

    return {
      wantToLearn: userSongs.wantToLearn.filter(filterFn),
      learning: userSongs.learning.filter(filterFn),
      learned: userSongs.learned.filter(filterFn),
    };
  }, [userSongs, searchQuery, tierFilters]);

  useEffect(() => {
    if (searchQuery.length > 2) {
      const timer = setTimeout(() => {
        posthog.capture("song_management_action", { action: "search", query: searchQuery });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [searchQuery]);

  // Use filtered songs for the lists to prevent "ghost" items, 
  // but we still iterate over ALL userSongs for finding logic/API ops 
  // if finding by ID is needed, but Render passes filtered.

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
            posthog.capture("song_management_action", { 
              action: "move_song", 
              from: activeContainer, 
              to: overContainer,
              song_id: activeId 
            });
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

          } catch (_error) {
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

  const getStatusLabel = (status: SongStatus) => {
    switch (status) {
      case "wantToLearn": return t("want_to_learn");
      case "learning": return t("learning");
      case "learned": return t("learned");
      default: return "";
    }
  };

  const renderBoard = (isMobileView: boolean) => {
    if (isMobileView) {
      return (
        <Tabs defaultValue="wantToLearn" className="w-full">
          <TabsList className="mb-6 grid w-full grid-cols-3 bg-zinc-900/50 p-1.5 h-auto rounded-xl border border-white/5">
            {(["wantToLearn", "learning", "learned"] as const).map(status => (
              <TabsTrigger 
                key={status}
                value={status} 
                className="flex flex-col gap-1.5 items-center py-3 rounded-lg data-[state=active]:bg-zinc-800 data-[state=active]:text-white transition-all"
              >
                  <span className="text-[11px] font-bold uppercase tracking-wider opacity-70">{getStatusLabel(status) as string}</span>
                  <span className="text-lg font-black leading-none">{filteredSongs[status].length}</span>
              </TabsTrigger>
            ))}
          </TabsList>
          
          {(["wantToLearn", "learning", "learned"] as const).map(status => (
            <TabsContent key={status} value={status}>
              <SongStatusCard
                title={getStatusLabel(status) as string}
                songs={filteredSongs[status]}
                droppableId={status}
                onStatusChange={handleStatusChange}
                onSongRemove={handleSongRemoval}
                isMobile={true}
                hideHeaderOnMobile={true}
              />
            </TabsContent>
          ))}
        </Tabs>
      );
    }

    return (
      <div className='font-openSans grid grid-cols-1 gap-6 md:grid-cols-3'>
        {(["wantToLearn", "learning", "learned"] as const).map(status => (
          <SongStatusCard
            key={status}
            title={getStatusLabel(status) as string}
            songs={filteredSongs[status]}
            droppableId={status}
            onStatusChange={handleStatusChange}
            onSongRemove={handleSongRemoval}
            isMobile={false}
            isDropTarget={activeOverContainer === status}
          />
        ))}
      </div>
    );
  };

  return (
    <DndContext 
        sensors={isMobile ? undefined : sensors}
        collisionDetection={closestCorners}
        onDragStart={isMobile ? undefined : handleDragStart}
        onDragEnd={isMobile ? undefined : handleDragEnd}
        onDragOver={isMobile ? undefined : handleDragOver}
    >

      <FilterBar 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        tierFilters={tierFilters}
        setTierFilters={setTierFilters}
        t={t}
      />

      {Object.values(userSongs).every(arr => arr.length === 0) ? (
        <EmptyState />
      ) : renderBoard(isMobile)}
      
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
