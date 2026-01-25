import { Button } from "assets/components/ui/button";
import { Input } from "assets/components/ui/input";
import { cn } from "assets/lib/utils";
import MainContainer from "components/MainContainer";
import AddSongModal from "feature/songs/components/AddSongModal/AddSongModal";
import FilterSheet from "feature/songs/components/FilterSheet/FilterSheet";
import { SongLearningSection } from "feature/songs/components/SongLearningSection/SongLearningSection";
import { SongLearningStats } from "feature/songs/components/SongLearningStats/SongLearningStats";
import { SongCardSkeleton } from "feature/songs/components/SongsGrid/SongCardSkeleton";
import { SongsGrid } from "feature/songs/components/SongsGrid/SongsGrid";
import { useSongs } from "feature/songs/hooks/useSongs";
import { getGlobalGenres } from "feature/songs/services/getGlobalMetadata";
import { getAllTiers } from "feature/songs/utils/getSongTier";
import { useTranslation } from "hooks/useTranslation";
import {  
  HelpCircle,
  LoaderCircle, 
  Music,
  Plus, 
  Search,
  SlidersHorizontal,
  X, 
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect,useState } from "react";


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
              <div className="space-y-10 animate-in fade-in-50 duration-500">
                {/* 1. Primary Header Row */}
                <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between border-b border-white/5 pb-8">
                  <div className="space-y-1">
                    <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
                      My Song Board
                    </h2>
                    <p className="text-zinc-500 font-medium">
                      Track and manage your guitar repertoire progress
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                 
                    >
                      <Link href="/guide?tab=songs">
                        <HelpCircle size={16} className="text-cyan-400" />
                        <span className="text-xs font-bold uppercase tracking-wider">How it works</span>
                      </Link>
                    </Button>
                    <Button 
                      onClick={() => router.push("/songs?view=library")}
                      
                    >
                      <Plus className="mr-2 h-5 w-5" />
                      Add a song to learn
                    </Button>
                  </div>
                </div>

                {/* 2. Global Strategy/Stats Dashboard */}
                <div className="rounded-xl bg-zinc-900/40 p-2 backdrop-blur-sm -mt-4">
                  <SongLearningStats userSongs={userSongs} />
                </div>

                {/* 3. Board Section */}
                <div className="space-y-6">
                  <SongLearningSection
                    isLanding={false}
                    userSongs={userSongs}
                    onChange={updateUserSongsCache}
                    onStatusChange={refreshSongs}
                  />
                </div>
              </div>
            )}

            {/* LIBRARY SECTION */}
            {(activeTab === "library" || activeTab === "table") && (
              <div className="space-y-6 animate-in fade-in-50 duration-300">
              
                {/* Tier Selection Grid - New Requirement */}
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col gap-1">
                      <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-500/80">Skill Level Filters</h3>
                      <p className="text-[11px] text-zinc-500 font-medium">Filter library by player tier</p>
                    </div>
                    <Button 
                      onClick={() => setIsModalOpen(true)}
                      className="h-11 bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition-all active:scale-95 shadow-[0_0_20px_rgba(8,145,178,0.3)] border-none px-6"
                    >
                      <Plus className="mr-2 h-5 w-5" />
                      {t("add_new_song")}
                    </Button>
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
                            "flex h-11 w-11 items-center justify-center rounded-xl border-2 font-bold transition-all active:scale-90",
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
                <div className="relative z-30 -mx-4 px-4 py-4 md:mx-0 md:p-0">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center">
                    
                    {/* Artist Input */}
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

                    {/* Title Input */}
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
                    <div className="space-y-8 min-h-[400px] flex flex-col justify-between pb-12">
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
