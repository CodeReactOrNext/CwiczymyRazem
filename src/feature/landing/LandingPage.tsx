"use client";

import type { faqQuestionInterface } from "feature/faq/components/FaqLayout";
import { BlogSection } from "feature/landing/components/BlogSection";
import { CookieBanner } from "feature/landing/components/CookieBanner";
import { FaqSection } from "feature/landing/components/FaqSection";
import { FeaturesSection } from "feature/landing/components/FeaturesSection";
import { Footer } from "feature/landing/components/Footer";
import { HeroSection } from "feature/landing/components/HeroSection";
import { PricingSection } from "feature/landing/components/PricingSection";
import { WhySection } from "feature/landing/components/WhySection";
import { LandingSEO } from "feature/landing/components/LandingSEO";
import { FinalCTASection } from "feature/landing/components/FinalCTASection";
import { ProductDemo } from "feature/landing/components/ProductDemo";
import { BlogFrontmatter } from "lib/blog";

interface LandingPageProps {
  blogs: BlogFrontmatter[];
}

const LandingPage = ({ blogs }: LandingPageProps) => {
  const faqQuestions: faqQuestionInterface[] = [
    {
      title: "Is Riff Quest really free?",
      message:
        "Yes, Riff Quest is 100% free. There are no subscriptions, no hidden fees, and no locked features. Everything we build is available to every guitarist from day one.",
    },
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
      <div className='min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-cyan-500/30 relative overflow-x-hidden'>
        {/* Aggressive Global Noise to eliminate banding */}
        <div className="fixed inset-0 pointer-events-none z-[100] opacity-[0.08] bg-[url('/static/images/old_effect_dark.webp')] mix-blend-overlay scale-[1.5]"></div>
        
        <HeroSection />
        <ProductDemo />
        <WhySection />
        <FeaturesSection />
        <PricingSection />
        <FaqSection questions={faqQuestions} />
        <BlogSection blogs={blogs} />
        <FinalCTASection />
        <Footer />
        <CookieBanner />
      </div>
    </>
  );
};

export default LandingPage;
