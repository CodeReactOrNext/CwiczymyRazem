import LibraryLandingPage from "feature/song-library/LibraryLandingPage";
import type {
  LibrarySong,
} from "feature/song-library/services/getSongsForStaticProps";
import { getSongsForStaticProps } from "feature/song-library/services/getSongsForStaticProps";
import { songGuides } from "feature/song-library/song-guides/content";
import { getPathSongLiveData } from "feature/song-library/song-guides/services/getSongGuideLiveData";
import type { PathSongLiveDataMap } from "feature/song-library/song-guides/types";
import type { GetStaticProps, NextPage } from "next";

interface LibraryPageProps {
  songs: LibrarySong[];
  totalSongs: number;
  guideLiveData: PathSongLiveDataMap;
}

const LibraryPage: NextPage<LibraryPageProps> = ({
  songs,
  totalSongs,
  guideLiveData,
}) => {
  return (
    <LibraryLandingPage
      songs={songs}
      totalSongs={totalSongs}
      guideLiveData={guideLiveData}
    />
  );
};

export const getStaticProps: GetStaticProps<LibraryPageProps> = async () => {
  const guideSongIds = songGuides
    .map((guide) => guide.songId)
    .filter((id): id is string => Boolean(id));

  const [{ songs, total }, guideLiveData] = await Promise.all([
    getSongsForStaticProps(24),
    getPathSongLiveData(guideSongIds),
  ]);

  return {
    props: { songs, totalSongs: total, guideLiveData },
    revalidate: 172800, // 2 days
  };
};

export default LibraryPage;
