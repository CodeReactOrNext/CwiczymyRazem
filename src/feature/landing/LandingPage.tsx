"use client";

import dynamic from "next/dynamic";
import type { faqQuestionInterface } from "feature/faq/components/FaqLayout";
import { HeroSection } from "feature/landing/components/HeroSection";
import { LandingSEO } from "feature/landing/components/LandingSEO";
import { ProductDemo } from "feature/landing/components/ProductDemo";
import type { BlogFrontmatter } from "lib/blog";

const WhySection = dynamic(() => import("feature/landing/components/WhySection").then(m => m.WhySection));
const InteractiveExercisesSection = dynamic(() => import("feature/landing/components/InteractiveExercisesSection").then(m => m.InteractiveExercisesSection));
const StatisticsSection = dynamic(() => import("feature/landing/components/StatisticsSection").then(m => m.StatisticsSection));
const SongsLibrarySection = dynamic(() => import("feature/landing/components/SongsLibrarySection").then(m => m.SongsLibrarySection));
const PracticePlansSection = dynamic(() => import("feature/landing/components/PracticePlansSection").then(m => m.PracticePlansSection));
const RoadmapSection = dynamic(() => import("feature/landing/components/RoadmapSection").then(m => m.RoadmapSection));
const SessionSummarySection = dynamic(() => import("feature/landing/components/SessionSummarySection").then(m => m.SessionSummarySection));
const FaqSection = dynamic(() => import("feature/landing/components/FaqSection").then(m => m.FaqSection));
const BlogSection = dynamic(() => import("feature/landing/components/BlogSection").then(m => m.BlogSection));
const FinalCTASection = dynamic(() => import("feature/landing/components/FinalCTASection").then(m => m.FinalCTASection));
const Footer = dynamic(() => import("feature/landing/components/Footer").then(m => m.Footer));
const CookieBanner = dynamic(() => import("feature/landing/components/CookieBanner").then(m => m.CookieBanner), { ssr: false });

interface LandingPageProps {
  blogs: BlogFrontmatter[];
}

const LandingPage = ({ blogs }: LandingPageProps) => {
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
        "The app automatically logs your sessions and skill development in areas like Technique, Theory, and Ear Training, giving you a clear birds-eye view of your improvement.",
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
      <main className='min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-cyan-500/30 relative overflow-x-hidden'>
        
        <HeroSection />
        <ProductDemo />
        <WhySection />
        <InteractiveExercisesSection />
        <StatisticsSection />
        <SongsLibrarySection />
        <PracticePlansSection />
        <RoadmapSection />
        <SessionSummarySection />
        <FaqSection questions={faqQuestions} />
        <BlogSection blogs={blogs} />
        <FinalCTASection />
        <Footer />
        <CookieBanner />
      </main>
    </>
  );
};

export default LandingPage;
