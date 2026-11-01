import LibraryLandingPage from "feature/song-library/LibraryLandingPage";
import type {
  LibrarySong,
} from "feature/song-library/services/getSongsForStaticProps";
import { getSongsForStaticProps } from "feature/song-library/services/getSongsForStaticProps";
import { songGuides } from "feature/song-library/song-guides/content";
import { getPathSongLiveData } from "feature/song-library/song-guides/services/getSongGuideLiveData";
import type {
  GuideCardData,
  PathSongLiveDataMap,
} from "feature/song-library/song-guides/types";
import type { GetStaticProps, NextPage } from "next";

interface LibraryPageProps {
  songs: LibrarySong[];
  totalSongs: number;
  guides: GuideCardData[];
  guideLiveData: PathSongLiveDataMap;
  guideSlugBySongId: Record<string, string>;
}

const LibraryPage: NextPage<LibraryPageProps> = ({
  songs,
  totalSongs,
  guides,
  guideLiveData,
  guideSlugBySongId,
}) => {
  return (
    <LibraryLandingPage
      songs={songs}
      totalSongs={totalSongs}
      guides={guides}
      guideLiveData={guideLiveData}
      guideSlugBySongId={guideSlugBySongId}
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

  // Cards for songs we have written a guide for link straight to it, instead of
  // sending every visitor to the sign-up form (SEO audit 2026-09-05).
  const guideSlugBySongId = Object.fromEntries(
    songGuides
      .filter((guide) => guide.songId)
      .map((guide) => [guide.songId as string, guide.slug])
  );

  return {
    props: {
      songs,
      totalSongs: total,
      guides: songGuides.map((guide) => ({
        slug: guide.slug,
        title: guide.title,
        artist: guide.artist,
        songId: guide.songId ?? null,
        editorialDifficulty: guide.editorial.difficulty,
        oneLiner: guide.editorial.oneLiner,
      })),
      guideLiveData,
      guideSlugBySongId,
    },
    revalidate: 172800, // 2 days
  };
};

export default LibraryPage;
