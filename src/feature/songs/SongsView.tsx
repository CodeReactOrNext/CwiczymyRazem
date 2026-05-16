import { Button } from "assets/components/ui/button";
import { Input } from "assets/components/ui/input";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "assets/components/ui/tabs";
import { cn } from "assets/lib/utils";
import { HeroBanner } from "components/UI/HeroBanner";
import AddSongModal from "feature/songs/components/AddSongModal/AddSongModal";
import FilterSheet from "feature/songs/components/FilterSheet/FilterSheet";
import { LevelProgressHero } from "feature/profile/components/LevelProgressHero";
import { LevelProgressCircle } from "feature/profile/components/LevelProgressCircle";
import { SongLearningSection } from "feature/songs/components/SongLearningSection/SongLearningSection";
import { SkillPowerHero } from "feature/songs/components/SongBoard/SkillPowerHero";
import { SongBoard } from "feature/songs/components/SongBoard/SongBoard";
import { SongDetailView } from "feature/songs/components/SongBoard/SongDetailView";
import { SongLearningStats } from "feature/songs/components/SongLearningStats/SongLearningStats";
import { SongPracticePickerModal } from "feature/songs/components/SongPracticePickerModal/SongPracticePickerModal";
import { SongCardSkeleton } from "feature/songs/components/SongsGrid/SongCardSkeleton";
import { SongsGrid } from "feature/songs/components/SongsGrid/SongsGrid";
import { useSongs } from "feature/songs/hooks/useSongs";
import { useSongsStatusChange } from "feature/songs/hooks/useSongsStatusChange";
import { useUserSongProgress } from "feature/songs/hooks/useUserSongProgress";
import { getGlobalGenres } from "feature/songs/services/getGlobalMetadata";
import type { Song } from "feature/songs/types/songs.type";
import { calculateSkillPower } from "feature/songs/utils/difficulty.utils";
import { getSongTier, getAllTiers } from "feature/songs/utils/getSongTier";
import { selectCurrentUserStats, selectUserAuth, selectUserInfo } from "feature/user/store/userSlice";
import { useTranslation } from "hooks/useTranslation";
import {
  LayoutDashboard,
  Library as LibraryIcon,
  LoaderCircle,
  Music,
  Plus,
  Search,
  SlidersHorizontal,
  Trophy,
  X,
} from "lucide-react";
import { useRouter } from "next/router";
import posthog from "posthog-js";
import { useEffect, useMemo, useState } from "react";
import { useAppSelector } from "store/hooks";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "assets/components/ui/tooltip";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  DragStartEvent,
  DragEndEvent,
  defaultDropAnimationSideEffects,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates, arrayMove } from "@dnd-kit/sortable";
import { updateUserSongOrder } from "feature/songs/services/updateUserSongOrder";
import { getUserSongs } from "feature/songs/services/getUserSongs";
import type { SongStatus } from "feature/songs/types/songs.type";
import { SongCard } from "feature/songs/components/SongsGrid/SongCard";


interface SongsViewProps {
  view?: "explore" | "management" | string;
  initialSongId?: string;
}

const SongsView = ({ view = "explore", initialSongId = "" }: SongsViewProps) => {
  const router = useRouter();
  const { t } = useTranslation("songs");
  const isManagementView = view === "management";


  const userAuth = useAppSelector(selectUserAuth);
  const userInfo = useAppSelector(selectUserInfo);
  const userStats = useAppSelector(selectCurrentUserStats);
  const isPremium = userInfo?.role === "pro" || userInfo?.role === "master" || userInfo?.role === "admin";

  const [practiceTarget, setPracticeTarget] = useState<Song | null>(null);
  const [detailsTarget, setDetailsTarget] = useState<Song | null>(null);

  const { progressMap, attachGpFile, detachGpFile } = useUserSongProgress(
    userAuth ?? null,
    isPremium
  );
  const {
    page,
    isLoading,
    userSongs,
    hasFilters,
    titleQuery,
    setTitleQuery,
    artistQuery,
    setArtistQuery,
    isModalOpen,
    filteredSongs,
    setIsModalOpen,
    difficultyFilter,
    handlePageChange,
    handleClearFilters,
    tierFilters,
    setTierFilters,
    hasMore,
    handleStatusUpdate,
    refreshSongs,
    refreshSongsWithoutLoading,
    sortBy,
    sortDirection,
    debounceLoading,
    genreFilters,
    applyFilters,
    handleResetFilters,
    updateUserSongsCache,
    getSongStatus,
  } = useSongs();

  const { handleSongRemoval, handleStatusChange } = useSongsStatusChange({
    userSongs,
    onChange: updateUserSongsCache,
    onTableStatusChange: refreshSongs,
  });

  const skillPower = userSongs?.learned ? calculateSkillPower(userSongs.learned) : 0;
  const playerTier = getSongTier(skillPower > 0 ? skillPower : '?');

  const totalSongsCount = (userSongs?.wantToLearn?.length || 0) + (userSongs?.learning?.length || 0) + (userSongs?.learned?.length || 0);
  const learnedCount = userSongs?.learned?.length || 0;
  const completionRate = totalSongsCount > 0 ? Math.round((learnedCount / totalSongsCount) * 100) : 0;

  const [availableGenres, setAvailableGenres] = useState<string[]>([]);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

  useEffect(() => {
    const fetchGenres = async () => {
      const genres = await getGlobalGenres();
      setAvailableGenres(genres);
    };
    fetchGenres();
  }, []);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<'explore' | 'collection'>('explore');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 1024px)");
    setIsMobile(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (initialSongId) {
      const allSongs = [...userSongs.wantToLearn, ...userSongs.learning, ...userSongs.learned];
      const song = allSongs.find(s => s.id === initialSongId);
      if (song) {
        setDetailsTarget(song);
      } else {
        const fetchSong = async () => {
          const { getSongById } = await import("feature/songs/services/getSongs");
          const fetchedSong = await getSongById(initialSongId);
          if (fetchedSong) {
            setDetailsTarget(fetchedSong);
          }
        };
        fetchSong();
      }
    }
  }, [initialSongId, userSongs]);

  const disableDnd = isMobile;

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

  const activeSensors = disableDnd ? [] : sensors;

  const findContainer = (id: string): SongStatus | undefined => {
    if (id === "wantToLearn" || id === "learning" || id === "learned") return id as SongStatus;
    
    if (userSongs.wantToLearn.find((s) => s.id === id)) return "wantToLearn";
    if (userSongs.learning.find((s) => s.id === id)) return "learning";
    if (userSongs.learned.find((s) => s.id === id)) return "learned";
    
    return undefined;
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: any) => {
    const { active, over } = event;
    const activeId = active.id as string;
    const overId = over?.id as string;

    if (!overId) return;

    const activeContainer = findContainer(activeId);
    const overContainer = findContainer(overId);

    if (!activeContainer || !overContainer || activeContainer === overContainer) {
      return;
    }

    const activeItems = userSongs[activeContainer];
    const overItems = userSongs[overContainer];
    const activeIndex = activeItems.findIndex((s) => s.id === activeId);
    const overIndex = overItems.findIndex((s) => s.id === overId);

    let newIndex;
    if (overId in userSongs) {
      newIndex = overItems.length;
    } else {
      const isBelowLastItem =
        over &&
        overIndex === overItems.length - 1 &&
        event.activatorEvent.offsetY > 0;

      const modifier = isBelowLastItem ? 1 : 0;
      newIndex = overIndex >= 0 ? overIndex + modifier : overItems.length;
    }

    const activeSong = activeItems[activeIndex];
    const newActiveItems = activeItems.filter((_, i) => i !== activeIndex);
    const newOverItems = [...overItems];
    newOverItems.splice(newIndex, 0, activeSong);

    updateUserSongsCache({
      ...userSongs,
      [activeContainer]: newActiveItems,
      [overContainer]: newOverItems,
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    const activeId = active.id as string;
    const overId = over?.id as string;

    setActiveId(null);

    if (!overId || !userAuth) return;

    const activeContainer = findContainer(activeId);
    const overContainer = findContainer(overId);

    if (!activeContainer || !overContainer) return;

    const activeItems = userSongs[activeContainer];
    const overItems = userSongs[overContainer];
    const activeIndex = activeItems.findIndex((s) => s.id === activeId);
    const overIndex = overItems.findIndex((s) => s.id === overId);

    if (activeContainer === overContainer) {
      if (activeIndex !== overIndex && overIndex !== -1) {
        const newItems = arrayMove(activeItems, activeIndex, overIndex);
        updateUserSongsCache({
          ...userSongs,
          [activeContainer]: newItems,
        });
        await updateUserSongOrder(userAuth, newItems);
      }
    } else {
      // Cross-container move is now handled by onDragOver for the UI,
      // but we still need to persist the change and the final order.
      const activeSong = overItems.find(s => s.id === activeId);
      if (!activeSong) return;

      await handleStatusChange(
        activeId,
        overContainer,
        activeSong.title,
        activeSong.artist,
        { skipOptimisticUpdate: true, skipRefetch: true }
      );
      
      await updateUserSongOrder(userAuth, userSongs[activeContainer]);
      await updateUserSongOrder(userAuth, userSongs[overContainer]);
    }
  };

  const activeSong = useMemo(() => {
    // Search in userSongs
    return [...userSongs.wantToLearn, ...userSongs.learning, ...userSongs.learned]
        .find(s => s.id === activeId);
  }, [activeId, userSongs]);






  return (
    <>
      <div className="flex flex-col h-[calc(100vh-5rem)] overflow-hidden font-openSans">
        {/* Mobile View Switcher */}
        {!detailsTarget && (
          <div className="flex xl:hidden bg-zinc-900/80 border-b border-white/5 p-1.5 backdrop-blur-md">
            <button 
              onClick={() => setMobileTab('explore')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 text-[12px] font-black transition-all duration-300 rounded-lg",
                mobileTab === 'explore' 
                  ? "text-cyan-400 bg-cyan-500/10 shadow-[0_0_15px_rgba(6,182,212,0.1)] border border-cyan-500/20" 
                  : "text-zinc-500 hover:text-zinc-400"
              )}
            >
              <Search size={14} />
              Explore
            </button>
            <button 
              onClick={() => setMobileTab('collection')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 text-[12px] font-black transition-all duration-300 rounded-lg",
                mobileTab === 'collection' 
                  ? "text-cyan-400 bg-cyan-500/10 shadow-[0_0_15px_rgba(6,182,212,0.1)] border border-cyan-500/20" 
                  : "text-zinc-500 hover:text-zinc-400"
              )}
            >
              <LibraryIcon size={14} />
              Collection
            </button>
          </div>
        )}

        <DndContext
          sensors={activeSensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
        <div className="flex-1 flex overflow-hidden relative">
          {/* Sidebar (Left) - Desktop only */}
          <aside id="sidebar-root" className="hidden xl:flex w-[300px] shrink-0 bg-zinc-900/30 border-r border-white/5 flex-col overflow-hidden">
             <div className="flex-1 overflow-y-auto no-scrollbar py-6 px-3">
                <SongLearningSection

                  isLanding={false}
                  userSongs={userSongs}
                  onChange={updateUserSongsCache}
                  onStatusChange={refreshSongs}
                  progressMap={progressMap}
                  isPremium={isPremium}
                  onPracticeWithGp={(song) => setPracticeTarget(song)}
                  onOpenDetails={(song) => {
                    setDetailsTarget(song);
                  }}
                  onExploreLibrary={(v) => {
                    router.push({ query: { ...router.query, view: v } }, undefined, { shallow: true });
                    setDetailsTarget(null);
                  }}
                  isLibraryActive={view === 'explore' && !detailsTarget}
                  activeId={activeId}
                  disableDnd={disableDnd}
                  isMobile={isMobile}
                />
             </div>
          </aside>

          <main className={cn(
            "flex-1 overflow-y-auto no-scrollbar relative bg-black/20",
            !detailsTarget ? "p-4 sm:p-6 md:p-10" : ""
          )}>
            {detailsTarget ? (
              <div className="h-full flex flex-col">
                <SongDetailView 
                  song={detailsTarget}
                  progress={progressMap[detailsTarget.id] ?? null}
                  status={getSongStatus(detailsTarget.id)}
                  onPractice={(song) => setPracticeTarget(song)}
                  onRemove={async (id) => {
                      await handleSongRemoval(id);
                      setDetailsTarget(null);
                  }}
                  onStatusChange={handleStatusChange}
                  onBack={() => setDetailsTarget(null)}
                />
              </div>
            ) : view === 'board' ? (
              <div className="space-y-10 animate-in fade-in-50 slide-in-from-bottom-4 duration-700">
                <SkillPowerHero 
                  skillPower={skillPower}
                  playerTier={playerTier}
                  learnedCount={learnedCount}
                  totalCount={totalSongsCount}
                />
                
                <div className="space-y-12">
                  {userSongs.wantToLearn.length > 0 && (
                    <div className="space-y-6">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-[4px] bg-zinc-500/10 flex items-center justify-center text-zinc-400">
                           <Music size={16} />
                        </div>
                        <h2 className="text-xl font-bold text-white">Want to learn</h2>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {userSongs.wantToLearn.map((song) => (
                          <SongCard 
                            key={song.id} 
                            song={song} 
                            onOpenDetails={() => setDetailsTarget(song)}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {userSongs.learning.length > 0 && (
                    <div className="space-y-6">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-[4px] bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                           <Play size={16} className="fill-current" />
                        </div>
                        <h2 className="text-xl font-bold text-white">Currently learning</h2>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {userSongs.learning.map((song) => (
                          <SongCard 
                            key={song.id} 
                            song={song} 
                            onOpenDetails={() => setDetailsTarget(song)}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {userSongs.learned.length > 0 && (
                    <div className="space-y-6">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-[4px] bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                           <Trophy size={16} />
                        </div>
                        <h2 className="text-xl font-bold text-white">Mastered songs</h2>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {userSongs.learned.map((song) => (
                          <SongCard 
                            key={song.id} 
                            song={song} 
                            onOpenDetails={() => setDetailsTarget(song)}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {userSongs.learned.length === 0 && userSongs.learning.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                      <div className="h-20 w-20 rounded-full bg-zinc-800 flex items-center justify-center mb-6">
                        <Music size={32} className="text-zinc-500" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">No songs in your board yet</h3>
                      <p className="text-sm max-w-xs">Start exploring the library and add songs to your collection to track your progress.</p>
                    </div>
                  )}
                </div>
              </div>
            ) : mobileTab === 'collection' ? (
              <div className="xl:hidden h-full overflow-y-auto p-4 bg-zinc-900/20 overscroll-none scroll-smooth">
                 <SongLearningSection
                  isLanding={false}
                  userSongs={userSongs}
                  onChange={updateUserSongsCache}
                  onStatusChange={refreshSongs}
                  progressMap={progressMap}
                  isPremium={isPremium}
                  onPracticeWithGp={(song) => setPracticeTarget(song)}
                  onOpenDetails={(song) => {
                    setDetailsTarget(song);
                  }}
                  onExploreLibrary={(v) => {
                    router.push({ query: { ...router.query, view: v } }, undefined, { shallow: true });
                    setDetailsTarget(null);
                    if (v === 'explore') setMobileTab('explore');
                  }}
                  isLibraryActive={view === 'explore' && !detailsTarget}
                  activeId={activeId}
                  disableDnd={disableDnd}
                  isMobile={isMobile}
                />
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in-50 duration-300">
                {/* Tier Selection Grid */}
                <div className="space-y-4">
                  <div className="flex flex-col gap-1">
                    <p className="text-xs font-bold text-zinc-500">Filter by Tier</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {getAllTiers().map((tier) => {
                      const isActive = tierFilters.includes(tier.tier);
                      return (
                        <button
                          key={tier.tier}
                          onClick={() => {
                            if (isActive) {
                              setTierFilters(tierFilters.filter((t: string) => t !== tier.tier));
                            } else {
                              posthog.capture("song_library_action", { action: "filter_tier", tier: tier.tier });
                              setTierFilters([...tierFilters, tier.tier]);
                            }
                          }}
                          className={cn(
                            "flex h-11 w-11 items-center justify-center rounded-lg font-bold transition-all active:scale-90",
                            isActive 
                              ? "opacity-100 shadow-lg shadow-black/20" 
                              : "bg-zinc-900 opacity-40 grayscale hover:opacity-100 hover:grayscale-0"
                          )}
                          style={{
                            backgroundColor: isActive ? `${tier.color}25` : "",
                            color: isActive ? tier.color : "inherit",
                          }}
                        >
                          {tier.tier}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Search & Filter Bar */}
                <div className="relative z-30 py-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center">
                    <div className="relative flex-1">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                        <Music className="h-4 w-4 text-zinc-500" />
                      </div>
                      <Input
                        placeholder={t("artist", "Artist...") as string}
                        value={artistQuery}
                        onChange={(e) => setArtistQuery(e.target.value)}
                        className="h-12 w-full border-white/5 bg-zinc-900/60 pl-11 text-white placeholder:text-zinc-500 focus:border-cyan-500/50 focus:bg-zinc-900 focus:ring-4 focus:ring-cyan-500/10 transition-all font-medium"
                      />
                    </div>

                    <div className="relative flex-[1.2]">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                        <Search className="h-4 w-4 text-zinc-500" />
                      </div>
                      <Input
                        placeholder={t("title", "Title...") as string}
                        value={titleQuery}
                        onChange={(e) => setTitleQuery(e.target.value)}
                        className="h-12 w-full border-white/5 bg-zinc-900/60 pl-11 text-white placeholder:text-zinc-500 focus:border-cyan-500/50 focus:bg-zinc-900 focus:ring-4 focus:ring-cyan-500/10 transition-all font-medium"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setIsFilterSheetOpen(true)}
                        className={cn(
                          "relative h-12 flex-1 border-white/5 bg-zinc-900/60 px-6 font-bold text-zinc-300 hover:bg-zinc-800 md:flex-initial transition-all active:scale-95",
                          hasFilters && "border-cyan-500/30 bg-cyan-500/5 text-cyan-400"
                        )}
                      >
                        <SlidersHorizontal className="mr-2.5 h-4 w-4" />
                        Filters & Sort
                      </Button>
                    </div>
                  </div>
                </div>

                <FilterSheet 
                  isOpen={isFilterSheetOpen}
                  onClose={() => setIsFilterSheetOpen(false)}
                  difficultyFilter={difficultyFilter}
                  tierFilters={tierFilters}
                  genreFilters={genreFilters}
                  sortBy={sortBy}
                  sortDirection={sortDirection}
                  availableGenres={availableGenres}
                  onApply={applyFilters}
                  onClearFilters={handleResetFilters}
                  hasFilters={hasFilters}
                />

                {/* Grid Content */}
                {isLoading ? (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <SongCardSkeleton key={i} />
                    ))}
                  </div>
                ) : (
                  <SongsGrid
                    songs={filteredSongs}
                    currentPage={page}
                    hasMore={hasMore}
                    onPageChange={handlePageChange}
                    onAddSong={() => setIsModalOpen(true)}
                    hasFilters={tierFilters.length > 0 || genreFilters.length > 0}
                    onStatusChange={refreshSongs}
                    userSongs={userSongs}
                  />
                )}
              </div>
            )}
          </main>
        </div>
        <DragOverlay dropAnimation={{
          sideEffects: defaultDropAnimationSideEffects({
            styles: {
              active: {
                opacity: "0.5",
              },
            },
          }),
        }}>
          {activeId && activeSong && (
            <div className="w-[280px] cursor-grabbing">
               <div className="flex items-center gap-3 rounded-xl border border-cyan-500/30 bg-zinc-900/90 p-3 shadow-2xl backdrop-blur-xl">
                 <div className="h-10 w-10 flex-shrink-0 rounded-lg bg-zinc-800 flex items-center justify-center overflow-hidden">
                   {activeSong.coverUrl ? (
                     <img src={activeSong.coverUrl} alt="" className="h-full w-full object-cover" />
                   ) : (
                     <Music className="h-5 w-5 text-zinc-600" />
                   )}
                 </div>
                 <div className="flex-1 min-w-0">
                   <p className="truncate text-xs font-bold text-white">{activeSong.title}</p>
                   <p className="truncate text-[10px] text-zinc-500">{activeSong.artist}</p>
                 </div>
               </div>
            </div>
          )}
        </DragOverlay>
        </DndContext>
      </div>

      <AddSongModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleStatusUpdate}
      />

      {practiceTarget && userAuth && (
        <SongPracticePickerModal
          song={practiceTarget}
          userId={userAuth}
          isPremium={isPremium}
          progress={progressMap[practiceTarget.id] ?? null}
          onAttachGpFile={attachGpFile}
          onDetachGpFile={detachGpFile}
          onClose={() => setPracticeTarget(null)}
        />
      )}
    </>
  );
};

export default SongsView;
