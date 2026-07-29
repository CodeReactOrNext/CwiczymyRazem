import LibraryLandingPage from "feature/song-library/LibraryLandingPage";
import type {
  LibrarySong,
} from "feature/song-library/services/getSongsForStaticProps";
import { getSongsForStaticProps } from "feature/song-library/services/getSongsForStaticProps";
import { songGuides } from "feature/song-library/song-guides/content";
import { getGuideCoverUrls } from "feature/song-library/song-guides/services/getSongGuideLiveData";
import type { GetStaticProps, NextPage } from "next";

interface LibraryPageProps {
  songs: LibrarySong[];
  totalSongs: number;
  guideCovers: Record<string, string | null>;
}

const LibraryPage: NextPage<LibraryPageProps> = ({
  songs,
  totalSongs,
  guideCovers,
}) => {
  return (
    <LibraryLandingPage
      songs={songs}
      totalSongs={totalSongs}
      guideCovers={guideCovers}
    />
  );
};

export const getStaticProps: GetStaticProps<LibraryPageProps> = async () => {
  const [{ songs, total }, guideCovers] = await Promise.all([
    getSongsForStaticProps(24),
    getGuideCoverUrls(songGuides.map((guide) => guide.songId)),
  ]);

  return {
    props: { songs, totalSongs: total, guideCovers },
    revalidate: 172800, // 2 days
  };
};

export default LibraryPage;
