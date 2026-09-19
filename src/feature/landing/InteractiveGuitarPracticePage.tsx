import { AuroraGlowFrame } from "components/AuroraGlowFrame/AuroraGlowFrame";
import { GuitarPatternBackground } from "components/GuitarPatternBackground/GuitarPatternBackground";
import { MarketingNav } from "components/MarketingNav/MarketingNav";
import { StaticTablature } from "feature/exercises/components/StaticTablature/StaticTablature";
import type { SerializedExercise } from "feature/exercises/lib/serializeExercise";
import { FaqSection } from "feature/landing/components/FaqSection";
import { Reveal } from "feature/landing/components/Reveal";
import {
  INTERACTIVE_PRACTICE_FAQS,
  INTERACTIVE_PRACTICE_META,
  INTERACTIVE_PRACTICE_START_HREF,
} from "feature/landing/data/interactivePractice";
import { jakartaLanding } from "feature/landing/lib/fonts";
import { MountOnVisible } from "feature/seoLanding/components/MountOnVisible";
import { NotationPreview } from "feature/seoLanding/components/NotationPreview";
import { notationEmbedHeightPx } from "feature/seoLanding/lib/notationEmbedHeight";
import { trackSignupCtaClicked } from "lib/signupFunnel";
import {
  ArrowDown,
  ArrowRight,
  ChevronRight,
  Clock,
  Mic,
  Music,
  Plug,
} from "lucide-react";
import dynamic from "next/dynamic";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";

export interface InteractiveGuitarPracticePageProps {
  /** The demo drill, serialized in getStaticProps. */
  exercise: SerializedExercise;
}

// Below-the-fold chrome loads on its own chunk, same as the other public pages.
const FinalCTASection = dynamic(() =>
  import("feature/landing/components/FinalCTASection").then(
    (m) => m.FinalCTASection,
  ),
);
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

const IMAGES = "/images/interactive-practice";

const START_STEPS = [
  {
    title: "Set the tempo",
    text: "The metronome slider sets the click, 80 BPM in the screenshots. The Speed control scales the whole playback, so a hard passage can run at half tempo without changing the drill.",
  },
  {
    title: "Turn on Pitch Detect",
    text: "The button turns green while the app listens. The first time, a short calibration asks how the guitar is connected and hears each string once.",
  },
  {
    title: "Play along",
    text: "The cursor moves through the tab. Each note lights up as a hit or a miss the moment it is due, and the score panel in the corner updates live.",
  },
];

const CONNECTIONS = [
  {
    icon: Plug,
    title: "Audio interface",
    subtitle: "USB or Thunderbolt box, guitar cable straight in",
    text: "The cleanest signal: no room noise, no metronome bleed, faster response. Pick this if you own one.",
  },
  {
    icon: Mic,
    title: "Microphone",
    subtitle: "Built-in laptop mic or an external USB mic",
    text: "For an acoustic guitar or an amp in the room. It works, with more misses on fast or distorted runs. Keep the metronome in headphones so the click is not heard as a note.",
  },
];

const SCORE_PANEL = [
  {
    label: "Score",
    text: "Points for every note the detector confirms, multiplied by the current combo multiplier.",
  },
  {
    label: "Accuracy",
    text: "Hits as a share of the notes that were due so far. It starts at 100% because nothing has been missed yet and only drops on a miss.",
  },
  {
    label: "Multiplier",
    text: "Grows one step every five hits in a row, up to x8, and resets when the combo breaks.",
  },
  {
    label: "Speeds mastered",
    text: "Every exercise with a BPM range has a ladder of tempos between its minimum and maximum, here 40 to 140 BPM in eleven rungs. Finishing the drill at a tempo ticks that rung off.",
  },
];

const difficultyBadges: Record<string, { label: string; className: string }> = {
  beginner: { label: "Beginner", className: "bg-sky-500/10 text-sky-300" },
  easy: { label: "Easy", className: "bg-emerald-500/10 text-emerald-300" },
  medium: { label: "Medium", className: "bg-amber-500/10 text-amber-300" },
  hard: { label: "Hard", className: "bg-rose-500/10 text-rose-300" },
};

const StartButton = ({
  location,
  children,
}: {
  location: "feature_hero" | "feature_demo";
  children: React.ReactNode;
}) => (
  <Link
    href={INTERACTIVE_PRACTICE_START_HREF}
    onClick={() => trackSignupCtaClicked(location)}
    className='inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-6 py-3 text-sm font-bold text-zinc-950 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-300 hover:bg-cyan-400'>
    {children}
    <ArrowRight className='h-4 w-4' aria-hidden='true' />
  </Link>
);

export const InteractiveGuitarPracticePage = ({
  exercise,
}: InteractiveGuitarPracticePageProps) => {
  const meta = INTERACTIVE_PRACTICE_META;
  const canonical = `https://riff.quest/${meta.slug}`;
  const ogImage = `https://riff.quest${meta.ogImage}`;
  const difficulty = difficultyBadges[exercise.difficulty];
  const notationHeightPx = notationEmbedHeightPx(
    exercise.tablature?.length ?? 0,
  );
  const duration =
    exercise.timeInMinutes < 1
      ? `${Math.round(exercise.timeInMinutes * 60)} sec`
      : `${exercise.timeInMinutes} min`;

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
            name: "Interactive guitar practice",
            item: canonical,
          },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: INTERACTIVE_PRACTICE_FAQS.map((faq) => ({
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
              <span className='text-zinc-400'>Interactive guitar practice</span>
            </div>

            <div className='grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-center'>
              <header>
                <h1 className='mb-6 text-balance font-landingHeading text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl'>
                  {meta.title}
                </h1>
                <p className='mb-4 text-lg leading-relaxed text-zinc-400'>
                  Open an exercise, set the tempo, press Start. The tablature
                  scrolls with the metronome, and with Pitch Detect on, the app
                  listens to your guitar and marks each note as a hit or a miss
                  while you play.
                </p>
                <p className='text-lg leading-relaxed text-zinc-400'>
                  Below is what the screen looks like, what the score panel
                  means and how to plug in. You need a free account to play;
                  looking around costs nothing.
                </p>

                <div className='mt-10 flex flex-col items-start gap-3 sm:flex-row sm:items-center'>
                  <StartButton location='feature_hero'>
                    Start practicing free
                  </StartButton>
                  <a
                    href='#demo'
                    className='inline-flex items-center gap-2 rounded-lg bg-zinc-800/60 px-6 py-3 text-sm font-semibold text-zinc-200 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-500 hover:bg-zinc-800'>
                    See the demo
                    <ArrowDown className='h-4 w-4' aria-hidden='true' />
                  </a>
                </div>
              </header>

              <AuroraGlowFrame>
                <div className='rounded-lg p-1.5 glass-card'>
                  <Image
                    src={`${IMAGES}/exercise-ready.webp`}
                    alt='Riff Quest exercise "Chromatic — Moving Accents" ready to start: colour-coded tablature across three strings, metronome at 80 BPM and the Pitch Detect button'
                    width={1325}
                    height={640}
                    priority
                    sizes='(min-width: 1024px) 720px, 100vw'
                    className='h-auto w-full rounded-lg'
                  />
                </div>
              </AuroraGlowFrame>
            </div>
          </div>
        </section>

        {/* ── What happens when you press Start + demo drill ── */}
        <section id='demo' className='scroll-mt-24 py-20'>
          <div className='mx-auto max-w-7xl px-6'>
            <Reveal className='mb-12 max-w-2xl'>
              <p className='mb-2 text-sm font-bold text-cyan-400'>
                The session
              </p>
              <h2 className='mb-5 font-landingHeading text-3xl font-bold tracking-tight text-white sm:text-4xl'>
                What happens when you press Start
              </h2>
              <p className='text-lg leading-relaxed text-zinc-400'>
                Three controls matter. Everything else on the screen is the
                exercise itself: instructions, tips and what it trains.
              </p>
            </Reveal>

            <Reveal delay={0.05}>
              <ol className='grid gap-6 rounded-lg bg-zinc-900/40 p-6 sm:grid-cols-3 sm:p-8'>
                {START_STEPS.map((step, idx) => (
                  <li key={step.title} className='flex flex-col gap-3'>
                    <span className='text-sm font-bold tabular-nums text-cyan-400'>
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <h3 className='text-lg font-semibold text-white'>
                      {step.title}
                    </h3>
                    <p className='text-sm leading-relaxed text-zinc-400'>
                      {step.text}
                    </p>
                  </li>
                ))}
              </ol>
            </Reveal>

            <Reveal delay={0.1} className='mt-16'>
              <div className='grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]'>
                <div>
                  <p className='mb-2 text-sm font-bold text-cyan-400'>
                    The drill in the screenshots
                  </p>
                  <div className='mb-4 flex flex-wrap items-center gap-2'>
                    <span
                      className={`inline-block rounded px-2.5 py-1 text-xs font-semibold ${difficulty.className}`}>
                      {difficulty.label}
                    </span>
                    <span className='inline-flex items-center gap-1.5 rounded bg-zinc-800/60 px-2.5 py-1 text-xs font-semibold text-zinc-300'>
                      <Clock
                        className='h-3 w-3 text-zinc-400'
                        aria-hidden='true'
                      />
                      {duration}
                    </span>
                    {exercise.metronomeSpeed && (
                      <span className='inline-flex items-center gap-1.5 rounded bg-zinc-800/60 px-2.5 py-1 text-xs font-semibold text-zinc-300'>
                        <Music
                          className='h-3 w-3 text-zinc-400'
                          aria-hidden='true'
                        />
                        {exercise.metronomeSpeed.min}–
                        {exercise.metronomeSpeed.max} BPM
                      </span>
                    )}
                  </div>
                  <h3 className='mb-3 text-2xl font-bold tracking-tight text-white'>
                    {exercise.title}
                  </h3>
                  <p className='mb-4 leading-relaxed text-zinc-400'>
                    {exercise.description}
                  </p>
                  <p className='mb-8 leading-relaxed text-zinc-300'>
                    A good first drill for note feedback: slow, so the detector
                    gets clean attacks to read, and short enough to run three
                    times in a row. The accent markers are for your ears; the
                    app only checks the pitches.
                  </p>
                  <StartButton location='feature_demo'>
                    Play this exercise with feedback
                  </StartButton>
                </div>

                {exercise.tablature && (
                  <div className='space-y-3'>
                    <MountOnVisible
                      reserveHeightPx={notationHeightPx}
                      placeholder={
                        <div className='h-full animate-pulse rounded-lg bg-zinc-900/60' />
                      }>
                      <NotationPreview
                        measures={exercise.tablature}
                        bpm={exercise.metronomeSpeed?.recommended || 120}
                        heightPx={notationHeightPx}
                      />
                    </MountOnVisible>
                    <details className='group'>
                      <summary className='cursor-pointer text-xs font-semibold text-zinc-500 transition-colors hover:text-zinc-300'>
                        Show plain-text tab
                      </summary>
                      <StaticTablature
                        measures={exercise.tablature}
                        maxMeasures={4}
                        className='mt-3'
                      />
                    </details>
                  </div>
                )}
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── Two ways to plug in ── */}
        <section className='py-20'>
          <div className='mx-auto max-w-7xl px-6'>
            <Reveal className='mb-12 max-w-2xl'>
              <p className='mb-2 text-sm font-bold text-cyan-400'>Input</p>
              <h2 className='mb-5 font-landingHeading text-3xl font-bold tracking-tight text-white sm:text-4xl'>
                Two ways to plug in
              </h2>
              <p className='text-lg leading-relaxed text-zinc-400'>
                The calibration asks one question first. Both answers work; one
                is cleaner.
              </p>
            </Reveal>

            <div className='grid gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-start'>
              <Reveal delay={0.05} className='grid gap-6 sm:grid-cols-2'>
                {CONNECTIONS.map((connection) => (
                  <div
                    key={connection.title}
                    className='flex flex-col gap-4 rounded-lg bg-zinc-900/40 p-6 sm:p-8'>
                    <connection.icon
                      className='h-6 w-6 text-zinc-400'
                      aria-hidden='true'
                    />
                    <div>
                      <h3 className='text-lg font-semibold text-white'>
                        {connection.title}
                      </h3>
                      <p className='text-sm text-zinc-500'>
                        {connection.subtitle}
                      </p>
                    </div>
                    <p className='text-sm leading-relaxed text-zinc-400'>
                      {connection.text}
                    </p>
                  </div>
                ))}
                <div className='rounded-lg bg-zinc-900/40 p-6 sm:col-span-2 sm:p-8'>
                  <p className='leading-relaxed text-zinc-400'>
                    The browser asks for microphone access once. Detection runs
                    on your computer: nothing is recorded, nothing is uploaded.
                    The full calibration walkthrough, the tuning options and the
                    &ldquo;it hears nothing&rdquo; checklist live in the{" "}
                    <Link
                      href='/wiki/note-detection'
                      className='font-bold text-cyan-400 transition-colors hover:text-cyan-300'>
                      note detection guide
                    </Link>
                    . Players with an audio interface can also use the{" "}
                    <Link
                      href='/wiki/desktop-app'
                      className='font-bold text-cyan-400 transition-colors hover:text-cyan-300'>
                      desktop app
                    </Link>{" "}
                    for lower latency.
                  </p>
                </div>
              </Reveal>

              <Reveal delay={0.1} className='flex flex-col gap-6'>
                <Image
                  src={`${IMAGES}/connection-choice.webp`}
                  alt='Guitar Calibration dialog asking how the guitar is connected, with two options: Audio Interface and Microphone'
                  width={514}
                  height={406}
                  sizes='(min-width: 1024px) 480px, 100vw'
                  className='h-auto w-full rounded-lg'
                />
                <Image
                  src={`${IMAGES}/mic-tools.webp`}
                  alt='The session toolbar with the Pitch Detect button and its menu open: Recalibrate, Tuner, Mic not working?'
                  width={720}
                  height={180}
                  sizes='(min-width: 1024px) 480px, 100vw'
                  className='h-auto w-full rounded-lg'
                />
              </Reveal>
            </div>
          </div>
        </section>

        {/* ── Reading the score panel ── */}
        <section className='py-20'>
          <div className='mx-auto max-w-7xl px-6'>
            <Reveal className='mb-12 max-w-2xl'>
              <p className='mb-2 text-sm font-bold text-cyan-400'>Feedback</p>
              <h2 className='mb-5 font-landingHeading text-3xl font-bold tracking-tight text-white sm:text-4xl'>
                Reading the score panel
              </h2>
              <p className='text-lg leading-relaxed text-zinc-400'>
                Turning Pitch Detect on adds a small panel above the tab. Four
                numbers, all about one narrow question: did the right pitch come
                out when it was due.
              </p>
            </Reveal>

            <Reveal delay={0.05}>
              <div className='grid gap-10 rounded-lg bg-zinc-900/40 p-6 sm:p-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start'>
                <div className='space-y-4'>
                  <Image
                    src={`${IMAGES}/score-hud.webp`}
                    alt='Score panel before the first note: Score 0, Accuracy 100%, multiplier x1'
                    width={345}
                    height={96}
                    sizes='(min-width: 1024px) 400px, 100vw'
                    className='h-auto w-full max-w-sm rounded-lg'
                  />
                  <p className='text-sm leading-relaxed text-zinc-500'>
                    This is the panel before the first note is played: no
                    points, nothing missed yet, base multiplier. A starting
                    position, not a result.
                  </p>
                </div>
                <dl className='grid gap-6 sm:grid-cols-2'>
                  {SCORE_PANEL.map((item) => (
                    <div key={item.label}>
                      <dt className='mb-1 font-semibold text-white'>
                        {item.label}
                      </dt>
                      <dd className='text-sm leading-relaxed text-zinc-400'>
                        {item.text}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </Reveal>

            <Reveal delay={0.1} className='mt-10 max-w-3xl'>
              <p className='leading-relaxed text-zinc-400'>
                What the panel does not hear: tone, timing feel, dynamics. A
                ringing open string can tick a box for you and a fast distorted
                run can be missed although you played it. If your ear says a
                take was sloppy and the panel says 98%, your ear is right. The
                wiki spells out{" "}
                <Link
                  href='/wiki/note-detection'
                  className='font-bold text-cyan-400 transition-colors hover:text-cyan-300'>
                  where detection is fooled
                </Link>
                , and{" "}
                <Link
                  href='/wiki/how-scoring-works'
                  className='font-bold text-cyan-400 transition-colors hover:text-cyan-300'>
                  how scoring works
                </Link>{" "}
                explains why your points come from the time you log, not from
                the hit percentage.
              </p>
            </Reveal>
          </div>
        </section>

        <FaqSection
          questions={INTERACTIVE_PRACTICE_FAQS}
          moreLink={{
            intro:
              "Setup, calibration and troubleshooting are covered step by step in the knowledge base:",
            href: "/wiki/note-detection",
            label: "Note Detection & Mic Setup",
          }}
        />

        {/* ── Where next ── */}
        <section className='py-20'>
          <div className='mx-auto max-w-7xl px-6'>
            <Reveal>
              <h2 className='mb-8 text-2xl font-bold text-white'>
                Not sure what to play first?
              </h2>
              <div className='grid gap-6 sm:grid-cols-3'>
                {[
                  {
                    href: "/beginner-guitar-exercises",
                    title: "Beginner guitar exercises",
                    text: "Eight short drills with real notation, in the order to learn them.",
                  },
                  {
                    href: "/guides",
                    title: "All practice guides",
                    text: "Speed, scales, an intermediate routine and a daily plan for 15, 30 or 60 minutes.",
                  },
                  {
                    href: "/how-it-works",
                    title: "How Riff Quest works",
                    text: "The whole app in three steps: pick, play, see your progress.",
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

        <FinalCTASection />
        <Footer />
        <CookieBanner />
      </main>
    </>
  );
};
