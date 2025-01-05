import type { NextPage } from "next";
import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

import PageLoadingLayout from "layouts/PageLoadingLayout";
import AuthLayoutWrapper from "wrappers/AuthLayoutWrapper";
import useAutoLogIn from "hooks/useAutoLogIn";
import { Song } from "utils/firebase/client/firebase.types";
import { getSongs, getUserSongs } from "utils/firebase/client/firebase.utils";
import MainContainer from "components/MainContainer";
import SongsTable from "feature/songs/components/SongsTable/SongsTable";
import AddSongModal from "feature/songs/components/AddSongModal/AddSongModal";
import { Button } from "assets/components/ui/button";
import { Input } from "assets/components/ui/input";
import { IoMdAddCircleOutline } from "react-icons/io";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "assets/components/ui/select";
import { X } from "lucide-react";
import { useAppSelector } from "store/hooks";
import { selectUserAuth } from "feature/user/store/userSlice";

const SongsPage: NextPage = () => {
  const { t } = useTranslation("songs");
  const { isLoggedIn } = useAutoLogIn({
    redirects: {
      loggedOut: "/login",
    },
  });
  const [songs, setSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);
  const debounceTimeout = useRef<NodeJS.Timeout>();
  const [sortBy, setSortBy] = useState<
    "title" | "artist" | "avgDifficulty" | "learners"
  >("learners");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [userSongs, setUserSongs] = useState<any>(null);
  const currentUserId = useAppSelector(selectUserAuth);
  const [totalPages, setTotalPages] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    debounceTimeout.current = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [searchQuery]);

  const getStatus = (userSongs: any, songId: string) => {
    if (!userSongs) return null;

    if (userSongs.wantToLearn?.includes(songId)) return "wantToLearn";
    if (userSongs.learning?.includes(songId)) return "learning";
    if (userSongs.learned?.includes(songId)) return "learned";
    return null;
  };

  const getAverageDifficulty = (difficulties: { rating: number }[]) => {
    if (!difficulties?.length) return 0;
    return (
      difficulties.reduce((acc, curr) => acc + curr.rating, 0) /
      difficulties.length
    );
  };

  const loadSongs = async () => {
    try {
      setIsLoading(true);
      const loadedSongs = await getSongs(
        sortBy,
        "desc",
        debouncedSearchQuery,
        page,
        ITEMS_PER_PAGE
      );
      setSongs(loadedSongs.songs);
      setTotalPages(Math.ceil(loadedSongs.total / ITEMS_PER_PAGE));
    } catch (error) {
      console.error("Error loading songs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSongs();
  }, [debouncedSearchQuery, sortBy, page]);

  useEffect(() => {
    const loadUserSongs = async () => {
      if (currentUserId) {
        const songs = await getUserSongs(currentUserId);
        console.log(songs);
        setUserSongs(songs);
      }
    };
    loadUserSongs();
  }, [currentUserId, statusFilter]);

  const handleSort = (newSortBy: string) => {
    setSortBy(newSortBy as typeof sortBy);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleClearFilters = () => {
    setStatusFilter("all");
    setDifficultyFilter("all");
  };

  const filteredSongs = songs.filter((song) => {
    let matchesStatus = true;
    let matchesDifficulty = true;

    // Status filter
    if (statusFilter !== "all") {
      const songStatus = getStatus(userSongs, song.id);
      matchesStatus = songStatus === statusFilter;
    }

    // Difficulty filter
    if (difficultyFilter !== "all") {
      const avgDifficulty = getAverageDifficulty(song.difficulties);
      switch (difficultyFilter) {
        case "easy":
          matchesDifficulty = avgDifficulty <= 4;
          break;
        case "medium":
          matchesDifficulty = avgDifficulty > 4 && avgDifficulty <= 7;
          break;
        case "hard":
          matchesDifficulty = avgDifficulty > 7;
          break;
      }
    }

    return matchesStatus && matchesDifficulty;
  });

  const hasFilters = statusFilter !== "all" || difficultyFilter !== "all" || searchQuery !== "";

  return (
    <AuthLayoutWrapper
      pageId={"songs"}
      subtitle={t("subtitlebar_text")}
      variant='primary'>
      {!isLoggedIn ? (
        <PageLoadingLayout />
      ) : (
        <MainContainer title={t("songs")}>
          <div className='p-4 font-openSans'>
            <div className='mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
              <div className='flex flex-1 items-center gap-4'>
                <div className='flex-1'>
                  <Input
                    type='text'
                    placeholder={t("search_songs")}
                    className='w-full max-w-xs'
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button onClick={() => setIsModalOpen(true)}>
                  <IoMdAddCircleOutline />
                  {t("add_song")}
                </Button>
              </div>

              <div className='flex items-center gap-4'>
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
              </div>
            </div>

            {isLoading ? (
              <div className='flex justify-center p-4'>
                <span className='loading loading-spinner loading-lg' />
              </div>
            ) : (
              <SongsTable
                songs={filteredSongs}
                onSort={handleSort}
                sortBy={sortBy}
                currentPage={page}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                onAddSong={() => setIsModalOpen(true)}
                onClearFilters={handleClearFilters}
                hasFilters={hasFilters}
              />
            )}

            <AddSongModal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              onSuccess={loadSongs}
            />
          </div>
        </MainContainer>
      )}
    </AuthLayoutWrapper>
  );
};

export default SongsPage;

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? "pl", [
        "common",
        "songs",
        "profile",
        "achievements",
        "toast",
      ])),
    },
  };
}
