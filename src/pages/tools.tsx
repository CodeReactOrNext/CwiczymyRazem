import { Footer } from "feature/landing/components/Footer";
import AppLayout from "layouts/AppLayout";
import { AudioLines, ExternalLink, Grid3x3, ListMusic, Rewind, Sparkles, Target, Timer } from "lucide-react";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import type { ComponentType, ReactElement } from "react";
import type { NextPageWithLayout } from "types/page";

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
        name: "Guitar Pro",
        url: "https://www.guitar-pro.com/",
        description: "Tab editor and player. Guitar Pro 8 lets you add an audio track synced to the tab — slow it down, speed it up, or change its pitch without losing sync with the notation.",
        logo: "/images/tools/guitar-pro.png",
        price: "paid",
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
        description: "Learn the notes on your fretboard until they become second nature — no more hesitating.",
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
        description: "A simple online metronome with no clutter — tempo and time signature, straight to the point.",
        logo: "/images/tools/flicktool.png",
        price: "free",
      },
      {
        name: "Polyrhythm Metronome",
        url: "https://poly.ozieblowski.dev/",
        description: "An open-source polyrhythm generator — practice divisions like 13:7, 3:4:5, or any other split.",
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
        description: "Splits a recording into vocals and instruments, and extracts lyrics from audio. Free — an account speeds up processing.",
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
        description: "Session tracking, exercise and practice plans, scoring, leaderboards, songs, and playlists — the app this list lives on.",
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

const ToolsPage: NextPageWithLayout = () => {
  const { status } = useSession();
  const isLogged = status === "authenticated";

  return (
    <>
      <Head>
        <title>19 Guitar Practice Tools (Free & Paid) | Riff Quest</title>
        <meta name="description" content="A curated list of external tools for guitar practice — tabs and chords, fretboard trainers, metronomes, AI-powered backing tracks, and ear-transcription software. Each one marked free, freemium, or paid." />
        <link rel='canonical' href={siteUrl} />
        <meta property="og:title" content="19 Guitar Practice Tools (Free & Paid) | Riff Quest" />
        <meta property="og:description" content="A curated list of external tools for guitar practice — tabs, fretboard trainers, metronomes, AI backing tracks, and ear-transcription software." />
        <meta property="og:url" content={siteUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://riff.quest/images/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="19 Guitar Practice Tools (Free & Paid) | Riff Quest" />
        <meta name="twitter:description" content="A curated list of external tools for guitar practice — tabs, fretboard trainers, metronomes, AI backing tracks, and ear-transcription software." />
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

      <div className={!isLogged ? "min-h-screen bg-zinc-950 text-zinc-100" : ""}>
        {!isLogged && (
          <nav className="border-b border-white/5 bg-zinc-950/50 backdrop-blur-xl">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
              <Link href="/" className="flex items-center gap-2">
                <Image
                  src='/images/longlightlogo.svg'
                  alt='Riff Quest'
                  width={120}
                  height={32}
                  className='h-6 w-auto'
                  priority
                />
              </Link>
              <div className="flex items-center gap-4">
                <Link href="/login" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
                  Login
                </Link>
                <Link href="/signup" className="rounded-full bg-cyan-500 px-4 py-1.5 text-sm font-bold text-black hover:bg-cyan-400 transition-colors">
                  Start Free
                </Link>
              </div>
            </div>
          </nav>
        )}

        <div className="mx-auto max-w-5xl px-6 py-20">
          <div className="mb-16 max-w-2xl">
            <p className="text-xs font-black uppercase tracking-[0.4em] text-cyan-500 mb-4">Resources</p>
            <h1 className="text-4xl font-black text-white mb-6">Guitar practice tools worth knowing about</h1>
            <p className="text-lg text-zinc-400 leading-relaxed">
              {totalTools} tools the guitar community actually uses alongside Riff Quest — tabs and chords, fretboard trainers, metronomes, backing tracks, and ear-transcription software. Every entry is marked free, freemium, or paid, and AI-powered tools carry a badge.
            </p>
          </div>

          <div className="space-y-16">
            {CATEGORIES.map((category) => {
              const Icon = category.icon;
              return (
                <section key={category.id} id={category.id}>
                  <div className="mb-5 flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-900/60 text-cyan-400">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div>
                      <h2 className="text-lg font-bold text-white">{category.name}</h2>
                      <p className="text-xs text-zinc-500">
                        {category.tools.length} {category.tools.length === 1 ? "tool" : "tools"}
                      </p>
                    </div>
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
            Logos belong to their respective owners and are shown for identification only. Pricing can change — check each tool&apos;s site for current terms.
          </p>
        </div>

        {!isLogged && <Footer />}
      </div>
    </>
  );
};

ToolsPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout pageId="tools" isPublic={true}>
      {page}
    </AppLayout>
  );
};

export default ToolsPage;
