import { cn } from "assets/lib/utils";
import { GuitarPatternBackground } from "components/GuitarPatternBackground/GuitarPatternBackground";
import { MarketingNav } from "components/MarketingNav/MarketingNav";
import { raisedTargetBpm } from "feature/exerciseGoals/utils/goalRules";
import { FaqSection } from "feature/landing/components/FaqSection";
import { FeatureList } from "feature/landing/components/FeatureList";
import { ClimbAndKeep } from "feature/landing/components/practiceGoals/ClimbAndKeep";
import { MilestonePlanner } from "feature/landing/components/practiceGoals/MilestonePlanner";
import { Reveal } from "feature/landing/components/Reveal";
import {
  PRACTICE_GOALS_CLIMB,
  PRACTICE_GOALS_FAQS,
  PRACTICE_GOALS_KEEP,
  PRACTICE_GOALS_META,
  PRACTICE_GOALS_NUMBERS,
  PRACTICE_GOALS_ROUTES,
  PRACTICE_GOALS_SHOWCASE,
  type PracticeGoalsTarget,
} from "feature/landing/data/practiceGoals";
import { jakartaLanding } from "feature/landing/lib/fonts";
import type { PracticeGoalsPageProps } from "feature/landing/lib/practiceGoalsProps";
import { AUTHORS } from "lib/authors";
import type { SignupCtaLocation } from "lib/signupFunnel";
import { trackSignupCtaClicked } from "lib/signupFunnel";
import { ArrowRight, ChevronRight } from "lucide-react";
import dynamic from "next/dynamic";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import posthog from "posthog-js";
import type { ReactNode } from "react";

export type { PracticeGoalsPageProps } from "feature/landing/lib/practiceGoalsProps";

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

const IMAGES = "/images/practice-goals";

export const PRACTICE_GOALS_AUTHOR = AUTHORS["Michael Apfel"];

const primaryButton =
  "inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-bold text-zinc-950 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 hover:bg-zinc-200";
const secondaryButton =
  "inline-flex items-center gap-2 rounded-lg bg-zinc-800/60 px-6 py-3 text-sm font-semibold text-zinc-200 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-500 hover:bg-zinc-800";

const trackCta = (target: PracticeGoalsTarget, location: SignupCtaLocation) => {
  posthog.capture("practice_goals_cta_clicked", {
    practice_goals_target: target,
    cta_location: location,
    from_path: typeof window === "undefined" ? "" : window.location.pathname,
  });
  trackSignupCtaClicked(location, { feature: `practice_goals_${target}` });
};

const CtaLink = ({
  target,
  location,
  className,
  children,
}: {
  target: PracticeGoalsTarget;
  location: SignupCtaLocation;
  className: string;
  children: ReactNode;
}) => (
  <Link
    href={PRACTICE_GOALS_ROUTES[target]}
    onClick={() => trackCta(target, location)}
    className={className}>
    {children}
  </Link>
);

/** One chapter of the loop; the numeral is the thread through the page. */
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
    <p className='mb-2 text-sm font-bold text-cyan-400'>{eyebrow}</p>
    <h2 className='mb-5 font-landingHeading text-3xl font-bold tracking-tight text-white sm:text-4xl'>
      {title}
    </h2>
    {children && (
      <p className='text-lg leading-relaxed text-zinc-400'>{children}</p>
    )}
  </Reveal>
);

export const PracticeGoalsPage = ({
  exerciseTitle,
  eligibleCount,
}: PracticeGoalsPageProps) => {
  const meta = PRACTICE_GOALS_META;
  const author = PRACTICE_GOALS_AUTHOR;
  const n = PRACTICE_GOALS_NUMBERS;
  const canonical = `https://riff.quest/${meta.slug}`;
  const ogImage = `https://riff.quest${meta.ogImage}`;
  const exampleTarget = PRACTICE_GOALS_SHOWCASE.targetBpm;

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
            name: "Practice goals",
            item: canonical,
          },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: PRACTICE_GOALS_FAQS.map((faq) => ({
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
              <span className='text-zinc-400'>Practice goals</span>
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
                  Set a tempo goal on an exercise and climb to it in small
                  steps, {n.cleanRuns} clean runs at a time. Then put what you
                  can play into a rotation, and let it tell you what has gone
                  too long without playing.
                </p>

                <div className='mt-10 flex flex-col items-start gap-3 sm:flex-row sm:items-center'>
                  <CtaLink
                    target='goals'
                    location='feature_hero'
                    className={primaryButton}>
                    Set a goal
                    <ArrowRight className='h-4 w-4' aria-hidden='true' />
                  </CtaLink>
                  <CtaLink
                    target='rotation'
                    location='feature_hero'
                    className={secondaryButton}>
                    Start a rotation
                  </CtaLink>
                </div>
                <p className='mt-4 max-w-md text-sm text-zinc-500'>
                  Free with your Riff Quest account. Goals need a microphone;
                  rotation does not.
                </p>

                <dl className='mt-12 flex flex-wrap gap-x-10 gap-y-6'>
                  {[
                    {
                      value: String(eligibleCount),
                      label: "exercises can take a goal",
                    },
                    {
                      value: String(n.cleanRuns),
                      label: "clean runs per milestone",
                    },
                    {
                      value: String(n.maxItems),
                      label: "things in a rotation",
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

              <ClimbAndKeep
                exerciseTitle={exerciseTitle}
                startBpm={PRACTICE_GOALS_SHOWCASE.startBpm}
                targetBpm={exampleTarget}
              />
            </div>
          </div>
        </section>

        {/* ── 01 Climb ── */}
        <section className='py-20'>
          <div className='mx-auto max-w-7xl px-6'>
            <Chapter
              number={1}
              eyebrow='Climb'
              title='A finish line for one exercise'>
              Practising a drill at the same tempo for months is how a plateau
              happens. A goal gives it a top, and a ladder of milestones on the
              way, so every session is aimed at the next rung.
            </Chapter>
            <div className='grid gap-12 lg:grid-cols-2 lg:items-start lg:gap-16'>
              <Reveal delay={0.05}>
                <FeatureList features={[...PRACTICE_GOALS_CLIMB]} />
              </Reveal>
              <Reveal delay={0.1}>
                <MilestonePlanner />
              </Reveal>
            </div>
            <Reveal delay={0.1} className='mt-12'>
              <Image
                src={`${IMAGES}/goal-card.webp`}
                alt='A goal in Riff Quest: Spider One Note Per Beat at milestone 4 of 6, 105 of 115 BPM, two of three clean runs done, with a chart of every scored run climbing towards the dashed goal line'
                width={2182}
                height={756}
                sizes='(min-width: 1280px) 1232px, 100vw'
                className='h-auto w-full rounded-lg'
              />
            </Reveal>
          </div>
        </section>

        {/* ── 02 Keep ── */}
        <section className='bg-zinc-900/30 py-20'>
          <div className='mx-auto max-w-7xl px-6'>
            <Chapter
              number={2}
              eyebrow='Keep'
              title='What you can play, still playable next month'>
              A song you nailed in spring is gone by autumn if nothing reminds
              you to play it. Rotation keeps track of when you last played each
              thing and brings up whatever has sat the longest.
            </Chapter>
            <div className='grid gap-12 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] lg:items-start lg:gap-16'>
              <Reveal delay={0.05}>
                <FeatureList features={[...PRACTICE_GOALS_KEEP]} />
                <p className='mt-8 text-sm leading-relaxed text-zinc-500'>
                  Anything you play counts, wherever you play it: an exercise
                  after {n.minPracticeSeconds} seconds, a song when you log it.
                  An item of your own counts after a session on the free timer,
                  or gets a tick if you leave the timer off.
                </p>
              </Reveal>
              <Reveal delay={0.1} className='mx-auto w-full max-w-md'>
                <Image
                  src={`${IMAGES}/rotation.webp`}
                  alt='A rotation in Riff Quest: Up next with two items to refresh, a Play the 3 stalest button, then two songs and exercises grouped as getting rusty, cooling down and fresh, each with five freshness dots and when it was last played'
                  width={1665}
                  height={2265}
                  sizes='(min-width: 1024px) 448px, 100vw'
                  className='h-auto w-full rounded-lg'
                />
              </Reveal>
            </div>
          </div>
        </section>

        {/* ── 03 The hand-off ── */}
        <section className='py-20'>
          <div className='mx-auto max-w-7xl px-6'>
            <Chapter
              number={3}
              eyebrow='Then'
              title='When the climb is done, choose'>
              Reaching a goal ticks the exercise&apos;s speeds mastered up to
              the goal tempo. After that it is your call.
            </Chapter>
            <Reveal delay={0.05} className='grid gap-4 md:grid-cols-2'>
              <div className='rounded-lg bg-zinc-900/40 p-6'>
                <h3 className='text-xl font-bold text-white'>Raise the bar</h3>
                <p className='mt-2 leading-relaxed text-zinc-400'>
                  A new goal is offered one step above the old one and about 10%
                  faster: reach {exampleTarget} BPM and the next one aims at{" "}
                  {raisedTargetBpm(exampleTarget)}. Change both before you save.
                </p>
              </div>
              <div className='rounded-lg bg-zinc-900/40 p-6'>
                <h3 className='text-xl font-bold text-white'>
                  Or keep it where it is
                </h3>
                <p className='mt-2 leading-relaxed text-zinc-400'>
                  Put the exercise in your rotation. It drains like everything
                  else there and comes back up after {n.rustyDays} days without
                  playing, so the tempo you climbed to does not slip away.
                </p>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── Why I built it ── */}
        <section className='bg-zinc-900/30 py-20'>
          <div className='mx-auto max-w-3xl px-6'>
            <Reveal>
              <p className='mb-2 text-sm font-bold text-cyan-400'>
                Why it exists
              </p>
              <h2 className='mb-8 font-landingHeading text-3xl font-bold tracking-tight text-white sm:text-4xl'>
                Two ways I used to waste practice
              </h2>
              <div className='space-y-5 text-lg leading-relaxed text-zinc-400'>
                <p>
                  The first was playing the same drill at the same tempo for
                  weeks, because nothing told me when it was time to push. A
                  goal fixes that by putting a number at the top and making me
                  earn each step on the way.
                </p>
                <p>
                  The second was the opposite: learning a song properly, then
                  losing it a month later because I moved on and never came
                  back. Rotation is the reminder I needed, a list that quietly
                  shows what is going rusty.
                </p>
                <p>
                  Together they cover both halves of practice: getting better at
                  something, and staying good at what you already have.
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
          questions={PRACTICE_GOALS_FAQS}
          moreLink={{
            intro:
              "Every setting of a goal, step by step, is in the knowledge base:",
            href: "/wiki/exercise-goals",
            label: "Exercise goals",
          }}
        />

        {/* ── Where next ── */}
        <section className='py-20'>
          <div className='mx-auto max-w-7xl px-6'>
            <Reveal>
              <h2 className='mb-8 text-2xl font-bold text-white'>
                Something to climb, something to keep
              </h2>
              <div className='grid gap-6 sm:grid-cols-3'>
                {[
                  {
                    href: "/guitar-speed-hand-synchronization-exercises",
                    title: "Speed and hand sync",
                    text: "The drills that take a tempo goal best, with a method for the climb.",
                  },
                  {
                    href: "/features/guitar-tab-editor",
                    title: "Your own exercises",
                    text: "Write a tab, save it as an exercise, and set a goal on it like any other.",
                  },
                  {
                    href: "/song-library",
                    title: "Song library",
                    text: "Songs to learn now and keep in your rotation later.",
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
                Climb it. Then keep it.
              </h2>
              <div className='flex flex-col items-center gap-3 sm:flex-row'>
                <CtaLink
                  target='goals'
                  location='feature_final'
                  className={primaryButton}>
                  Set a goal
                  <ArrowRight className='h-4 w-4' aria-hidden='true' />
                </CtaLink>
                <CtaLink
                  target='rotation'
                  location='feature_final'
                  className={secondaryButton}>
                  Start a rotation
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
