import { GuitarPatternBackground } from "components/GuitarPatternBackground/GuitarPatternBackground";
import { MarketingNav } from "components/MarketingNav/MarketingNav";
import { FaqSection } from "feature/landing/components/FaqSection";
import { FeatureList } from "feature/landing/components/FeatureList";
import { RoadmapComposer } from "feature/landing/components/playerRoadmaps/RoadmapComposer";
import { RoadmapPipeline } from "feature/landing/components/playerRoadmaps/RoadmapPipeline";
import { RoadmapWalkthrough } from "feature/landing/components/playerRoadmaps/RoadmapWalkthrough";
import { StepAnatomy } from "feature/landing/components/playerRoadmaps/StepAnatomy";
import { Reveal } from "feature/landing/components/Reveal";
import {
  ROADMAP_EXAMPLES,
  ROADMAP_FACTS,
  ROADMAP_STEP_EXAMPLE,
} from "feature/landing/data/playerRoadmapExamples";
import {
  PLAYER_ROADMAPS_CTA_HREF,
  PLAYER_ROADMAPS_EXAMPLE_ANCHOR,
  PLAYER_ROADMAPS_FAQS,
  PLAYER_ROADMAPS_META,
  PLAYER_ROADMAPS_PIPELINE,
  PLAYER_ROADMAPS_PRICES,
  PLAYER_ROADMAPS_STEP_PARTS,
  PLAYER_ROADMAPS_TOKEN_NOTE,
} from "feature/landing/data/playerRoadmaps";
import { jakartaLanding } from "feature/landing/lib/fonts";
import type { PlayerRoadmapsPageProps } from "feature/landing/lib/playerRoadmapsProps";
import { AUTHORS } from "lib/authors";
import type { SignupCtaLocation } from "lib/signupFunnel";
import { trackSignupCtaClicked } from "lib/signupFunnel";
import { ArrowDown, ArrowRight, ChevronRight } from "lucide-react";
import dynamic from "next/dynamic";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import posthog from "posthog-js";
import type { ReactNode } from "react";

export type { PlayerRoadmapsPageProps } from "feature/landing/lib/playerRoadmapsProps";

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

const IMAGES = "/images/player-roadmaps";

/** The roadmap the walkthrough and the step come from. */
const SHOWCASE = ROADMAP_EXAMPLES.find(
  (roadmap) => roadmap.id === ROADMAP_STEP_EXAMPLE.roadmapId,
)!;

export const PLAYER_ROADMAPS_AUTHOR = AUTHORS["Michael Apfel"];

const primaryButton =
  "inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-bold text-zinc-950 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 hover:bg-zinc-200";
const secondaryButton =
  "inline-flex items-center gap-2 rounded-lg bg-zinc-800/60 px-6 py-3 text-sm font-semibold text-zinc-200 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-500 hover:bg-zinc-800";

const trackCta = (target: "build" | "example", location: SignupCtaLocation) => {
  posthog.capture("player_roadmaps_cta_clicked", {
    player_roadmaps_target: target,
    cta_location: location,
    from_path: typeof window === "undefined" ? "" : window.location.pathname,
  });
  if (target === "build") {
    trackSignupCtaClicked(location, { feature: "player_roadmaps" });
  }
};

const BuildLink = ({
  location,
  children,
}: {
  location: SignupCtaLocation;
  children: ReactNode;
}) => (
  <Link
    href={PLAYER_ROADMAPS_CTA_HREF}
    onClick={() => trackCta("build", location)}
    className={primaryButton}>
    {children}
    <ArrowRight className='h-4 w-4' aria-hidden='true' />
  </Link>
);

/** A screenshot that opens at full size in a new tab, so a phone reader can
 *  zoom into the labels instead of squinting at a narrow panel. */
const Screenshot = ({
  src,
  alt,
  width,
  height,
  sizes,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  sizes: string;
}) => (
  <a
    href={src}
    target='_blank'
    rel='noopener'
    aria-label={`${alt} (opens full size)`}
    className='block rounded-lg focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400'>
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      sizes={sizes}
      className='h-auto w-full rounded-lg'
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

export const PlayerRoadmapsPage = ({
  stepExerciseTitle,
}: PlayerRoadmapsPageProps) => {
  const meta = PLAYER_ROADMAPS_META;
  const author = PLAYER_ROADMAPS_AUTHOR;
  const canonical = `https://riff.quest/${meta.slug}`;
  const ogImage = `https://riff.quest${meta.ogImage}`;
  const exampleHref = `#${PLAYER_ROADMAPS_EXAMPLE_ANCHOR}`;
  const stepPhase = SHOWCASE.phases[ROADMAP_STEP_EXAMPLE.phaseIndex];

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
            name: "Guitar roadmap",
            item: canonical,
          },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: PLAYER_ROADMAPS_FAQS.map((faq) => ({
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
              <span className='text-zinc-400'>Guitar roadmap</span>
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
                  Write a paragraph about the guitarist you want to be. Riff
                  Quest turns it into phases and steps, and ties every step to
                  something you can do today: an exercise in the app, a few
                  video lessons picked for that exact step, or a song from the
                  library.
                </p>

                <div className='mt-10 flex flex-col items-start gap-3 sm:flex-row sm:items-center'>
                  <BuildLink location='feature_hero'>
                    Build your roadmap
                  </BuildLink>
                  <a
                    href={exampleHref}
                    onClick={() => trackCta("example", "feature_hero")}
                    className={secondaryButton}>
                    Read a real one
                    <ArrowDown className='h-4 w-4' aria-hidden='true' />
                  </a>
                </div>
                <p className='mt-4 max-w-md text-sm text-zinc-500'>
                  Player Roadmaps open with a donation of any size, for life.
                  Everything else in Riff Quest is free.
                </p>

                <dl className='mt-12 flex flex-wrap gap-x-10 gap-y-6'>
                  {[
                    {
                      value: `${ROADMAP_FACTS.phasesMin}–${ROADMAP_FACTS.phasesMax}`,
                      label: "phases per roadmap",
                    },
                    {
                      value: `${ROADMAP_FACTS.stepsMin}–${ROADMAP_FACTS.stepsMax}`,
                      label: "steps per roadmap",
                    },
                    {
                      value: `${ROADMAP_FACTS.stepsWithLessonsPct}%`,
                      label: "of steps with lessons",
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

              <RoadmapComposer examples={ROADMAP_EXAMPLES} />
            </div>
          </div>
        </section>

        {/* ── How it gets made ── */}
        <section className='py-20'>
          <div className='mx-auto grid max-w-7xl gap-4 px-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-16'>
            <div className='lg:sticky lg:top-24 lg:self-start'>
              <SectionIntro
                eyebrow='How it gets made'
                title='From one paragraph to a plan you can open'>
                A roadmap is not one long answer from a chatbot. It is written
                in stages, each one checking the last, and nothing reaches you
                until every step has something to practise.
              </SectionIntro>
            </div>
            <RoadmapPipeline stages={PLAYER_ROADMAPS_PIPELINE} />
          </div>
        </section>

        {/* ── A real roadmap ── */}
        <section
          id={PLAYER_ROADMAPS_EXAMPLE_ANCHOR}
          className='scroll-mt-16 bg-zinc-900/30 py-20'>
          <div className='mx-auto max-w-7xl px-6'>
            <SectionIntro
              eyebrow='A real roadmap'
              title='Every phase, every step, as a player got it'>
              This is a real public roadmap, word for word: the
              player&apos;s goal first, then the plan it became. Songs are
              marked where they come in.
            </SectionIntro>
            <RoadmapWalkthrough roadmap={SHOWCASE} />
          </div>
        </section>

        {/* ── Inside a step ── */}
        <section className='py-20'>
          <div className='mx-auto max-w-7xl px-6'>
            <div className='grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:items-start'>
              <div className='lg:sticky lg:top-24'>
                <SectionIntro
                  eyebrow='Inside a step'
                  title='Something to play, not something to read about'>
                  Open any step and it tells you what to do with your hands, for
                  how long, and how to know you are done. This one opens phase{" "}
                  {ROADMAP_STEP_EXAMPLE.phaseIndex + 1} of {SHOWCASE.title},
                  unedited.
                </SectionIntro>
                <Reveal delay={0.05}>
                  <FeatureList features={[...PLAYER_ROADMAPS_STEP_PARTS]} />
                </Reveal>
              </div>
              <StepAnatomy
                step={ROADMAP_STEP_EXAMPLE}
                stepCount={stepPhase.steps.length}
                exerciseTitle={stepExerciseTitle}
              />
            </div>
          </div>
        </section>

        {/* ── In the app ── */}
        <section className='bg-zinc-900/30 py-20'>
          <div className='mx-auto max-w-7xl px-6'>
            <SectionIntro
              eyebrow='In the app'
              title='A map you walk, not a list'>
              Phases run down the middle, steps branch off them, and the next
              step to play sits at the top. A step opens in a drawer beside the
              map, so you never lose your place.
            </SectionIntro>
            <Reveal
              delay={0.05}
              className='grid gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,4fr)] lg:items-start'>
              <Screenshot
                src={`${IMAGES}/map.webp`}
                alt={`The ${SHOWCASE.title} roadmap in Riff Quest two steps in: the first two steps of The Hetfield Pulse done, Down-up gallop rotation in progress and offered as Continue, Riff Language next`}
                width={1400}
                height={1431}
                sizes='(min-width: 1024px) 700px, 100vw'
              />
              <Screenshot
                src={`${IMAGES}/step.webp`}
                alt='The step drawer for Down-up gallop rotation: what it is, why it matters, how to practise it, when you have got it, then the Gallop Picking exercise and three video lessons, two of four ticked off'
                width={720}
                height={1679}
                sizes='(min-width: 1024px) 400px, 100vw'
              />
            </Reveal>
          </div>
        </section>

        {/* ── What it costs ── */}
        <section className='py-20'>
          <div className='mx-auto max-w-7xl px-6'>
            <div className='grid gap-12 lg:grid-cols-2 lg:items-start'>
              <SectionIntro
                eyebrow='What it costs, and why'
                title='The one part of Riff Quest that runs on donations'>
                Every roadmap is written by an AI model, and every run costs
                real money. So Player Roadmaps open with a donation of any size,
                once and for life, with no subscription. The donation becomes
                tokens, and tokens pay for the writing.
              </SectionIntro>
              <Reveal delay={0.05}>
                <ul className='space-y-2'>
                  {PLAYER_ROADMAPS_PRICES.map((price) => (
                    <li
                      key={price.label}
                      className='flex items-center justify-between gap-6 rounded-lg bg-zinc-900/60 px-5 py-4'>
                      <div className='min-w-0'>
                        <p className='font-semibold text-white'>
                          {price.label}
                        </p>
                        <p className='text-sm text-zinc-500'>{price.note}</p>
                      </div>
                      <p className='shrink-0 text-right'>
                        {price.tokens > 0 ? (
                          <>
                            <span className='font-teko text-3xl leading-none text-white'>
                              {price.tokens}
                            </span>
                            <span className='ml-1.5 text-sm text-zinc-500'>
                              {price.tokens === 1 ? "token" : "tokens"}
                            </span>
                          </>
                        ) : (
                          <span className='text-sm font-semibold text-emerald-400'>
                            Free
                          </span>
                        )}
                      </p>
                    </li>
                  ))}
                </ul>
                <p className='mt-4 text-sm leading-relaxed text-zinc-500'>
                  {PLAYER_ROADMAPS_TOKEN_NOTE}
                </p>
              </Reveal>
            </div>
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
                Knowing who you want to sound like is not a plan
              </h2>
              <div className='space-y-5 text-lg leading-relaxed text-zinc-400'>
                <p>
                  The question that cost me the most practice time was never how
                  to play something. It was what to play next. I knew whose
                  records I wanted to sound like, and I still sat down most
                  evenings with forty minutes, a metronome and no idea where to
                  start.
                </p>
                <p>
                  When I put together the first artist roadmaps for Riff Quest
                  by hand, the slow part was not finding lessons. It was the
                  order: which picking-hand skill has to come before which riff,
                  and where the songs belong. Player Roadmaps do that job for
                  any goal, the way I would: draft the order, have it
                  questioned, then tie every step to something you can open and
                  play.
                </p>
                <p>
                  It costs money every time it runs, which is why it sits behind
                  a donation while the rest of the app does not. I would rather
                  say that plainly than dress it up as a premium tier.
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
          questions={PLAYER_ROADMAPS_FAQS}
          moreLink={{
            intro:
              "Rather follow a fixed path than write your own? Every stage of the free one is on its own page:",
            href: "/features/guitar-learning-path",
            label: "The guitar learning path",
          }}
        />

        {/* ── Where next ── */}
        <section className='py-20'>
          <div className='mx-auto max-w-7xl px-6'>
            <Reveal>
              <h2 className='mb-8 text-2xl font-bold text-white'>
                Not ready for a whole roadmap?
              </h2>
              <div className='grid gap-6 sm:grid-cols-3'>
                {[
                  {
                    href: "/features/guitar-learning-path",
                    title: "Guitar learning path",
                    text: "Free, fixed modules from first melody to bends and the whole fretboard, each step closed by an exam.",
                  },
                  {
                    href: "/guitar-practice-planner",
                    title: "Guitar practice planner",
                    text: "Ready-made routines, your own plan or Auto Plan, when you already know what to work on today.",
                  },
                  {
                    href: "/song-library",
                    title: "Song library",
                    text: "The songs a roadmap can send you to, with difficulty ratings, tabs and backing tracks.",
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
                Tell it who you want to sound like.
              </h2>
              <BuildLink location='feature_final'>Build your roadmap</BuildLink>
              <p className='mt-6 max-w-md text-sm text-zinc-500'>
                Free account first. Player Roadmaps then open with a donation of
                any size, made with the same email.
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
