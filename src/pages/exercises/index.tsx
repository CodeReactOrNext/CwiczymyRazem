import { Footer } from "feature/landing/components/Footer";
import { ExerciseCard } from "feature/exercises/components/ExerciseCard/ExerciseCard";
import { idToSlug, slugToId } from "feature/exercises/lib/slugUtils";
import { serializeExercises } from "feature/exercises/lib/serializeExercise";
import { exercisesAgregat } from "feature/exercisePlan/data/exercisesAgregat";
import AppLayout from "layouts/AppLayout";
import {
  ArrowRight,
  BookOpen,
  Ear,
  Guitar,
  Lightbulb,
  Music2,
  TrendingUp,
  Zap,
} from "lucide-react";
import type { GetStaticProps } from "next";
import Image from "next/image";
import Link from "next/link";
import Head from "next/head";
import { useSession } from "next-auth/react";
import type { ReactElement } from "react";
import type { NextPageWithLayout } from "types/page";

interface ExercisesLandingPageProps {
  exercisesData: Array<{
    id: string;
    title: string;
    difficulty: 'easy' | 'medium' | 'hard';
    category: string;
    description: string;
    timeInMinutes: number;
    premium?: boolean;
  }>;
}

const CATEGORIES = [
  {
    id: "technique",
    label: "Technique",
    icon: <Guitar className="w-5 h-5" />,
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/20",
    glow: "bg-cyan-500/5",
    count: 107,
    tagline: "Build real muscle memory",
    description:
      "Spider exercises, legato runs, alternate picking, sweep arpeggios, bending, vibrato, strumming patterns — everything your hands need.",
    examples: ["Spider Permutations ×24", "Sweep Cascades", "Legato Trill Sprints", "Precision Bending"],
  },
  {
    id: "theory",
    label: "Theory",
    icon: <BookOpen className="w-5 h-5" />,
    color: "text-violet-400",
    bg: "bg-violet-500/10",
    border: "border-violet-500/20",
    glow: "bg-violet-500/5",
    count: 8,
    tagline: "Understand what you play",
    description:
      "Fretboard mapping, guide-tone voice leading, chord-tone improvisation — turn knowledge into fluent playing.",
    examples: ["Fretboard Mastery", "Guide Tone Voice Leading", "Natural Notes Map", "Scale Practice"],
  },
  {
    id: "creativity",
    label: "Creativity",
    icon: <Lightbulb className="w-5 h-5" />,
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
    glow: "bg-orange-500/5",
    count: 9,
    tagline: "Break out of patterns",
    description:
      "Improvisation prompts, call-and-response phrasing, composition challenges — exercises that grow your musical voice.",
    examples: ["Improv Prompts", "Composition Challenge", "Single Chord Improv", "Two-Notes-Per-Bar"],
  },
  {
    id: "hearing",
    label: "Ear Training",
    icon: <Ear className="w-5 h-5" />,
    color: "text-sky-400",
    bg: "bg-sky-500/10",
    border: "border-sky-500/20",
    glow: "bg-sky-500/5",
    count: 5,
    tagline: "Train the musician's ear",
    description:
      "Play by ear, interval recognition, sing what you play — connect what you hear to what your fingers do.",
    examples: ["Ear Training Lvl 1–3", "Play By Ear", "Sing What You Play", "Tone Matching"],
  },
];

const FEATURES = [
  {
    icon: <Music2 className="w-5 h-5 text-cyan-400" />,
    title: "Interactive Guitar Pro tabs",
    desc: "Every exercise comes with animated tablature synced to audio. See exactly what to play — note by note.",
  },
  {
    icon: <TrendingUp className="w-5 h-5 text-emerald-400" />,
    title: "BPM progress tracking",
    desc: "Log your tempo each session. Watch your speed increase over weeks with automatic progress graphs.",
  },
  {
    icon: <Zap className="w-5 h-5 text-amber-400" />,
    title: "XP & gamification",
    desc: "Earn skill points for every completed exercise. Level up your Technique, Theory, and Ear Training skills.",
  },
];

const SPOTLIGHT = [
  {
    title: "Spider Permutations",
    category: "Technique",
    difficulty: "easy → hard",
    desc: "24 chromatic finger patterns — the most systematic way to build left-hand independence and precision.",
    color: "text-cyan-400",
    dot: "bg-cyan-400",
  },
  {
    title: "Legato Trill Sprints",
    category: "Technique",
    difficulty: "Advanced",
    desc: "Sextuplet trill patterns across strings for extreme left-hand speed and endurance.",
    color: "text-cyan-400",
    dot: "bg-rose-400",
  },
  {
    title: "Neoclassical Sweep Master",
    category: "Technique",
    difficulty: "Advanced",
    desc: "Diminished and minor arpeggio shapes across 5 strings with position shifts and legato turnarounds.",
    color: "text-cyan-400",
    dot: "bg-rose-400",
  },
  {
    title: "Fretboard Mastery",
    category: "Theory",
    difficulty: "Advanced",
    desc: "Play the same melodic phrase in multiple positions — forces note-based thinking instead of shape patterns.",
    color: "text-violet-400",
    dot: "bg-rose-400",
  },
  {
    title: "Composition Challenge",
    category: "Creativity",
    difficulty: "Advanced",
    desc: "Compose a piece in 40 min guided by 5 random constraints: style, form, harmony, melody, rhythm.",
    color: "text-orange-400",
    dot: "bg-rose-400",
  },
  {
    title: "Sing What You Play",
    category: "Ear Training",
    difficulty: "Advanced",
    desc: "Connect your voice to your fingers — the most direct path to internalising intervals and phrasing.",
    color: "text-sky-400",
    dot: "bg-rose-400",
  },
];

const difficultyBadge: Record<string, string> = {
  "easy → hard": "bg-zinc-800 text-zinc-400 border-zinc-700",
  Advanced: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  Intermediate: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  Beginner: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

const ExercisesLandingPage: NextPageWithLayout<ExercisesLandingPageProps> = ({ exercisesData }) => {
  const { status } = useSession();
  const isLogged = status === "authenticated";

  return (
    <>
      <Head>
        <title>Interactive Guitar Exercise Library — Riff Quest</title>
        <meta
          name="description"
          content="Explore over 144 professional guitar exercises designed to improve your technique, theory, creativity and ear training. Interactive tabs, audio playback, and progress tracking."
        />
        <link rel="canonical" href="https://riff.quest/exercises" />
        <meta property="og:title" content="Interactive Guitar Exercise Library — Riff Quest" />
        <meta property="og:description" content="144+ professional guitar exercises with interactive tabs, audio playback and XP tracking." />
        <meta property="og:url" content="https://riff.quest/exercises" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://riff.quest/images/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>

      <div className="min-h-screen bg-zinc-950 text-zinc-100 overflow-x-hidden selection:bg-cyan-500/30">

        {/* Nav */}
        {!isLogged && (
          <nav className="sticky top-0 z-50 border-b border-white/5 bg-zinc-950/80 backdrop-blur-xl">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
              <Link href="/">
                <Image src="/images/longlightlogo.svg" alt="Riff Quest" width={120} height={32} className="h-6 w-auto" priority />
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

        {/* ─── HERO ─────────────────────────────────────────────── */}
        <section className="relative bg-black overflow-hidden">
          {/* Ambient glows */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-cyan-500/10 blur-[160px] rounded-full" />
            <div className="absolute bottom-0 right-0 w-[500px] h-[400px] bg-violet-500/8 blur-[130px] rounded-full" />
          </div>

          <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8 pt-28 pb-24 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/5 px-4 py-1.5 mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-xs font-black uppercase tracking-[0.2em] text-cyan-400">Exercise Library</span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tighter text-white leading-[0.95] mb-7">
              Interactive Guitar<br />
              <span className="bg-gradient-to-r from-cyan-400 via-teal-400 to-cyan-500 bg-[length:200%_auto] animate-gradient bg-clip-text text-transparent">
                Exercise Library
              </span>
            </h1>

            <p className="mx-auto max-w-2xl text-xl text-zinc-400 leading-relaxed mb-10">
              Over <span className="text-white font-semibold">144 professional exercises</span> designed to improve
              your technique, theory, creativity and ear — each with interactive tabs and audio playback.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 rounded-2xl bg-cyan-500 px-8 py-4 text-base font-black text-black hover:bg-cyan-400 transition-all hover:scale-[1.02]"
              >
                Start practicing for free <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-8 py-4 text-base font-bold text-zinc-300 hover:text-white hover:bg-white/5 transition-colors"
              >
                Learn more about Riff Quest
              </Link>
            </div>

            {/* Social proof numbers */}
            <div className="mt-16 flex flex-wrap justify-center gap-x-12 gap-y-4">
              {[
                { n: "144+", label: "exercises" },
                { n: "4", label: "skill categories" },
                { n: "3", label: "difficulty levels" },
                { n: "∞", label: "XP to earn" },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <div className="text-3xl font-black text-white">{s.n}</div>
                  <div className="text-xs font-semibold uppercase tracking-widest text-zinc-600 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── BROWSE BY CATEGORY ───────────────────────────────── */}
        <section className="relative py-16 bg-black border-y border-white/5">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-white mb-2">Browse by Category</h2>
              <p className="text-zinc-400">Explore exercises organized by skill area</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { id: "technique", label: "Technique", icon: "🎸", count: Math.floor(exercisesData.filter(e => e.category === "technique").length) },
                { id: "theory", label: "Theory", icon: "📚", count: Math.floor(exercisesData.filter(e => e.category === "theory").length) },
                { id: "hearing", label: "Ear Training", icon: "👂", count: Math.floor(exercisesData.filter(e => e.category === "hearing").length) },
                { id: "creativity", label: "Creativity", icon: "✨", count: Math.floor(exercisesData.filter(e => e.category === "creativity").length) },
              ].map((cat) => (
                <Link
                  key={cat.id}
                  href={`/exercises/category/${cat.id}`}
                  className="group rounded-2xl border border-white/5 bg-zinc-900/40 hover:bg-zinc-900/70 transition-all duration-200 p-6 cursor-pointer"
                >
                  <div className="text-4xl mb-4">{cat.icon}</div>
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors">
                    {cat.label}
                  </h3>
                  <p className="text-sm text-zinc-500 mb-4">
                    {cat.count} exercise{cat.count !== 1 ? "s" : ""}
                  </p>
                  <div className="flex items-center gap-1 text-cyan-400 text-sm font-semibold group-hover:gap-2 transition-all">
                    Browse <ArrowRight className="w-4 h-4" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ─── CATEGORIES ───────────────────────────────────────── */}
        <section className="relative py-28 bg-zinc-950">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-cyan-500/5 blur-[150px] rounded-full" />
          </div>
          <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
            <div className="mb-16 max-w-2xl">
              <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-400 mb-4">Categories</p>
              <h2 className="text-4xl sm:text-5xl font-black tracking-tighter text-white leading-tight">
                Every area of your playing.<br />
                <span className="text-zinc-500">All in one place.</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {CATEGORIES.map((cat) => (
                <div
                  key={cat.id}
                  className={`relative rounded-2xl border ${cat.border} bg-zinc-900/40 p-8 overflow-hidden group hover:bg-zinc-900/70 transition-colors`}
                >
                  {/* Glow */}
                  <div className={`absolute -top-16 -right-16 w-48 h-48 ${cat.glow} blur-[80px] rounded-full pointer-events-none`} />

                  <div className="relative z-10">
                    <div className={`inline-flex items-center gap-2 ${cat.color} ${cat.bg} border ${cat.border} rounded-xl px-3 py-1.5 mb-5`}>
                      {cat.icon}
                      <span className="text-sm font-black uppercase tracking-wider">{cat.label}</span>
                      <span className="ml-1 text-xs font-black opacity-60">{cat.count}</span>
                    </div>

                    <h3 className="text-2xl font-black text-white mb-2">{cat.tagline}</h3>
                    <p className="text-zinc-400 text-sm leading-relaxed mb-6">{cat.description}</p>

                    <ul className="flex flex-wrap gap-2">
                      {cat.examples.map((ex) => (
                        <li key={ex} className="rounded-lg bg-zinc-800/60 border border-white/5 px-3 py-1 text-xs font-semibold text-zinc-400">
                          {ex}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── FEATURES ─────────────────────────────────────────── */}
        <section className="py-28 bg-black border-y border-white/5">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-16 items-center">
              {/* Left text */}
              <div>
                <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-400 mb-5">How it works</p>
                <h2 className="text-4xl sm:text-5xl font-black tracking-tighter text-white leading-tight mb-6">
                  Not just tabs.<br />
                  <span className="text-zinc-500">A full practice system.</span>
                </h2>
                <p className="text-zinc-400 text-lg leading-relaxed mb-10">
                  Each exercise is paired with animated Guitar Pro tablature, audio playback at any tempo, and
                  a built-in progress tracker — so you always know where you left off and how fast you're improving.
                </p>
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-6 py-3 text-sm font-black text-black hover:bg-cyan-400 transition-colors"
                >
                  Try it free <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Right features */}
              <div className="space-y-5">
                {FEATURES.map((f) => (
                  <div
                    key={f.title}
                    className="flex items-start gap-5 rounded-2xl border border-white/5 bg-zinc-900/50 p-6"
                  >
                    <div className="mt-0.5 w-10 h-10 rounded-xl bg-zinc-800 border border-white/5 flex items-center justify-center shrink-0">
                      {f.icon}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white mb-1">{f.title}</div>
                      <div className="text-sm text-zinc-500 leading-relaxed">{f.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ─── SPOTLIGHT EXERCISES ──────────────────────────────── */}
        <section className="py-28 bg-zinc-950">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mb-14 text-center max-w-2xl mx-auto">
              <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-400 mb-4">Highlights</p>
              <h2 className="text-4xl sm:text-5xl font-black tracking-tighter text-white leading-tight">
                A few exercises worth knowing about
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {SPOTLIGHT.map((ex) => (
                <div
                  key={ex.title}
                  className="flex flex-col rounded-2xl border border-white/5 bg-zinc-900/40 p-6 hover:bg-zinc-900/70 hover:border-white/10 transition-all"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <span className={`text-[11px] font-black uppercase tracking-widest ${ex.color}`}>{ex.category}</span>
                    <span className="text-zinc-700">·</span>
                    <span className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full border ${difficultyBadge[ex.difficulty] ?? "bg-zinc-800 text-zinc-400 border-zinc-700"}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${ex.dot}`} />
                      {ex.difficulty}
                    </span>
                  </div>
                  <h3 className="text-base font-black text-white mb-3 leading-snug">{ex.title}</h3>
                  <p className="text-sm text-zinc-500 leading-relaxed flex-1">{ex.desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-12 text-center">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-8 py-4 text-sm font-bold text-zinc-300 hover:text-white hover:bg-white/5 transition-colors"
              >
                See all {exercisesData.length} exercises after sign-up <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* ─── FULL EXERCISE CATALOG ────────────────────────────── */}
        <section className="py-28 bg-black border-t border-white/5">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mb-16 text-center max-w-2xl mx-auto">
              <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-400 mb-4">Browse All</p>
              <h2 className="text-4xl sm:text-5xl font-black tracking-tighter text-white leading-tight">
                Complete Exercise Catalog
              </h2>
              <p className="text-zinc-400 text-lg mt-4">
                Explore all {exercisesData.length} exercises across 4 categories. Free exercises available immediately, premium exercises unlock with a subscription.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {exercisesData.slice(0, 30).map((exercise) => (
                <ExerciseCard
                  key={exercise.id}
                  exercise={exercise}
                  href={`/exercises/${idToSlug(exercise.id)}`}
                />
              ))}
            </div>

            {exercisesData.length > 30 && (
              <div className="mt-12 text-center">
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 rounded-2xl bg-cyan-500 px-8 py-4 text-sm font-bold text-black hover:bg-cyan-400 transition-colors"
                >
                  Sign up to explore all {exercisesData.length} exercises <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* ─── FINAL CTA ────────────────────────────────────────── */}
        <section className="relative py-32 bg-black border-t border-white/5 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-cyan-500/10 blur-[150px] rounded-full" />
          </div>
          <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
            <h2 className="text-5xl sm:text-6xl font-black tracking-tighter text-white leading-[0.95] mb-6">
              Stop searching.<br />
              <span className="bg-gradient-to-r from-cyan-400 via-teal-400 to-cyan-500 bg-[length:200%_auto] animate-gradient bg-clip-text text-transparent">
                Start practicing.
              </span>
            </h2>
            <p className="text-zinc-400 text-xl mb-10 leading-relaxed">
              144 exercises. Interactive tabs. Real progress tracking.<br />
              Free to start — no credit card required.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-3 rounded-2xl bg-cyan-500 px-10 py-5 text-lg font-black text-black hover:bg-cyan-400 transition-all hover:scale-[1.02]"
            >
              Get started free <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>

        {!isLogged && <Footer />}
      </div>
    </>
  );
};

ExercisesLandingPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout pageId={null} isPublic={true}>
      {page}
    </AppLayout>
  );
};

export const getStaticProps: GetStaticProps<ExercisesLandingPageProps> = async () => {
  const exercisesData = serializeExercises(exercisesAgregat)
    .filter((ex) => !ex.isHiddenFromLibrary)
    .map((ex) => ({
      id: ex.id,
      title: ex.title,
      difficulty: ex.difficulty,
      category: ex.category,
      description: ex.description,
      timeInMinutes: ex.timeInMinutes,
      premium: ex.premium,
    }));

  return {
    props: { exercisesData },
  };
};

export default ExercisesLandingPage;
