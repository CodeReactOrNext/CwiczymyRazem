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
import { LoaderCircle, Search, X, Library, Grid } from "lucide-react";
import { useTranslation } from "react-i18next";
import { IoMdAddCircleOutline } from "react-icons/io";
import { useState } from "react";

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
      <div className='font-openSans p-4 lg:p-8'>
        <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
          {/* Enhanced Tab Navigation */}
          <div className='mb-8 lg:mb-12'>
            <TabsList className='grid h-16 w-full grid-cols-2 rounded-2xl border border-white/5 bg-zinc-900/60 p-1.5 backdrop-blur-xl'>
              <TabsTrigger
                value='management'
                className='flex h-full w-full items-center justify-center gap-3 rounded-xl border border-transparent px-6 text-sm font-bold text-zinc-400 transition-all duration-300 data-[state=active]:border-cyan-500/30 data-[state=active]:bg-cyan-500/10 data-[state=active]:text-cyan-300 data-[state=active]:shadow-lg data-[state=active]:shadow-cyan-500/10 hover:bg-zinc-800/50 hover:text-zinc-200'>
                <Library size={20} />
                <span>Zarządzanie</span>
              </TabsTrigger>
              <TabsTrigger
                value='table'
                className='flex h-full w-full items-center justify-center gap-3 rounded-xl border border-transparent px-6 text-sm font-bold text-zinc-400 transition-all duration-300 data-[state=active]:border-purple-500/30 data-[state=active]:bg-purple-500/10 data-[state=active]:text-purple-300 data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/10 hover:bg-zinc-800/50 hover:text-zinc-200'>
                <Grid size={20} />
                <span>Biblioteka</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Management Tab Content */}
          <TabsContent value='management' className='mt-0'>
            <div className='space-y-8'>
              {/* Enhanced header */}
              <div className='mb-8'>
                <h2 className='mb-2 text-2xl font-black text-white lg:text-3xl'>
                  Zarządzanie utworami
                </h2>
                <p className='text-base font-medium text-zinc-400'>
                  Przeciągnij utwory między kategoriami aby zmienić ich status
                  nauki
                </p>
              </div>

              {/* Direct Song Learning Section */}
              <SongLearningSection
                isLanding={false}
                userSongs={userSongs}
                onChange={setUserSongs}
                onStatusChange={refreshSongs}
              />
            </div>
          </TabsContent>

          {/* Grid Tab Content */}
          <TabsContent value='table' className='mt-0'>
            <div className='space-y-8'>
              {/* Enhanced Filters Section */}
              <div className='rounded-2xl border border-white/5 bg-zinc-900/60 p-6 shadow-xl backdrop-blur-xl lg:p-8'>
                <div className='mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
                  <h3 className='text-xl font-bold text-white lg:text-2xl'>
                    Biblioteka i Filtry
                  </h3>
                  <Button
                    onClick={() => setIsModalOpen(true)}
                    className='h-12 rounded-xl border border-cyan-500/20 bg-gradient-to-r from-cyan-600 to-blue-600 px-6 font-bold text-white shadow-lg shadow-cyan-500/20 transition-all duration-300 hover:scale-105 hover:from-cyan-500 hover:to-blue-500 hover:shadow-cyan-500/30'>
                    <IoMdAddCircleOutline className='mr-2 h-5 w-5' />
                    Dodaj nowy utwór
                  </Button>
                </div>

                <div className='space-y-6'>
                  {/* Search & Basic Filters Row */}
                  <div className='grid gap-6 lg:grid-cols-4'>
                    <div className='lg:col-span-2'>
                      <label className='mb-2 block text-xs font-bold uppercase tracking-wider text-zinc-500'>
                        Wyszukiwanie
                      </label>
                      <Input
                        type='text'
                        startIcon={
                          <Search size={18} className='text-zinc-500' />
                        }
                        endIcon={
                          debounceLoading ? (
                            <LoaderCircle
                              size={18}
                              className='animate-spin text-cyan-500'
                            />
                          ) : undefined
                        }
                        placeholder={t("search_songs")}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className='h-12 rounded-xl border-white/5 bg-zinc-800/50 text-white placeholder-zinc-500 transition-all focus:border-cyan-500/50 focus:bg-zinc-800 focus:ring-4 focus:ring-cyan-500/10'
                      />
                    </div>
                    <div>
                      <label className='mb-2 block text-xs font-bold uppercase tracking-wider text-zinc-500'>
                        Status
                      </label>
                      <Select
                        value={statusFilter}
                        onValueChange={setStatusFilter}>
                        <SelectTrigger className='h-12 rounded-xl border-white/5 bg-zinc-800/50 text-zinc-300 transition-all hover:bg-zinc-800 focus:ring-0'>
                          <SelectValue placeholder='Status' />
                        </SelectTrigger>
                        <SelectContent className='border-zinc-800 bg-zinc-900'>
                          <SelectItem value='all'>Wszystkie</SelectItem>
                          <SelectItem value='wantToLearn' className='text-blue-400'>
                            Chcę nauczyć
                          </SelectItem>
                          <SelectItem value='learning' className='text-amber-400'>
                            Uczę się
                          </SelectItem>
                          <SelectItem value='learned' className='text-emerald-400'>
                            Nauczone
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className='mb-2 block text-xs font-bold uppercase tracking-wider text-zinc-500'>
                        Trudność
                      </label>
                      <Select
                        value={difficultyFilter}
                        onValueChange={setDifficultyFilter}>
                        <SelectTrigger className='h-12 rounded-xl border-white/5 bg-zinc-800/50 text-zinc-300 transition-all hover:bg-zinc-800 focus:ring-0'>
                          <SelectValue placeholder='Trudność' />
                        </SelectTrigger>
                        <SelectContent className='border-zinc-800 bg-zinc-900'>
                          <SelectItem value='all'>Wszystkie</SelectItem>
                          <SelectItem value='easy'>Łatwe</SelectItem>
                          <SelectItem value='medium'>Średnie</SelectItem>
                          <SelectItem value='hard'>Trudne</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Tier Filters Row */}
                  <div>
                    <label className='mb-3 block text-xs font-bold uppercase tracking-wider text-zinc-500'>
                      Poziom trudności (Tier)
                    </label>
                    <div className='flex flex-wrap items-center gap-3'>
                      <Button
                        variant='ghost'
                        onClick={() => setTierFilter("all")}
                        className={`h-10 rounded-lg px-5 text-xs font-bold uppercase tracking-wide transition-all ${
                          tierFilter === "all"
                            ? "border border-cyan-500/50 bg-cyan-500/20 text-cyan-300 shadow-lg shadow-cyan-500/10"
                            : "border border-white/5 bg-zinc-800/30 text-zinc-500 hover:bg-zinc-800 hover:text-white"
                        }`}>
                        Wszystkie
                      </Button>
                      {getAllTiers().map((tier) => (
                        <Button
                          key={tier.tier}
                          variant='ghost'
                          onClick={() => setTierFilter(tier.tier)}
                          className={`h-10 px-4 text-xs font-bold transition-all ${
                            tierFilter === tier.tier
                              ? "border-2 opacity-100 shadow-lg"
                              : "border border-white/5 bg-zinc-800/30 opacity-70 hover:opacity-100"
                          }`}
                          style={{
                            borderColor:
                              tierFilter === tier.tier ? tier.color : undefined,
                            backgroundColor:
                              tierFilter === tier.tier
                                ? tier.color + "15"
                                : undefined,
                            color:
                              tierFilter === tier.tier ? tier.color : "#71717a",
                          }}>
                          {tier.tier}
                        </Button>
                      ))}
                      {(statusFilter !== "all" ||
                        difficultyFilter !== "all" ||
                        tierFilter !== "all") && (
                        <Button
                          variant='ghost'
                          onClick={handleClearFilters}
                          className='h-10 rounded-lg border border-red-500/20 px-5 text-xs font-bold uppercase tracking-wide text-red-400 hover:bg-red-500/10 hover:text-red-300'>
                          <X className='mr-2 h-3 w-3' />
                          Wyczyść
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Grid Section */}
              <div className='min-h-[500px]'>
                {isLoading ? (
                  <div className='flex h-[400px] items-center justify-center'>
                    <div className='text-center'>
                      <div className='mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-zinc-700 border-t-cyan-500'></div>
                      <p className='text-lg font-bold text-white'>
                        Ładowanie biblioteki...
                      </p>
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
                  />
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>

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
