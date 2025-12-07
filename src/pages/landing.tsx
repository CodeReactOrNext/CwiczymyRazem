"use client";

import type { NextPage } from "next";
import Head from "next/head";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "react-i18next";
import type { faqQuestionInterface } from "feature/faq/components/FaqLayout";

// Import new modular components
import { HeroSection } from "feature/landing/components/HeroSection";
import { FeaturesSection } from "feature/landing/components/FeaturesSection";
import { TestimonialsSection } from "feature/landing/components/TestimonialsSection";
import { PricingSection } from "feature/landing/components/PricingSection";
import { FaqSection } from "feature/landing/components/FaqSection";
import { Footer } from "feature/landing/components/Footer";

const LandingPage: NextPage = () => {
  const { t } = useTranslation(["common", "profile"]);

  const faqQuestions: faqQuestionInterface[] = [
    {
      title: "Is Practice Together really free?",
      message:
        "Yes! Practice Together is mostly free. Core features, progress tracking, exercises and gamification are available without any fees.",
    },
    {
      title: "How does progress tracking work?",
      message:
        "The app automatically tracks your exercises, practice time and progress in different skills. You receive detailed reports and statistics showing your development.",
    },
    {
      title: "Can I create my own exercises?",
      message:
        "Of course! In addition to ready-made practice plans, you can create your own, tailored to your needs and musical goals.",
    },
    {
      title: "How does the gamification system work?",
      message:
        "For regular practice you earn points, unlock new skills and achievements. The system motivates for daily practice and helps build habits.",
    },
    {
      title: "Do I need special equipment?",
      message:
        "No! Just a guitar and a device with internet access. Practice Together works on phones, tablets and computers.",
    },
  ];

  return (
    <>
      <Head>
        <title>Practice Together - Learn to play guitar</title>
        <meta
          name='description'
          content='Intelligent guitar learning platform with progress system, community and thousands of songs.'
        />
      </Head>

      <div className='min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-cyan-500/30'>
        <HeroSection />
        <FeaturesSection />
        <TestimonialsSection />
        <PricingSection />
        <FaqSection questions={faqQuestions} />
        <Footer />
      </div>
    </>
  );
};

export default LandingPage;

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? "pl", ["common", "profile"])),
    },
  };
}
