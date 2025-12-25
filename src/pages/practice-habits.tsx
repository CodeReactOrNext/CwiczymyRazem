"use client";

import type { NextPage } from "next";
import Head from "next/head";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18nextConfig from "../../next-i18next.config";
import PracticeHabitsView from "feature/practice-habits/PracticeHabitsView";

const PracticeHabitsPage: NextPage = () => {
  const siteUrl = "https://riff.quest/practice-habits";
  const canonicalUrl = siteUrl;
  const title = "How to Build Daily Guitar Practice Habits & Track Progress | Riff Quest";
  const description = "Master daily guitar practice habits with science-backed strategies. Learn progress tracking techniques, habit formation, and practical tips for consistent guitar practice. Start building your routine today.";
  const keywords = "guitar practice habits, daily practice routine, progress tracking, habit formation, guitar skills, consistent practice, practice motivation";

  return (
    <>
      <Head>
        {/* Primary Meta Tags */}
        <title>{title}</title>
        <meta name="title" content={title} />
        <meta name="description" content={description} />
        <meta name="keywords" content={keywords} />
        <meta name="author" content="Riff Quest" />
        <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
        <meta name="language" content="English" />
        <link rel="canonical" href={canonicalUrl} />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="article" />
        <meta property="og:site_name" content="Riff Quest" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content="https://riff.quest/promo.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Riff Quest - Guitar Practice Habit Building Guide" />
        <meta property="og:locale" content="en_US" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@riffquest" />
        <meta name="twitter:creator" content="@riffquest" />
        <meta name="twitter:url" content={canonicalUrl} />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content="https://riff.quest/promo.png" />
        <meta name="twitter:image:alt" content="Riff Quest - Guitar Practice Habit Building Guide" />

        {/* Article Schema */}
        <meta property="article:author" content="Riff Quest Team" />
        <meta property="article:publisher" content="https://riff.quest" />
        <meta property="article:section" content="Guitar Practice" />
        <meta property="article:tag" content="Practice Habits" />
        <meta property="article:tag" content="Progress Tracking" />
        <meta property="article:tag" content="Habit Formation" />
        <meta property="article:tag" content="Guitar Skills" />
        <meta property="article:published_time" content="2025-12-25T00:00:00.000Z" />
        <meta property="article:modified_time" content="2025-12-25T00:00:00.000Z" />

        {/* Additional SEO */}
        <meta name="theme-color" content="#06b6d4" />
        <meta name="msapplication-TileColor" content="#06b6d4" />
        <meta name="application-name" content="Riff Quest" />

        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Article",
              "headline": "How to Build Daily Guitar Practice Habits & Track Progress",
              "description": description,
              "image": "https://riff.quest/promo.png",
              "author": {
                "@type": "Organization",
                "name": "Riff Quest Team",
                "url": "https://riff.quest"
              },
              "publisher": {
                "@type": "Organization",
                "name": "Riff Quest",
                "logo": {
                  "@type": "ImageObject",
                  "url": "https://riff.quest/favicon/apple-touch-icon.png"
                }
              },
              "datePublished": "2025-12-25",
              "dateModified": "2025-12-25",
              "mainEntityOfPage": {
                "@type": "WebPage",
                "@id": canonicalUrl
              },
              "keywords": keywords.split(", "),
              "articleSection": "Guitar Practice",
              "about": [
                {
                  "@type": "Thing",
                  "name": "Guitar Practice Habits"
                },
                {
                  "@type": "Thing",
                  "name": "Progress Tracking"
                },
                {
                  "@type": "Thing",
                  "name": "Habit Formation"
                }
              ]
            })
          }}
        />

        {/* FAQ Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "mainEntity": [
                {
                  "@type": "Question",
                  "name": "Why is building a daily guitar practice habit challenging?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Most guitarists struggle with daily practice because they don't know what to practice, don't see daily progress, life interrupts their routine, or practice feels too overwhelming. The solution is building a habit that's small enough to start, clear enough to repeat, and measurable enough to feel rewarding."
                  }
                },
                {
                  "@type": "Question",
                  "name": "How can I track my guitar practice progress effectively?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Track your daily practice sessions, time spent, and what you practiced. Use tools like Riff Quest to see your consistency patterns and progress over time. Focus on measurable goals like '10 minutes daily for 14 days' rather than vague objectives."
                  }
                },
                {
                  "@type": "Question",
                  "name": "What's the best way to start a daily guitar practice routine?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Start with habit stacking - attach practice to an existing daily routine. Set a minimum practice time (5 minutes) that feels easy to achieve. Use progress tracking to stay motivated and gradually increase your practice time as the habit becomes automatic."
                  }
                }
              ]
            })
          }}
        />

        {/* Breadcrumb Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              "itemListElement": [
                {
                  "@type": "ListItem",
                  "position": 1,
                  "name": "Home",
                  "item": "https://riff.quest"
                },
                {
                  "@type": "ListItem",
                  "position": 2,
                  "name": "Practice Habits",
                  "item": canonicalUrl
                }
              ]
            })
          }}
        />
      </Head>

      <PracticeHabitsView />
    </>
  );
};

export default PracticeHabitsPage;

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(
        locale ?? "en",
        ["common"],
        nextI18nextConfig
      )),
    },
    // Enable ISR for better performance
    revalidate: 86400, // 24 hours
  };
}
