import type { HowItWorksStats } from "feature/landing/data/howItWorksStats";
import { getHowItWorksStats } from "feature/landing/data/howItWorksStats";
import { HowItWorksPage } from "feature/landing/HowItWorksPage";
import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";

const HowItWorks: NextPage<{ stats: HowItWorksStats }> = ({ stats }) => {
  return (
    <>
      <Head>
        <title>How It Works – Riff Quest Guitar Practice Tracker</title>
        <meta
          name="description"
          content="See how Riff Quest works in 3 steps: pick what to practice, track your session automatically, and see real progress. Free guitar practice tracker."
        />
        <link rel="canonical" href="https://riff.quest/how-it-works" />
        <meta property="og:title" content="How It Works – Riff Quest Guitar Practice Tracker" />
        <meta
          property="og:description"
          content="Stop guessing. See your progress. Three simple steps, real measurable results."
        />
        <meta property="og:url" content="https://riff.quest/how-it-works" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://riff.quest/images/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="How It Works – Riff Quest Guitar Practice Tracker" />
        <meta
          name="twitter:description"
          content="Stop guessing. See your progress."
        />
        <meta name="twitter:image" content="https://riff.quest/images/og-image.png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "WebPage",
              name: "How Riff Quest Works",
              url: "https://riff.quest/how-it-works",
              isPartOf: { "@type": "WebSite", name: "Riff Quest", url: "https://riff.quest" },
            },
            {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: "https://riff.quest" },
                { "@type": "ListItem", position: 2, name: "How Riff Quest Works", item: "https://riff.quest/how-it-works" },
              ],
            },
          ],
        }),
          }}
        />
      </Head>
      <HowItWorksPage stats={stats} />
    </>
  );
};

export const getStaticProps: GetStaticProps<{
  stats: HowItWorksStats;
}> = async () => ({ props: { stats: getHowItWorksStats() } });

export default HowItWorks;
