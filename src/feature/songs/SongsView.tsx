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
    setUserSongs,
    refreshSongs,
    refreshSongsWithoutLoading,
    debounceLoading,
  } = useSongs();

  return (
    <MainContainer title={t("songs")}>
      <div className='p-4 font-openSans'>
        <SongLearningSection
          isLanding={false}
          userSongs={userSongs}
          onChange={setUserSongs}
          onStatusChange={refreshSongs}
        />
        <div className='mb-4 mt-8 flex flex-col gap-4 sm:items-center sm:justify-between md:flex-row'>
          <div className='flex flex-1 items-center gap-4'>
            <div className='max-w-xs flex-1'>
              <Input
                type='text'
                startIcon={
                  <Search size={18} className='text-muted-foreground' />
                }
                endIcon={
                  debounceLoading ? (
                    <LoaderCircle
                      size={18}
                      className='animate-spin text-muted-foreground'
                    />
                  ) : undefined
                }
                placeholder={t("search_songs")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className='flex flex-wrap items-center gap-4'>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className='w-[180px]'>
                <SelectValue placeholder={t("filter_by_status")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>{t("all_statuses")}</SelectItem>
                <SelectItem value='wantToLearn'>
                  {t("want_to_learn")}
                </SelectItem>
                <SelectItem value='learning'>{t("learning")}</SelectItem>
                <SelectItem value='learned'>{t("learned")}</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={difficultyFilter}
              onValueChange={setDifficultyFilter}>
              <SelectTrigger className='w-[180px]'>
                <SelectValue placeholder={t("filter_by_difficulty")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>{t("all_difficulties")}</SelectItem>
                <SelectItem value='easy'>{t("easy")}</SelectItem>
                <SelectItem value='medium'>{t("medium")}</SelectItem>
                <SelectItem value='hard'>{t("hard")}</SelectItem>
              </SelectContent>
            </Select>

            {(statusFilter !== "all" || difficultyFilter !== "all") && (
              <Button
                variant='ghost'
                onClick={handleClearFilters}
                className='flex items-center gap-2'>
                {t("clear_filters")}
                <X className='h-4 w-4' />
              </Button>
            )}
            <Button onClick={() => setIsModalOpen(true)}>
              <IoMdAddCircleOutline />
              {t("add_song")}
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className='flex h-[500px] justify-center p-4'>
            <span className='loading loading-spinner loading-lg' />
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
