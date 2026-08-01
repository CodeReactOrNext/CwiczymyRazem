import { seoLandingConfigs } from "feature/seoLanding/content";
import type { SeoLandingGuideLink } from "feature/seoLanding/types/seoLanding.types";
import {
  getSongGuideBySlug,
  songGuides,
} from "feature/song-library/song-guides/content";
import {
  getCrossGuideDifficulties,
  getPathSongLiveData,
  getSongGuideLiveData,
} from "feature/song-library/song-guides/services/getSongGuideLiveData";
import SongGuidePage from "feature/song-library/song-guides/SongGuidePage";
import type {
  CrossGuideDifficultyMap,
  GuideLiveData,
  PathSongLiveDataMap,
  SongGuide,
} from "feature/song-library/song-guides/types";
import { SEO_LANDING_PAGES } from "lib/exerciseLandingLink";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";

interface SongGuideRouteProps {
  guide: SongGuide;
  liveData: GuideLiveData;
  crossGuideDifficulty: CrossGuideDifficultyMap;
  relatedLandingLinks: SeoLandingGuideLink[];
  pathSongLiveData: PathSongLiveDataMap;
}

const SongGuideRoute: NextPage<SongGuideRouteProps> = ({
  guide,
  liveData,
  crossGuideDifficulty,
  relatedLandingLinks,
  pathSongLiveData,
}) => {
  return (
    <SongGuidePage
      guide={guide}
      liveData={liveData}
      crossGuideDifficulty={crossGuideDifficulty}
      relatedLandingLinks={relatedLandingLinks}
      pathSongLiveData={pathSongLiveData}
    />
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  return {
    paths: songGuides.map((guide) => ({ params: { slug: guide.slug } })),
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps<SongGuideRouteProps> = async ({
  params,
}) => {
  const slug = params?.slug as string;
  const guide = getSongGuideBySlug(slug);

  if (!guide) {
    return { notFound: true };
  }

  const liveData = await getSongGuideLiveData(guide.songId);

  const crossGuideRefs = [
    ...guide.learningPath.easier,
    ...guide.learningPath.harder,
  ]
    .filter((song) => song.guideSlug)
    .map((song) => ({
      guideSlug: song.guideSlug as string,
      songId: getSongGuideBySlug(song.guideSlug as string)?.songId ?? null,
    }));

  const crossGuideDifficulty = await getCrossGuideDifficulties(crossGuideRefs);

  const pathSongIds = [
    ...guide.learningPath.easier,
    ...guide.learningPath.harder,
  ]
    .map((song) => song.songId)
    .filter((id): id is string => Boolean(id));
  const pathSongLiveData = await getPathSongLiveData(pathSongIds);

  const relatedLandingLinks: SeoLandingGuideLink[] =
    guide.relatedLandingSlugs.map((key) => {
      const landingSlug = SEO_LANDING_PAGES[key].slice(1);
      const config = seoLandingConfigs.find((c) => c.slug === landingSlug);
      if (!config) {
        throw new Error(
          `Song guide "${guide.slug}" references unknown landing page "${key}"`
        );
      }
      return {
        slug: config.slug,
        title: config.title,
        description: config.metaDescription,
      };
    });

  return {
    props: {
      guide,
      liveData,
      crossGuideDifficulty,
      relatedLandingLinks,
      pathSongLiveData,
    },
    revalidate: 86400, // refresh community stats daily
  };
};

export default SongGuideRoute;
