import { seoLandingConfigs } from "feature/seoLanding/content";
import type { SeoLandingGuideLink } from "feature/seoLanding/types/seoLanding.types";
import {
  getSongGuideBySlug,
  songGuides,
} from "feature/song-library/song-guides/content";
import { getSongGuideLiveData } from "feature/song-library/song-guides/services/getSongGuideLiveData";
import SongGuidePage from "feature/song-library/song-guides/SongGuidePage";
import type {
  GuideLiveData,
  SongGuide,
} from "feature/song-library/song-guides/types";
import { SEO_LANDING_PAGES } from "lib/exerciseLandingLink";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";

interface SongGuideRouteProps {
  guide: SongGuide;
  liveData: GuideLiveData;
  relatedLandingLinks: SeoLandingGuideLink[];
}

const SongGuideRoute: NextPage<SongGuideRouteProps> = ({
  guide,
  liveData,
  relatedLandingLinks,
}) => {
  return (
    <SongGuidePage
      guide={guide}
      liveData={liveData}
      relatedLandingLinks={relatedLandingLinks}
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
    props: { guide, liveData, relatedLandingLinks },
    revalidate: 86400, // refresh community stats daily
  };
};

export default SongGuideRoute;
