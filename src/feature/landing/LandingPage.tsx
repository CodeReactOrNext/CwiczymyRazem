"use client";

import { SectionSeam } from "components/SectionSeam/SectionSeam";
import type { faqQuestionInterface } from "feature/faq/components/FaqLayout";
import { HeroSection } from "feature/landing/components/HeroSection";
import { LandingSEO } from "feature/landing/components/LandingSEO";
import { LandingStickyNav } from "feature/landing/components/LandingStickyNav";
import { jakartaLanding } from "feature/landing/lib/fonts";
import type { BlogFrontmatter } from "lib/blog";
import dynamic from "next/dynamic";

const InteractiveExercisesSection = dynamic(() =>
  import("feature/landing/components/InteractiveExercisesSection").then(
    (m) => m.InteractiveExercisesSection,
  ),
);
const ExerciseCatalogPreview = dynamic(() =>
  import("feature/landing/components/ExerciseCatalogPreview").then(
    (m) => m.ExerciseCatalogPreview,
  ),
);
const StatisticsSection = dynamic(() =>
  import("feature/landing/components/StatisticsSection").then(
    (m) => m.StatisticsSection,
  ),
);
const SongsLibrarySection = dynamic(() =>
  import("feature/landing/components/SongsLibrarySection").then(
    (m) => m.SongsLibrarySection,
  ),
);
const PracticePlansSection = dynamic(() =>
  import("feature/landing/components/PracticePlansSection").then(
    (m) => m.PracticePlansSection,
  ),
);
const TestimonialsSection = dynamic(() =>
  import("feature/landing/components/TestimonialsSection").then(
    (m) => m.TestimonialsSection,
  ),
);
const MidCTASection = dynamic(() =>
  import("feature/landing/components/MidCTASection").then(
    (m) => m.MidCTASection,
  ),
);
const FaqSection = dynamic(() =>
  import("feature/landing/components/FaqSection").then((m) => m.FaqSection),
);
const BlogSection = dynamic(() =>
  import("feature/landing/components/BlogSection").then((m) => m.BlogSection),
);
const Footer = dynamic(() =>
  import("feature/landing/components/Footer").then((m) => m.Footer),
);
const CookieBanner = dynamic(
  () =>
    import("feature/landing/components/CookieBanner").then(
      (m) => m.CookieBanner,
    ),
  { ssr: false },
);

interface LandingPageProps {
  blogs: BlogFrontmatter[];
  spotlightExercises?: Array<{
    id: string;
    title: string;
    difficulty: "beginner" | "easy" | "medium" | "hard";
    category: string;
    description: string;
    timeInMinutes: number;
  }>;
}

const LandingPage = ({ blogs, spotlightExercises = [] }: LandingPageProps) => {
  const faqQuestions: faqQuestionInterface[] = [
    {
      title: "Who is this app for?",
      message:
        "Riff Quest is for guitarists who want to turn their practice into visible progress. If you feel inconsistent, stuck, or just want a better way to track your repertoire, this is for you.",
    },
    {
      title: "Is it for beginners or advanced guitarists?",
      message:
        "It's designed for both. Beginners use it to stay motivated and track their first skills, while advanced players use it to manage complex repertoires and see where they stand in the community.",
    },
    {
      title: "Do I have to practice every day to use it?",
      message:
        "Absolutely not. We hate 'streak pressure.' Riff Quest is a companion that tracks your growth whenever you pick up the guitar, whether that's daily or just a few times a week.",
    },
    {
      title: "Where do the song difficulty levels come from?",
      message:
        "They are community-rated. Instead of a single expert deciding how hard a song is, the difficulty reflects the real-world experience of guitarists who have actually practiced and learned it.",
    },
    {
      title: "How does progress tracking work?",
      message:
        "The app automatically logs your sessions and skill development in areas like Technique, Theory, and Ear Training, giving you a clear bird's-eye view of your improvement.",
    },
    {
      title: "Can I track my own custom songs and exercises?",
      message:
        "Yes! You have full flexibility to log any song or exercise you're currently working on, keeping your practice organized and your progress visible.",
    },
    {
      title: "How does the gamification (XP) help me?",
      message:
        "By earning skill points and leveling up, you get a tangible sense of achievement for every minute spent with your guitar. It turns 'messy practice' into a rewarding progression system.",
    },
  ];

  return (
    <>
      <LandingSEO faqQuestions={faqQuestions} />
      <main
        className={`${jakartaLanding.variable} relative min-h-screen overflow-x-hidden bg-zinc-950 font-sans text-zinc-100 selection:bg-cyan-500/30`}>
        <LandingStickyNav />
        <HeroSection />
        <InteractiveExercisesSection />
        {spotlightExercises.length > 0 && (
          <ExerciseCatalogPreview exercises={spotlightExercises} />
        )}
        <StatisticsSection />
        <SectionSeam from='900' to='950' />
        <SongsLibrarySection />
        <PracticePlansSection />
        <TestimonialsSection />
        <MidCTASection />
        <FaqSection questions={faqQuestions} />
        <BlogSection blogs={blogs} />
        <Footer />
        <CookieBanner />
      </main>
    </>
  );
};

export default LandingPage;
