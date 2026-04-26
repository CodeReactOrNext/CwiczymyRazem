import LibraryLandingPage from "feature/song-library/LibraryLandingPage";
import type {
  LibrarySong,
} from "feature/song-library/services/getSongsForStaticProps";
import { getSongsForStaticProps } from "feature/song-library/services/getSongsForStaticProps";
import type { GetStaticProps, NextPage } from "next";

interface LibraryPageProps {
  songs: LibrarySong[];
  totalSongs: number;
}

const LibraryPage: NextPage<LibraryPageProps> = ({ songs, totalSongs }) => {
  return <LibraryLandingPage songs={songs} totalSongs={totalSongs} />;
};

export const getStaticProps: GetStaticProps<LibraryPageProps> = async () => {
  const { songs, total } = await getSongsForStaticProps(24);
  return {
    props: { songs, totalSongs: total },
    revalidate: 172800, // 2 days
  };
};

export default LibraryPage;
