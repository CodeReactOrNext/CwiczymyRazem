import { cn } from "assets/lib/utils";
import { GuitarPatternBackground } from "components/GuitarPatternBackground/GuitarPatternBackground";
import { MarketingNav } from "components/MarketingNav/MarketingNav";
import { ChallengeBoard } from "feature/landing/components/competition/ChallengeBoard";
import { SeasonRace } from "feature/landing/components/competition/SeasonRace";
import { FaqSection } from "feature/landing/components/FaqSection";
import { FeatureList } from "feature/landing/components/FeatureList";
import { Reveal } from "feature/landing/components/Reveal";
import {
  COMPETITION_BOARDS,
  COMPETITION_CHALLENGE,
  COMPETITION_FAQS,
  COMPETITION_META,
  COMPETITION_ROUTES,
  COMPETITION_SEASON_COUNTS,
  COMPETITION_SEASON_REWARDS,
  type CompetitionTarget,
} from "feature/landing/data/competition";
import type { CompetitionPageProps } from "feature/landing/lib/competitionProps";
import { jakartaLanding } from "feature/landing/lib/fonts";
import { AUTHORS } from "lib/authors";
import type { SignupCtaLocation } from "lib/signupFunnel";
import { trackSignupCtaClicked } from "lib/signupFunnel";
import { ArrowRight, ChevronRight, Crown, Guitar, Trophy } from "lucide-react";
import dynamic from "next/dynamic";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import posthog from "posthog-js";
import type { ReactNode } from "react";

export type { CompetitionPageProps } from "feature/landing/lib/competitionProps";

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

/** The app's podium tones (SeasonRewards): gold, silver, bronze. */
const PODIUM_ROW = [
  "bg-amber-500/10 text-amber-300",
  "bg-zinc-400/10 text-zinc-200",
  "bg-orange-500/10 text-orange-300",
];

/** An icon and a colour per board, so the three read apart at a glance. */
const BOARD_LOOK = [
  { Icon: Trophy, tone: "bg-cyan-500/10 text-cyan-300" },
  { Icon: Crown, tone: "bg-amber-500/10 text-amber-300" },
  { Icon: Guitar, tone: "bg-purple-500/10 text-purple-300" },
];

export const COMPETITION_AUTHOR = AUTHORS["Michael Apfel"];

const primaryButton =
  "inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-bold text-zinc-950 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 hover:bg-zinc-200";
const secondaryButton =
  "inline-flex items-center gap-2 rounded-lg bg-zinc-800/60 px-6 py-3 text-sm font-semibold text-zinc-200 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-500 hover:bg-zinc-800";

const trackCta = (target: CompetitionTarget, location: SignupCtaLocation) => {
  posthog.capture("competition_cta_clicked", {
    competition_target: target,
    cta_location: location,
    from_path: typeof window === "undefined" ? "" : window.location.pathname,
  });
  trackSignupCtaClicked(location, { feature: `competition_${target}` });
};

const CtaLink = ({
  target,
  location,
  className,
  children,
}: {
  target: CompetitionTarget;
  location: SignupCtaLocation;
  className: string;
  children: ReactNode;
}) => (
  <Link
    href={COMPETITION_ROUTES[target]}
    onClick={() => trackCta(target, location)}
    className={className}>
    {children}
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

export const CompetitionPage = ({ daily }: CompetitionPageProps) => {
  const meta = COMPETITION_META;
  const author = COMPETITION_AUTHOR;
  const challenge = COMPETITION_CHALLENGE;
  const rewards = COMPETITION_SEASON_REWARDS;
  const canonical = `https://riff.quest/${meta.slug}`;
  const ogImage = `https://riff.quest${meta.ogImage}`;
  const fullBoardFame = challenge.songs * challenge.fame + challenge.clearBonus;

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
            name: "Rankings",
            item: canonical,
          },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: COMPETITION_FAQS.map((faq) => ({
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
              <span className='text-zinc-400'>Rankings</span>
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
                  Every session you log lands on a monthly season that starts
                  from zero on the 1st. Top ten gets paid. On the side: five
                  songs the community votes in every month, and one exercise the
                  whole app plays every day.
                </p>

                <div className='mt-10 flex flex-col items-start gap-3 sm:flex-row sm:items-center'>
                  <CtaLink
                    target='seasons'
                    location='feature_hero'
                    className={primaryButton}>
                    Join this season
                    <ArrowRight className='h-4 w-4' aria-hidden='true' />
                  </CtaLink>
                  <CtaLink
                    target='challenges'
                    location='feature_hero'
                    className={secondaryButton}>
                    See this month&apos;s songs
                  </CtaLink>
                </div>
                <p className='mt-4 max-w-md text-sm text-zinc-500'>
                  Free with your Riff Quest account.
                </p>

                <dl className='mt-12 flex flex-wrap gap-x-10 gap-y-6'>
                  {[
                    { value: "3", label: "boards" },
                    {
                      value: String(rewards.length),
                      label: "places paid each season",
                    },
                    {
                      value: String(challenge.songs),
                      label: "challenge songs a month",
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

              <SeasonRace rewards={rewards} />
            </div>
          </div>
        </section>

        {/* ── Three boards ── */}
        <section className='py-20'>
          <div className='mx-auto max-w-7xl px-6'>
            <SectionIntro
              eyebrow='Three boards'
              title='Three ways to be at the top'>
              They rank different things on purpose, so a newcomer, a veteran
              and a collector each have a board they can climb.
            </SectionIntro>
            <Reveal delay={0.05} className='grid gap-4 md:grid-cols-3'>
              {COMPETITION_BOARDS.map((board, idx) => {
                const { Icon, tone } = BOARD_LOOK[idx];
                return (
                  <div
                    key={board.title}
                    className='rounded-lg bg-zinc-900/40 p-6'>
                    <span
                      className={cn(
                        "mb-5 flex h-10 w-10 items-center justify-center rounded-lg",
                        tone,
                      )}>
                      <Icon className='h-5 w-5' aria-hidden='true' />
                    </span>
                    <h3 className='text-xl font-bold text-white'>
                      {board.title}
                    </h3>
                    <p className='mt-2 text-sm leading-relaxed text-zinc-400'>
                      {board.text}
                    </p>
                  </div>
                );
              })}
            </Reveal>

            <Reveal delay={0.1} className='mt-14'>
              <Image
                src='/images/practice-leaderboard/season-board.webp'
                alt='The Seasons board in Riff Quest with example players: the month, the Fame paid to the top three and places four to ten, then rows with rank, name, level, when they last practised, season points, practice time and achievements; the signed-in player is highlighted in cyan'
                width={1600}
                height={1269}
                sizes='(min-width: 1280px) 1232px, 100vw'
                className='h-auto w-full rounded-lg'
              />
              <p className='mt-3 text-xs text-zinc-600'>
                The Seasons board as the app draws it, filled with made-up
                players.
              </p>
            </Reveal>
          </div>
        </section>

        {/* ── Season ── */}
        <section className='bg-zinc-900/30 py-20'>
          <div className='mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-2 lg:items-start lg:gap-16'>
            <div>
              <SectionIntro
                eyebrow='The season'
                title='One calendar month, and it pays'>
                A season measures the month&apos;s practice and nothing else.
                Finish in the top ten and Fame arrives when it closes.
              </SectionIntro>
              <Reveal delay={0.05}>
                <FeatureList features={[...COMPETITION_SEASON_COUNTS]} />
              </Reveal>
            </div>
            <Reveal delay={0.1}>
              <ol className='grid grid-cols-2 gap-x-8 gap-y-2 rounded-lg bg-zinc-900/40 p-6 sm:p-8'>
                {rewards.map((fame, idx) => (
                  <li
                    key={idx}
                    className={cn(
                      "flex items-baseline justify-between gap-4 rounded-md px-3 py-1.5",
                      PODIUM_ROW[idx],
                    )}>
                    <span
                      className={cn(
                        "font-teko text-2xl tabular-nums leading-none",
                        PODIUM_ROW[idx] ? "" : "text-zinc-500",
                      )}>
                      {idx + 1}
                    </span>
                    <span className='text-sm tabular-nums text-zinc-200'>
                      {fame} <span className='text-zinc-500'>Fame</span>
                    </span>
                  </li>
                ))}
              </ol>
              <p className='mt-4 text-sm text-zinc-500'>
                Paid once, when the season closes. Fame buys gear in the Arsenal
                and cannot be bought.
              </p>
            </Reveal>
          </div>
        </section>

        {/* ── Challenges ── */}
        <section className='py-20'>
          <div className='mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-2 lg:items-center lg:gap-16'>
            <div>
              <SectionIntro
                eyebrow='Monthly Challenges'
                title='Five songs, picked by the players'>
                Every month the community votes in {challenge.songs} songs, and
                everyone records themselves playing them. It is the one place in
                the app where other people hear you play, and it pays better
                than anything else.
              </SectionIntro>
              <Reveal delay={0.05}>
                <ul className='space-y-3 text-sm leading-relaxed text-zinc-400'>
                  <li>
                    Each recording pays{" "}
                    <span className='font-semibold text-zinc-200'>
                      {challenge.points} points and {challenge.fame} Fame
                    </span>
                    , all five add{" "}
                    <span className='font-semibold text-zinc-200'>
                      {challenge.clearBonus}
                    </span>{" "}
                    more: {fullBoardFame} Fame for a full board.
                  </li>
                  <li>
                    A phone video is enough. Recordings are not judged; one that
                    exists counts.
                  </li>
                  <li>
                    Next month&apos;s songs are decided while this month runs:
                    nominate a song and spread {challenge.votes} votes across
                    the ones you want.
                  </li>
                </ul>
              </Reveal>
            </div>
            <Reveal delay={0.1}>
              <ChallengeBoard
                songs={challenge.songs}
                points={challenge.points}
                fame={challenge.fame}
                clearBonus={challenge.clearBonus}
              />
            </Reveal>
          </div>
        </section>

        {/* ── Exercise of the day ── */}
        <section className='bg-zinc-900/30 py-20'>
          <div className='mx-auto max-w-7xl px-6'>
            <SectionIntro
              eyebrow='Exercise of the day'
              title='One exercise, everybody, today'>
              Every day the whole app gets the same exercise, drawn from{" "}
              {daily.poolSize} that the microphone scores note by note at a
              tempo, so every run is the same test.
            </SectionIntro>
            <Reveal delay={0.05} className='grid gap-4 md:grid-cols-3'>
              {[
                {
                  title: `A board of ${daily.boardSize}`,
                  text: "The day's best runs, from your Home screen. Play it as often as you like; your best run is the one that stands.",
                },
                {
                  title: "One prize, for first place",
                  text: `When the day closes, the winner gets a rare mod at its best possible roll or a Legendary part. It needs at least ${daily.minPlayers} players on the board.`,
                },
                {
                  title: "The same day for everyone",
                  text: `The day runs on UTC, so everyone plays the same exercise at the same moment. Runs from yesterday still land for ${daily.graceMinutes} minutes after midnight.`,
                },
              ].map((card) => (
                <div key={card.title} className='rounded-lg bg-zinc-900/40 p-6'>
                  <h3 className='text-lg font-bold text-white'>{card.title}</h3>
                  <p className='mt-2 text-sm leading-relaxed text-zinc-400'>
                    {card.text}
                  </p>
                </div>
              ))}
            </Reveal>
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
                A leaderboard a newcomer can win
              </h2>
              <div className='space-y-5 text-lg leading-relaxed text-zinc-400'>
                <p>
                  An all-time leaderboard is a museum: the people at the top got
                  there years ago, and someone who starts today has no reason to
                  look at it. That is why the board that pays is a season, and
                  why it starts from zero every month.
                </p>
                <p>
                  The rest is about variety. Some players want a number to beat
                  every day, some want a month-long project, some want to be
                  heard. The exercise of the day, the challenge songs and the
                  season give each of them something to aim at, without making
                  anyone play for hours to keep up.
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
          questions={COMPETITION_FAQS}
          moreLink={{
            intro: "How the boards and seasons work, in detail:",
            href: "/wiki/leaderboard-and-seasons",
            label: "Rankings and seasons",
          }}
        />

        {/* ── Where next ── */}
        <section className='py-20'>
          <div className='mx-auto max-w-7xl px-6'>
            <Reveal>
              <h2 className='mb-8 text-2xl font-bold text-white'>
                More ways to compete
              </h2>
              <div className='grid gap-6 sm:grid-cols-3'>
                {[
                  {
                    href: "/features/guitar-duels",
                    title: "Guitar duels",
                    text: "One exercise, one opponent, 48 hours. Ranked by ELO.",
                  },
                  {
                    href: "/features/guitar-practice-rewards",
                    title: "Practice rewards",
                    text: "What the Fame you win buys, and the gear board it puts you on.",
                  },
                  {
                    href: "/features/guitar-progress-tracker",
                    title: "Progress tracker",
                    text: "Points, levels, streaks and skills: everything your sessions add up to.",
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
                This month is still anyone&apos;s.
              </h2>
              <CtaLink
                target='seasons'
                location='feature_final'
                className={primaryButton}>
                Join this season
                <ArrowRight className='h-4 w-4' aria-hidden='true' />
              </CtaLink>
              <p className='mt-6 max-w-md text-sm text-zinc-500'>
                Free account. Your first logged session puts you on the board.
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
