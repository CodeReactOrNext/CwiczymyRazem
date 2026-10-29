import { cn } from "assets/lib/utils";
import { GuitarPatternBackground } from "components/GuitarPatternBackground/GuitarPatternBackground";
import { MarketingNav } from "components/MarketingNav/MarketingNav";
import {
  COMPLETION_FAME_REWARD,
  THANKS_FAME_REWARD,
} from "feature/communityExercises/types";
import { FaqSection } from "feature/landing/components/FaqSection";
import { FeatureList } from "feature/landing/components/FeatureList";
import { BackingSources } from "feature/landing/components/ownMaterial/BackingSources";
import { PublishCard } from "feature/landing/components/ownMaterial/PublishCard";
import { TabPlayback } from "feature/landing/components/ownMaterial/TabPlayback";
import { Reveal } from "feature/landing/components/Reveal";
import {
  OWN_MATERIAL_BACKINGS,
  OWN_MATERIAL_BOARD,
  OWN_MATERIAL_EXERCISE_PARTS,
  OWN_MATERIAL_FACTS,
  OWN_MATERIAL_FAQS,
  OWN_MATERIAL_META,
  OWN_MATERIAL_ROUTES,
  OWN_MATERIAL_SOURCES,
  type OwnMaterialTarget,
} from "feature/landing/data/ownMaterial";
import { jakartaLanding } from "feature/landing/lib/fonts";
import type { OwnMaterialPageProps } from "feature/landing/lib/ownMaterialProps";
import { AUTHORS } from "lib/authors";
import type { SignupCtaLocation } from "lib/signupFunnel";
import { trackSignupCtaClicked } from "lib/signupFunnel";
import { ArrowRight, ChevronRight, Heart, Play } from "lucide-react";
import dynamic from "next/dynamic";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import posthog from "posthog-js";
import type { ReactNode } from "react";

export type { OwnMaterialPageProps } from "feature/landing/lib/ownMaterialProps";

// Below-the-fold chrome loads on its own chunk, same as the other public pages.
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

const IMAGES = "/images/guitar-tab-editor";

export const OWN_MATERIAL_AUTHOR = AUTHORS["Michael Apfel"];

const primaryButton =
  "inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-bold text-zinc-950 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 hover:bg-zinc-200";
const secondaryButton =
  "inline-flex items-center gap-2 rounded-lg bg-zinc-800/60 px-6 py-3 text-sm font-semibold text-zinc-200 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-500 hover:bg-zinc-800";

const trackCta = (target: OwnMaterialTarget, location: SignupCtaLocation) => {
  posthog.capture("own_material_cta_clicked", {
    own_material_target: target,
    cta_location: location,
    from_path: typeof window === "undefined" ? "" : window.location.pathname,
  });
  // The editor opens without an account; the other two go through sign-up.
  if (target !== "editor") {
    trackSignupCtaClicked(location, { feature: "own_material" });
  }
};

const CtaLink = ({
  target,
  location,
  className,
  children,
}: {
  target: OwnMaterialTarget;
  location: SignupCtaLocation;
  className: string;
  children: ReactNode;
}) => (
  <Link
    href={OWN_MATERIAL_ROUTES[target]}
    onClick={() => trackCta(target, location)}
    className={className}>
    {children}
  </Link>
);

/**
 * One chapter of the page's story. The big numeral is the thread: the four
 * chapters read as steps of one job, not four products.
 */
const Chapter = ({
  number,
  eyebrow,
  title,
  children,
  className,
}: {
  number: number;
  eyebrow: string;
  title: string;
  children?: ReactNode;
  className?: string;
}) => (
  <Reveal className={cn("mb-12 max-w-3xl", className)}>
    <span
      aria-hidden
      className='mb-4 block font-teko text-6xl tabular-nums leading-none text-zinc-700'>
      {String(number).padStart(2, "0")}
    </span>
    <div>
      <p className='mb-2 text-sm font-bold text-cyan-400'>{eyebrow}</p>
      <h2 className='mb-5 font-landingHeading text-3xl font-bold tracking-tight text-white sm:text-4xl'>
        {title}
      </h2>
      {children && (
        <p className='text-lg leading-relaxed text-zinc-400'>{children}</p>
      )}
    </div>
  </Reveal>
);

export const OwnMaterialPage = ({ showcase }: OwnMaterialPageProps) => {
  const meta = OWN_MATERIAL_META;
  const author = OWN_MATERIAL_AUTHOR;
  const canonical = `https://riff.quest/${meta.slug}`;
  const ogImage = `https://riff.quest${meta.ogImage}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": canonical,
        url: canonical,
        name: meta.metaTitle,
        description: meta.metaDescription,
        primaryImageOfPage: { "@type": "ImageObject", url: ogImage },
        datePublished: meta.publishedAt,
        dateModified: meta.updatedAt,
        author: {
          "@type": "Person",
          name: author.name,
          description: author.bio,
          image: `https://riff.quest${author.image}`,
        },
        isPartOf: {
          "@type": "WebSite",
          name: "Riff Quest",
          url: "https://riff.quest",
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: "https://riff.quest",
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Tab editor",
            item: canonical,
          },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: OWN_MATERIAL_FAQS.map((faq) => ({
          "@type": "Question",
          name: faq.title,
          acceptedAnswer: { "@type": "Answer", text: faq.message },
        })),
      },
    ],
  };

  return (
    <>
      <Head>
        <title>{meta.metaTitle}</title>
        <meta name='description' content={meta.metaDescription} />
        <link rel='canonical' href={canonical} />
        <meta property='og:title' content={meta.metaTitle} />
        <meta property='og:description' content={meta.metaDescription} />
        <meta property='og:image' content={ogImage} />
        <meta property='og:type' content='website' />
        <meta property='og:url' content={canonical} />
        <meta name='twitter:card' content='summary_large_image' />
        <meta name='twitter:title' content={meta.metaTitle} />
        <meta name='twitter:description' content={meta.metaDescription} />
        <meta name='twitter:image' content={ogImage} />
        <script
          type='application/ld+json'
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </Head>

      <main
        className={`${jakartaLanding.variable} min-h-screen overflow-x-clip bg-zinc-950 text-zinc-300`}>
        <MarketingNav />

        {/* ── Hero ── */}
        <section className='relative overflow-hidden'>
          <GuitarPatternBackground opacity={0.02} />

          <div className='relative mx-auto max-w-7xl px-6 pb-20 pt-24'>
            <div className='mb-8 flex items-center gap-2 text-xs tracking-widest text-zinc-500'>
              <Link href='/' className='transition-colors hover:text-zinc-300'>
                Home
              </Link>
              <ChevronRight className='h-3 w-3' aria-hidden='true' />
              <span className='text-zinc-400'>Tab editor</span>
            </div>

            <div className='grid gap-14 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:items-center'>
              <header>
                <p className='mb-3 text-sm font-bold text-cyan-400'>
                  {meta.eyebrow}
                </p>
                <h1 className='mb-6 text-balance font-landingHeading text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl'>
                  {meta.title}
                </h1>
                <p className='max-w-xl text-lg leading-relaxed text-zinc-400'>
                  Bring a Guitar Pro file or write a riff from scratch. Riff
                  Quest turns it into an exercise with tempo control and note
                  detection, puts a band behind it, and lets other players
                  practise it too if you want them to.
                </p>

                <div className='mt-10 flex flex-col items-start gap-3 sm:flex-row sm:items-center'>
                  <CtaLink
                    target='editor'
                    location='feature_hero'
                    className={primaryButton}>
                    Open the tab editor
                    <ArrowRight className='h-4 w-4' aria-hidden='true' />
                  </CtaLink>
                  <CtaLink
                    target='gpTabs'
                    location='feature_hero'
                    className={secondaryButton}>
                    Upload a Guitar Pro file
                  </CtaLink>
                </div>
                <p className='mt-4 max-w-md text-sm text-zinc-500'>
                  The editor opens without an account. Saving and practising
                  take a free one.
                </p>

                <dl className='mt-12 flex flex-wrap gap-x-10 gap-y-6'>
                  {[
                    {
                      value: `${OWN_MATERIAL_FACTS.exercisesWritten}+`,
                      label: "exercises written by players",
                    },
                    {
                      value: `${OWN_MATERIAL_FACTS.gpFilesUploaded}+`,
                      label: "Guitar Pro files uploaded",
                    },
                  ].map((stat) => (
                    <div key={stat.label}>
                      <dt className='sr-only'>{stat.label}</dt>
                      <dd className='font-teko text-5xl leading-none text-white'>
                        {stat.value}
                      </dd>
                      <dd className='mt-1 text-sm text-zinc-500'>
                        {stat.label}
                      </dd>
                    </div>
                  ))}
                </dl>
              </header>

              <TabPlayback showcase={showcase} />
            </div>
          </div>
        </section>

        {/* ── 01 Bring the music ── */}
        <section className='py-20'>
          <div className='mx-auto max-w-7xl px-6'>
            <Chapter
              number={1}
              eyebrow='Bring the music'
              title='Start from a file, or from nothing'>
              Whatever you want to practise, get it in as notes: a Guitar Pro
              file from your collection, or a tab you write yourself.
            </Chapter>

            <Reveal delay={0.05} className='grid gap-10 md:grid-cols-2'>
              {[OWN_MATERIAL_SOURCES.gp, OWN_MATERIAL_SOURCES.editor].map(
                (source) => (
                  <div key={source.title}>
                    <h3 className='mb-3 text-xl font-bold text-white'>
                      {source.title}
                    </h3>
                    <p className='leading-relaxed text-zinc-400'>
                      {source.text}
                    </p>
                  </div>
                ),
              )}
            </Reveal>

            <Reveal delay={0.1} className='mt-12'>
              <a
                href={`${IMAGES}/tab-editor.webp`}
                target='_blank'
                rel='noopener'
                aria-label='The tab editor, full size (opens in a new tab)'
                className='block rounded-lg bg-zinc-900/60 p-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400'>
                <Image
                  src={`${IMAGES}/tab-editor.webp`}
                  alt='The Riff Quest tab editor with two bars of sixteenth notes: a live preview of the tab on top, the editing grid with all six strings below, and the keyboard shortcuts beside it'
                  width={1600}
                  height={1017}
                  sizes='(min-width: 1280px) 1232px, 100vw'
                  className='h-auto w-full rounded-lg'
                />
              </a>
            </Reveal>
          </div>
        </section>

        {/* ── 02 Make it an exercise ── */}
        <section className='bg-zinc-900/30 py-20'>
          <div className='mx-auto max-w-7xl px-6'>
            <Chapter
              number={2}
              eyebrow='Make it an exercise'
              title='One form, and it practises like the rest'>
              Publish the tab and fill in what a teacher would tell you about
              it. From then on it sits in My Exercises and behaves like any
              exercise in the library.
            </Chapter>
            <div className='grid gap-12 lg:grid-cols-2 lg:items-start lg:gap-16'>
              <Reveal delay={0.05}>
                <FeatureList features={[...OWN_MATERIAL_EXERCISE_PARTS]} />
              </Reveal>
              <Reveal delay={0.1}>
                <PublishCard />
              </Reveal>
            </div>
          </div>
        </section>

        {/* ── 03 Play it with a band ── */}
        <section className='py-20'>
          <div className='mx-auto max-w-7xl px-6'>
            <Chapter
              number={3}
              eyebrow='Play it with a band'
              title='Never practise against silence'>
              A riff over a metronome tells you if you are in time. A riff over
              a band tells you if it sounds right. Which band you get depends on
              what you brought.
            </Chapter>
            <Reveal delay={0.05}>
              <BackingSources
                sources={OWN_MATERIAL_BACKINGS}
                progression={showcase.progression}
                parts={showcase.parts}
              />
            </Reveal>
          </div>
        </section>

        {/* ── 04 Share it ── */}
        <section className='bg-zinc-900/30 py-20'>
          <div className='mx-auto max-w-7xl px-6'>
            <div className='grid gap-12 lg:grid-cols-2 lg:items-start lg:gap-16'>
              <div>
                <Chapter
                  number={4}
                  eyebrow='Share it'
                  title='Someone else probably wants that drill'
                  className='mb-8'>
                  Public exercises go into the community tab, where every player
                  can find them, practise them, rate them and say thanks.
                </Chapter>
                <Reveal delay={0.05}>
                  <ul className='space-y-3 text-sm leading-relaxed text-zinc-400'>
                    <li>
                      <span className='font-semibold text-zinc-200'>
                        {THANKS_FAME_REWARD} Fame
                      </span>{" "}
                      for you each time a player sends thanks.
                    </li>
                    <li>
                      <span className='font-semibold text-zinc-200'>
                        {COMPLETION_FAME_REWARD} Fame
                      </span>{" "}
                      the first time each new player completes it.
                    </li>
                    <li>
                      A play count and a rating, so you can see what landed.
                    </li>
                  </ul>
                </Reveal>
              </div>
              <Reveal delay={0.1}>
                <p className='mb-4 text-sm text-zinc-500'>
                  Most played in the community tab when this page was written
                </p>
                <ul className='space-y-2'>
                  {OWN_MATERIAL_BOARD.map((row) => (
                    <li
                      key={row.title}
                      className='flex items-center justify-between gap-4 rounded-lg bg-zinc-900/60 px-5 py-4'>
                      <span className='min-w-0 font-semibold text-white'>
                        {row.title}
                      </span>
                      <span className='flex shrink-0 items-center gap-4 text-sm tabular-nums text-zinc-400'>
                        <span
                          className='inline-flex items-center gap-1.5'
                          aria-label={`Practised ${row.plays} times`}>
                          <Play className='h-3.5 w-3.5' aria-hidden='true' />
                          {row.plays}
                        </span>
                        <span
                          className='inline-flex items-center gap-1.5 text-amber-400'
                          aria-label={`${row.thanks} thanks`}>
                          <Heart className='h-3.5 w-3.5' aria-hidden='true' />
                          {row.thanks}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
                <p className='mt-4 text-sm text-zinc-500'>
                  {OWN_MATERIAL_FACTS.authors}+ players have written exercises
                  so far.
                </p>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ── Why I built it ── */}
        <section className='py-20'>
          <div className='mx-auto max-w-3xl px-6'>
            <Reveal>
              <p className='mb-2 text-sm font-bold text-cyan-400'>
                Why it exists
              </p>
              <h2 className='mb-8 font-landingHeading text-3xl font-bold tracking-tight text-white sm:text-4xl'>
                The best exercise is usually the one you wrote
              </h2>
              <div className='space-y-5 text-lg leading-relaxed text-zinc-400'>
                <p>
                  Most of what I practise is not in any library: a lick I took
                  off a record, a part from a song one of my bands played, a
                  drill I made up to fix one weak spot. For years those lived in
                  text files and Guitar Pro tabs, and I played them against a
                  metronome or nothing at all.
                </p>
                <p>
                  I wanted them to be first-class exercises, with the same tempo
                  control, the same note detection and the same place in a
                  routine as everything else. And I wanted a band behind them.
                  The generated backing is deliberately plain: it reads your
                  notes, picks chords that fit and stays out of the way.
                </p>
                <p>
                  Then it seemed a waste to keep them to myself. If a drill
                  fixed something for me, it will fix it for somebody else.
                </p>
              </div>
              <div className='mt-10 flex items-center gap-4'>
                <Image
                  src={author.image}
                  alt={author.name}
                  width={56}
                  height={56}
                  className='h-14 w-14 shrink-0 rounded-full object-cover'
                />
                <div>
                  <p className='font-semibold text-white'>{author.name}</p>
                  <p className='text-sm text-zinc-500'>{author.role}</p>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        <FaqSection
          questions={OWN_MATERIAL_FAQS}
          moreLink={{
            intro:
              "What a practice session looks like once your exercise is in it:",
            href: "/interactive-guitar-practice",
            label: "Interactive guitar practice",
          }}
        />

        {/* ── Where next ── */}
        <section className='py-20'>
          <div className='mx-auto max-w-7xl px-6'>
            <Reveal>
              <h2 className='mb-8 text-2xl font-bold text-white'>
                Where your exercise goes next
              </h2>
              <div className='grid gap-6 sm:grid-cols-3'>
                {[
                  {
                    href: "/interactive-guitar-practice",
                    title: "Interactive guitar practice",
                    text: "The session your exercise runs in: the tab scrolls and every note you hit is marked live.",
                  },
                  {
                    href: "/guitar-practice-planner",
                    title: "Guitar practice planner",
                    text: "Put your own exercises into a routine next to library ones, with a set time for each.",
                  },
                  {
                    href: "/features/desktop-guitar-practice-app",
                    title: "Desktop app",
                    text: "Lower-latency input through your interface, and your own audio files as backing tracks.",
                  },
                ].map((card) => (
                  <Link
                    key={card.href}
                    href={card.href}
                    className='group h-full rounded-lg bg-zinc-900/40 p-6 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-500 hover:bg-zinc-900/60'>
                    <h3 className='mb-2 text-lg font-bold text-white transition-colors group-hover:text-cyan-400'>
                      {card.title}
                    </h3>
                    <p className='mb-4 text-sm leading-relaxed text-zinc-400'>
                      {card.text}
                    </p>
                    <span className='inline-flex items-center gap-1 text-xs font-semibold text-cyan-400'>
                      Open
                      <ArrowRight className='h-3 w-3' aria-hidden='true' />
                    </span>
                  </Link>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section className='relative overflow-hidden bg-zinc-950 py-28'>
          <div className='absolute inset-0 z-0 overflow-hidden'>
            <GuitarPatternBackground opacity={0.02} />
          </div>
          <div className='relative z-10 mx-auto max-w-7xl px-6 lg:px-8'>
            <div className='flex flex-col items-center text-center'>
              <h2 className='mb-8 max-w-3xl font-landingHeading text-4xl font-extrabold leading-tight tracking-[-0.03em] text-white sm:text-5xl lg:text-6xl'>
                Write the riff. Then play it with a band.
              </h2>
              <div className='flex flex-col items-center gap-3 sm:flex-row'>
                <CtaLink
                  target='editor'
                  location='feature_final'
                  className={primaryButton}>
                  Open the tab editor
                  <ArrowRight className='h-4 w-4' aria-hidden='true' />
                </CtaLink>
                <CtaLink
                  target='myExercises'
                  location='feature_final'
                  className={secondaryButton}>
                  See my exercises
                </CtaLink>
              </div>
            </div>
          </div>
        </section>

        <Footer />
        <CookieBanner />
      </main>
    </>
  );
};
