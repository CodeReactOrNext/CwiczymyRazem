import { Footer } from "feature/landing/components/Footer";
import { AudioLines, ExternalLink, Grid3x3, ListMusic, Rewind, Sparkles, Target, Timer } from "lucide-react";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import type { ComponentType } from "react";

type PriceTier = "free" | "freemium" | "paid";

interface Tool {
  name: string;
  url: string;
  description: string;
  logo: string;
  price: PriceTier;
  ai?: boolean;
  isOwnApp?: boolean;
}

interface ToolCategory {
  id: string;
  name: string;
  icon: ComponentType<{ className?: string }>;
  tools: Tool[];
}

const CATEGORIES: ToolCategory[] = [
  {
    id: "tabs",
    name: "Tabs, Chords & Notation",
    icon: ListMusic,
    tools: [
      {
        name: "Ultimate Guitar",
        url: "https://www.ultimate-guitar.com/",
        description: "The largest tab and chord database on the web, built and moderated by the community.",
        logo: "/images/tools/ultimate-guitar.png",
        price: "freemium",
      },
      {
        name: "Songsterr",
        url: "https://www.songsterr.com/",
        description: "Tab database with synced audio playback: mute or solo individual tracks, slow down the tempo, and follow along as it plays.",
        logo: "/images/tools/songsterr.ico",
        price: "freemium",
      },
      {
        name: "Guitar Pro",
        url: "https://www.guitar-pro.com/",
        description: "Tab editor and player. Guitar Pro 8 lets you add an audio track synced to the tab, then slow it down, speed it up, or change its pitch without losing sync.",
        logo: "/images/tools/guitar-pro.png",
        price: "paid",
      },
      {
        name: "MuseScore Studio",
        url: "https://musescore.org/",
        description: "Free notation and tab editor for writing and editing your own scores from scratch.",
        logo: "/images/tools/musescore.ico",
        price: "free",
      },
      {
        name: "TuxGuitar",
        url: "https://tuxguitar.app/",
        description: "Open-source tab editor that reads and writes Guitar Pro files, handy for converting a MuseScore or MIDI file into a GP file to import into Riff Quest.",
        logo: "/images/tools/tuxguitar.png",
        price: "free",
      },
      {
        name: "StrumForge",
        url: "https://strumforge.com/",
        description: "Chord progression generator: fingering diagrams, groove controls, scale diagrams, and practice-ready rhythm patterns in one screen.",
        logo: "/images/tools/strumforge.png",
        price: "free",
      },
    ],
  },
  {
    id: "fretboard",
    name: "Fretboard, Scales & Theory",
    icon: Grid3x3,
    tools: [
      {
        name: "Freta",
        url: "https://freta.app/",
        description: "An interactive fretboard diagram for exploring scales, chords, and positions in any tuning.",
        logo: "/images/tools/freta.png",
        price: "free",
      },
      {
        name: "Fretboard Forever",
        url: "https://fretboardforever.app/",
        description: "Learn the notes on your fretboard until they become second nature, no more hesitating.",
        logo: "/images/tools/fretboard-forever.png",
        price: "free",
      },
      {
        name: "QFGM (Quinn Fetrow)",
        url: "https://quinnfetrowsguitarmachines.com/",
        description: "A toolkit for learning notes, scales, arpeggios, and improvisation.",
        logo: "/images/tools/qfgm.png",
        price: "free",
      },
    ],
  },
  {
    id: "rhythm",
    name: "Metronome & Rhythm",
    icon: Timer,
    tools: [
      {
        name: "Metronomus",
        url: "https://metronom.us/en/",
        description: "A free online metronome: tempo (BPM), time signature, lots of rhythm patterns, mouse, keyboard, and touch control.",
        logo: "/images/tools/metronomus.png",
        price: "free",
      },
      {
        name: "Flicktool",
        url: "https://flicktool.com/online-metronome/",
        description: "A simple online metronome with no clutter: tempo and time signature, straight to the point.",
        logo: "/images/tools/flicktool.png",
        price: "free",
      },
      {
        name: "Polyrhythm Metronome",
        url: "https://poly.ozieblowski.dev/",
        description: "An open-source polyrhythm generator for practice divisions like 13:7, 3:4:5, or any other split.",
        logo: "/images/tools/polyrhythm.png",
        price: "free",
      },
      {
        name: "4four.io",
        url: "https://4four.io/",
        description: "A rhythm and music theory training platform with score tracking; teachers can create exercises for students. Free and mobile-friendly.",
        logo: "/images/tools/4four.png",
        price: "free",
      },
      {
        name: "Metric Flow App",
        url: "https://www.tomquayle.co.uk/metric-flow-app/",
        description: "Tom Quayle's app for rhythm training.",
        logo: "/images/tools/metricflow.png",
        price: "paid",
      },
    ],
  },
  {
    id: "backing",
    name: "Backing Tracks & Stem Separation",
    icon: AudioLines,
    tools: [
      {
        name: "Moises",
        url: "https://moises.ai/",
        description: "Removes the guitar from a recording and turns it into a backing track. Also changes tempo, pitch, and more.",
        logo: "/images/tools/moises.svg",
        price: "freemium",
        ai: true,
      },
      {
        name: "Jamzone",
        url: "https://www.jamzone.com/",
        description: "A collection of backing tracks recorded by real musicians, with control over each individual stem.",
        logo: "/images/tools/jamzone.png",
        price: "freemium",
      },
      {
        name: "MVSEP",
        url: "https://mvsep.com/en",
        description: "Splits a recording into vocals and instruments, and extracts lyrics from audio. Free, though an account speeds up processing.",
        logo: "/images/tools/mvsep.ico",
        price: "free",
        ai: true,
      },
    ],
  },
  {
    id: "slowdown",
    name: "Slow-Down & Ear Transcription",
    icon: Rewind,
    tools: [
      {
        name: "Transpose",
        url: "https://transpose.video/",
        description: "Transpose, pitch shift, loop sections, and change the speed of a recording.",
        logo: "/images/tools/transpose.png",
        price: "free",
      },
      {
        name: "Transcribe!",
        url: "https://www.seventhstring.com/xscribe/overview.html",
        description: "One of the best slow-down algorithms for ear transcription, better than plenty of DAWs. Chord analysis, available on Windows/Mac/Linux.",
        logo: "/images/tools/transcribe.ico",
        price: "paid",
      },
      {
        name: "Anytune",
        url: "https://www.anytune.app/",
        description: "Slow down recordings and learn songs by ear.",
        logo: "/images/tools/anytune.png",
        price: "freemium",
      },
    ],
  },
  {
    id: "guided",
    name: "Guided Practice",
    icon: Target,
    tools: [
      {
        name: "riff.quest",
        url: "/",
        description: "Session tracking, exercise and practice plans, scoring, leaderboards, songs, and playlists: the app this list lives on.",
        logo: "/images/logolight.svg",
        price: "freemium",
        isOwnApp: true,
      },
      {
        name: "Solotrainer",
        url: "https://www.solotrainer.app/",
        description: "Tom Quayle's app for practicing solos and phrasing.",
        logo: "/images/tools/solotrainer.png",
        price: "paid",
      },
    ],
  },
];

const PRICE_LABEL: Record<PriceTier, string> = {
  free: "Free",
  freemium: "Freemium",
  paid: "Paid",
};

const PRICE_CLASSES: Record<PriceTier, string> = {
  free: "bg-emerald-500/10 text-emerald-400",
  freemium: "bg-amber-500/10 text-amber-400",
  paid: "bg-zinc-800 text-zinc-400",
};

const totalTools = CATEGORIES.reduce((sum, category) => sum + category.tools.length, 0);
const siteUrl = "https://riff.quest/tools";

const ToolsPage = () => {
  return (
    <>
      <Head>
        <title>22 Guitar Tools Worth Using Alongside Riff Quest</title>
        <meta name="description" content="22 tools for tabs, fretboard drilling, metronomes, backing tracks, and ear transcription, the things Riff Quest doesn't cover, marked free, freemium, or paid." />
        <link rel='canonical' href={siteUrl} />
        <meta property="og:title" content="22 Guitar Tools Worth Using Alongside Riff Quest" />
        <meta property="og:description" content="What I use for tabs, fretboard drilling, metronomes, backing tracks, and ear transcription: the things Riff Quest doesn't cover." />
        <meta property="og:url" content={siteUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://riff.quest/images/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="22 Guitar Tools Worth Using Alongside Riff Quest" />
        <meta name="twitter:description" content="What I use for tabs, fretboard drilling, metronomes, backing tracks, and ear transcription: the things Riff Quest doesn't cover." />
        <meta name="twitter:image" content="https://riff.quest/images/og-image.png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "ItemList",
              "name": "Guitar Practice Tools",
              "itemListElement": CATEGORIES.flatMap((category) => category.tools).map((tool, index) => ({
                "@type": "ListItem",
                "position": index + 1,
                "name": tool.name,
                "url": tool.url.startsWith("http") ? tool.url : siteUrl,
              })),
            }),
          }}
        />
      </Head>

      <main className="min-h-screen bg-zinc-950 text-zinc-300 overflow-x-hidden">
        <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-zinc-950/90 backdrop-blur-sm">
          <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-6">
            <Link href="/" className="transition-opacity hover:opacity-70">
              <Image src='/images/longlightlogo.svg' alt='Riff Quest' width={120} height={32} className='h-6 w-auto' priority />
            </Link>
            <div className="flex items-center gap-6">
              <Link href="/login" className="text-sm text-zinc-400 hover:text-white transition-colors">Login</Link>
              <Link href="/signup" className="text-sm font-medium text-cyan-400 hover:text-cyan-300 transition-colors">Start Free →</Link>
            </div>
          </div>
        </nav>

        <div className="mx-auto max-w-5xl px-6 pb-24 pt-32">
          <div className="mb-16 max-w-2xl">
            <p className="mb-4 text-xs text-zinc-500">
              Michael Apfel, riff.quest founder. Last checked August 2026.
            </p>
            <h1 className="text-4xl font-black text-white mb-6">Tools worth using alongside Riff Quest</h1>
            <p className="text-lg text-zinc-400 leading-relaxed">
              Riff Quest handles session tracking, practice plans, and scoring, but it won&apos;t give you a tab, slow a recording down for ear training, or generate a backing track. These are the {totalTools} tools I use for that instead, grouped by what you&apos;d reach for them to do. Every entry is marked free, freemium, or paid, and anything leaning on a model to do the work carries an AI badge.
            </p>
          </div>

          <div className="space-y-16">
            {CATEGORIES.map((category) => {
              const Icon = category.icon;
              return (
                <section key={category.id} id={category.id}>
                  <div className="mb-5 flex items-center gap-3">
                    <Icon className="h-4 w-4 shrink-0 text-cyan-400" />
                    <h2 className="text-lg font-bold text-white">{category.name}</h2>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {category.tools.map((tool) => (
                      <Link
                        key={tool.name}
                        href={tool.url}
                        target={tool.url.startsWith("http") ? "_blank" : undefined}
                        rel={tool.url.startsWith("http") ? "noopener noreferrer" : undefined}
                        className={
                          tool.isOwnApp
                            ? "group flex flex-col gap-3 rounded-lg bg-cyan-500/10 p-5 transition-background hover:bg-cyan-500/[0.16]"
                            : "group flex flex-col gap-3 rounded-lg bg-zinc-900/40 p-5 transition-background hover:bg-zinc-800/40"
                        }>
                        <div className="flex items-center gap-3">
                          <span
                            className={
                              tool.isOwnApp
                                ? "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-zinc-900/60 p-2.5"
                                : "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-zinc-100 p-2"
                            }>
                            <Image src={tool.logo} alt="" width={28} height={28} className="h-full w-full object-contain" unoptimized />
                          </span>
                          <span className="text-sm font-bold text-white">{tool.name}</span>
                        </div>

                        <p className="flex-grow text-sm leading-relaxed text-zinc-400">{tool.description}</p>

                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wide ${PRICE_CLASSES[tool.price]}`}>
                              {PRICE_LABEL[tool.price]}
                            </span>
                            {tool.ai && (
                              <span className="flex items-center gap-1 rounded bg-purple-500/10 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-purple-400" title="Uses artificial intelligence">
                                <Sparkles className="h-2.5 w-2.5" />
                                AI
                              </span>
                            )}
                            {tool.isOwnApp && (
                              <span className="rounded bg-cyan-500/15 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-cyan-400">
                                This app
                              </span>
                            )}
                          </div>
                          <ExternalLink className="h-3.5 w-3.5 shrink-0 text-zinc-500 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>

          <p className="mt-16 max-w-2xl text-xs leading-relaxed text-zinc-600">
            Logos belong to their respective owners and are shown for identification only. Pricing can change, so check each tool&apos;s site for current terms.
          </p>
        </div>

        <Footer />
      </main>
    </>
  );
};

export default ToolsPage;
