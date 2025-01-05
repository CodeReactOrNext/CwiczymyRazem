import type { NextPage } from "next";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

import PageLoadingLayout from "layouts/PageLoadingLayout";
import AuthLayoutWrapper from "wrappers/AuthLayoutWrapper";
import useAutoLogIn from "hooks/useAutoLogIn";
import { Song } from "utils/firebase/client/firebase.types";
import { getSongs } from "utils/firebase/client/firebase.utils";
import MainContainer from "components/MainContainer";
import SongsTable from "feature/songs/components/SongsTable/SongsTable";
import AddSongModal from "feature/songs/components/AddSongModal/AddSongModal";
import { Button } from "assets/components/ui/button";
import { IoMdAddCircleOutline } from "react-icons/io";

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
  const [sortBy, setSortBy] = useState<
    "title" | "artist" | "avgDifficulty" | "learners"
  >("title");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);

  const loadSongs = async () => {
    try {
      setIsLoading(true);
      const loadedSongs = await getSongs(
        sortBy,
        sortDirection,
        searchQuery,
        page,
        10
      );
      setSongs(loadedSongs);
    } catch (error) {
      console.error("Error loading songs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSongs();
  }, [searchQuery, sortBy, sortDirection, page]);

  const handleSort = (newSortBy: string) => {
    if (sortBy === newSortBy) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(newSortBy as typeof sortBy);
      setSortDirection("asc");
    }
  };

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
            <div className='mb-4 flex items-center justify-between'>
              <div className='form-control'>
                <input
                  type='text'
                  placeholder={t("search_songs")}
                  className='input input-bordered w-full max-w-xs'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button onClick={() => setIsModalOpen(true)}>
                <IoMdAddCircleOutline />
                {t("add_song")}
              </Button>
            </div>

            {isLoading ? (
              <div className='flex justify-center p-4'>
                <span className='loading loading-spinner loading-lg' />
              </div>
            ) : (
              <SongsTable
                songs={songs}
                onSort={handleSort}
                sortBy={sortBy}
                sortDirection={sortDirection}
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
