import { GuitarPatternBackground } from "components/GuitarPatternBackground/GuitarPatternBackground";
import { MarketingNav } from "components/MarketingNav/MarketingNav";
import { DuelFaceOff } from "feature/landing/components/duels/DuelFaceOff";
import { FaqSection } from "feature/landing/components/FaqSection";
import { FeatureList } from "feature/landing/components/FeatureList";
import { Reveal } from "feature/landing/components/Reveal";
import {
  DUELS_CTA_HREF,
  DUELS_FAQS,
  DUELS_IDEAS,
  DUELS_META,
  DUELS_NUMBERS,
  DUELS_REAL_DUEL,
  DUELS_RULES_ANCHOR,
} from "feature/landing/data/duels";
import type { DuelsPageProps } from "feature/landing/lib/duelsProps";
import { jakartaLanding } from "feature/landing/lib/fonts";
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

export type { DuelsPageProps } from "feature/landing/lib/duelsProps";

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

const IMAGES = "/images/guitar-duels";

export const DUELS_AUTHOR = AUTHORS["Michael Apfel"];

const primaryButton =
  "inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-bold text-zinc-950 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 hover:bg-zinc-200";
const secondaryButton =
  "inline-flex items-center gap-2 rounded-lg bg-zinc-800/60 px-6 py-3 text-sm font-semibold text-zinc-200 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-500 hover:bg-zinc-800";

const trackCta = (location: SignupCtaLocation) => {
  posthog.capture("duels_cta_clicked", {
    cta_location: location,
    from_path: typeof window === "undefined" ? "" : window.location.pathname,
  });
  trackSignupCtaClicked(location, { feature: "duels" });
};

const DuelLink = ({ location }: { location: SignupCtaLocation }) => (
  <Link
    href={DUELS_CTA_HREF}
    onClick={() => trackCta(location)}
    className={primaryButton}>
    Find a duel
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

const CARD_PARTS = [
  {
    label: "The clock",
    desc: `The bar along the top is the ${DUELS_NUMBERS.durationHours} hours running down, and the time left sits beside the exercise.`,
  },
  {
    label: "Your best, and only yours",
    desc: "Your top score, its accuracy and tempo. The other side stays three question marks until the duel is settled.",
  },
  {
    label: "Attempts, both sides",
    desc: "A tick for every run either of you sends, so you know whether you are up against someone grinding or someone who has not started.",
  },
  {
    label: "Beat your best, or Ready",
    desc: "Play again, or lock in what you have. Both ready, and the result comes straight away.",
  },
];

export const DuelsPage = ({ realDuelExercise, drawReel }: DuelsPageProps) => {
  const meta = DUELS_META;
  const author = DUELS_AUTHOR;
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
            name: "Guitar duels",
            item: canonical,
          },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: DUELS_FAQS.map((faq) => ({
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
              <span className='text-zinc-400'>Guitar duels</span>
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
                  Get paired with another guitarist and a random exercise. You
                  both have {DUELS_NUMBERS.durationHours} hours and as many runs
                  as you like; only your best one counts. Win, and your rating
                  climbs.
                </p>

                <div className='mt-10 flex flex-col items-start gap-3 sm:flex-row sm:items-center'>
                  <DuelLink location='feature_hero' />
                  <a
                    href={`#${DUELS_RULES_ANCHOR}`}
                    className={secondaryButton}>
                    What a duel is
                    <ArrowDown className='h-4 w-4' aria-hidden='true' />
                  </a>
                </div>
                <p className='mt-4 max-w-md text-sm text-zinc-500'>
                  Free with your Riff Quest account. Bring a microphone for the
                  playing drills.
                </p>

                <dl className='mt-12 flex flex-wrap gap-x-10 gap-y-6'>
                  {[
                    {
                      value: `${DUELS_NUMBERS.durationHours} h`,
                      label: "per duel",
                    },
                    { value: "1v1", label: "same exercise, both sides" },
                    {
                      value: String(DUELS_NUMBERS.maxOpen),
                      label: "duels at once",
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

              <DuelFaceOff
                exercise={realDuelExercise}
                reel={drawReel}
                you={DUELS_REAL_DUEL.you}
                opponent={DUELS_REAL_DUEL.opponent}
                date='13 October 2026'
              />
            </div>
          </div>
        </section>

        {/* ── What it is ── */}
        <section id={DUELS_RULES_ANCHOR} className='scroll-mt-16 py-20'>
          <div className='mx-auto grid max-w-7xl gap-4 px-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-16'>
            <SectionIntro
              eyebrow='What it is'
              title='A practice session with a rival on the other side'>
              Two guitarists, one exercise, two days. Each of you plays it on
              your own time; the duel compares your best runs and moves a
              rating.
            </SectionIntro>
            <Reveal delay={0.05}>
              <FeatureList features={[...DUELS_IDEAS]} />
              <p className='mt-8 text-sm leading-relaxed text-zinc-500'>
                The duel rating is a ladder of its own. The points you log from
                practice go to the{" "}
                <Link
                  href='/features/guitar-practice-leaderboard'
                  className='font-bold text-cyan-400 transition-colors hover:text-cyan-300'>
                  monthly practice leaderboard
                </Link>
                .
              </p>
            </Reveal>
          </div>
        </section>

        {/* ── In the app ── */}
        <section className='py-20'>
          <div className='mx-auto max-w-7xl px-6'>
            <div className='grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-center lg:gap-16'>
              <div>
                <SectionIntro
                  eyebrow='In the app'
                  title='Everything you need, nothing you should not see'>
                  A running duel is one card on the Duels page.
                </SectionIntro>
                <Reveal delay={0.05}>
                  <FeatureList features={CARD_PARTS} />
                </Reveal>
              </div>
              <Reveal delay={0.1}>
                <Image
                  src={`${IMAGES}/active-duel.webp`}
                  alt='A running duel in Riff Quest: Finger Permutations 3-2-4-1 with 17 hours 59 minutes left, your best of 4210 at 91% and 100 BPM after 3 attempts, against an anonymous opponent shown as three question marks after 2 attempts, with Beat your best and Ready buttons'
                  width={1456}
                  height={822}
                  sizes='(min-width: 1024px) 700px, 100vw'
                  className='h-auto w-full rounded-lg'
                />
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
                A drill is easier to quit than a rival
              </h2>
              <div className='space-y-5 text-lg leading-relaxed text-zinc-400'>
                <p>
                  Practising alone, a drill ends when I get bored of it. Put
                  somebody on the other side of the same drill, and I play it
                  three more times to see if I can squeeze out a cleaner run.
                  That is the whole idea of a duel.
                </p>
                <p>
                  Two choices shaped it. The opponent stays anonymous until the
                  end, so nobody can wait to edge past a score they can see. And
                  there are {DUELS_NUMBERS.durationHours} hours instead of a
                  live match, because guitarists practise at very different
                  times of day.
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
          questions={DUELS_FAQS}
          moreLink={{
            intro: "How a run is scored, note by note, is shown here:",
            href: "/interactive-guitar-practice",
            label: "Interactive guitar practice",
          }}
        />

        {/* ── Where next ── */}
        <section className='py-20'>
          <div className='mx-auto max-w-7xl px-6'>
            <Reveal>
              <h2 className='mb-8 text-2xl font-bold text-white'>
                Get ready for your next duel
              </h2>
              <div className='grid gap-6 sm:grid-cols-3'>
                {[
                  {
                    href: "/interactive-guitar-practice",
                    title: "Interactive guitar practice",
                    text: "How Pitch Detect grades a run note by note, and what turns a good run into a high score.",
                  },
                  {
                    href: "/guitar-speed-hand-synchronization-exercises",
                    title: "Speed and hand sync",
                    text: "Spider drills and finger permutations, the backbone of the duel pool, with a routine to train them.",
                  },
                  {
                    href: "/features/desktop-guitar-practice-app",
                    title: "Desktop app",
                    text: "Your interface through its driver: lower latency and steadier input when every note counts.",
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
                Same drill. Who plays it cleaner?
              </h2>
              <DuelLink location='feature_final' />
              <p className='mt-6 max-w-md text-sm text-zinc-500'>
                Free account. Bring a microphone for the playing drills.
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
