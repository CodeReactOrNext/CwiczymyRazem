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
import { GuideMistakes } from "./components/GuideMistakes";
import { GuidePracticePlan } from "./components/GuidePracticePlan";
import { GuideProgression } from "./components/GuideProgression";
import { GuideRelatedExercises } from "./components/GuideRelatedExercises";
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
import type { CrossGuideDifficultyMap, GuideLiveData, SongGuide } from "./types";
import { resolveGuideFaq } from "./utils/resolveFaq";

interface SongGuidePageProps {
  guide: SongGuide;
  liveData: GuideLiveData;
  crossGuideDifficulty: CrossGuideDifficultyMap;
  relatedLandingLinks: SeoLandingGuideLink[];
}

const SongGuidePage = ({
  guide,
  liveData,
  crossGuideDifficulty,
  relatedLandingLinks,
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
        return <GuideVerdict guide={guide} liveData={liveData} />;
      case "whoFor":
        return <GuideWhoFor guide={guide} />;
      case "techniques":
        return <GuideTechniques guide={guide} />;
      case "songMap":
        return <GuideSongMap guide={guide} />;
      case "timeline":
        return <GuideTimeline guide={guide} />;
      case "mistakes":
        return <GuideMistakes guide={guide} />;
      case "practicePlan":
        return <GuidePracticePlan guide={guide} />;
      case "learningPath":
        return (
          <GuideLearningPath
            guide={guide}
            crossGuideDifficulty={crossGuideDifficulty}
          />
        );
      case "progression":
        return <GuideProgression guide={guide} liveData={liveData} />;
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

  // Anchors let the top-of-page GuideToc jump straight to a section; the
  // offset clears LibraryNav's fixed 64px header so the heading isn't hidden.
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
      <main className='relative min-h-screen overflow-x-hidden bg-zinc-950 font-sans text-zinc-100 selection:bg-cyan-500/30'>
        <GuideHero guide={guide} liveData={liveData} />
        <GuideStatsBar guide={guide} liveData={liveData} />
        <GuideToc guide={guide} />
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
