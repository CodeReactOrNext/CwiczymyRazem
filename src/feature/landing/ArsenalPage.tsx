import { GuitarPatternBackground } from "components/GuitarPatternBackground/GuitarPatternBackground";
import { MarketingNav } from "components/MarketingNav/MarketingNav";
import { CaseReveal } from "feature/landing/components/arsenal/CaseReveal";
import { FameCalculator } from "feature/landing/components/arsenal/FameCalculator";
import { GearMarquee } from "feature/landing/components/arsenal/GearMarquee";
import { PedalChainDemo } from "feature/landing/components/arsenal/PedalChainDemo";
import { RARITY_COLOR } from "feature/landing/components/arsenal/rarity";
import { FaqSection } from "feature/landing/components/FaqSection";
import { FeatureList } from "feature/landing/components/FeatureList";
import { RoadmapPipeline } from "feature/landing/components/playerRoadmaps/RoadmapPipeline";
import { Reveal } from "feature/landing/components/Reveal";
import {
  ARSENAL_CTA_HREF,
  ARSENAL_DAILY_QUEST_FAME,
  ARSENAL_FAQS,
  ARSENAL_LOOP,
  ARSENAL_META,
  ARSENAL_SHOPS,
  ARSENAL_WORKSHOP,
} from "feature/landing/data/arsenal";
import type { ArsenalPageProps } from "feature/landing/lib/arsenalProps";
import { jakartaLanding } from "feature/landing/lib/fonts";
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

export type { ArsenalPageProps } from "feature/landing/lib/arsenalProps";

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

export const ARSENAL_AUTHOR = AUTHORS["Michael Apfel"];

const primaryButton =
  "inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-bold text-zinc-950 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 hover:bg-zinc-200";
const secondaryButton =
  "inline-flex items-center gap-2 rounded-lg bg-zinc-800/60 px-6 py-3 text-sm font-semibold text-zinc-200 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-500 hover:bg-zinc-800";

const trackCta = (location: SignupCtaLocation) => {
  posthog.capture("arsenal_cta_clicked", {
    cta_location: location,
    from_path: typeof window === "undefined" ? "" : window.location.pathname,
  });
  trackSignupCtaClicked(location, { feature: "arsenal" });
};

const StartLink = ({ location }: { location: SignupCtaLocation }) => (
  <Link
    href={ARSENAL_CTA_HREF}
    onClick={() => trackCta(location)}
    className={primaryButton}>
    Start earning Fame
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

export const ArsenalPage = ({
  counts,
  rarities,
  cases,
  reveals,
  gallery,
  chain,
  chainFame,
}: ArsenalPageProps) => {
  const meta = ARSENAL_META;
  const author = ARSENAL_AUTHOR;
  const canonical = `https://riff.quest/${meta.slug}`;
  const ogImage = `https://riff.quest${meta.ogImage}`;
  const priceOf = (id: string) => cases.find((entry) => entry.id === id);

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
            name: "Practice rewards",
            item: canonical,
          },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: ARSENAL_FAQS.map((faq) => ({
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
              <span className='text-zinc-400'>Practice rewards</span>
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
                  Every minute you practise pays Fame. Spend it on cases of
                  guitars and pedals, build them up in the Workshop, and wire a
                  pedalboard that pays you back every hour you play. None of it
                  makes you a better guitarist. It is what the practice buys.
                </p>

                <div className='mt-10 flex flex-col items-start gap-3 sm:flex-row sm:items-center'>
                  <StartLink location='feature_hero' />
                  <a href='#how-it-pays' className={secondaryButton}>
                    How it pays
                  </a>
                </div>
                <p className='mt-4 max-w-md text-sm text-zinc-500'>
                  Free. Fame is earned by playing and cannot be bought.
                </p>

                <dl className='mt-12 flex flex-wrap gap-x-10 gap-y-6'>
                  {[
                    { value: counts.guitars, label: "guitars to collect" },
                    { value: counts.pedals, label: "pedals" },
                    { value: rarities.length, label: "rarities" },
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

              <CaseReveal reveals={reveals} />
            </div>
          </div>
        </section>

        {/* ── The loop ── */}
        <section id='how-it-pays' className='scroll-mt-16 py-20'>
          <div className='mx-auto grid max-w-7xl gap-4 px-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-16'>
            <div className='lg:sticky lg:top-24 lg:self-start'>
              <SectionIntro
                eyebrow='The loop'
                title='Practice pays, the rig pays back'>
                Fame is the currency of the Arsenal, and practice is where it
                comes from. The better the rig you build with it, the more each
                hour of practice pays.
              </SectionIntro>
            </div>
            <RoadmapPipeline stages={ARSENAL_LOOP} />
          </div>
        </section>

        {/* ── Fame maths ── */}
        <section className='bg-zinc-900/30 py-20'>
          <div className='mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-2 lg:items-start lg:gap-16'>
            <SectionIntro
              eyebrow='The maths'
              title='What a day at the guitar is worth'>
              Practice pays on a curve that favours a short daily habit over a
              marathon. Your rig adds a rate per hour that grows with its level.
              Move the sliders: these are the formulas the game pays with.
            </SectionIntro>
            <Reveal delay={0.05}>
              <FameCalculator
                questFame={ARSENAL_DAILY_QUEST_FAME}
                cases={[
                  priceOf("standard"),
                  priceOf("elite-guitar"),
                  priceOf("vault-guitar"),
                ]
                  .filter((entry): entry is (typeof cases)[number] => !!entry)
                  .map((entry) => ({
                    name: entry.name,
                    fame: entry.fame,
                  }))}
              />
            </Reveal>
          </div>
        </section>

        {/* ── Cases ── */}
        <section className='py-20'>
          <div className='mx-auto max-w-7xl px-6'>
            <SectionIntro
              eyebrow='Cases'
              title={`From ${Math.min(...cases.map((entry) => entry.fame))} to ${Math.max(...cases.map((entry) => entry.fame))} Fame`}>
              The dearer the case, the better the odds. Every gear case counts
              your bad luck, and when the bar fills it owes you a model you have
              not found or a rarer drop. Open five or ten at once, and the last
              one in the pack is owed a new model, or a Rare or better once
              nothing new is left.
            </SectionIntro>
            <Reveal
              delay={0.05}
              className='grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6'>
              {cases.map((entry) => (
                <div
                  key={entry.id}
                  className='flex flex-col items-center rounded-lg bg-zinc-900/40 p-4 text-center'>
                  <Image
                    src={entry.image}
                    alt={entry.name}
                    width={400}
                    height={400}
                    className='h-28 w-auto select-none object-contain'
                  />
                  <p className='mt-3 text-sm font-semibold text-white'>
                    {entry.name}
                  </p>
                  <p className='mt-1 text-xs text-zinc-500'>{entry.note}</p>
                  <p className='mt-3 font-teko text-2xl tabular-nums leading-none text-zinc-200'>
                    {entry.fame}
                    <span className='ml-1 font-sans text-xs text-zinc-500'>
                      Fame
                    </span>
                  </p>
                </div>
              ))}
            </Reveal>
          </div>
        </section>

        {/* ── Collection ── */}
        <section className='bg-zinc-900/30 py-20'>
          <div className='mx-auto max-w-7xl px-6'>
            <SectionIntro
              eyebrow='The collection'
              title={`${counts.guitars} guitars and ${counts.pedals} pedals, no two quite alike`}>
              Each one is drawn for the game, with a rarity, and rolls its own
              condition, year and country of make when it drops, so two copies
              of the same model are rarely worth the same. The Dex keeps every
              model you have ever found.
            </SectionIntro>
            <Reveal delay={0.05}>
              <div className='mb-8 flex flex-wrap gap-x-6 gap-y-2 text-sm'>
                {rarities.map((rarity) => (
                  <span key={rarity} className='flex items-center gap-2'>
                    <span
                      className='h-2 w-2 rounded-full'
                      style={{ background: RARITY_COLOR[rarity] }}
                    />
                    <span className='text-zinc-300'>{rarity}</span>
                  </span>
                ))}
              </div>
            </Reveal>
          </div>
          <GearMarquee gear={gallery} />
          <div className='mx-auto mt-12 max-w-7xl px-6'>
            <Reveal>
              <Image
                src='/images/wiki/arsenal-stash-board.webp'
                alt='The Arsenal stash board: a grid of sockets holding guitars, pedals, pickups and parts, each tinted by rarity with its item level in the corner'
                width={2332}
                height={1266}
                sizes='(min-width: 1280px) 1232px, 100vw'
                className='h-auto w-full rounded-lg'
              />
            </Reveal>
          </div>
        </section>

        {/* ── Workshop ── */}
        <section className='py-20'>
          <div className='mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-2 lg:items-start lg:gap-16'>
            <SectionIntro
              eyebrow='The Workshop'
              title='Make the copy you love the best one'>
              Scrap what you do not want for parts, and spend the parts on what
              you keep. Every job raises the item&apos;s level, and the level is
              what your rig is ranked on.
            </SectionIntro>
            <Reveal delay={0.05}>
              <FeatureList features={[...ARSENAL_WORKSHOP]} />
            </Reveal>
          </div>
        </section>

        {/* ── Rig ── */}
        <section className='bg-zinc-900/30 py-20'>
          <div className='mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:items-center lg:gap-16'>
            <div>
              <SectionIntro
                eyebrow='The rig'
                title='A pedalboard wired like a real one'>
                Equip your guitars and stand your pedals on a board. Your Rig
                Level, the sum of everything in service, ranks you on the gear
                board and sets what each hour of practice pays.
              </SectionIntro>
              <Reveal delay={0.05}>
                <ul className='space-y-3 text-sm leading-relaxed text-zinc-400'>
                  <li>
                    Every cable that runs into the pedal that belongs next pays{" "}
                    <span className='font-semibold text-zinc-200'>
                      {chainFame.perCable} Fame an hour
                    </span>
                    .
                  </li>
                  <li>
                    A board of {chainFame.flawlessMinPedals} or more pedals with
                    nothing out of order adds{" "}
                    <span className='font-semibold text-zinc-200'>
                      {chainFame.flawless}
                    </span>
                    .
                  </li>
                  <li>
                    A pedal in every stage of the chain, from tuner to reverb,
                    pays{" "}
                    <span className='font-semibold text-zinc-200'>
                      {chainFame.complete} an hour
                    </span>{" "}
                    on its own.
                  </li>
                  <li>
                    Every pedal needs an output on the power supply, so a bigger
                    brick is the first upgrade a growing board wants.
                  </li>
                </ul>
              </Reveal>
            </div>
            <Reveal delay={0.1}>
              <PedalChainDemo chain={chain} chainFame={chainFame} />
            </Reveal>
          </div>
        </section>

        {/* ── Shops ── */}
        <section className='py-20'>
          <div className='mx-auto max-w-7xl px-6'>
            <SectionIntro
              eyebrow='Beyond the cases'
              title='Shop, trade, order, or build your own'
            />
            <Reveal delay={0.05} className='grid gap-4 sm:grid-cols-2'>
              {ARSENAL_SHOPS.map((shop) => (
                <div key={shop.title} className='rounded-lg bg-zinc-900/40 p-6'>
                  <h3 className='text-lg font-bold text-white'>{shop.title}</h3>
                  <p className='mt-2 text-sm leading-relaxed text-zinc-400'>
                    {shop.text}
                  </p>
                </div>
              ))}
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
                Gear is the reward guitarists already chase
              </h2>
              <div className='space-y-5 text-lg leading-relaxed text-zinc-400'>
                <p>
                  Points and streaks tell you that you practised. They do not
                  give you anything to want. Every guitarist I know already
                  wants something: the next pedal, a better guitar, a board that
                  finally sits right.
                </p>
                <p>
                  So the Arsenal turns practice into that. It is kept apart from
                  your level on purpose: what you play decides your ranking, and
                  the gear is only what the time at the guitar buys. And it
                  cannot be bought, because a reward you can pay for stops being
                  a reward for practising.
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
          questions={ARSENAL_FAQS}
          moreLink={{
            intro:
              "Every case, job and price in detail is in the knowledge base:",
            href: "/wiki/arsenal-and-gear",
            label: "Arsenal and gear",
          }}
        />

        {/* ── Where next ── */}
        <section className='py-20'>
          <div className='mx-auto max-w-7xl px-6'>
            <Reveal>
              <h2 className='mb-8 text-2xl font-bold text-white'>
                Ways to earn more Fame
              </h2>
              <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-4'>
                {[
                  {
                    href: "/features/guitar-learning-path",
                    title: "Guitar learning path",
                    text: "Finish a module and a reward waits at the end of the path, headed by a guitar for your collection.",
                  },
                  {
                    href: "/features/guitar-tab-editor",
                    title: "Share your exercises",
                    text: "Every thank-you on an exercise you wrote pays Fame, and so does each new player who completes it.",
                  },
                  {
                    href: "/features/guitar-duels",
                    title: "Guitar duels",
                    text: "One exercise, two players, 48 hours. A practice session with a rival on the other side.",
                  },
                  {
                    href: "/features/guitar-practice-leaderboard",
                    title: "Monthly seasons",
                    text: "The top ten players of every month get Fame when the season closes.",
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
                Your next pedal is a practice session away.
              </h2>
              <StartLink location='feature_final' />
              <p className='mt-6 max-w-md text-sm text-zinc-500'>
                Free account. Every session you log pays Fame from day one.
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
