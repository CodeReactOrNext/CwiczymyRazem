import { Button } from "assets/components/ui/button";
import { Input } from "assets/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "assets/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "assets/components/ui/tabs";
import MainContainer from "components/MainContainer";
import AddSongModal from "feature/songs/components/AddSongModal/AddSongModal";
import { SongsGrid } from "feature/songs/components/SongsGrid/SongsGrid";
import { SongLearningSection } from "feature/songs/components/SongLearningSection/SongLearningSection";
import FilterSheet from "feature/songs/components/FilterSheet/FilterSheet";
import { useSongs } from "feature/songs/hooks/useSongs";
import { getAllTiers } from "feature/songs/utils/getSongTier";
import { getGlobalGenres } from "feature/songs/services/getGlobalMetadata";
import { 
  LoaderCircle, 
  Search, 
  X, 
  Plus, 
  Filter,  
  LayoutGrid,
  SlidersHorizontal,
  ListMusic,
  Music,
  LayoutDashboard,
  Activity,
  Brain,
  Dumbbell,
  Settings,
  Calendar,
  Home,
  Code,
} from "lucide-react";
import { SongCardSkeleton } from "feature/songs/components/SongsGrid/SongCardSkeleton";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { cn } from "assets/lib/utils";
import { useRouter } from "next/router";
import Link from "next/link";


const SongsView = () => {
  const { t } = useTranslation("songs");
  const router = useRouter();
  const activeTab = (router.query.view as string) || "management";
  const {
    page,
    isLoading,
    userSongs,
    totalPages,
    hasFilters,
    searchQuery,
    isModalOpen,
    filteredSongs,
    setSearchQuery,
    setIsModalOpen,
    difficultyFilter,
    handlePageChange,
    handleClearFilters,
    tierFilters,
    setTierFilters,
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
  } = useSongs();
  const [availableGenres, setAvailableGenres] = useState<string[]>([]);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

  useEffect(() => {
    const fetchGenres = async () => {
      const genres = await getGlobalGenres();
      setAvailableGenres(genres);
    };
    fetchGenres();
  }, []);


  return (
    <MainContainer title={t("songs")}>
      <div className='font-openSans flex flex-col gap-6 p-4 lg:p-8 min-h-screen'>
        {/* Content Area */}
        <div className="flex-1">
          <div className="h-full w-full">
            
            {/* MANAGEMENT SECTION */}
            {activeTab === "management" && (
              <div className="space-y-6 animate-in fade-in-50 duration-300">
               <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                  <div className="flex flex-col gap-2">
                    <h2 className="text-lg font-bold tracking-tight text-white">{t("your_progress", "Your Progress")}</h2>
                    <p className="text-sm text-zinc-400 max-w-2xl">
                      {t("drag_and_drop_description", "Drag and drop songs to track your learning journey. Move items between columns to update their status.")}
                    </p>
                  </div>
                  <Button 
                    variant="outline"
                    onClick={() => router.push("/songs?view=library")}
                    className="h-10 border-white/10 bg-zinc-900/60 font-bold transition-all active:scale-95"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {t("add_songs_from_library", "Add songs from library") as string}
                  </Button>
               </div>
               
               <SongLearningSection
                isLanding={false}
                userSongs={userSongs}
                onChange={updateUserSongsCache}
                onStatusChange={refreshSongs}
              />
              </div>
            )}

            {/* LIBRARY SECTION */}
            {(activeTab === "library" || activeTab === "table") && (
              <div className="space-y-6 animate-in fade-in-50 duration-300">
              
                {/* Tier Selection Grid - New Requirement */}
                <div className="space-y-3">
                  <div className="flex flex-col gap-1">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-cyan-500/80">Skill Level Filters</h3>
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
                              setTierFilters([...tierFilters, tier.tier]);
                            }
                          }}
                          className={cn(
                            "flex h-11 w-11 items-center justify-center rounded-xl border-2 font-black transition-all active:scale-90",
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

                {/* Enhanced Search & Filter Bar */}
                <div className="sticky top-0 z-30 -mx-4 px-4 py-4 backdrop-blur-xl md:static md:mx-0 md:p-0 md:backdrop-blur-none">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center">
                    
                    {/* Search Input */}
                    <div className="relative flex-1">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                        <Search className="h-4 w-4 text-zinc-500" />
                      </div>
                      <Input
                        placeholder={t("search_songs")}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-12 w-full  border-white/5 bg-zinc-900/60 pl-11 text-white placeholder:text-zinc-500 shadow-lg focus:border-cyan-500/50 focus:bg-zinc-900 focus:ring-4 focus:ring-cyan-500/10 transition-all font-medium"
                      />
                       {debounceLoading && (
                          <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                            <LoaderCircle className="h-5 w-5 animate-spin text-cyan-500" />
                          </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Filter Toggle Button */}
                      <Button
                        variant="outline"
                        onClick={() => setIsFilterSheetOpen(true)}
                        className={cn(
                          "relative h-12 flex-1  border-white/5 bg-zinc-900/60 px-6 font-bold text-zinc-300 shadow-lg hover:bg-zinc-800 md:flex-initial transition-all active:scale-95",
                          hasFilters && "border-cyan-500/30 bg-cyan-500/5 text-cyan-400"
                        )}
                      >
                        <SlidersHorizontal className="mr-2.5 h-4 w-4" />
                        Filters & Sort
                        {hasFilters && (
                          <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)] border-2 border-zinc-950" />
                        )}
                      </Button>

                      {hasFilters && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleClearFilters}
                          className="h-12 w-12 shrink-0  border border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                          title="Clear all filters"
                        >
                          <X className="h-5 w-5" />
                        </Button>
                      )}
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
                <div className="min-h-[500px] rounded-2xl bg-zinc-900/20 p-1">
                  {isLoading ? (
                    <div className="space-y-8 pb-12">
                      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
                        {Array.from({ length: 20 }).map((_, i) => (
                          <SongCardSkeleton key={i} />
                        ))}
                      </div>
                      <div className='flex justify-center mt-8'>
                        <div className='h-12 w-64 animate-pulse rounded-2xl bg-zinc-900/30 backdrop-blur-sm' />
                      </div>
                    </div>
                  ) : (
                    <SongsGrid
                      key={filteredSongs.toString()}
                      songs={filteredSongs}
                      currentPage={page}
                      totalPages={totalPages}
                      onPageChange={handlePageChange}
                      onAddSong={() => setIsModalOpen(true)}
                      hasFilters={hasFilters}
                      onStatusChange={refreshSongsWithoutLoading}
                      userSongs={userSongs}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <AddSongModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleStatusUpdate}
        />
      </div>
    </MainContainer>
  );
};

export default SongsView;
