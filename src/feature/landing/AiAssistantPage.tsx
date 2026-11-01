import { GuitarPatternBackground } from "components/GuitarPatternBackground/GuitarPatternBackground";
import { MarketingNav } from "components/MarketingNav/MarketingNav";
import { FaqSection } from "feature/landing/components/FaqSection";
import { FeatureList } from "feature/landing/components/FeatureList";
import { Reveal } from "feature/landing/components/Reveal";
import {
  AI_ASSISTANT_CANNOT,
  AI_ASSISTANT_CTA_HREF,
  AI_ASSISTANT_FAQS,
  AI_ASSISTANT_META,
  AI_ASSISTANT_PROMPTS,
  AI_ASSISTANT_SERVER_URL,
  AI_ASSISTANT_STEPS,
  AI_ASSISTANT_STEPS_ANCHOR,
} from "feature/landing/data/aiAssistant";
import { jakartaLanding } from "feature/landing/lib/fonts";
import { AUTHORS } from "lib/authors";
import { MCP_EXERCISES_PER_DAY, MCP_WRITES_PER_DAY } from "lib/mcp/limits";
import type { SignupCtaLocation } from "lib/signupFunnel";
import { trackSignupCtaClicked } from "lib/signupFunnel";
import { ArrowDown, ArrowRight, Check, ChevronRight, Copy } from "lucide-react";
import dynamic from "next/dynamic";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import posthog from "posthog-js";
import type { ReactNode } from "react";
import { useState } from "react";

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

export const AI_ASSISTANT_AUTHOR = AUTHORS["Michael Apfel"];

const primaryButton =
  "inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-bold text-zinc-950 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 hover:bg-zinc-200";
const secondaryButton =
  "inline-flex items-center gap-2 rounded-lg bg-zinc-800/60 px-6 py-3 text-sm font-semibold text-zinc-200 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-500 hover:bg-zinc-800";

const trackCta = (location: SignupCtaLocation) => {
  posthog.capture("ai_assistant_cta_clicked", {
    cta_location: location,
    from_path: typeof window === "undefined" ? "" : window.location.pathname,
  });
  trackSignupCtaClicked(location, { feature: "ai_assistant" });
};

const SupportLink = ({ location }: { location: SignupCtaLocation }) => (
  <Link
    href={AI_ASSISTANT_CTA_HREF}
    onClick={() => trackCta(location)}
    className={primaryButton}>
    Become a supporter
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

/** The address, big enough to read, with the one button anybody needs here. */
const ServerAddress = () => {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(AI_ASSISTANT_SERVER_URL);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // no clipboard (insecure context, old browser): the address is on screen
    }
  };
  return (
    <div className='flex flex-col gap-3 rounded-lg bg-zinc-900/60 p-4 sm:flex-row sm:items-center sm:justify-between sm:pl-6'>
      <code className='font-mono break-all text-base text-white sm:text-lg'>
        {AI_ASSISTANT_SERVER_URL}
      </code>
      <button
        type='button'
        onClick={copy}
        className='inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-zinc-800/80 px-4 py-2 text-sm font-semibold text-zinc-200 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-500 hover:bg-zinc-800'>
        {copied ? (
          <Check className='h-4 w-4' aria-hidden='true' />
        ) : (
          <Copy className='h-4 w-4' aria-hidden='true' />
        )}
        {copied ? "Copied" : "Copy address"}
      </button>
    </div>
  );
};

/**
 * A short, made-up exchange in the shape a real one takes: the player asks in
 * plain words, the assistant reads riff.quest and answers from it. Labelled as
 * an example; the numbers are invented, not anybody's account.
 */
const ExampleChat = () => (
  <figure className='rounded-lg bg-zinc-900/40 p-5 sm:p-6'>
    <figcaption className='mb-5 text-xs text-zinc-500'>
      Example conversation in Claude
    </figcaption>
    <div className='space-y-5'>
      <p className='ml-auto max-w-[85%] rounded-lg bg-zinc-800/80 px-4 py-3 text-sm leading-relaxed text-zinc-100'>
        What have I been neglecting this month?
      </p>
      <div className='space-y-3'>
        <p className='text-xs text-zinc-500'>
          Read riff.quest: practice history, weak spots, tempo goals
        </p>
        <div className='space-y-3 text-sm leading-relaxed text-zinc-300'>
          <p>
            You&apos;ve practised 9 h 20 min this month, and 8 h of it was
            technique. Ear training got 12 minutes and theory none at all.
          </p>
          <p>
            Your alternate picking goal has sat at 120 BPM for two weeks. Want
            me to plan a 30-minute session that warms up on intervals and then
            pushes the picking drill from 116 BPM?
          </p>
        </div>
      </div>
      <p className='ml-auto max-w-[85%] rounded-lg bg-zinc-800/80 px-4 py-3 text-sm leading-relaxed text-zinc-100'>
        Yes, save it.
      </p>
      <p className='text-xs text-emerald-400'>
        Saved to riff.quest: “30 min · Intervals + picking”
      </p>
    </div>
  </figure>
);

export const AiAssistantPage = () => {
  const meta = AI_ASSISTANT_META;
  const author = AI_ASSISTANT_AUTHOR;
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
            name: "AI assistants",
            item: canonical,
          },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: AI_ASSISTANT_FAQS.map((faq) => ({
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
              <span className='text-zinc-400'>AI assistants</span>
            </div>

            <div className='grid gap-14 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] lg:items-center'>
              <header>
                <p className='mb-3 text-sm font-bold text-amber-300'>
                  {meta.eyebrow}
                </p>
                <h1 className='mb-6 text-balance font-landingHeading text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl'>
                  {meta.title}
                </h1>
                <p className='max-w-xl text-lg leading-relaxed text-zinc-400'>
                  Connect Claude, ChatGPT or Cursor to your Riff Quest account.
                  It reads what you actually practised, plans your next session
                  and writes exercises with tabs, then saves them to your
                  account when you say so.
                </p>

                <div className='mt-10 flex flex-col items-start gap-3 sm:flex-row sm:items-center'>
                  <SupportLink location='feature_hero' />
                  <a
                    href={`#${AI_ASSISTANT_STEPS_ANCHOR}`}
                    className={secondaryButton}>
                    How to connect
                    <ArrowDown className='h-4 w-4' aria-hidden='true' />
                  </a>
                </div>
                <p className='mt-4 max-w-md text-sm text-zinc-500'>
                  A supporter perk: any donation unlocks it. Practising, logging
                  and everything else in Riff Quest stays free.
                </p>
              </header>

              <Reveal delay={0.05}>
                <ExampleChat />
              </Reveal>
            </div>
          </div>
        </section>

        {/* ── How to connect ── */}
        <section id={AI_ASSISTANT_STEPS_ANCHOR} className='scroll-mt-16 py-20'>
          <div className='mx-auto grid max-w-7xl gap-4 px-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-16'>
            <SectionIntro
              eyebrow='How to connect'
              title='Three steps, about a minute'>
              No keys to copy around and nothing to install. You sign in to Riff
              Quest from inside Claude, the same way you log in anywhere else.
            </SectionIntro>
            <Reveal delay={0.05}>
              <FeatureList features={[...AI_ASSISTANT_STEPS]} />
              <div className='mt-10 space-y-3'>
                <p className='text-sm font-bold text-white'>
                  The address to paste
                </p>
                <ServerAddress />
                <p className='text-sm leading-relaxed text-zinc-500'>
                  The same for everyone. Your account comes from signing in, not
                  from the address.
                </p>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── What to ask ── */}
        <section className='py-20'>
          <div className='mx-auto grid max-w-7xl gap-4 px-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-16'>
            <SectionIntro
              eyebrow='What to ask'
              title='Talk about your playing, not about the app'>
              Ask the way you&apos;d ask a teacher who had read your practice
              log. The assistant finds what it needs in Riff Quest on its own.
            </SectionIntro>
            <Reveal delay={0.05}>
              <FeatureList features={[...AI_ASSISTANT_PROMPTS]} />
            </Reveal>
          </div>
        </section>

        {/* ── What it can touch ── */}
        <section className='py-20'>
          <div className='mx-auto max-w-7xl px-6'>
            <SectionIntro
              eyebrow='Your account, your call'
              title='Nothing changes behind your back'>
              By default Claude asks before each change it wants to save, and if
              you don&apos;t allow changes when you connect, it can only read.
            </SectionIntro>
            <Reveal delay={0.05}>
              <div className='grid gap-6 lg:grid-cols-3'>
                <div className='rounded-lg bg-zinc-900/40 p-6'>
                  <p className='mb-3 text-sm font-bold text-white'>
                    It can read
                  </p>
                  <p className='text-sm leading-relaxed text-zinc-400'>
                    Your profile, practice history, calendar, skills, weak
                    spots, tempo goals, songs and recent scored runs, plus the
                    exercise library and the wiki.
                  </p>
                </div>
                <div className='rounded-lg bg-zinc-900/40 p-6'>
                  <p className='mb-3 text-sm font-bold text-white'>
                    It can save, if you allow it
                  </p>
                  <p className='text-sm leading-relaxed text-zinc-400'>
                    Practice plans, tempo goals, songs on your list and private
                    exercises with tabs. Up to {MCP_WRITES_PER_DAY} changes a
                    day, {MCP_EXERCISES_PER_DAY} of them new exercises.
                  </p>
                </div>
                <div className='rounded-lg bg-zinc-900/40 p-6'>
                  <p className='mb-3 text-sm font-bold text-white'>
                    It can&apos;t
                  </p>
                  <ul className='space-y-1.5 text-sm leading-relaxed text-zinc-400'>
                    {AI_ASSISTANT_CANNOT.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <p className='mt-8 max-w-2xl text-sm leading-relaxed text-zinc-500'>
                Riff Quest runs no AI for this: the thinking happens in your
                assistant. What it reads is covered in the{" "}
                <Link
                  href='/privacy-policy'
                  className='font-bold text-cyan-400 transition-colors hover:text-cyan-300'>
                  privacy policy
                </Link>
                , and Settings → AI assistants → Disconnect ends access at once.
              </p>
            </Reveal>
          </div>
        </section>

        {/* ── Why supporters ── */}
        <section className='py-20'>
          <div className='mx-auto max-w-3xl px-6'>
            <Reveal>
              <p className='mb-2 text-sm font-bold text-amber-300'>
                Why it&apos;s a supporter perk
              </p>
              <h2 className='mb-8 font-landingHeading text-3xl font-bold tracking-tight text-white sm:text-4xl'>
                A thank-you to the people who keep it free
              </h2>
              <div className='space-y-5 text-lg leading-relaxed text-zinc-400'>
                <p>
                  Riff Quest is free and runs on donations. Practising, logging,
                  the library and the rankings stay open to everyone, and that
                  isn&apos;t changing.
                </p>
                <p>
                  Connecting your own AI assistant is something extra, so it
                  goes to supporters, next to the roadmap board, the gear votes
                  and the rest of the supporter panel.
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
          questions={AI_ASSISTANT_FAQS}
          moreLink={{
            intro: "Every step and every setting, in the wiki:",
            href: "/wiki/ai-assistants",
            label: "Connect Claude or another AI assistant",
          }}
        />

        {/* ── Where next ── */}
        <section className='py-20'>
          <div className='mx-auto max-w-7xl px-6'>
            <Reveal>
              <h2 className='mb-8 text-2xl font-bold text-white'>
                What your assistant works with
              </h2>
              <div className='grid gap-6 sm:grid-cols-3'>
                {[
                  {
                    href: "/features/guitar-practice-goals",
                    title: "Tempo goals",
                    text: "The BPM goals your assistant sets, and how you climb them a few clean runs at a time.",
                  },
                  {
                    href: "/features/guitar-tab-editor",
                    title: "Your own exercises",
                    text: "Where the exercises it writes end up: your own tabs, played and scored like any other.",
                  },
                  {
                    href: "/guitar-practice-planner",
                    title: "Practice plans",
                    text: "The plans it builds with you, and how a plan turns into a session with a timer.",
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
                Your practice log, in a conversation.
              </h2>
              <SupportLink location='feature_final' />
              <p className='mt-6 max-w-md text-sm text-zinc-500'>
                Any donation unlocks it. Everything else stays free.
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
