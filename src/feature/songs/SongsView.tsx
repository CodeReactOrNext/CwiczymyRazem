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
import { useSongs } from "feature/songs/hooks/useSongs";
import { getAllTiers } from "feature/songs/utils/getSongTier";
import { LoaderCircle, Search, X, Plus, Filter, LayoutGrid, ListMusic } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { cn } from "assets/lib/utils";


const SongsView = () => {
  const { t } = useTranslation("songs");
  const [activeTab, setActiveTab] = useState("management");
  const {
    page,
    isLoading,
    loadSongs,
    userSongs,
    totalPages,
    hasFilters,
    searchQuery,
    isModalOpen,
    statusFilter,
    filteredSongs,
    setSearchQuery,
    setIsModalOpen,
    setStatusFilter,
    difficultyFilter,
    handlePageChange,
    handleClearFilters,
    setDifficultyFilter,
    tierFilter,
    setTierFilter,
    setUserSongs,
    refreshSongs,
    refreshSongsWithoutLoading,
    debounceLoading,
  } = useSongs();


  return (
    <MainContainer title={t("songs")}>
      <div className='font-openSans flex flex-col gap-6 p-4 lg:p-8 min-h-screen'>
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
            <TabsList className="grid h-12 w-full grid-cols-2 gap-2 rounded-2xl bg-zinc-900/50 p-1 md:w-[300px] md:grid-cols-2">
              <TabsTrigger 
                value="management"
                className="rounded-xl data-[state=active]:bg-cyan-500/10 data-[state=active]:text-cyan-400"
              >
                <LayoutGrid className="mr-2 h-4 w-4" />
                Management
              </TabsTrigger>
              <TabsTrigger 
                value="table"
                className="rounded-xl data-[state=active]:bg-cyan-500/10 data-[state=active]:text-cyan-400"
              >
                <ListMusic className="mr-2 h-4 w-4" />
                Library
              </TabsTrigger>
            </TabsList>
          </Tabs>

        </div>
        {/* Content Area */}
        <div className="flex-1">
          <Tabs value={activeTab} className="h-full w-full">
            
            {/* MANAGEMENT TAB */}
            <TabsContent value="management" className="mt-0 space-y-6 animate-in fade-in-50 duration-300">
               <div className="flex flex-col gap-2">
                  <h2 className="text-lg font-bold tracking-tight text-white">Your Progress</h2>
                  <p className="text-sm text-zinc-400 max-w-2xl">
                    Drag and drop songs to track your learning journey. Move items between columns to update their status.
                  </p>
               </div>
               
               <SongLearningSection
                isLanding={false}
                userSongs={userSongs}
                onChange={setUserSongs}
                onStatusChange={refreshSongs}
              />
            </TabsContent>

            {/* LIBRARY TAB */}
            <TabsContent value="table" className="mt-0 space-y-6 animate-in fade-in-50 duration-300">
              
              {/* Compact Search & Filter Bar */}
              <div className="sticky top-0 z-30 -mx-4 px-4 py-4 backdrop-blur-xl md:static md:mx-0 md:p-0 md:backdrop-blur-none">
                <div className="flex flex-col gap-4 rounded-2xl border border-white/5 bg-zinc-900/60 p-4 shadow-xl backdrop-blur-md md:flex-row md:items-center">
                  
                  {/* Search Input */}
                  <div className="relative flex-1">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Search className="h-5 w-5 text-zinc-500" />
                    </div>
                    <Input
                      placeholder={t("search_songs")}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-11 w-full rounded-xl border-white/5 bg-zinc-800/50 pl-10 text-white placeholder:text-zinc-500 focus:border-cyan-500/50 focus:bg-zinc-800 focus:ring-4 focus:ring-cyan-500/10"
                    />
                     {debounceLoading && (
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                          <LoaderCircle className="h-5 w-5 animate-spin text-cyan-500" />
                        </div>
                      )}
                  </div>

                  <div className="flex items-center gap-3 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
                    {/* Status Filter */}
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="h-11 min-w-[140px] rounded-xl border-white/5 bg-zinc-800/50 text-zinc-300 hover:bg-zinc-800 focus:ring-0">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent className="border-zinc-800 bg-zinc-900 font-medium">
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="wantToLearn" className="text-blue-400">Want to Learn</SelectItem>
                        <SelectItem value="learning" className="text-amber-400">Learning</SelectItem>
                        <SelectItem value="learned" className="text-emerald-400">Learned</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Difficulty Filter */}
                    <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                      <SelectTrigger className="h-11 min-w-[140px] rounded-xl border-white/5 bg-zinc-800/50 text-zinc-300 hover:bg-zinc-800 focus:ring-0">
                        <SelectValue placeholder="Difficulty" />
                      </SelectTrigger>
                      <SelectContent className="border-zinc-800 bg-zinc-900 font-medium">
                        <SelectItem value="all">All Difficulties</SelectItem>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Clear Filters */}
                    {(hasFilters) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleClearFilters}
                        className="h-11 w-11 shrink-0 rounded-xl border border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                        title="Clear filters"
                      >
                        <X className="h-5 w-5" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Tier Tags Row - Optional expansion */}
                <div className="mt-4 flex flex-wrap gap-2">
                    {getAllTiers().map((tier) => (
                      <button
                        key={tier.tier}
                        onClick={() => setTierFilter(tierFilter === tier.tier ? "all" : tier.tier)}
                        className={cn(
                          "flex h-8 items-center rounded-lg border px-3 text-xs font-bold uppercase tracking-wider transition-all",
                          tierFilter === tier.tier 
                            ? "opacity-100 shadow-md transform scale-105" 
                            : "border-white/5 bg-zinc-800/30 text-zinc-500 opacity-60 hover:opacity-100 hover:bg-zinc-800/80"
                        )}
                        style={{
                          borderColor: tierFilter === tier.tier ? tier.color : undefined,
                          backgroundColor: tierFilter === tier.tier ? `${tier.color}15` : undefined,
                          color: tierFilter === tier.tier ? tier.color : undefined,
                          boxShadow: tierFilter === tier.tier ? `0 2px 10px ${tier.color}20` : undefined,
                        }}
                      >
                        {tier.tier}
                      </button>
                    ))}
                </div>
              </div>

              {/* Grid Content */}
              <div className="min-h-[500px] rounded-2xl bg-zinc-900/20 p-1">
                {isLoading ? (
                  <div className="flex h-[400px] flex-col items-center justify-center gap-4">
                    <LoaderCircle className="h-12 w-12 animate-spin text-cyan-500" />
                    <p className="font-medium text-zinc-400">Loading library...</p>
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
                  />
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <AddSongModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={loadSongs}
        />
      </div>
    </MainContainer>
  );
};

export default SongsView;
