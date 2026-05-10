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
  closestCorners,
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
}

const SongsView = ({ view = "explore" }: SongsViewProps) => {
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
    if (userSongs.wantToLearn.find((s) => s.id === id)) return "wantToLearn";
    if (userSongs.learning.find((s) => s.id === id)) return "learning";
    if (userSongs.learned.find((s) => s.id === id)) return "learned";
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

    if (!overId || !userAuth) return;

    // Standard internal move (existing logic from SongLearningSection)
    const activeContainer = findContainer(activeId);
    let overContainer = findContainer(overId);

    if (!overContainer && ["wantToLearn", "learning", "learned"].includes(overId)) {
        overContainer = overId as SongStatus;
    }

    if (!activeContainer || !overContainer) return;

    const activeItems = userSongs[activeContainer];
    const overItems = userSongs[overContainer];
    
    const activeIndex = activeItems.findIndex((s) => s.id === activeId);
    const overIndex = overItems.findIndex((s) => s.id === overId);

    if (activeContainer === overContainer) {
        if (activeIndex !== overIndex) {
            const newItems = arrayMove(activeItems, activeIndex, overIndex);
            updateUserSongsCache({
                ...userSongs,
                [activeContainer]: newItems,
            });
            await updateUserSongOrder(userAuth, newItems);
        }
    } else {
        const activeSong = activeItems[activeIndex];
        const newActiveItems = activeItems.filter((_, i) => i !== activeIndex);
        const newOverItems = [...overItems];
        const insertIndex = overIndex >= 0 ? overIndex : overItems.length;
        newOverItems.splice(insertIndex, 0, activeSong);

        updateUserSongsCache({
            ...userSongs,
            [activeContainer]: newActiveItems,
            [overContainer]: newOverItems,
        });

        await handleStatusChange(
            activeId,
            overContainer,
            activeSong.title,
            activeSong.artist,
            { skipOptimisticUpdate: true, skipRefetch: true }
        );
        await updateUserSongOrder(userAuth, newActiveItems);
        await updateUserSongOrder(userAuth, newOverItems);
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
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
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
                  onExploreLibrary={() => setDetailsTarget(null)}
                  isLibraryActive={!detailsTarget}
                  activeId={activeId}
                  disableDnd={disableDnd}
                  isMobile={isMobile}
                />
             </div>
          </aside>

          <main className={cn(
            "flex-1 overflow-y-auto no-scrollbar relative bg-black/20",
            !detailsTarget && mobileTab === 'explore' ? "p-4 sm:p-6 md:p-10" : ""
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
                  onExploreLibrary={() => setMobileTab('explore')}
                  isLibraryActive={false}
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
                    <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-500/80">Skill Level Filters</h3>
                    <p className="text-[11px] text-zinc-500 font-medium">Filter library by player tier</p>
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
                            "flex h-11 w-11 items-center justify-center rounded-[8px] border-2 font-bold transition-all active:scale-90",
                            isActive 
                              ? "shadow-lg" 
                              : "border-white/5 bg-zinc-900 opacity-40 grayscale hover:opacity-100 hover:grayscale-0"
                          )}
                          style={{
                            borderColor: isActive ? tier.color : "transparent",
                            backgroundColor: isActive ? `${tier.color}15` : "",
                            color: isActive ? tier.color : "inherit",
                            boxShadow: isActive ? `0 0 15px ${tier.color}30` : ""
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
                        className="h-12 w-full border-white/5 bg-zinc-900/60 pl-11 text-white placeholder:text-zinc-500 shadow-lg focus:border-cyan-500/50 focus:bg-zinc-900 focus:ring-4 focus:ring-cyan-500/10 transition-all font-medium"
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
                        className="h-12 w-full border-white/5 bg-zinc-900/60 pl-11 text-white placeholder:text-zinc-500 shadow-lg focus:border-cyan-500/50 focus:bg-zinc-900 focus:ring-4 focus:ring-cyan-500/10 transition-all font-medium"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setIsFilterSheetOpen(true)}
                        className={cn(
                          "relative h-12 flex-1 border-white/5 bg-zinc-900/60 px-6 font-bold text-zinc-300 shadow-lg hover:bg-zinc-800 md:flex-initial transition-all active:scale-95",
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
