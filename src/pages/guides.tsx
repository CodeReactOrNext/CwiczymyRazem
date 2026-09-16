import { GuitarPatternBackground } from "components/GuitarPatternBackground/GuitarPatternBackground";
import { MarketingNav } from "components/MarketingNav/MarketingNav";
import { seoLandingConfigs } from "feature/seoLanding/content";
import { collectExerciseIds } from "feature/seoLanding/lib/collectExerciseIds";
import { ArrowRight, ChevronRight } from "lucide-react";
import type { GetStaticProps, NextPage } from "next";
import dynamic from "next/dynamic";
import Head from "next/head";
import Link from "next/link";

const Footer = dynamic(() =>
  import("feature/landing/components/Footer").then((m) => m.Footer),
);

const SITE_URL = "https://riff.quest";
const CANONICAL = `${SITE_URL}/guides`;

/**
 * Reading order, not config order: the five guides form a progression, and the
 * hub is the only place a reader sees them side by side.
 */
const ORDER = [
  "beginner-guitar-exercises",
  "daily-guitar-practice-plan",
  "guitar-scale-practice-routine",
  "guitar-speed-hand-synchronization-exercises",
  "intermediate-guitar-practice-routine",
];

/** Who each guide is written for — the one thing the configs do not carry. */
const LEVEL: Record<string, string> = {
  "beginner-guitar-exercises": "Beginner",
  "daily-guitar-practice-plan": "All levels",
  "guitar-scale-practice-routine": "Beginner to intermediate",
  "guitar-speed-hand-synchronization-exercises": "Intermediate",
  "intermediate-guitar-practice-routine": "Intermediate to advanced",
};

interface GuideCard {
  slug: string;
  title: string;
  description: string;
  level: string;
  drillCount: number;
  updatedAt: string;
}

interface GuidesPageProps {
  guides: GuideCard[];
}

const TITLE = "Guitar Practice Guides: Routines, Drills and Session Plans";
/** SERP title — kept under 60 chars with the brand appended, like the guides themselves. */
const META_TITLE = "Guitar Practice Guides: Routines & Drills | Riff Quest";
const DESCRIPTION =
  "Five free guitar practice guides — beginner drills, a daily plan, scale and speed routines, and an intermediate session. Every exercise playable in the browser.";

const GuidesPage: NextPage<GuidesPageProps> = ({ guides }) => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: TITLE,
        description: DESCRIPTION,
        url: CANONICAL,
        isPartOf: { "@type": "WebSite", url: SITE_URL, name: "Riff Quest" },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
          {
            "@type": "ListItem",
            position: 2,
            name: "Practice guides",
            item: CANONICAL,
          },
        ],
      },
      {
        "@type": "ItemList",
        name: "Guitar practice guides",
        numberOfItems: guides.length,
        itemListElement: guides.map((guide, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: guide.title,
          url: `${SITE_URL}/${guide.slug}`,
        })),
      },
    ],
  };

  const totalDrills = guides.reduce((sum, guide) => sum + guide.drillCount, 0);

  return (
    <>
      <Head>
        <title>{META_TITLE}</title>
        <meta name='description' content={DESCRIPTION} />
        <meta property='og:type' content='website' />
        <meta property='og:title' content={TITLE} />
        <meta property='og:description' content={DESCRIPTION} />
        <meta property='og:url' content={CANONICAL} />
        <meta property='og:image' content={`${SITE_URL}/images/og-image.png`} />
        <meta name='twitter:card' content='summary_large_image' />
        <meta name='twitter:title' content={TITLE} />
        <meta name='twitter:description' content={DESCRIPTION} />
        <link rel='canonical' href={CANONICAL} />
        <script
          type='application/ld+json'
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </Head>

      <main className='min-h-screen overflow-x-hidden bg-zinc-950 text-zinc-300'>
        <MarketingNav current='/guides' />

        <div className='relative overflow-hidden'>
          <div className='pointer-events-none absolute -top-48 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-[140px]' />
          <GuitarPatternBackground opacity={0.02} />

          <div className='relative mx-auto max-w-7xl px-6 pb-16 pt-24'>
            <div className='mb-8 flex items-center gap-2 text-xs tracking-widest text-zinc-500'>
              <Link href='/' className='transition-colors hover:text-zinc-300'>
                Home
              </Link>
              <ChevronRight className='h-3 w-3' aria-hidden='true' />
              <span className='text-zinc-400'>Practice guides</span>
            </div>

            <h1 className='max-w-3xl text-4xl font-bold leading-tight text-white sm:text-5xl'>
              Guitar practice guides
            </h1>
            <p className='mt-6 max-w-2xl text-lg leading-relaxed text-zinc-400'>
              Five routines that cover the whole arc of a practice habit: what to
              play on day one, how to fill a session, and the drills that move
              speed, scales and technique. {totalDrills} exercises across the set,
              every one of them playable in the browser with your guitar plugged
              in or a microphone open.
            </p>
          </div>
        </div>

        <section className='mx-auto max-w-7xl px-6 pb-16'>
          <div className='grid gap-6 sm:grid-cols-2'>
            {guides.map((guide) => (
              <Link key={guide.slug} href={`/${guide.slug}`}>
                <article className='group h-full cursor-pointer rounded-lg bg-zinc-900/40 p-7 transition-colors hover:bg-zinc-900/60'>
                  <div className='mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500'>
                    <span className='font-semibold text-cyan-400'>
                      {guide.level}
                    </span>
                    {guide.drillCount > 0 && (
                      <span>{guide.drillCount} exercises</span>
                    )}
                  </div>
                  <h2 className='mb-3 text-xl font-bold leading-snug text-white transition-colors group-hover:text-cyan-400'>
                    {guide.title}
                  </h2>
                  <p className='mb-5 text-sm leading-relaxed text-zinc-400'>
                    {guide.description}
                  </p>
                  <span className='inline-flex items-center gap-1 text-xs font-semibold text-cyan-400'>
                    Read the guide
                    <ArrowRight className='h-3 w-3' aria-hidden='true' />
                  </span>
                </article>
              </Link>
            ))}
          </div>
        </section>

        <section className='mx-auto max-w-7xl px-6 pb-24'>
          <h2 className='mb-8 text-2xl font-bold text-white'>Keep reading</h2>
          <div className='grid gap-6 sm:grid-cols-2'>
            <Link href='/song-library'>
              <div className='group h-full cursor-pointer rounded-lg bg-zinc-900/40 p-7 transition-colors hover:bg-zinc-900/60'>
                <h3 className='mb-3 text-lg font-bold text-white transition-colors group-hover:text-cyan-400'>
                  Song library
                </h3>
                <p className='mb-5 text-sm leading-relaxed text-zinc-400'>
                  Songs ranked by difficulty from community ratings, with
                  written guides for the ones people ask about most — what each
                  riff demands before you attempt it.
                </p>
                <span className='inline-flex items-center gap-1 text-xs font-semibold text-cyan-400'>
                  Browse the library
                  <ArrowRight className='h-3 w-3' aria-hidden='true' />
                </span>
              </div>
            </Link>
            <Link href='/blog'>
              <div className='group h-full cursor-pointer rounded-lg bg-zinc-900/40 p-7 transition-colors hover:bg-zinc-900/60'>
                <h3 className='mb-3 text-lg font-bold text-white transition-colors group-hover:text-cyan-400'>
                  Blog
                </h3>
                <p className='mb-5 text-sm leading-relaxed text-zinc-400'>
                  Longer pieces on how practice actually works: how much time a
                  session needs, what to track, and how to pick songs that match
                  where you are.
                </p>
                <span className='inline-flex items-center gap-1 text-xs font-semibold text-cyan-400'>
                  Read the blog
                  <ArrowRight className='h-3 w-3' aria-hidden='true' />
                </span>
              </div>
            </Link>
          </div>
        </section>

        <Footer />
      </main>
    </>
  );
};

export const getStaticProps: GetStaticProps<GuidesPageProps> = async () => {
  const bySlug = new Map(
    seoLandingConfigs.map((config) => [config.slug, config]),
  );

  // Fail the build on a slug that no longer exists rather than quietly
  // dropping a card — the hub is the only header-level link these pages get.
  const guides = ORDER.map((slug) => {
    const config = bySlug.get(slug);
    if (!config) {
      throw new Error(`/guides lists unknown landing slug "${slug}"`);
    }
    return {
      slug: config.slug,
      title: config.title,
      description: config.metaDescription,
      level: LEVEL[slug] ?? "All levels",
      drillCount: collectExerciseIds(config).length,
      updatedAt: config.updatedAt,
    };
  });

  if (guides.length !== seoLandingConfigs.length) {
    throw new Error(
      `/guides lists ${guides.length} of ${seoLandingConfigs.length} landing pages`,
    );
  }

  return { props: { guides } };
};

export default GuidesPage;
