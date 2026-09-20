import { AuroraGlowFrame } from "components/AuroraGlowFrame/AuroraGlowFrame";
import { GuitarPatternBackground } from "components/GuitarPatternBackground/GuitarPatternBackground";
import { MarketingNav } from "components/MarketingNav/MarketingNav";
import type {
  DifficultyLevel,
  ExerciseCategory,
} from "feature/exercisePlan/types/exercise.types";
import { FaqSection } from "feature/landing/components/FaqSection";
import { Reveal } from "feature/landing/components/Reveal";
import {
  type PlannerTarget,
  PRACTICE_PLANNER_EXAMPLE,
  PRACTICE_PLANNER_EXAMPLE_ANCHOR,
  PRACTICE_PLANNER_FAQS,
  PRACTICE_PLANNER_META,
  PRACTICE_PLANNER_ROUTES,
} from "feature/landing/data/practicePlanner";
import { jakartaLanding } from "feature/landing/lib/fonts";
import { trackPlannerCtaClicked } from "feature/landing/lib/plannerAnalytics";
import type {
  GuitarPracticePlannerPageProps,
  PlannerExampleBlock,
} from "feature/landing/lib/practicePlannerProps";
import type { SignupCtaLocation } from "lib/signupFunnel";
import {
  ArrowDown,
  ArrowRight,
  ChevronRight,
  Clock,
  ListChecks,
} from "lucide-react";
import dynamic from "next/dynamic";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

export type { GuitarPracticePlannerPageProps } from "feature/landing/lib/practicePlannerProps";

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

const IMAGES = "/images/practice-planner";

const CATEGORY_LABEL: Record<ExerciseCategory | "mixed", string> = {
  technique: "Technique",
  theory: "Theory",
  creativity: "Creativity",
  hearing: "Hearing",
  mixed: "Mixed",
};

const DIFFICULTY_LABEL: Record<DifficultyLevel, string> = {
  beginner: "Beginner",
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

/** Same hue per category as the app's plan cards, so the timeline reads as
 *  the product's own colour coding rather than a marketing palette. */
const CATEGORY_TONE: Record<
  ExerciseCategory | "mixed",
  { bar: string; text: string }
> = {
  technique: { bar: "bg-blue-500/60", text: "text-blue-400" },
  theory: { bar: "bg-emerald-500/60", text: "text-emerald-400" },
  creativity: { bar: "bg-purple-500/60", text: "text-purple-400" },
  hearing: { bar: "bg-amber-500/60", text: "text-amber-400" },
  mixed: { bar: "bg-zinc-500/60", text: "text-zinc-300" },
};

const formatClock = (minutes: number) =>
  `${String(minutes).padStart(2, "0")}:00`;

const primaryButton =
  "inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-6 py-3 text-sm font-bold text-zinc-950 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-300 hover:bg-cyan-400";
const secondaryButton =
  "inline-flex items-center gap-2 rounded-lg bg-zinc-800/60 px-6 py-3 text-sm font-semibold text-zinc-200 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-500 hover:bg-zinc-800";
const textLink =
  "inline-flex items-center gap-1.5 text-sm font-bold text-cyan-400 transition-colors hover:text-cyan-300";

const ProductLink = ({
  target,
  location,
  className,
  children,
}: {
  target: Exclude<PlannerTarget, "example">;
  location: SignupCtaLocation;
  className: string;
  children: ReactNode;
}) => (
  <Link
    href={PRACTICE_PLANNER_ROUTES[target].href}
    onClick={() => trackPlannerCtaClicked(target, location)}
    className={className}>
    {children}
  </Link>
);

/** A screenshot that opens at full size in a new tab, so a phone reader can
 *  zoom into the labels instead of squinting at a 360px-wide panel. */
const Screenshot = ({
  src,
  alt,
  width,
  height,
  sizes,
  className,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  sizes: string;
  className?: string;
}) => (
  <a
    href={src}
    target='_blank'
    rel='noopener'
    aria-label={`${alt} (opens full size)`}
    className='block rounded-lg focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-300'>
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      sizes={sizes}
      className={`h-auto w-full rounded-lg ${className ?? ""}`}
    />
  </a>
);

const SectionIntro = ({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children?: ReactNode;
}) => (
  <Reveal className='mb-12 max-w-2xl'>
    <p className='mb-2 text-sm font-bold text-cyan-400'>{eyebrow}</p>
    <h2 className='mb-5 font-landingHeading text-3xl font-bold tracking-tight text-white sm:text-4xl'>
      {title}
    </h2>
    {children && (
      <p className='text-lg leading-relaxed text-zinc-400'>{children}</p>
    )}
  </Reveal>
);

const ExampleTimeline = ({ blocks }: { blocks: PlannerExampleBlock[] }) => (
  <div>
    {/* Proportional bar: 3/5/4/8 minutes of 20. Hidden on phones, where the
        ordered list below carries the same information vertically. */}
    <div
      className='mb-8 hidden gap-1 sm:flex'
      role='img'
      aria-label={`Timeline of the ${PRACTICE_PLANNER_EXAMPLE.totalMinutes}-minute example session`}>
      {blocks.map((block) => (
        <div
          key={block.exerciseId}
          style={{ flexGrow: block.minutes }}
          className='min-w-0'>
          <div
            className={`h-2 rounded-full ${CATEGORY_TONE[block.category].bar}`}
          />
          <div className='mt-2 flex items-baseline justify-between gap-2 text-xs'>
            <span className='font-teko text-lg leading-none text-zinc-400'>
              {formatClock(block.startsAt)}
            </span>
            <span className='truncate text-zinc-500'>{block.goal}</span>
          </div>
        </div>
      ))}
    </div>

    <ol className='space-y-2'>
      {blocks.map((block, idx) => (
        <li
          key={block.exerciseId}
          className='grid gap-3 rounded-lg bg-zinc-900/40 p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start'>
          <div className='flex gap-4'>
            <span className='w-7 shrink-0 font-teko text-[26px] font-medium leading-none text-zinc-600'>
              {String(idx + 1).padStart(2, "0")}
            </span>
            <div className='min-w-0'>
              <h3 className='font-semibold text-white'>{block.title}</h3>
              <p className='mt-1 text-sm leading-relaxed text-zinc-400'>
                {block.description}
              </p>
              <p
                className={`mt-2 text-xs font-semibold ${CATEGORY_TONE[block.category].text}`}>
                {block.goal}
              </p>
            </div>
          </div>
          <div className='flex items-center gap-3 pl-11 text-sm sm:flex-col sm:items-end sm:gap-1 sm:pl-0'>
            <span className='font-teko text-2xl leading-none text-white'>
              {block.minutes} min
            </span>
            <span className='text-xs tabular-nums text-zinc-500'>
              {formatClock(block.startsAt)}–
              {formatClock(block.startsAt + block.minutes)}
            </span>
          </div>
        </li>
      ))}
    </ol>
  </div>
);

export const GuitarPracticePlannerPage = ({
  routines,
  exampleBlocks,
}: GuitarPracticePlannerPageProps) => {
  const meta = PRACTICE_PLANNER_META;
  const canonical = `https://riff.quest/${meta.slug}`;
  const ogImage = `https://riff.quest${meta.ogImage}`;
  const exampleHref = `#${PRACTICE_PLANNER_EXAMPLE_ANCHOR}`;

  // WebPage + breadcrumbs only. No FAQPage: the three questions are product
  // objections, not a rich-result play, and no Article: this is not one.
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
            name: "Guitar practice planner",
            item: canonical,
          },
        ],
      },
    ],
  };

  const ways: {
    target: Exclude<PlannerTarget, "example">;
    title: string;
    text: string;
    cta: string;
    image: { src: string; alt: string; width: number; height: number };
  }[] = [
    {
      target: "routines",
      title: "Start with a routine",
      text: "Browse ready-made sessions and choose a focus before you start.",
      cta: "Explore routines",
      image: {
        src: `${IMAGES}/ready-made-routines.webp`,
        alt: "Ready-made guitar practice routines in Riff Quest",
        width: 992,
        height: 656,
      },
    },
    {
      target: "builder",
      title: "Make it your own",
      text: "Choose your exercises, give each one a time slot, and put them in the order you want.",
      cta: "Build a custom plan",
      image: {
        src: `${IMAGES}/custom-plan-order.webp`,
        alt: "Four guitar exercises arranged into a 20-minute custom plan",
        width: 992,
        height: 656,
      },
    },
    {
      target: "autoPlan",
      title: "Let Auto Plan assemble it",
      text: "Choose a session length and filter by practice category and difficulty. Review the result before you play.",
      cta: "Open Auto Plan",
      image: {
        src: `${IMAGES}/auto-plan-settings.webp`,
        alt: "Auto Plan duration and category difficulty filters",
        width: 992,
        height: 656,
      },
    },
  ];

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
        className={`${jakartaLanding.variable} min-h-screen overflow-x-hidden bg-zinc-950 text-zinc-300`}>
        <MarketingNav />

        {/* ── Hero ── */}
        <section className='relative overflow-hidden'>
          <div className='pointer-events-none absolute -top-48 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-[140px]' />
          <GuitarPatternBackground opacity={0.02} />

          <div className='relative mx-auto max-w-7xl px-6 pb-20 pt-24'>
            <div className='mb-8 flex items-center gap-2 text-xs tracking-widest text-zinc-500'>
              <Link href='/' className='transition-colors hover:text-zinc-300'>
                Home
              </Link>
              <ChevronRight className='h-3 w-3' aria-hidden='true' />
              <span className='text-zinc-400'>Guitar practice planner</span>
            </div>

            <div className='grid gap-12 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:items-center'>
              <header>
                <p className='mb-3 text-sm font-bold text-cyan-400'>
                  {meta.eyebrow}
                </p>
                <h1 className='mb-6 text-balance font-landingHeading text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl'>
                  {meta.title}
                </h1>
                <p className='text-lg leading-relaxed text-zinc-400'>
                  Choose a ready-made routine, build your own sequence, or let
                  Auto Plan assemble a session. Set your focus, arrange your
                  exercises, and start playing.
                </p>

                <div className='mt-10 flex flex-col items-start gap-3 sm:flex-row sm:items-center'>
                  <ProductLink
                    target='builder'
                    location='feature_hero'
                    className={primaryButton}>
                    Build your practice plan
                    <ArrowRight className='h-4 w-4' aria-hidden='true' />
                  </ProductLink>
                  <a
                    href={exampleHref}
                    onClick={() =>
                      trackPlannerCtaClicked("example", "feature_hero")
                    }
                    className={secondaryButton}>
                    See a 20-minute example
                    <ArrowDown className='h-4 w-4' aria-hidden='true' />
                  </a>
                </div>
                <ProductLink
                  target='routines'
                  location='feature_hero'
                  className={`mt-6 ${textLink}`}>
                  Browse ready-made routines
                  <ArrowRight className='h-3.5 w-3.5' aria-hidden='true' />
                </ProductLink>
              </header>

              <div>
                <AuroraGlowFrame>
                  <div className='rounded-lg p-1.5 glass-card'>
                    <Image
                      src={`${IMAGES}/custom-plan-order.webp`}
                      alt='Four guitar exercises arranged into a 20-minute custom plan: Spider — One String, Legato — Hammer-on Pentatonic, Play by Ear — Easy and Phrasing — Two Notes Per Bar, with their minutes'
                      width={992}
                      height={656}
                      priority
                      sizes='(min-width: 1024px) 760px, 100vw'
                      className='h-auto w-full rounded-lg'
                    />
                  </div>
                </AuroraGlowFrame>
                <ol className='mt-6 flex flex-wrap items-center gap-x-8 gap-y-3 px-2'>
                  {["Choose", "Arrange", "Play"].map((step, idx) => (
                    <li key={step} className='flex items-center gap-3'>
                      <span className='font-teko text-2xl leading-none text-cyan-400'>
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                      <span className='text-sm font-semibold text-zinc-200'>
                        {step}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </section>

        {/* ── Three ways to plan ── */}
        <section className='py-20'>
          <div className='mx-auto max-w-7xl px-6'>
            <SectionIntro
              eyebrow='Three paths'
              title='Three ways to plan your practice'
            />
            <Reveal delay={0.05}>
              <div className='grid gap-6 lg:grid-cols-3'>
                {ways.map((way) => (
                  <div
                    key={way.target}
                    className='flex flex-col rounded-lg bg-zinc-900/40 p-4 sm:p-5'>
                    <Screenshot
                      src={way.image.src}
                      alt={way.image.alt}
                      width={way.image.width}
                      height={way.image.height}
                      sizes='(min-width: 1024px) 380px, 100vw'
                    />
                    <div className='flex flex-1 flex-col px-1 pb-2 pt-6'>
                      <h3 className='text-lg font-semibold text-white'>
                        {way.title}
                      </h3>
                      <p className='mt-2 flex-1 text-sm leading-relaxed text-zinc-400'>
                        {way.text}
                      </p>
                      <ProductLink
                        target={way.target}
                        location='feature_card'
                        className={`mt-6 ${textLink}`}>
                        {way.cta}
                        <ArrowRight
                          className='h-3.5 w-3.5'
                          aria-hidden='true'
                        />
                      </ProductLink>
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── Ready-made routines ── */}
        <section className='py-20'>
          <div className='mx-auto max-w-7xl px-6'>
            <SectionIntro
              eyebrow='Ready-made routines'
              title='Pick a starting point and get playing'>
              The routine library is sorted into Featured, Playalongs, My Plans
              and Community, with a category filter on top. Every card says how
              long it takes and how many exercises are inside.
            </SectionIntro>

            <div className='grid gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-start'>
              <Reveal delay={0.05}>
                <Screenshot
                  src={`${IMAGES}/ready-made-routines.webp`}
                  alt='Ready-made guitar practice routines in Riff Quest: the Featured tab with the category filter and three beginner cards'
                  width={992}
                  height={656}
                  sizes='(min-width: 1024px) 700px, 100vw'
                />
              </Reveal>

              <Reveal delay={0.1} className='flex flex-col gap-6'>
                <ul className='space-y-2'>
                  {routines.map((routine) => (
                    <li
                      key={routine.id}
                      className='rounded-lg bg-zinc-900/40 p-5'>
                      <div className='mb-1 flex flex-wrap gap-x-3 text-xs font-semibold'>
                        <span className={CATEGORY_TONE[routine.category].text}>
                          {CATEGORY_LABEL[routine.category]}
                        </span>
                        <span className='text-zinc-500'>
                          {DIFFICULTY_LABEL[routine.difficulty]}
                        </span>
                      </div>
                      <h3 className='font-semibold text-white'>
                        {routine.title}
                      </h3>
                      <div className='mt-3 flex items-center gap-5 text-sm text-zinc-400'>
                        <span className='inline-flex items-center gap-1.5'>
                          <Clock className='h-3.5 w-3.5' aria-hidden='true' />
                          {routine.minutes} min
                        </span>
                        <span className='inline-flex items-center gap-1.5'>
                          <ListChecks
                            className='h-3.5 w-3.5'
                            aria-hidden='true'
                          />
                          {routine.exerciseCount} exercises
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
                <ProductLink
                  target='routines'
                  location='feature_demo'
                  className={secondaryButton}>
                  Explore all routines
                  <ArrowRight className='h-4 w-4' aria-hidden='true' />
                </ProductLink>
              </Reveal>
            </div>

            <Reveal delay={0.1} className='mt-14'>
              <div className='grid gap-6 rounded-lg bg-zinc-900/40 p-4 sm:p-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-center'>
                <Screenshot
                  src={`${IMAGES}/routine-session.webp`}
                  alt='First exercise in an ordered guitar practice routine, with the session progress bar showing step 1 of 4'
                  width={1280}
                  height={720}
                  sizes='(min-width: 1024px) 700px, 100vw'
                />
                <p className='px-2 leading-relaxed text-zinc-400'>
                  A ready-made routine opens as an ordered practice session. The
                  progress bar at the top counts the exercises, the timer runs
                  each block, and Next moves you on when the block is done.
                </p>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── 20-minute example ── */}
        <section
          id={PRACTICE_PLANNER_EXAMPLE_ANCHOR}
          className='scroll-mt-24 bg-zinc-900/30 py-20'>
          <div className='mx-auto max-w-7xl px-6'>
            <SectionIntro
              eyebrow='Custom plan'
              title='See a 20-minute session take shape'>
              Here&rsquo;s one example built in the custom planner. Change the
              exercises, timing, and order to fit your own session.
            </SectionIntro>

            <div className='grid gap-12 lg:grid-cols-[minmax(0,6fr)_minmax(0,6fr)] lg:items-start'>
              <Reveal delay={0.05}>
                <div className='mb-6 flex flex-wrap items-baseline gap-x-4 gap-y-1'>
                  <h3 className='text-2xl font-bold tracking-tight text-white'>
                    {PRACTICE_PLANNER_EXAMPLE.name}
                  </h3>
                  <span className='text-sm text-zinc-500'>
                    Mixed · Easy · {PRACTICE_PLANNER_EXAMPLE.totalMinutes} min ·{" "}
                    {exampleBlocks.length} exercises
                  </span>
                </div>
                <ExampleTimeline blocks={exampleBlocks} />
                <p className='mt-6 text-sm leading-relaxed text-zinc-500'>
                  The minutes were set by hand in the wizard, not taken from the
                  library defaults, and they cover the exercise blocks only. It
                  shows how the planner works, not a programme to follow.
                </p>
              </Reveal>

              <Reveal delay={0.1} className='flex flex-col gap-6'>
                <Screenshot
                  src={`${IMAGES}/custom-plan-order.webp`}
                  alt='Order step of the custom plan wizard: four exercises with their minutes and categories, ready to drag into order'
                  width={992}
                  height={656}
                  sizes='(min-width: 1024px) 600px, 100vw'
                />
                <ul className='grid gap-4 sm:grid-cols-3'>
                  {[
                    {
                      title: "Choose exercises",
                      text: "From the library, the community, your own exercises or songs.",
                    },
                    {
                      title: "Set each duration",
                      text: "Every block gets its own minutes; the card sums them up.",
                    },
                    {
                      title: "Arrange the order",
                      text: "Drag to reorder. Warm-up first, the hardest block last.",
                    },
                  ].map((callout, idx) => (
                    <li key={callout.title} className='flex gap-3'>
                      <span className='font-teko text-2xl leading-none text-cyan-400'>
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                      <div>
                        <h4 className='text-sm font-semibold text-white'>
                          {callout.title}
                        </h4>
                        <p className='mt-1 text-xs leading-relaxed text-zinc-400'>
                          {callout.text}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className='grid gap-5 rounded-lg bg-zinc-900/40 p-4 sm:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] sm:items-center sm:p-5'>
                  <Screenshot
                    src={`${IMAGES}/custom-plan-card.webp`}
                    alt='Custom plan details showing 20 minutes and four exercises'
                    width={436}
                    height={226}
                    sizes='(min-width: 640px) 260px, 100vw'
                  />
                  <p className='text-sm leading-relaxed text-zinc-400'>
                    The last step names the plan and picks its card. The card
                    then shows the total and the exercise count in your My Plans
                    tab.
                  </p>
                </div>
                <div>
                  <ProductLink
                    target='builder'
                    location='feature_demo'
                    className={primaryButton}>
                    Build your own 20-minute plan
                    <ArrowRight className='h-4 w-4' aria-hidden='true' />
                  </ProductLink>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ── Auto Plan ── */}
        <section className='py-20'>
          <div className='mx-auto max-w-7xl px-6'>
            <SectionIntro
              eyebrow='Auto Plan'
              title='Choose the boundaries. Review the plan.'>
              Select a duration, choose your categories and difficulty, then
              review the generated exercises. Swap an exercise or change the
              order before starting.
            </SectionIntro>

            <Reveal delay={0.05}>
              <ol className='grid gap-6 lg:grid-cols-2'>
                {[
                  {
                    title: "Settings",
                    src: `${IMAGES}/auto-plan-settings.webp`,
                    alt: "Auto Plan duration and category difficulty filters: 30 minutes selected, Easy ticked for Technique, Theory, Creativity and Hearing",
                    height: 656,
                    text: "Pick a length from 15 minutes to 2 hours, then tick a difficulty per category. The counter shows how many exercises match before you generate.",
                  },
                  {
                    title: "Generated plan",
                    src: `${IMAGES}/generated-auto-plan.webp`,
                    alt: "Generated guitar practice plan with exercise controls: Plan 30 minutes, Regenerate and Start buttons, and the first exercise Strumming 10 — Upstroke Run",
                    height: 516,
                    text: "Every exercise has its own controls: details, swap for another, move up or down, remove. Regenerate rolls the whole plan again.",
                  },
                ].map((step, idx) => (
                  <li
                    key={step.title}
                    className='flex flex-col gap-5 rounded-lg bg-zinc-900/40 p-4 sm:p-5'>
                    <div className='flex items-center gap-3 px-1'>
                      <span className='font-teko text-2xl leading-none text-cyan-400'>
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                      <h3 className='font-semibold text-white'>{step.title}</h3>
                    </div>
                    <div className='[mask-image:linear-gradient(to_bottom,black_82%,transparent)]'>
                      <Screenshot
                        src={step.src}
                        alt={step.alt}
                        width={992}
                        height={step.height}
                        sizes='(min-width: 1024px) 600px, 100vw'
                      />
                    </div>
                    <p className='px-1 text-sm leading-relaxed text-zinc-400'>
                      {step.text}
                    </p>
                  </li>
                ))}
              </ol>
            </Reveal>

            <Reveal delay={0.1} className='mt-8 max-w-3xl'>
              <p className='text-sm leading-relaxed text-zinc-500'>
                Example: a 30-minute target with Easy selected across the four
                practice categories. Generated exercise times may not add up to
                the exact target duration.
              </p>
              <div className='mt-8'>
                <ProductLink
                  target='autoPlan'
                  location='feature_demo'
                  className={primaryButton}>
                  Generate a practice plan
                  <ArrowRight className='h-4 w-4' aria-hidden='true' />
                </ProductLink>
              </div>
            </Reveal>
          </div>
        </section>

        <FaqSection
          questions={PRACTICE_PLANNER_FAQS}
          moreLink={{
            intro:
              "Filters, sharing a plan with the community and what Auto Plan does when nothing fits are covered in the knowledge base:",
            href: "/wiki/exercise-plans-and-auto-plan",
            label: "How routines and Auto Plan work",
          }}
        />

        {/* ── Where next ── */}
        <section className='py-20'>
          <div className='mx-auto max-w-7xl px-6'>
            <Reveal>
              <h2 className='mb-8 text-2xl font-bold text-white'>
                Looking for what to practise, not how to plan it?
              </h2>
              <div className='grid gap-6 sm:grid-cols-3'>
                {[
                  {
                    href: "/daily-guitar-practice-plan",
                    title: "Daily guitar practice plan guide",
                    text: "Complete 15, 30 and 60-minute routines with example exercises and advice on what to play each day.",
                  },
                  {
                    href: "/intermediate-guitar-practice-routine",
                    title: "Intermediate practice routine",
                    text: "A 45-minute programme with a short-session variant and a weekly rotation.",
                  },
                  {
                    href: "/interactive-guitar-practice",
                    title: "Interactive guitar practice",
                    text: "What happens once the session starts: the tab scrolls and every note you hit is marked live.",
                  },
                ].map((card) => (
                  <Link key={card.href} href={card.href}>
                    <div className='group h-full cursor-pointer rounded-lg bg-zinc-900/40 p-6 transition-colors hover:bg-zinc-900/60'>
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
                    </div>
                  </Link>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section className='relative overflow-hidden bg-zinc-950 py-28'>
          <div className='absolute inset-0 z-0 overflow-hidden'>
            <div className='pointer-events-none absolute left-1/2 top-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/10 blur-[140px]' />
            <GuitarPatternBackground opacity={0.02} />
          </div>
          <div className='relative z-10 mx-auto max-w-7xl px-6 lg:px-8'>
            <div className='flex flex-col items-center text-center'>
              <h2 className='mb-8 max-w-3xl font-landingHeading text-4xl font-extrabold leading-tight tracking-[-0.03em] text-white sm:text-5xl lg:text-6xl'>
                Make your next session easy to start.
              </h2>
              <div className='flex flex-col items-center gap-3 sm:flex-row'>
                <ProductLink
                  target='builder'
                  location='feature_final'
                  className={primaryButton}>
                  Build your practice plan
                  <ArrowRight className='h-4 w-4' aria-hidden='true' />
                </ProductLink>
                <ProductLink
                  target='routines'
                  location='feature_final'
                  className={secondaryButton}>
                  Browse routines
                </ProductLink>
              </div>
              <p className='mt-6 text-sm text-zinc-500'>
                Free account, no card. Signed in already? The buttons take you
                straight to the feature.
              </p>
            </div>
          </div>
        </section>

        <Footer />
        <CookieBanner />
      </main>
    </>
  );
};
