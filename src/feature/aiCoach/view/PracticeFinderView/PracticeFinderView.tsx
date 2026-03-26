import React, { useState } from "react";
import { ChevronRight, Dumbbell, Search, Sparkles, YoutubeIcon } from "lucide-react";
import { useRouter } from "next/router";
import { exercisesAgregat } from "feature/exercisePlan/data/exercisesAgregat";
import type { YouTubeLessonResult } from "../../types/youtubeLesson.types";
import YouTubeLessonCard from "../RoadmapView/components/YouTubeLessonCard";

const LEVELS = ["Beginner", "Intermediate", "Advanced"] as const;
type Level = (typeof LEVELS)[number];

interface SearchResult {
  exerciseIds: string[];
  lessons: YouTubeLessonResult[];
}

// ─── Example queries ────────────────────────────────────────────────────────

const EXAMPLES: { label: string; query: string }[] = [
  { label: "🎸 Barre chord transitions", query: "barre chord transitions" },
  { label: "⚡ Alternate picking speed", query: "alternate picking speed" },
  { label: "🤚 Weak pinky finger", query: "strengthening the pinky finger for chord changes" },
  { label: "🎵 Fingerpicking patterns", query: "fingerpicking patterns acoustic" },
  { label: "🔥 Blues bending in tune", query: "blues string bending in tune" },
  { label: "🎯 Pentatonic soloing", query: "pentatonic scale soloing" },
  { label: "⏱ Rushing the beat", query: "playing in time not rushing the tempo" },
  { label: "🔗 Legato technique", query: "legato hammer-ons pull-offs" },
];

// ─── How it works steps ─────────────────────────────────────────────────────

const HOW_IT_WORKS = [
  {
    icon: "✍️",
    title: "Describe what you want to work on",
    desc: "Type anything — a technique, a problem you're struggling with, or a style you want to learn. No need for fancy terms.",
    examples: ['"my barre chords keep buzzing"', '"I want to play faster riffs"'],
  },
  {
    icon: "🔍",
    title: "AI searches the library for you",
    desc: "We scan our full exercise library and a curated collection of YouTube guitar lessons to find the best match for your level.",
    examples: null,
  },
  {
    icon: "🚀",
    title: "Open it and start practicing",
    desc: "Click an exercise to launch it directly in the practice session, or open the YouTube lesson in a new tab.",
    examples: null,
  },
];

// ─── Component ───────────────────────────────────────────────────────────────

const PracticeFinderView: React.FC = () => {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState<Level>("Beginner");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [searched, setSearched] = useState(false);
  const [lastQuery, setLastQuery] = useState("");

  const runSearch = async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setResult(null);
    setSearched(false);
    setLastQuery(q);

    try {
      const [exRes, ytRes] = await Promise.all([
        fetch("/api/search-exercise", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stepTitle: q, description: q, goal: q, level }),
        }),
        fetch("/api/search-youtube-lessons", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stepTitle: q, stepDescription: q, roadmapGoal: q, roadmapLevel: level }),
        }),
      ]);
      const exData = await exRes.json();
      const ytData = await ytRes.json();
      setResult({ exerciseIds: exData.exercise_ids ?? [], lessons: ytData.lessons ?? [] });
    } catch {
      setResult({ exerciseIds: [], lessons: [] });
    } finally {
      setLoading(false);
      setSearched(true);
    }
  };

  const handleSearch = () => runSearch(query.trim());

  const handleExample = (exampleQuery: string) => {
    setQuery(exampleQuery);
    runSearch(exampleQuery);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSearch();
  };

  const exercises = (result?.exerciseIds ?? [])
    .map((id) => exercisesAgregat.find((ex) => ex.id === id))
    .filter(Boolean);

  const hasResults = exercises.length > 0 || (result?.lessons && result.lessons.length > 0);
  const isIdle = !loading && !searched;

  return (
    <div className="px-4 py-8 md:px-8 md:py-10">

      {/* ── Search form ── */}
      <div className="mb-8 flex flex-col gap-3 max-w-2xl">
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. barre chords hurt my fingers, I want to solo over blues..."
            maxLength={200}
            className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-200 placeholder-zinc-600 outline-none transition-colors focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20"
          />
          <button
            onClick={handleSearch}
            disabled={!query.trim() || loading}
            className="flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-black transition-colors hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            Search
          </button>
        </div>

        {/* Level selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-600">Level:</span>
          {LEVELS.map((l) => (
            <button
              key={l}
              onClick={() => setLevel(l)}
              className={`rounded-lg border px-3 py-1 text-xs font-medium transition-colors ${
                level === l
                  ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-300"
                  : "border-zinc-800 bg-zinc-900 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div className="max-w-2xl flex flex-col gap-4">
          <div className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3.5">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-700 border-t-emerald-500" />
            <p className="text-sm text-zinc-500">Searching exercises and lessons for <span className="text-zinc-300 font-medium">&ldquo;{lastQuery}&rdquo;</span>…</p>
          </div>
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex h-[61px] animate-pulse items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 px-3">
              <div className="h-[45px] w-[80px] shrink-0 rounded-lg bg-zinc-800" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-3/4 rounded bg-zinc-800" />
                <div className="h-2.5 w-1/2 rounded bg-zinc-800" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Results ── */}
      {searched && !loading && (
        <div className="max-w-2xl flex flex-col gap-6">
          {!hasResults ? (
            /* No results */
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 px-6 py-10">
              <p className="text-sm font-semibold text-zinc-300 mb-1">
                Nothing found for &ldquo;{lastQuery}&rdquo;
              </p>
              <p className="text-sm text-zinc-500 mb-6">
                Our library might not have an exact match yet. Try describing it differently — use simpler words or focus on one technique at a time.
              </p>
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-600 mb-3">Try instead:</p>
              <div className="flex flex-wrap gap-2">
                {EXAMPLES.slice(0, 4).map((ex) => (
                  <button
                    key={ex.query}
                    onClick={() => handleExample(ex.query)}
                    className="rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:border-emerald-500/50 hover:text-emerald-300"
                  >
                    {ex.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Exercises */}
              {exercises.length > 0 && (
                <div>
                  <p className="mb-2.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
                    <Dumbbell className="h-3 w-3 text-emerald-500" />
                    Recommended Exercises
                  </p>
                  <div className="flex flex-col gap-2">
                    {exercises.map((ex) => ex && (
                      <button
                        key={ex.id}
                        onClick={() => router.push(`/profile/skills?exerciseId=${ex.id}`)}
                        className="group relative flex w-full items-center gap-4 overflow-hidden rounded-2xl border border-emerald-800/40 bg-emerald-950/30 px-4 py-4 text-left transition-all hover:border-emerald-600/50 hover:bg-emerald-950/50"
                      >
                        <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-500/5 via-transparent to-transparent" />
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 ring-1 ring-emerald-500/30 transition group-hover:bg-emerald-500/25 group-hover:ring-emerald-500/50">
                          <Dumbbell className="h-5 w-5 text-emerald-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-zinc-100">{ex.title}</p>
                          {ex.difficulty && (
                            <p className="mt-0.5 text-[11px] capitalize text-zinc-500">
                              {ex.difficulty} · {ex.category}
                            </p>
                          )}
                        </div>
                        <ChevronRight className="h-4 w-4 shrink-0 text-emerald-600 transition group-hover:translate-x-0.5 group-hover:text-emerald-400" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* YouTube lessons */}
              {result!.lessons.length > 0 && (
                <div>
                  <p className="mb-2.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
                    <YoutubeIcon className="h-3.5 w-3.5 text-red-500" />
                    YouTube Lessons
                  </p>
                  <div className="space-y-2">
                    {result!.lessons.map((lesson) => (
                      <YouTubeLessonCard key={lesson.videoId} lesson={lesson} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Idle state: how it works + examples ── */}
      {isIdle && (
        <div className="max-w-2xl flex flex-col gap-8">

          {/* How it works */}
          <div>
            <p className="mb-4 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
              <Sparkles className="h-3 w-3" />
              How it works
            </p>
            <div className="flex flex-col gap-3">
              {HOW_IT_WORKS.map((step, i) => (
                <div key={i} className="flex gap-4 rounded-xl border border-zinc-800/80 bg-zinc-900/50 px-4 py-4">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-base">
                    {step.icon}
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-semibold text-zinc-200">{step.title}</p>
                    <p className="text-xs leading-relaxed text-zinc-500">{step.desc}</p>
                    {step.examples && (
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {step.examples.map((ex) => (
                          <span key={ex} className="rounded-md bg-zinc-800 px-2 py-0.5 text-[11px] text-zinc-400 font-mono">
                            {ex}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Example chips */}
          <div>
            <p className="mb-3 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
              <Search className="h-3 w-3" />
              Try one of these
            </p>
            <div className="flex flex-wrap gap-2">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex.query}
                  onClick={() => handleExample(ex.query)}
                  className="rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 py-2 text-xs font-medium text-zinc-300 transition-all hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-300"
                >
                  {ex.label}
                </button>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default PracticeFinderView;
