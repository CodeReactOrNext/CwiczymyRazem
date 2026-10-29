import { GuitarPatternBackground } from "components/GuitarPatternBackground/GuitarPatternBackground";
import { MarketingNav } from "components/MarketingNav/MarketingNav";
import {
  BoonDeck,
  BoonList,
} from "feature/landing/components/bossFights/BoonDeck";
import { BossRoster } from "feature/landing/components/bossFights/BossRoster";
import { HeroFight } from "feature/landing/components/bossFights/HeroFight";
import { PhaseLadder } from "feature/landing/components/bossFights/PhaseLadder";
import { FaqSection } from "feature/landing/components/FaqSection";
import { FeatureList } from "feature/landing/components/FeatureList";
import { Reveal } from "feature/landing/components/Reveal";
import {
  BOSS_FIGHTS_CTA_HREF,
  BOSS_FIGHTS_DIFFICULTIES,
  BOSS_FIGHTS_META,
  BOSS_FIGHTS_RULES_ANCHOR,
  bossFightsFaqs,
} from "feature/landing/data/bossFights";
import type { BossFightsPageProps } from "feature/landing/lib/bossFightsProps";
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

export type { BossFightsPageProps } from "feature/landing/lib/bossFightsProps";

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

export const BOSS_FIGHTS_AUTHOR = AUTHORS["Michael Apfel"];

const primaryButton =
  "inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-bold text-zinc-950 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 hover:bg-zinc-200";
const secondaryButton =
  "inline-flex items-center gap-2 rounded-lg bg-zinc-800/60 px-6 py-3 text-sm font-semibold text-zinc-200 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-500 hover:bg-zinc-800";

const trackCta = (location: SignupCtaLocation) => {
  posthog.capture("boss_fights_cta_clicked", {
    cta_location: location,
    from_path: typeof window === "undefined" ? "" : window.location.pathname,
  });
  trackSignupCtaClicked(location, { feature: "boss_fights" });
};

const FightLink = ({ location }: { location: SignupCtaLocation }) => (
  <Link
    href={BOSS_FIGHTS_CTA_HREF}
    onClick={() => trackCta(location)}
    className={primaryButton}>
    Pick a fight
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

export const BossFightsPage = ({
  numbers,
  bosses,
  ladders,
  boons,
  rules,
  hero,
  deals,
}: BossFightsPageProps) => {
  const meta = BOSS_FIGHTS_META;
  const author = BOSS_FIGHTS_AUTHOR;
  const canonical = `https://riff.quest/${meta.slug}`;
  const ogImage = `https://riff.quest${meta.ogImage}`;
  const faqs = bossFightsFaqs(numbers);
  const heroDraft = hero.next.draft.flatMap((id) =>
    boons.filter((boon) => boon.id === id),
  );

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
            name: "Boss Fights",
            item: canonical,
          },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: faqs.map((faq) => ({
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
              <span className='text-zinc-400'>Boss Fights</span>
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
                  Pick a boss and play. Every clean note charges your sword, a
                  full sword strikes, and every miss bites back. Clear a phase
                  and the boss comes back faster with a new drill. The fight
                  never ends; the question is how far you get.
                </p>

                <div className='mt-10 flex flex-col items-start gap-3 sm:flex-row sm:items-center'>
                  <FightLink location='feature_hero' />
                  <a
                    href={`#${BOSS_FIGHTS_RULES_ANCHOR}`}
                    className={secondaryButton}>
                    How a fight works
                    <ArrowDown className='h-4 w-4' aria-hidden='true' />
                  </a>
                </div>
                <p className='mt-4 max-w-md text-sm text-zinc-500'>
                  Free with your Riff Quest account. The game listens through
                  your microphone.
                </p>

                <dl className='mt-12 flex flex-wrap gap-x-10 gap-y-6'>
                  {[
                    { value: String(bosses.length), label: "bosses" },
                    {
                      value: String(numbers.boonCount),
                      label: "boons to draft",
                    },
                    {
                      value: String(BOSS_FIGHTS_DIFFICULTIES.length),
                      label: "difficulties",
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

              <div>
                <HeroFight run={hero} draft={heroDraft} />
                <p className='mt-3 text-xs leading-relaxed text-zinc-600'>
                  Phase 1 against the Fretweaver: {hero.frames.length} notes of
                  a made-up player put through the game&apos;s own fight engine,
                  replayed faster than the real {hero.bpm} BPM.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── The bosses ── */}
        <section className='py-20'>
          <div className='mx-auto max-w-7xl px-6'>
            <SectionIntro
              eyebrow='The bosses'
              title='Three bosses, three things to train'>
              Each boss is built around one skill: one fights with finger
              drills, one with chord changes, one with changes you solo over.
              Pick the one you need.
            </SectionIntro>
            <Reveal delay={0.05}>
              <BossRoster bosses={bosses} />
            </Reveal>
          </div>
        </section>

        {/* ── How a fight works ── */}
        <section
          id={BOSS_FIGHTS_RULES_ANCHOR}
          className='scroll-mt-16 bg-zinc-900/30 py-20'>
          <div className='mx-auto grid max-w-7xl gap-4 px-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-16'>
            <div className='lg:sticky lg:top-24 lg:self-start'>
              <SectionIntro
                eyebrow='How a fight works'
                title='Play clean and it hurts. Miss and you do.'>
                The microphone hears every note and grades its timing, the same
                way it scores any exercise in the app. The fight turns those
                grades into damage.
              </SectionIntro>
            </div>
            <Reveal delay={0.05}>
              <FeatureList
                features={rules.map((rule) => ({
                  label: rule.title,
                  desc: rule.body,
                }))}
              />
            </Reveal>
          </div>
        </section>

        {/* ── Endless ── */}
        <section className='py-20'>
          <div className='mx-auto max-w-7xl px-6'>
            <SectionIntro
              eyebrow='Endless and random'
              title='Every phase a little faster than the last'>
              The first phase is gentle on purpose: {ladders[0].phases[0].bpm}{" "}
              BPM in {ladders[0].phases[0].rhythm} for the Fretweaver. After
              that the notes come a little faster every phase, a few BPM more
              and later a quicker rhythm, and every {numbers.gateEvery}th phase
              guards a gate. These are the first {ladders[0].phases.length}{" "}
              phases of one run, as the game dealt them.
            </SectionIntro>
            <Reveal delay={0.05}>
              <PhaseLadder ladders={ladders} bosses={bosses} />
            </Reveal>
          </div>
        </section>

        {/* ── The draft ── */}
        <section className='bg-zinc-900/30 py-20'>
          <div className='mx-auto max-w-7xl px-6'>
            <div className='grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-center lg:gap-16'>
              <SectionIntro
                eyebrow='The draft'
                title='Build your run, one boon at a time'>
                After every phase the game deals {numbers.draftSize} boons and
                you keep one. Armor or a sharper blade, a slower tempo or a
                faster one for more damage. Two runs rarely end up with the same
                build.
              </SectionIntro>
              <Reveal delay={0.05}>
                <BoonDeck boons={boons} deals={deals} />
              </Reveal>
            </div>
            <Reveal delay={0.05} className='mt-16'>
              <h3 className='mb-8 text-xl font-bold text-white'>
                All {boons.length} boons
              </h3>
              <BoonList boons={boons} />
            </Reveal>
          </div>
        </section>

        {/* ── Difficulty ── */}
        <section className='py-20'>
          <div className='mx-auto max-w-7xl px-6'>
            <div className='grid gap-12 lg:grid-cols-2 lg:items-start lg:gap-16'>
              <div>
                <SectionIntro
                  eyebrow='Difficulty and savepoints'
                  title='Start easy. Start deep, once you have earned it.'>
                  Difficulty changes what a miss costs and how fast every phase
                  plays, and the score follows it.
                </SectionIntro>
                <Reveal delay={0.05}>
                  <ul className='space-y-3 text-sm leading-relaxed text-zinc-400'>
                    <li>
                      Every {numbers.gateEvery}th phase is a gate:{" "}
                      <span className='font-semibold text-zinc-200'>
                        {numbers.gateHpPercent}% more HP
                      </span>{" "}
                      and bites {numbers.gateBitePercent}% harder.
                    </li>
                    <li>
                      Reach a gate and it becomes a savepoint: your next run can
                      start there. Reaching it on a harder difficulty opens it
                      on the easier ones too.
                    </li>
                    <li>
                      A run&apos;s score is the damage you dealt. Start from a
                      savepoint and the phases you skipped are added on top,
                      once you clear the one you started at.
                    </li>
                  </ul>
                </Reveal>
              </div>
              <Reveal delay={0.1}>
                <div className='overflow-x-auto rounded-lg bg-zinc-900/40 p-5 sm:p-6'>
                  <table className='w-full text-left text-sm'>
                    <caption className='sr-only'>
                      What each difficulty changes
                    </caption>
                    <thead>
                      <tr className='text-xs text-zinc-500'>
                        <th scope='col' className='pb-3 font-normal'>
                          Difficulty
                        </th>
                        <th scope='col' className='pb-3 font-normal'>
                          Bites
                        </th>
                        <th scope='col' className='pb-3 font-normal'>
                          Tempo
                        </th>
                        <th scope='col' className='pb-3 font-normal'>
                          Score
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {BOSS_FIGHTS_DIFFICULTIES.map((row) => (
                        <tr key={row.id}>
                          <th
                            scope='row'
                            className='py-2.5 font-semibold text-white'>
                            {row.label}
                          </th>
                          <td className='py-2.5 tabular-nums text-zinc-300'>
                            {row.damage}
                          </td>
                          <td className='py-2.5 tabular-nums text-zinc-300'>
                            {row.tempo}
                          </td>
                          <td className='py-2.5 font-teko text-xl tabular-nums leading-none text-white'>
                            {row.reward}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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
                The drill everyone skips, with something at stake
              </h2>
              <div className='space-y-5 text-lg leading-relaxed text-zinc-400'>
                <p>
                  Chromatic finger drills are the most useful boring thing on
                  the guitar. Everyone knows they work, and hardly anyone plays
                  them for long. I wanted a reason to play one more round, and a
                  boss at a third of its HP is a very good reason.
                </p>
                <p>
                  The first version had ten levels. I threw it out: a level you
                  have beaten is a level you never play again, and a drill you
                  never play again stops doing anything for your hands. So each
                  boss is one fight that never ends, dealt fresh every run, and
                  it only speeds up when you clear a phase.
                </p>
                <p>
                  A fight pays no{" "}
                  <Link
                    href='/features/guitar-practice-rewards'
                    className='font-bold text-cyan-400 transition-colors hover:text-cyan-300'>
                    Fame
                  </Link>
                  . It is scored in your browser, where the server cannot check
                  it, so what you keep is the practice time and a record you
                  know you earned.
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
          questions={faqs}
          moreLink={{
            intro:
              "How the microphone grades a note, and what counts as on time:",
            href: "/interactive-guitar-practice",
            label: "Interactive guitar practice",
          }}
        />

        {/* ── Where next ── */}
        <section className='py-20'>
          <div className='mx-auto max-w-7xl px-6'>
            <Reveal>
              <h2 className='mb-8 text-2xl font-bold text-white'>
                Train for the next phase
              </h2>
              <div className='grid gap-6 sm:grid-cols-3'>
                {[
                  {
                    href: "/guitar-speed-hand-synchronization-exercises",
                    title: "Speed and hand sync",
                    text: "Spider drills and finger permutations, the Fretweaver's whole repertoire, with a routine to build them up.",
                  },
                  {
                    href: "/features/guitar-duels",
                    title: "Guitar duels",
                    text: "The same kind of drills against a real player: one exercise, 48 hours, best run wins.",
                  },
                  {
                    href: "/features/desktop-guitar-practice-app",
                    title: "Desktop app",
                    text: "Your interface through its driver: lower latency, so a late note is your timing and not the browser's.",
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
                How far do you get?
              </h2>
              <FightLink location='feature_final' />
              <p className='mt-6 max-w-md text-sm text-zinc-500'>
                Free account. Bring your guitar and a microphone.
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
