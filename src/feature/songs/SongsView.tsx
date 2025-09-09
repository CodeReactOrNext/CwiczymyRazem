import { Button } from "assets/components/ui/button";
import { Input } from "assets/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "assets/components/ui/select";
import MainContainer from "components/MainContainer";
import AddSongModal from "feature/songs/components/AddSongModal/AddSongModal";
import { SongLearningSection } from "feature/songs/components/SongLearningSection/SongLearningSection";
import SongsTable from "feature/songs/components/SongsTable/SongsTable";
import { useSongs } from "feature/songs/hooks/useSongs";
import { getAllTiers } from "feature/songs/utils/getSongTier";
import { LoaderCircle, Search, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { IoMdAddCircleOutline } from "react-icons/io";

const SongsView = () => {
  const { t } = useTranslation("songs");
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
      <div className='font-openSans space-y-8 p-6'>
        {/* Compact Song Management Section */}
        <div className='rounded-lg border border-zinc-700/50 bg-zinc-900/20 p-4 backdrop-blur-sm'>
          <div className='mb-3 flex items-center justify-between'>
            <div>
              <h2 className='text-lg font-bold text-white'>
                Zarządzanie utworami
              </h2>
              <p className='text-xs text-zinc-500'>
                Przeciągnij utwory między kategoriami
              </p>
            </div>
            <Button
              onClick={() => setIsModalOpen(true)}
              size='sm'
              className='bg-gradient-to-r from-cyan-500 to-cyan-600 font-semibold text-white shadow-lg shadow-cyan-500/25 hover:from-cyan-400 hover:to-cyan-500'>
              <IoMdAddCircleOutline className='mr-2 h-4 w-4' />
              Dodaj utwór
            </Button>
          </div>
          <SongLearningSection
            isLanding={false}
            userSongs={userSongs}
            onChange={setUserSongs}
            onStatusChange={refreshSongs}
          />
        </div>

        {/* Compact Filters Section */}
        <div className='rounded-lg border border-zinc-700/50 bg-zinc-900/20 p-4 backdrop-blur-sm'>
          <div className='space-y-3'>
            {/* Search & Basic Filters Row */}
            <div className='grid gap-3 lg:grid-cols-4'>
              <div className='lg:col-span-2'>
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
                  className='h-9 border-zinc-600/50 bg-zinc-800/50 text-sm'
                />
              </div>
              <div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className='h-9 border-zinc-600/50 bg-zinc-800/50 text-sm'>
                    <SelectValue placeholder='Status' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>Wszystkie</SelectItem>
                    <SelectItem value='wantToLearn'>Chcę nauczyć</SelectItem>
                    <SelectItem value='learning'>Uczę się</SelectItem>
                    <SelectItem value='learned'>Nauczone</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Select
                  value={difficultyFilter}
                  onValueChange={setDifficultyFilter}>
                  <SelectTrigger className='h-9 border-zinc-600/50 bg-zinc-800/50 text-sm'>
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
            <div className='flex flex-wrap items-center gap-2'>
              <span className='text-xs font-medium text-zinc-400'>Tier:</span>
              <Button
                variant='ghost'
                size='sm'
                onClick={() => setTierFilter("all")}
                className={`h-7 px-3 text-xs transition-all ${
                  tierFilter === "all"
                    ? "border border-cyan-500/50 bg-cyan-500/20 text-cyan-300"
                    : "border border-zinc-600/50 bg-zinc-800/30 text-zinc-400 hover:bg-zinc-700/50"
                }`}>
                Wszystkie
              </Button>
              {getAllTiers().map((tier) => (
                <Button
                  key={tier.tier}
                  variant='ghost'
                  size='sm'
                  onClick={() => setTierFilter(tier.tier)}
                  className={`h-7 px-2 text-xs transition-all ${
                    tierFilter === tier.tier
                      ? "border-2 shadow-md"
                      : "border border-zinc-600/50 bg-zinc-800/30 hover:bg-zinc-700/50"
                  }`}
                  style={{
                    borderColor:
                      tierFilter === tier.tier ? tier.color : undefined,
                    backgroundColor:
                      tierFilter === tier.tier ? tier.color + "20" : undefined,
                    color: tierFilter === tier.tier ? tier.color : undefined,
                  }}>
                  <span className='font-bold'>{tier.tier}</span>
                </Button>
              ))}
              {(statusFilter !== "all" ||
                difficultyFilter !== "all" ||
                tierFilter !== "all") && (
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={handleClearFilters}
                  className='h-7 border border-zinc-600/50 px-3 text-xs text-zinc-400 hover:bg-zinc-700/50'>
                  <X className='mr-1 h-3 w-3' />
                  Wyczyść
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Content Section */}
        <div className='overflow-hidden rounded-lg border border-zinc-700/50 bg-zinc-900/20 backdrop-blur-sm'>
          {isLoading ? (
            <div className='flex h-[500px] items-center justify-center'>
              <div className='text-center'>
                <div className='mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-zinc-600 border-t-cyan-400'></div>
                <p className='text-lg font-medium text-zinc-300'>
                  Ładowanie utworów...
                </p>
                <p className='text-sm text-zinc-500'>
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
              tierFilter={tierFilter}
            />
          )}
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
