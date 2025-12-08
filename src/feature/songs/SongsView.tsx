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
import { SongLearningSection } from "feature/songs/components/SongLearningSection/SongLearningSection";
import SongsTable from "feature/songs/components/SongsTable/SongsTable";
import { useSongs } from "feature/songs/hooks/useSongs";
import { getAllTiers } from "feature/songs/utils/getSongTier";
import { LoaderCircle, Search, X, Library, Table } from "lucide-react";
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
      <div className='font-openSans p-6'>
        <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
          {/* Enhanced Tab Navigation */}
          <div className='mb-8'>
            <TabsList className='grid h-14 w-full grid-cols-2 rounded-xl border border-slate-700/50 bg-slate-800/40 p-1 backdrop-blur-sm'>
              <TabsTrigger
                value='management'
                className='flex h-full w-full items-center justify-center gap-2.5 rounded-lg border border-transparent px-6 py-3 text-sm font-semibold text-slate-400 transition-all duration-300 data-[state=active]:border-cyan-400/40 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-blue-500/15 data-[state=active]:text-cyan-300 data-[state=active]:shadow-lg data-[state=active]:shadow-cyan-500/25 data-[state=active]:backdrop-blur-sm hover:bg-slate-700/30 hover:text-slate-200'>
                <Library size={18} />
                <span>Zarządzanie utworami</span>
              </TabsTrigger>
              <TabsTrigger
                value='table'
                className='flex h-full w-full items-center justify-center gap-2.5 rounded-lg border border-transparent px-6 py-3 text-sm font-semibold text-slate-400 transition-all duration-300 data-[state=active]:border-purple-400/40 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500/20 data-[state=active]:to-pink-500/15 data-[state=active]:text-purple-300 data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/25 data-[state=active]:backdrop-blur-sm hover:bg-slate-700/30 hover:text-slate-200'>
                <Table size={18} />
                <span>Tabela utworów</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Management Tab Content */}
          <TabsContent value='management' className='mt-0'>
            <div className='space-y-8'>
              {/* Enhanced header */}
              <div className='mb-8'>
                <h2 className='mb-3 text-2xl font-bold text-slate-100'>
                  Zarządzanie utworami
                </h2>
                <p className='text-base leading-relaxed text-slate-300'>
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

          {/* Table Tab Content */}
          <TabsContent value='table' className='mt-0'>
            <div className='space-y-8'>
              {/* Enhanced Filters Section */}
              <div className='rounded-xl border border-slate-700/50 bg-slate-800/40 p-6 shadow-lg backdrop-blur-sm'>
                <div className='mb-6 flex items-center justify-between'>
                  <h3 className='text-xl font-semibold text-slate-100'>
                    Filtry i wyszukiwanie
                  </h3>
                  <Button
                    onClick={() => setIsModalOpen(true)}
                    className='rounded-lg border border-cyan-500/30 bg-gradient-to-r from-cyan-600 to-blue-600 px-5 py-2.5 font-semibold text-white transition-all duration-300 hover:from-cyan-500 hover:to-blue-500 hover:shadow-lg hover:shadow-cyan-500/25'>
                    <IoMdAddCircleOutline className='mr-2 h-4 w-4' />
                    Dodaj utwór
                  </Button>
                </div>

                <div className='space-y-4'>
                  {/* Search & Basic Filters Row */}
                  <div className='grid gap-4 lg:grid-cols-4'>
                    <div className='lg:col-span-2'>
                      <label className='mb-2 block text-sm font-medium text-slate-300'>
                        Wyszukiwanie
                      </label>
                      <Input
                        type='text'
                        startIcon={
                          <Search size={16} className='text-muted-foreground' />
                        }
                        endIcon={
                          debounceLoading ? (
                            <LoaderCircle
                              size={16}
                              className='animate-spin text-muted-foreground'
                            />
                          ) : undefined
                        }
                        placeholder={t("search_songs")}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className='h-10 border-slate-600/50 bg-slate-800/50'
                      />
                    </div>
                    <div>
                      <label className='mb-2 block text-sm font-medium text-slate-300'>
                        Status
                      </label>
                      <Select
                        value={statusFilter}
                        onValueChange={setStatusFilter}>
                        <SelectTrigger className='h-10 border-zinc-600/50 bg-zinc-800/50'>
                          <SelectValue placeholder='Status' />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='all'>Wszystkie</SelectItem>
                          <SelectItem value='wantToLearn'>
                            Chcę nauczyć
                          </SelectItem>
                          <SelectItem value='learning'>Uczę się</SelectItem>
                          <SelectItem value='learned'>Nauczone</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className='mb-2 block text-sm font-medium text-slate-300'>
                        Trudność
                      </label>
                      <Select
                        value={difficultyFilter}
                        onValueChange={setDifficultyFilter}>
                        <SelectTrigger className='h-10 border-zinc-600/50 bg-zinc-800/50'>
                          <SelectValue placeholder='Trudność' />
                        </SelectTrigger>
                        <SelectContent>
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
                    <label className='mb-3 block text-sm font-medium text-slate-300'>
                      Poziom trudności (Tier)
                    </label>
                    <div className='flex flex-wrap items-center gap-3'>
                      <Button
                        variant='ghost'
                        onClick={() => setTierFilter("all")}
                        className={`h-9 px-4 text-sm transition-all ${
                          tierFilter === "all"
                            ? "border border-cyan-500/50 bg-cyan-500/25 text-cyan-300"
                            : "border border-slate-600/50 bg-slate-800/30 text-slate-400 hover:bg-slate-700/50"
                        }`}>
                        Wszystkie
                      </Button>
                      {getAllTiers().map((tier) => (
                        <Button
                          key={tier.tier}
                          variant='ghost'
                          onClick={() => setTierFilter(tier.tier)}
                          className={`h-9 px-3 text-sm transition-all ${
                            tierFilter === tier.tier
                              ? "border-2 shadow-lg backdrop-blur-sm"
                              : "border border-slate-600/50 bg-slate-800/30 hover:bg-slate-700/50"
                          }`}
                          style={{
                            borderColor:
                              tierFilter === tier.tier ? tier.color : undefined,
                            backgroundColor:
                              tierFilter === tier.tier
                                ? tier.color + "25"
                                : undefined,
                            color:
                              tierFilter === tier.tier ? tier.color : undefined,
                          }}>
                          <span className='font-bold'>{tier.tier}</span>
                        </Button>
                      ))}
                      {(statusFilter !== "all" ||
                        difficultyFilter !== "all" ||
                        tierFilter !== "all") && (
                        <Button
                          variant='ghost'
                          onClick={handleClearFilters}
                          className='h-9 border border-slate-600/50 px-4 text-sm text-slate-400 hover:bg-slate-700/50'>
                          <X className='mr-2 h-4 w-4' />
                          Wyczyść filtry
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced Table Section */}
              <div className='overflow-hidden rounded-xl border border-slate-700/50 bg-slate-800/40 shadow-lg backdrop-blur-sm'>
                {isLoading ? (
                  <div className='flex h-[500px] items-center justify-center'>
                    <div className='text-center'>
                      <div className='mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-slate-600 border-t-cyan-400'></div>
                      <p className='text-lg font-semibold text-slate-300'>
                        Ładowanie utworów...
                      </p>
                      <p className='text-sm text-slate-400'>
                        Pobieranie biblioteki muzycznej
                      </p>
                    </div>
                  </div>
                ) : (
                  <SongsTable
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
