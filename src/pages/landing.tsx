"use client";

import type { NextPage } from "next";
import Head from "next/head";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "react-i18next";
import nextI18nextConfig from "../../next-i18next.config";
import type { faqQuestionInterface } from "feature/faq/components/FaqLayout";

// Import new modular components
import { HeroSection } from "feature/landing/components/HeroSection";
import { FeaturesSection } from "feature/landing/components/FeaturesSection";
import { PricingSection } from "feature/landing/components/PricingSection";
import { FaqSection } from "feature/landing/components/FaqSection";
import { Footer } from "feature/landing/components/Footer";

const LandingPage: NextPage = () => {
  const { t } = useTranslation(["common", "profile"]);

  const faqQuestions: faqQuestionInterface[] = [
    {
      title: "Is Riff Quest really free?",
      message:
        "Yes! Riff Quest is mostly free. Core features, progress tracking, exercises and gamification are available without any fees.",
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
        "No! Just a guitar and a device with internet access. Riff Quest works on phones, tablets and computers.",
    },
  ];

  const siteUrl = "https://riff.quest";
  const ogImageUrl = `${siteUrl}/promo.png`;

  return (
    <>
      <Head>
        <title>{t("common:seo.title") as string}</title>
        <meta name='description' content={t("common:seo.description") as string} />
        <meta name='keywords' content={t("common:seo.keywords") as string} />

        {/* Open Graph / Facebook */}
        <meta property='og:type' content='website' />
        <meta property='og:url' content={siteUrl} />
        <meta property='og:title' content={t("common:seo.title") as string} />
        <meta property='og:description' content={t("common:seo.description") as string} />
        <meta property='og:image' content={ogImageUrl} />

        {/* Twitter */}
        <meta name='twitter:card' content='summary_large_image' />
        <meta name='twitter:url' content={siteUrl} />
        <meta name='twitter:title' content={t("common:seo.title") as string} />
        <meta name='twitter:description' content={t("common:seo.description") as string} />
        <meta name='twitter:image' content={ogImageUrl} />

        <link rel='canonical' href={siteUrl} />

        {/* Structured Data */}
        <script
          type='application/ld+json'
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "Riff Quest",
              "url": siteUrl,
              "description": t("common:seo.description") as string,
            }),
          }}
        />


        <script
          type='application/ld+json'
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "Riff Quest",
              "url": siteUrl,
              "logo": `${siteUrl}/favicon/apple-touch-icon.png`,
            }),
          }}
        />
        <script
          type='application/ld+json'
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "mainEntity": faqQuestions.map((q) => ({
                "@type": "Question",
                "name": q.title,
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": q.message,
                },
              })),
            }),
          }}
        />
      </Head>

      <main className='min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-cyan-500/30'>
        <HeroSection />
        <FeaturesSection />
        <PricingSection />
        <FaqSection questions={faqQuestions} />
        <Footer />
      </main>
    </>
  );
};

export default LandingPage;

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(
        locale ?? "pl",
        ["common", "profile"],
        nextI18nextConfig
      )),
    },
  };
}
