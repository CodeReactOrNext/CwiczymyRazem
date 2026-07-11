import type {
  DragEndEvent,
  DragStartEvent} from "@dnd-kit/core";
import {
  closestCenter,
  defaultDropAnimationSideEffects,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove,sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { Button } from "assets/components/ui/button";
import { Input } from "assets/components/ui/input";
import { cn } from "assets/lib/utils";
import { Ripple } from "components/Ripple/Ripple";
import AddSongModal from "feature/songs/components/AddSongModal/AddSongModal";
import FilterSheet from "feature/songs/components/FilterSheet/FilterSheet";
import { PlaylistsView } from "feature/songs/components/Playlists/PlaylistsView";
import { SkillPowerHero } from "feature/songs/components/SongBoard/SkillPowerHero";
import { SongDetailView } from "feature/songs/components/SongBoard/SongDetailView";
import { SongLearningSection } from "feature/songs/components/SongLearningSection/SongLearningSection";
import { SongPracticePickerModal } from "feature/songs/components/SongPracticePickerModal/SongPracticePickerModal";
import { SongCard } from "feature/songs/components/SongsGrid/SongCard";
import { SongsGrid } from "feature/songs/components/SongsGrid/SongsGrid";
import { useSongs } from "feature/songs/hooks/useSongs";
import { useSongsStatusChange } from "feature/songs/hooks/useSongsStatusChange";
import { useUserSongProgress } from "feature/songs/hooks/useUserSongProgress";
import { getGlobalGenres } from "feature/songs/services/getGlobalMetadata";
import { updateUserSongOrder } from "feature/songs/services/updateUserSongOrder";
import type { Song } from "feature/songs/types/songs.type";
import type { SongStatus } from "feature/songs/types/songs.type";
import { getGatedSkillPower, getSongsUntilNextTier,MIN_LEARNED_SONGS_FOR_TIER } from "feature/songs/utils/difficulty.utils";
import { getAllTiers,getSongTier } from "feature/songs/utils/getSongTier";
import { selectCurrentUserStats, selectUserAuth, selectUserInfo } from "feature/user/store/userSlice";
import { useTranslation } from "hooks/useTranslation";
import {
  Library as LibraryIcon,
  ListMusic,
  Music,
  Play,
  Search,
  SlidersHorizontal,
  Trophy,
} from "lucide-react";
import { useRouter } from "next/router";
import posthog from "posthog-js";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAppSelector } from "store/hooks";


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

  const skillPower = userSongs?.learned ? getGatedSkillPower(userSongs.learned) : 0;
  const playerTier = getSongTier(skillPower > 0 ? skillPower : '?');
  const nextTierProgress = userSongs?.learned ? getSongsUntilNextTier(userSongs.learned) : null;

  const totalSongsCount = (userSongs?.wantToLearn?.length || 0) + (userSongs?.learning?.length || 0) + (userSongs?.learned?.length || 0);
  const learnedCount = userSongs?.learned?.length || 0;
  const completionRate = totalSongsCount > 0 ? Math.round((learnedCount / totalSongsCount) * 100) : 0;
  const totalPracticeMs = Object.values(progressMap).reduce((sum, p) => sum + (p?.totalPracticeMs || 0), 0);

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
  // The list the card started in. dragOver moves the card across lists in the cache,
  // so by dragEnd findContainer(activeId) already returns the *new* list — we need the
  // original to know whether the status actually changed and must be persisted.
  const dragSourceContainer = useRef<SongStatus | null>(null);
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
    const id = event.active.id as string;
    dragSourceContainer.current = findContainer(id) ?? null;
    setActiveId(id);
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

    const sourceContainer = dragSourceContainer.current;
    dragSourceContainer.current = null;

    if (!overId || !userAuth) return;

    // dragOver has already moved the card into its target list in the cache,
    // so this is the *final* container the card now lives in.
    const finalContainer = findContainer(activeId);
    if (!finalContainer) return;

    const activeSong = userSongs[finalContainer].find((s) => s.id === activeId);
    if (!activeSong) return;

    if (sourceContainer && sourceContainer !== finalContainer) {
      // Cross-list move: the UI was updated by onDragOver, but the status field
      // still needs to be persisted (updateUserSongOrder only writes `order`),
      // otherwise the next refetch reads the stale status and the card jumps back.
      await handleStatusChange(
        activeId,
        finalContainer,
        activeSong.title,
        activeSong.artist,
        { skipOptimisticUpdate: true, skipRefetch: true }
      );

      await updateUserSongOrder(userAuth, userSongs[sourceContainer]);
      await updateUserSongOrder(userAuth, userSongs[finalContainer]);
    } else {
      // Reorder within the same list.
      const items = userSongs[finalContainer];
      const activeIndex = items.findIndex((s) => s.id === activeId);
      const overIndex = items.findIndex((s) => s.id === overId);

      if (activeIndex !== overIndex && overIndex !== -1) {
        const newItems = arrayMove(items, activeIndex, overIndex);
        updateUserSongsCache({
          ...userSongs,
          [finalContainer]: newItems,
        });
        await updateUserSongOrder(userAuth, newItems);
      }
    }
  };

  const activeSong = useMemo(() => {
    // Search in userSongs
    return [...userSongs.wantToLearn, ...userSongs.learning, ...userSongs.learned]
        .find(s => s.id === activeId);
  }, [activeId, userSongs]);

  // ── Playlists ────────────────────────────────────────────────────────────
  const activePlaylistId = (router.query.playlistId as string) || null;

  const collectionSongs = useMemo(() => {
    const map = new Map<string, Song>();
    [...userSongs.learning, ...userSongs.wantToLearn, ...userSongs.learned].forEach(
      (s) => map.set(s.id, s)
    );
    return Array.from(map.values());
  }, [userSongs]);

  const learnedSongIds = useMemo(
    () => new Set(userSongs.learned.map((s) => s.id)),
    [userSongs.learned]
  );

  const handleOpenPlaylist = (playlistId: string | null) => {
    const query: Record<string, any> = { ...router.query, view: "playlists" };
    if (playlistId) query.playlistId = playlistId;
    else delete query.playlistId;
    router.push({ query }, undefined, { shallow: true });
  };

  const handleSwitchView = (v: string) => {
    const query: Record<string, any> = { ...router.query, view: v };
    delete query.playlistId;
    router.push({ query }, undefined, { shallow: true });
    setDetailsTarget(null);
  };

  const resolvePlaylistSong = async (songId: string): Promise<Song | null> => {
    const local = collectionSongs.find((s) => s.id === songId);
    if (local) return local;
    const { getSongById } = await import("feature/songs/services/getSongs");
    return getSongById(songId);
  };

  const openSongFromPlaylist = async (songId: string) => {
    const song = await resolvePlaylistSong(songId);
    if (song) setDetailsTarget(song);
  };

  const practiceSongFromPlaylist = async (songId: string) => {
    const song = await resolvePlaylistSong(songId);
    if (song) setPracticeTarget(song);
  };






  return (
    <>
      <div className="flex flex-col h-[calc(100dvh-6rem)] md:h-[calc(100dvh-8rem)] overflow-hidden font-openSans">
        {/* Mobile View Switcher */}
        {!detailsTarget && (
          <div className="flex xl:hidden bg-zinc-900/80 p-1.5 backdrop-blur-md">
            <button
              onClick={() => {
                setMobileTab('explore');
                if (view === 'playlists') handleSwitchView('explore');
              }}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 text-[12px] font-medium transition-all duration-300 rounded-lg",
                mobileTab === 'explore' && view !== 'playlists'
                  ? "text-white bg-white/10"
                  : "text-zinc-500 hover:text-zinc-400"
              )}
            >
              <Search size={14} />
              Explore
            </button>
            <button
              onClick={() => {
                setMobileTab('explore');
                if (view !== 'playlists') handleSwitchView('playlists');
              }}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 text-[12px] font-medium transition-all duration-300 rounded-lg",
                mobileTab === 'explore' && view === 'playlists'
                  ? "text-white bg-white/10"
                  : "text-zinc-500 hover:text-zinc-400"
              )}
            >
              <ListMusic size={14} />
              Playlists
            </button>
            <button
              onClick={() => setMobileTab('collection')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 text-[12px] font-medium transition-all duration-300 rounded-lg",
                mobileTab === 'collection'
                  ? "text-white bg-white/10"
                  : "text-zinc-500 hover:text-zinc-400"
              )}
            >
              <LibraryIcon size={14} />
              Board
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
             <div className="flex-1 overflow-y-auto no-scrollbar py-3 px-3">
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
                  onExploreLibrary={handleSwitchView}
                  isLibraryActive={view === 'explore' && !detailsTarget}
                  isPlaylistsActive={view === 'playlists' && !detailsTarget}
                  activeId={activeId}
                  disableDnd={disableDnd}
                  isMobile={isMobile}
                />
             </div>
          </aside>

          <main className={cn(
            "flex-1 overflow-y-auto no-scrollbar relative bg-black/20",
            // Playlists view manages its own padding so the header hue wash can bleed to the edges.
            !detailsTarget && view !== 'playlists' ? "p-4 sm:p-6 md:p-10" : ""
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
                  backLabel={view === 'playlists' ? 'Back to playlist' : 'Back to Explore'}
                  showBackOnDesktop={view === 'playlists'}
                />
              </div>
            ) : view === 'board' ? (
              <div className="space-y-10 animate-in fade-in-50 slide-in-from-bottom-4 duration-700">
                <SkillPowerHero
                  skillPower={skillPower}
                  playerTier={playerTier}
                  learnedCount={learnedCount}
                  totalCount={totalSongsCount}
                  totalPracticeMs={totalPracticeMs}
                  nextTierProgress={nextTierProgress}
                />
                
                <div className="space-y-12">
                  {userSongs.learning.length > 0 && (
                    <div className="space-y-6">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-[4px] bg-white/5 flex items-center justify-center text-zinc-300">
                           <Play size={16} className="fill-current" />
                        </div>
                        <h2 className="text-xl font-semibold text-white">Currently learning</h2>
                      </div>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 md:grid-cols-4 2xl:grid-cols-5">
                        {userSongs.learning.map((song) => (
                          <SongCard
                            key={song.id}
                            song={song}
                            onOpenDetails={() => setDetailsTarget(song)}
                            onPlay={() => setPracticeTarget(song)}
                            showPracticeStatus
                            practiceMs={progressMap[song.id]?.totalPracticeMs}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {userSongs.wantToLearn.length > 0 && (
                    <div className="space-y-6">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-[4px] bg-white/5 flex items-center justify-center text-zinc-300">
                           <Music size={16} />
                        </div>
                        <h2 className="text-xl font-semibold text-white">Want to learn</h2>
                      </div>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 md:grid-cols-4 2xl:grid-cols-5">
                        {userSongs.wantToLearn.map((song) => (
                          <SongCard
                            key={song.id}
                            song={song}
                            onOpenDetails={() => setDetailsTarget(song)}
                            onPlay={() => setPracticeTarget(song)}
                            showPracticeStatus
                            practiceMs={progressMap[song.id]?.totalPracticeMs}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {userSongs.learned.length > 0 && (
                    <div className="space-y-6">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-[4px] bg-white/5 flex items-center justify-center text-zinc-300">
                           <Trophy size={16} />
                        </div>
                        <h2 className="text-xl font-semibold text-white">Mastered songs</h2>
                      </div>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 md:grid-cols-4 2xl:grid-cols-5">
                        {userSongs.learned.map((song) => (
                          <SongCard
                            key={song.id}
                            song={song}
                            onOpenDetails={() => setDetailsTarget(song)}
                            onPlay={() => setPracticeTarget(song)}
                            showPracticeStatus
                            practiceMs={progressMap[song.id]?.totalPracticeMs}
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
                    handleSwitchView(v);
                    if (v === 'explore' || v === 'playlists') setMobileTab('explore');
                  }}
                  isLibraryActive={view === 'explore' && !detailsTarget}
                  isPlaylistsActive={view === 'playlists' && !detailsTarget}
                  activeId={activeId}
                  disableDnd={disableDnd}
                  isMobile={isMobile}
                />
              </div>
            ) : view === 'playlists' ? (
              <PlaylistsView
                activePlaylistId={activePlaylistId}
                onOpenPlaylist={handleOpenPlaylist}
                collectionSongs={collectionSongs}
                learnedSongIds={learnedSongIds}
                onPracticeSong={practiceSongFromPlaylist}
                onOpenSong={openSongFromPlaylist}
              />
            ) : (
              <div className="space-y-6 animate-in fade-in-50 duration-300">
                {/* Tier Selection Grid */}
                <div className="space-y-4">
                  <div className="flex flex-col gap-1">
                    <p className="text-xs font-bold text-zinc-400">Filter by Tier</p>
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
                            "relative flex h-11 w-11 items-center justify-center rounded-lg font-bold transition-all active:scale-90",
                            isActive
                              ? "shadow-lg shadow-black/20"
                              : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white"
                          )}
                          style={{
                            backgroundColor: isActive ? `${tier.color}25` : "",
                            color: isActive ? tier.color : "",
                          }}
                        >
                          <Ripple />
                          {tier.tier}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Search & Filter Bar */}
                <div className="relative z-30 py-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center">
                    <div className="group relative flex-1">
                      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center pl-4">
                        <Music className="h-4 w-4 text-zinc-500 transition-colors group-focus-within:text-white" />
                      </div>
                      <Input
                        placeholder={t("artist", "Artist...") as string}
                        value={artistQuery}
                        onChange={(e) => setArtistQuery(e.target.value)}
                        className="h-12 w-full border-none bg-zinc-900/60 pl-11 text-white placeholder:text-zinc-400 focus:bg-zinc-900 focus:ring-4 focus:ring-cyan-500/10 transition-all font-medium"
                      />
                    </div>

                    <div className="group relative flex-[1.2]">
                      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center pl-4">
                        <Search className="h-4 w-4 text-zinc-500 transition-colors group-focus-within:text-white" />
                      </div>
                      <Input
                        placeholder={t("title", "Title...") as string}
                        value={titleQuery}
                        onChange={(e) => setTitleQuery(e.target.value)}
                        className="h-12 w-full border-none bg-zinc-900/60 pl-11 text-white placeholder:text-zinc-400 focus:bg-zinc-900 focus:ring-4 focus:ring-cyan-500/10 transition-all font-medium"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        onClick={() => setIsFilterSheetOpen(true)}
                        className={cn(
                          "relative h-12 flex-1 bg-zinc-900/60 px-6 font-bold text-zinc-300 hover:bg-zinc-800 md:flex-initial transition-all active:scale-95",
                          hasFilters && "bg-cyan-500/5 text-cyan-400"
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
                <SongsGrid
                  songs={filteredSongs}
                  isLoading={isLoading}
                  currentPage={page}
                  hasMore={hasMore}
                  onPageChange={handlePageChange}
                  onAddSong={() => setIsModalOpen(true)}
                  hasFilters={tierFilters.length > 0 || genreFilters.length > 0}
                  onStatusChange={refreshSongs}
                  onPractice={(song) => setPracticeTarget(song)}
                  userSongs={userSongs}
                  updateUserSongsCache={updateUserSongsCache}
                />
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
