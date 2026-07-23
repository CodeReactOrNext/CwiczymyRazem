"use client";

import { CookieBanner } from "feature/landing/components/CookieBanner";
import { FaqSection } from "feature/landing/components/FaqSection";
import { Footer } from "feature/landing/components/Footer";
import type { SeoLandingGuideLink } from "feature/seoLanding/types/seoLanding.types";
import { LibraryNav } from "feature/song-library/components/LibraryNav";
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
import { GuideStatsBar } from "./components/GuideStatsBar";
import { GuideTechniques } from "./components/GuideTechniques";
import { GuideTimeline } from "./components/GuideTimeline";
import { GuideVerdict } from "./components/GuideVerdict";
import { GuideWhoFor } from "./components/GuideWhoFor";
import { SongGuideSEO } from "./components/SongGuideSEO";
import type { GuideLiveData, SongGuide } from "./types";

interface SongGuidePageProps {
  guide: SongGuide;
  liveData: GuideLiveData;
  relatedLandingLinks: SeoLandingGuideLink[];
}

const SongGuidePage = ({
  guide,
  liveData,
  relatedLandingLinks,
}: SongGuidePageProps) => {
  const renderSection = (sectionId: string): ReactNode => {
    if (sectionId.startsWith("custom:")) {
      const block = guide.customBlocks.find(
        (candidate) => `custom:${candidate.id}` === sectionId
      );
      return block ? (
        <GuideCustomBlock key={sectionId} block={block} />
      ) : null;
    }

    switch (sectionId) {
      case "verdict":
        return (
          <GuideVerdict key={sectionId} guide={guide} liveData={liveData} />
        );
      case "whoFor":
        return <GuideWhoFor key={sectionId} guide={guide} />;
      case "techniques":
        return <GuideTechniques key={sectionId} guide={guide} />;
      case "songMap":
        return <GuideSongMap key={sectionId} guide={guide} />;
      case "timeline":
        return <GuideTimeline key={sectionId} guide={guide} />;
      case "mistakes":
        return <GuideMistakes key={sectionId} guide={guide} />;
      case "practicePlan":
        return <GuidePracticePlan key={sectionId} guide={guide} />;
      case "learningPath":
        return (
          <GuideLearningPath
            key={sectionId}
            guide={guide}
            liveData={liveData}
          />
        );
      case "progression":
        return <GuideProgression key={sectionId} guide={guide} />;
      case "inlineCta":
        return (
          <GuideInlineCta
            key={sectionId}
            guide={guide}
            coverUrl={liveData.song?.coverUrl}
          />
        );
      case "relatedExercises":
        return (
          <GuideRelatedExercises key={sectionId} links={relatedLandingLinks} />
        );
      default:
        return null;
    }
  };

  return (
    <>
      <SongGuideSEO guide={guide} liveData={liveData} />
      <LibraryNav />
      <main className='relative min-h-screen overflow-x-hidden bg-zinc-950 font-sans text-zinc-100 selection:bg-cyan-500/30'>
        <GuideHero guide={guide} liveData={liveData} />
        <GuideStatsBar guide={guide} liveData={liveData} />
        {guide.sectionOrder.map(renderSection)}
        <FaqSection questions={guide.faq} />
        <GuideFinalCta guide={guide} coverUrl={liveData.song?.coverUrl} />
        <Footer />
        <CookieBanner />
      </main>
    </>
  );
};

export default SongGuidePage;
