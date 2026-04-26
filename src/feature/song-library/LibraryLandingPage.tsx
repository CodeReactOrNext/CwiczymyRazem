"use client";

import { CookieBanner } from "feature/landing/components/CookieBanner";
import { Footer } from "feature/landing/components/Footer";
import { LibraryCTASection } from "feature/song-library/components/LibraryCTASection";
import { LibraryFaqSection } from "feature/song-library/components/LibraryFaqSection";
import { LibraryHeroSection } from "feature/song-library/components/LibraryHeroSection";
import { LibraryNav } from "feature/song-library/components/LibraryNav";
import { LibrarySEO } from "feature/song-library/components/LibrarySEO";
import { LibrarySongGrid } from "feature/song-library/components/LibrarySongGrid";
import { LibraryStatsBar } from "feature/song-library/components/LibraryStatsBar";
import { LibraryTierGuide } from "feature/song-library/components/LibraryTierGuide";
import type { LibrarySong } from "feature/song-library/services/getSongsForStaticProps";

const faqQuestions = [
  {
    title: "How is song difficulty determined?",
    message:
      "Difficulty ratings come from the guitarists who actually practiced each song. Instead of a single expert score, each song's rating reflects the real-world experience of the community — averaging out all submitted scores.",
  },
  {
    title: "What are the guitar tier levels?",
    message:
      "We use a 5-tier system from D (Beginner) to S (Legendary), based on a 1–10 difficulty scale. D tier covers scores 1–3.9, C covers 4–5.9, B covers 6–7.4, A covers 7.5–8.9, and S tier covers 9–10.",
  },
  {
    title: "Can I filter songs by genre?",
    message:
      "Yes — you can filter by genre and tier directly on this page. Inside the full app you can also filter by difficulty range and sort by popularity or rating count.",
  },
  {
    title: "Is the guitar song library free to use?",
    message:
      "Browsing the library and tracking your songs is free forever. A Pro plan unlocks additional features like Guitar Pro tab integration and AI practice recommendations.",
  },
  {
    title: "How do I add a song to my practice list?",
    message:
      "Create a free account, then click any song to add it to your Want to Learn list, mark it as Practicing, or log it as Learned. Your progress is saved automatically.",
  },
];

interface LibraryLandingPageProps {
  songs: LibrarySong[];
  totalSongs: number;
}

const LibraryLandingPage = ({ songs, totalSongs }: LibraryLandingPageProps) => {
  return (
    <>
      <LibrarySEO songs={songs} totalSongs={totalSongs} faqQuestions={faqQuestions} />
      <LibraryNav />
      <main className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-cyan-500/30 relative overflow-x-hidden">
        {/* Grain overlay */}
        <div className="fixed inset-0 pointer-events-none z-[100] opacity-[0.04] bg-[url('/static/images/old_effect_dark.webp')] bg-repeat" />

        <LibraryHeroSection totalSongs={totalSongs} />
        <LibraryStatsBar totalSongs={totalSongs} />
        <LibrarySongGrid songs={songs} totalSongs={totalSongs} />
        <LibraryTierGuide />
        <LibraryCTASection />
        <LibraryFaqSection questions={faqQuestions} />
        <Footer />
        <CookieBanner />
      </main>
    </>
  );
};

export default LibraryLandingPage;
