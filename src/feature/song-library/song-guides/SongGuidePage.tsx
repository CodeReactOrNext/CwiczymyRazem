"use client";

import { AuthorBio } from "components/Blog/AuthorBio";
import { CookieBanner } from "feature/landing/components/CookieBanner";
import { FaqSection } from "feature/landing/components/FaqSection";
import { Footer } from "feature/landing/components/Footer";
import type { SeoLandingGuideLink } from "feature/seoLanding/types/seoLanding.types";
import { LibraryNav } from "feature/song-library/components/LibraryNav";
import { getAuthorProfile } from "lib/authors";
import type { ReactNode } from "react";

import { GuideFinalCta, GuideInlineCta } from "./components/GuideCtas";
import { GuideCustomBlock } from "./components/GuideCustomBlock";
import { GuideHero } from "./components/GuideHero";
import { GuideLearningPath } from "./components/GuideLearningPath";
import { GuidePracticePlan } from "./components/GuidePracticePlan";
import { GuideProgressBar } from "./components/GuideProgressBar";
import { GuideProgression } from "./components/GuideProgression";
import { GuideRelatedExercises } from "./components/GuideRelatedExercises";
import { GuideRiffPreview } from "./components/GuideRiffPreview";
import { GuideSongMap } from "./components/GuideSongMap";
import { GuideSources } from "./components/GuideSources";
import { GuideStatsBar } from "./components/GuideStatsBar";
import { GuideTechniques } from "./components/GuideTechniques";
import { GuideTimeline } from "./components/GuideTimeline";
import { GuideToc } from "./components/GuideToc";
import { GuideVerdict } from "./components/GuideVerdict";
import { GuideVideoLessons } from "./components/GuideVideoLessons";
import { GuideWhoFor } from "./components/GuideWhoFor";
import { SongGuideSEO } from "./components/SongGuideSEO";
import type {
  CrossGuideDifficultyMap,
  GuideLiveData,
  PathSongLiveDataMap,
  SongGuide,
} from "./types";
import { resolveGuideFaq } from "./utils/resolveFaq";

interface SongGuidePageProps {
  guide: SongGuide;
  liveData: GuideLiveData;
  crossGuideDifficulty: CrossGuideDifficultyMap;
  relatedLandingLinks: SeoLandingGuideLink[];
  pathSongLiveData: PathSongLiveDataMap;
}

const SongGuidePage = ({
  guide,
  liveData,
  crossGuideDifficulty,
  relatedLandingLinks,
  pathSongLiveData,
}: SongGuidePageProps) => {
  const resolvedFaq = resolveGuideFaq(guide, liveData);
  const authorProfile = getAuthorProfile(guide.author);

  const renderSectionContent = (sectionId: string): ReactNode => {
    if (sectionId.startsWith("custom:")) {
      const block = guide.customBlocks.find(
        (candidate) => `custom:${candidate.id}` === sectionId
      );
      return block ? <GuideCustomBlock block={block} /> : null;
    }

    switch (sectionId) {
      case "verdict":
        return <GuideVerdict guide={guide} />;
      case "whoFor":
        return <GuideWhoFor guide={guide} />;
      case "techniques":
        return <GuideTechniques guide={guide} />;
      case "songMap":
        return <GuideSongMap guide={guide} />;
      case "riffPreview":
        // Rendered explicitly right after GuideHero (see below), not here —
        // it goes above the stats bar / progression ladder, ahead of the
        // rest of sectionOrder, so a visitor can try the riff before reading
        // anything else.
        return null;
      case "timeline":
        return <GuideTimeline guide={guide} />;
      case "practicePlan":
        return <GuidePracticePlan guide={guide} />;
      case "learningPath":
        return (
          <GuideLearningPath
            guide={guide}
            crossGuideDifficulty={crossGuideDifficulty}
            pathSongLiveData={pathSongLiveData}
          />
        );
      // "progression" renders once, above sectionOrder — see below.
      case "progression":
        return null;
      case "inlineCta":
        return (
          <GuideInlineCta guide={guide} coverUrl={liveData.song?.coverUrl} />
        );
      case "relatedExercises":
        return <GuideRelatedExercises links={relatedLandingLinks} />;
      case "sources":
        return guide.sources ? (
          <GuideSources sources={guide.sources} />
        ) : null;
      case "videoLessons":
        return guide.videoLessons ? (
          <GuideVideoLessons lessons={guide.videoLessons} />
        ) : null;
      default:
        return null;
    }
  };

  // Anchors (e.g. FAQ schema deep links) clear LibraryNav's fixed 64px header.
  const renderSection = (sectionId: string): ReactNode => {
    const content = renderSectionContent(sectionId);
    if (!content) return null;

    return (
      <div key={sectionId} id={sectionId} className='scroll-mt-24'>
        {content}
      </div>
    );
  };

  return (
    <>
      <SongGuideSEO guide={guide} liveData={liveData} resolvedFaq={resolvedFaq} />
      <LibraryNav />
      <GuideProgressBar />
      <GuideToc guide={guide} />
      <main className='relative min-h-screen bg-zinc-950 font-sans text-zinc-100 selection:bg-cyan-500/30'>
        <GuideHero guide={guide} liveData={liveData} />
        {guide.riffPreview && (
          <div id='riffPreview' className='scroll-mt-24'>
            <GuideRiffPreview riffPreview={guide.riffPreview} />
          </div>
        )}
        <GuideStatsBar guide={guide} liveData={liveData} />
        <div id='progression' className='scroll-mt-24'>
          <GuideProgression guide={guide} liveData={liveData} />
        </div>
        {guide.sectionOrder.map(renderSection)}
        <div id='faq' className='scroll-mt-24'>
          <FaqSection questions={resolvedFaq} />
        </div>
        {authorProfile && (
          <div className='mx-auto max-w-5xl px-6'>
            <AuthorBio
              name={authorProfile.name}
              image={authorProfile.image}
              role={authorProfile.role}
              bio={authorProfile.bio}
            />
          </div>
        )}
        <GuideFinalCta guide={guide} coverUrl={liveData.song?.coverUrl} />
        <Footer />
        <CookieBanner />
      </main>
    </>
  );
};

export default SongGuidePage;
