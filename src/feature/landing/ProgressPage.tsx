import { GuitarPatternBackground } from "components/GuitarPatternBackground/GuitarPatternBackground";
import { MarketingNav } from "components/MarketingNav/MarketingNav";
import { FaqSection } from "feature/landing/components/FaqSection";
import { FeatureList } from "feature/landing/components/FeatureList";
import { PointsCalculator } from "feature/landing/components/progress/PointsCalculator";
import { SessionToProgress } from "feature/landing/components/progress/SessionToProgress";
import { Reveal } from "feature/landing/components/Reveal";
import {
  PROGRESS_CTA_HREF,
  PROGRESS_FAQS,
  PROGRESS_LEVEL_STEPS,
  PROGRESS_MAX_STREAK_BONUS,
  PROGRESS_META,
  PROGRESS_POINTS_PER_HOUR,
  PROGRESS_STATS,
} from "feature/landing/data/progress";
import { jakartaLanding } from "feature/landing/lib/fonts";
import type { ProgressPageProps } from "feature/landing/lib/progressProps";
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
import { getDailyStreakMultiplier } from "utils/gameLogic/getDailyStreakMultiplier";

export type { ProgressPageProps } from "feature/landing/lib/progressProps";

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

export const PROGRESS_AUTHOR = AUTHORS["Michael Apfel"];

const primaryButton =
  "inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-bold text-zinc-950 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 hover:bg-zinc-200";
const secondaryButton =
  "inline-flex items-center gap-2 rounded-lg bg-zinc-800/60 px-6 py-3 text-sm font-semibold text-zinc-200 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-500 hover:bg-zinc-800";

const ACHIEVEMENT_TONE: Record<string, string> = {
  common: "text-zinc-300",
  rare: "text-cyan-400",
  veryRare: "text-purple-400",
  epic: "text-amber-400",
};

const trackCta = (location: SignupCtaLocation) => {
  posthog.capture("progress_cta_clicked", {
    cta_location: location,
    from_path: typeof window === "undefined" ? "" : window.location.pathname,
  });
  trackSignupCtaClicked(location, { feature: "progress" });
};

const StartLink = ({ location }: { location: SignupCtaLocation }) => (
  <Link
    href={PROGRESS_CTA_HREF}
    onClick={() => trackCta(location)}
    className={primaryButton}>
    Log your first session
    <ArrowRight className='h-4 w-4' aria-hidden='true' />
  </Link>
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

export const ProgressPage = ({
  skills,
  achievements,
  achievementsTotal,
  achievementExample,
}: ProgressPageProps) => {
  const meta = PROGRESS_META;
  const author = PROGRESS_AUTHOR;
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
            name: "Progress tracker",
            item: canonical,
          },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: PROGRESS_FAQS.map((faq) => ({
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
              <span className='text-zinc-400'>Progress tracker</span>
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
                  Every session you log turns into points, a level, time per
                  category and skills that grow with the exercises you play. The
                  app keeps the books, so you can see the work instead of
                  guessing whether it is paying off.
                </p>

                <div className='mt-10 flex flex-col items-start gap-3 sm:flex-row sm:items-center'>
                  <StartLink location='feature_hero' />
                  <a href='#points' className={secondaryButton}>
                    How points work
                    <ArrowDown className='h-4 w-4' aria-hidden='true' />
                  </a>
                </div>
                <p className='mt-4 max-w-md text-sm text-zinc-500'>
                  Free. Practise in the app or log what you played elsewhere.
                </p>

                <dl className='mt-12 flex flex-wrap gap-x-10 gap-y-6'>
                  {[
                    { value: skills, label: "skills tracked" },
                    { value: achievementsTotal, label: "achievements" },
                    {
                      value: PROGRESS_POINTS_PER_HOUR,
                      label: "points an hour",
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

              <SessionToProgress achievement={achievementExample} />
            </div>
          </div>
        </section>

        {/* ── Points ── */}
        <section id='points' className='scroll-mt-16 py-20'>
          <div className='mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-2 lg:items-start lg:gap-16'>
            <div>
              <SectionIntro
                eyebrow='Points and streaks'
                title='Showing up beats a marathon'>
                Practice pays a flat {PROGRESS_POINTS_PER_HOUR} points an hour,
                every category the same. The multiplier comes from your streak:
                practise on consecutive days and everything you log is worth
                more, up to +{PROGRESS_MAX_STREAK_BONUS}%.
              </SectionIntro>
              <Reveal delay={0.05}>
                <ol className='flex flex-wrap gap-2'>
                  {[1, 2, 3, 4, 5].map((day) => (
                    <li
                      key={day}
                      className='flex min-w-[4.5rem] flex-col rounded-lg bg-zinc-900/40 px-4 py-3'>
                      <span className='text-xs text-zinc-500'>
                        Day {day === 5 ? "5+" : day}
                      </span>
                      <span className='font-teko text-2xl tabular-nums leading-none text-white'>
                        +{Math.round(getDailyStreakMultiplier(day) * 100)}%
                      </span>
                    </li>
                  ))}
                </ol>
                <p className='mt-4 text-sm leading-relaxed text-zinc-500'>
                  Miss a day and the streak starts again. Ten minutes is enough
                  to keep it.
                </p>
              </Reveal>
            </div>
            <Reveal delay={0.1}>
              <PointsCalculator />
            </Reveal>
          </div>
        </section>

        {/* ── Levels ── */}
        <section className='bg-zinc-900/30 py-20'>
          <div className='mx-auto max-w-7xl px-6'>
            <SectionIntro eyebrow='Levels' title='A level is hours you put in'>
              Your total points set your level, and each level takes a little
              more than the last. Points only measure work you did and can never
              be spent, so a level is a fair record of time at the guitar.
            </SectionIntro>
            <Reveal
              delay={0.05}
              className='grid gap-3 sm:grid-cols-3 lg:grid-cols-5'>
              {PROGRESS_LEVEL_STEPS.map((step) => (
                <div key={step.level} className='rounded-lg bg-zinc-900/40 p-5'>
                  <p className='text-xs text-zinc-500'>Level</p>
                  <p className='font-teko text-4xl tabular-nums leading-none text-white'>
                    {step.level + 1}
                  </p>
                  <p className='mt-2 text-sm tabular-nums text-zinc-300'>
                    {step.points.toLocaleString("en-US")} points
                  </p>
                  <p className='text-xs tabular-nums text-zinc-500'>
                    ≈ {Math.round(step.points / PROGRESS_POINTS_PER_HOUR)} h of
                    practice, less with a streak
                  </p>
                </div>
              ))}
            </Reveal>
          </div>
        </section>

        {/* ── Stats ── */}
        <section className='py-20'>
          <div className='mx-auto max-w-7xl px-6'>
            <div className='grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-center lg:gap-16'>
              <div>
                <SectionIntro
                  eyebrow='Statistics'
                  title='Where your hours actually went'>
                  Every session is broken down for you, so the week you thought
                  was all technique shows up as what it really was.
                </SectionIntro>
                <Reveal delay={0.05}>
                  <FeatureList features={[...PROGRESS_STATS]} />
                </Reveal>
              </div>
              <Reveal delay={0.1}>
                <Image
                  src='/images/stats-overview.webp'
                  alt='Riff Quest statistics: total time and points with trend lines, sessions and healthy habits, time split across technique, theory, creativity and hearing, an activity chart over time, and averages such as session length and points per hour'
                  width={1412}
                  height={804}
                  sizes='(min-width: 1024px) 700px, 100vw'
                  className='h-auto w-full rounded-lg'
                />
              </Reveal>
            </div>
          </div>
        </section>

        {/* ── Skills ── */}
        <section className='bg-zinc-900/30 py-20'>
          <div className='mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-2 lg:items-start lg:gap-16'>
            <SectionIntro
              eyebrow='Skills'
              title={`${skills} skills that grow with every exercise`}>
              Alternate picking, legato, bending, chords, ear training,
              improvisation and the rest. Every exercise is tagged with what it
              trains, and finishing it in a logged session feeds those skills: 1
              point for an easy exercise, 2 for a medium one, 3 for a hard one.
            </SectionIntro>
            <Reveal delay={0.05}>
              <FeatureList
                features={[
                  {
                    label: "A map of the whole library",
                    desc: "Seven milestones from Foundations to Mastery, and every exercise in the library as a dot on its branch, easiest first.",
                  },
                  {
                    label: "Gaps you can see",
                    desc: "A branch with one filled dot is not a failing grade, it is a shortlist of what to play tonight.",
                  },
                  {
                    label: "Only ever up",
                    desc: "Skills never go down. The number is a record of attention paid, so a quiet month does not cost you anything.",
                  },
                ]}
              />
            </Reveal>
          </div>
        </section>

        {/* ── Achievements & profile ── */}
        <section className='py-20'>
          <div className='mx-auto max-w-7xl px-6'>
            <SectionIntro
              eyebrow='Achievements and profile'
              title={`${achievementsTotal} badges, and a profile to wear them on`}>
              Streaks, hours, sessions, songs and more, each badge unlocked by
              something you actually did. They pay nothing: they unlock titles,
              profile banners and accent colours, and you choose which to show.
            </SectionIntro>
            <Reveal delay={0.05} className='flex flex-wrap gap-x-10 gap-y-6'>
              {achievements.map((tier) => (
                <div key={tier.rarity}>
                  <p className='font-teko text-5xl tabular-nums leading-none text-white'>
                    {tier.count}
                  </p>
                  <p
                    className={`mt-1 text-sm ${ACHIEVEMENT_TONE[tier.rarity] ?? "text-zinc-400"}`}>
                    {tier.label}
                  </p>
                </div>
              ))}
            </Reveal>
            <Reveal delay={0.1} className='mt-12'>
              <Image
                src='/images/wiki/achievements-map.webp'
                alt='The achievements map in Riff Quest: a grid of badge icons, the unlocked ones lit in cyan and gold, the rest greyed out'
                width={2232}
                height={968}
                sizes='(min-width: 1280px) 1232px, 100vw'
                className='h-auto w-full rounded-lg'
              />
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
                Progress on guitar is slow enough to be invisible
              </h2>
              <div className='space-y-5 text-lg leading-relaxed text-zinc-400'>
                <p>
                  Riff Quest started as my own fix for this. Getting better at
                  guitar happens in steps too small to notice from one day to
                  the next, and an evening that felt like nothing is easy to
                  write off as wasted.
                </p>
                <p>
                  Numbers do not lie the way that feeling does. A month of
                  half-hour sessions shows up as hours, a level and a skill that
                  moved, even when your hands have not told you yet. That is
                  what kept me practising, and why the streak rewards showing up
                  rather than heroics.
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
          questions={PROGRESS_FAQS}
          moreLink={{
            intro: "Every way to earn points, in detail:",
            href: "/wiki/how-scoring-works",
            label: "Points, levels and streaks",
          }}
        />

        {/* ── Where next ── */}
        <section className='py-20'>
          <div className='mx-auto max-w-7xl px-6'>
            <Reveal>
              <h2 className='mb-8 text-2xl font-bold text-white'>
                Put the numbers to work
              </h2>
              <div className='grid gap-6 sm:grid-cols-3'>
                {[
                  {
                    href: "/guitar-practice-journal",
                    title: "Practice journal PDF",
                    text: "Prefer paper? A printable journal and log, with a filled-in example and a weekly review.",
                  },
                  {
                    href: "/features/guitar-practice-goals",
                    title: "Goals and rotation",
                    text: "Aim the hours at one tempo, then keep what you learned from going rusty.",
                  },
                  {
                    href: "/features/guitar-practice-leaderboard",
                    title: "Rankings",
                    text: "The same points on a monthly season that starts from zero on the 1st.",
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
                Make the work visible.
              </h2>
              <StartLink location='feature_final' />
              <p className='mt-6 max-w-md text-sm text-zinc-500'>
                Free account. Your history starts with the first session.
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
