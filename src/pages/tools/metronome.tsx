import { cn } from "assets/lib/utils";
import { Footer } from "feature/landing/components/Footer";
import { Metronome } from "feature/metronome/components/Metronome";
import { ChevronRight, ExternalLink } from "lucide-react";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";

const siteUrl = "https://riff.quest/tools/metronome";
const AUTHOR_URL = "https://github.com/marxd262";
const SOURCE_URL = `${AUTHOR_URL}/Metronome`;

const TITLE =
  "Online Metronome for Guitar Practice — Tempo Ramp & Speed Drills";
const DESCRIPTION =
  "Free online metronome built for guitar practice: tap tempo, accents and subdivisions per beat, a tempo ramp that climbs to your target BPM, and a slow/fast speed drill.";

const MODES = [
  {
    name: "Metronome",
    text: "A plain click at the tempo you set, plus a percentage dial that plays the same target slower — work a passage at 70% without losing track of the tempo you are aiming for.",
  },
  {
    name: "Ramp",
    text: "Starts at one tempo and steps towards another, by a percentage or a fixed number of BPM every few bars. It holds once it reaches the target, so you can stay there as long as you want.",
  },
  {
    name: "Practice",
    text: "A speed drill that cycles slow, break, fast, break. Set the fast tempo and how much slower the slow phase is; the breaks give your hands a moment before the tempo changes.",
  },
];

const FAQ = [
  {
    question: "How do I use the ramp to build speed?",
    answer:
      "Set the start tempo to a speed you can play cleanly and the stop tempo to where you want to be, then choose a small step — two or three percent every two or four bars. If the passage falls apart before the ramp reaches the target, the last clean tempo is your real working speed for today.",
  },
  {
    question: "What is the slow/fast practice drill for?",
    answer:
      "Switching between a comfortable tempo and one just above your limit. The slow phase lets you play the passage accurately; the fast phase makes your hands move at the speed you are working towards. Going back and forth builds speed faster than grinding at one tempo.",
  },
  {
    question: "How do I accent a beat or add subdivisions?",
    answer:
      "The pattern editor under the tempo controls shows every beat of the bar split into its subdivisions. Click a slot to cycle it between accented, normal, quiet and muted, or pick one of the preset rhythms to fill the bar in one go.",
  },
  {
    question: "Are there keyboard shortcuts?",
    answer:
      "Space starts and stops the click. The up and down arrows move the tempo by one BPM, or by five with Shift held. Click the metronome once first so it has the keyboard focus.",
  },
  {
    question: "Why don't I hear anything?",
    answer:
      "Browsers only start audio after you interact with the page, so press Start rather than waiting for it to play. On a phone, check that the ringer or silent switch isn't muting the browser.",
  },
  {
    question: "Does it remember my settings?",
    answer:
      "Yes — tempo, pattern, sound and mode are saved in your browser and restored the next time you open the page. Nothing is sent to a server.",
  },
];

const MetronomePage = () => (
  <>
    <Head>
      <title>{TITLE}</title>
      <meta name='description' content={DESCRIPTION} />
      <link rel='canonical' href={siteUrl} />
      <meta property='og:title' content={TITLE} />
      <meta property='og:description' content={DESCRIPTION} />
      <meta property='og:url' content={siteUrl} />
      <meta property='og:type' content='website' />
      <meta
        property='og:image'
        content='https://riff.quest/images/og-image.png'
      />
      <meta name='twitter:card' content='summary_large_image' />
      <meta name='twitter:title' content={TITLE} />
      <meta name='twitter:description' content={DESCRIPTION} />
      <meta
        name='twitter:image'
        content='https://riff.quest/images/og-image.png'
      />
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "Guitar Practice Metronome",
              url: siteUrl,
              applicationCategory: "MultimediaApplication",
              operatingSystem: "Any browser",
              description: DESCRIPTION,
              author: { "@type": "Person", name: "marxd262", url: AUTHOR_URL },
              offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
              featureList: [
                "Tap tempo",
                "Per-beat accents and subdivisions",
                "Tempo ramp from a start to a target BPM",
                "Slow/fast speed drill with breaks",
              ],
            },
            {
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: FAQ.map((item) => ({
                "@type": "Question",
                name: item.question,
                acceptedAnswer: { "@type": "Answer", text: item.answer },
              })),
            },
            {
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: [
                {
                  "@type": "ListItem",
                  position: 1,
                  name: "Tools",
                  item: "https://riff.quest/tools",
                },
                {
                  "@type": "ListItem",
                  position: 2,
                  name: "Metronome",
                  item: siteUrl,
                },
              ],
            },
          ]),
        }}
      />
    </Head>

    <main className='min-h-screen overflow-x-hidden bg-zinc-950 text-zinc-300'>
      <nav className='fixed left-0 right-0 top-0 z-50 bg-zinc-950/90 backdrop-blur-sm'>
        <div className='mx-auto flex h-16 max-w-4xl items-center justify-between px-6'>
          <Link href='/' className='transition-opacity hover:opacity-70'>
            <Image
              src='/images/longlightlogo.svg'
              alt='Riff Quest'
              width={120}
              height={32}
              className='h-6 w-auto'
              priority
            />
          </Link>
          <div className='flex items-center gap-6'>
            <Link
              href='/tools'
              className='text-sm text-zinc-400 transition-colors hover:text-white'>
              Tools
            </Link>
            <Link
              href='/signup'
              className='text-sm font-medium text-cyan-400 transition-colors hover:text-cyan-300'>
              Start Free →
            </Link>
          </div>
        </div>
      </nav>

      <div className='mx-auto max-w-3xl px-6 pb-24 pt-28'>
        <div className='mb-6 flex items-center gap-1.5 text-xs text-zinc-600'>
          <Link href='/tools' className='transition-colors hover:text-zinc-400'>
            Tools
          </Link>
          <ChevronRight className='h-3 w-3' />
          <span className='text-zinc-500'>Metronome</span>
        </div>

        <h1 className='text-4xl font-black text-white'>
          Online metronome for guitar
        </h1>
        <p className='mt-3 text-zinc-400'>
          Tap tempo, accents per beat, a tempo ramp and a slow/fast speed drill.
          Press Start, or hit Space once you have clicked into it.
        </p>

        {/* From 900px the metronome splits into controls + readout columns, which
            need more room than the article column gives the text around it. */}
        <div className='mt-8 md:-mx-16 lg:-mx-32'>
          <Metronome />
        </div>

        <div className='mt-8 flex flex-wrap items-center gap-5 rounded-2xl bg-zinc-900/40 p-6'>
          <Image
            src={`${AUTHOR_URL}.png?size=112`}
            alt='marxd262'
            width={56}
            height={56}
            className='h-14 w-14 shrink-0 rounded-full'
          />
          <div className='min-w-0 flex-1 space-y-1'>
            <p className='text-sm text-zinc-400'>Metronome built by</p>
            <a
              href={AUTHOR_URL}
              target='_blank'
              rel='noopener noreferrer'
              className='text-xl font-black text-white transition-colors hover:text-cyan-300'>
              marxd262
            </a>
            <p className='text-sm text-zinc-500'>
              Open source, shared on Riff Quest with the author&apos;s
              permission.
            </p>
          </div>
          <a
            href={SOURCE_URL}
            target='_blank'
            rel='noopener noreferrer'
            className='flex items-center gap-2 rounded-lg bg-zinc-800/60 px-4 py-2.5 text-sm font-bold text-zinc-200 transition-background hover:bg-zinc-800'>
            Source on GitHub
            <ExternalLink className='h-4 w-4' />
          </a>
        </div>

        <section className='mt-24' id='modes'>
          <h2 className='text-2xl font-black text-white'>
            Three ways to practise with it
          </h2>
          <ol className='mt-8 space-y-6'>
            {MODES.map((mode, index) => (
              <li key={mode.name} className='flex gap-5'>
                <span className='flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 text-sm font-black text-cyan-400'>
                  {index + 1}
                </span>
                <div className='space-y-1.5'>
                  <h3 className='font-bold text-white'>{mode.name}</h3>
                  <p className='text-sm leading-relaxed text-zinc-400'>
                    {mode.text}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className='mt-24' id='faq'>
          <h2 className='text-2xl font-black text-white'>
            Metronome questions
          </h2>
          <div className='mt-8 space-y-8'>
            {FAQ.map((item) => (
              <div key={item.question} className='space-y-2'>
                <h3 className='font-bold text-white'>{item.question}</h3>
                <p className='text-sm leading-relaxed text-zinc-400'>
                  {item.answer}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className='mt-24 rounded-2xl bg-cyan-500/10 p-8'>
          <h2 className='text-2xl font-black text-white'>
            Keep the tempo. Keep the record.
          </h2>
          <p className='mt-3 max-w-xl text-sm leading-relaxed text-zinc-300'>
            Riff Quest tracks your practice: exercises with a built-in click,
            tabs that listen to what you play, and a history of the tempos you
            have reached. It is free — no subscription, no paywall.
          </p>
          <div className='mt-6 flex flex-wrap items-center gap-3'>
            <Link
              href='/signup'
              className={cn(
                "rounded-lg bg-cyan-500 px-5 py-2.5 text-sm font-bold text-zinc-950",
                "transition-background hover:bg-cyan-400",
              )}>
              Start practising free
            </Link>
            <Link
              href='/tools/tuner'
              className='rounded-lg bg-zinc-900/60 px-5 py-2.5 text-sm font-bold text-zinc-300 transition-background hover:bg-zinc-800'>
              Guitar tuner
            </Link>
            <Link
              href='/tools'
              className='rounded-lg px-2 py-2.5 text-sm font-bold text-zinc-400 transition-colors hover:text-white'>
              All guitar tools →
            </Link>
          </div>
        </section>
      </div>

      <Footer />
    </main>
  </>
);

export default MetronomePage;
