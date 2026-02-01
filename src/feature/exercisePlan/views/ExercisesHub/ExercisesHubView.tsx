import { useState, useMemo } from "react";
import Head from "next/head";
import { exercisesAgregat } from "../../data/exercisesAgregat";
import { ExerciseCard } from "../../components/ExerciseCard";
import { Input } from "assets/components/ui/input";
import { Badge } from "assets/components/ui/badge";
import { 
  FaSearch, 
  FaFilter, 
  FaGuitar, 
  FaBrain, 
  FaMusic, 
  FaLayerGroup,
  FaFire
} from "react-icons/fa";
import { cn } from "assets/lib/utils";
import { useTranslation } from "hooks/useTranslation";
import Link from "next/link";

const categories = [
  { id: "all", label: "All", icon: FaLayerGroup },
  { id: "technique", label: "Technique", icon: FaGuitar },
  { id: "theory", label: "Theory", icon: FaBrain },
  { id: "creativity", label: "Creativity", icon: FaMusic },
  { id: "hearing", label: "By Ear", icon: FaMusic },
];

const difficulties = ["easy", "medium", "hard"];

export const ExercisesHubView = () => {
  const { t } = useTranslation(["exercises", "common"]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);

  const filteredExercises = useMemo(() => {
    return exercisesAgregat.filter(ex => {
      const matchesSearch = ex.title.toLowerCase().includes(search.toLowerCase()) || 
                           ex.description.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = selectedCategory === "all" || ex.category === selectedCategory;
      const matchesDifficulty = !selectedDifficulty || ex.difficulty === selectedDifficulty;
      
      return matchesSearch && matchesCategory && matchesDifficulty;
    });
  }, [search, selectedCategory, selectedDifficulty]);

  return (
    <div className="min-h-screen bg-[#020202] pb-20">
      <Head>
        <title>Interactive Guitar Exercise Library | Riff Quest</title>
        <meta name="description" content="Explore over 60 professional guitar exercises designed to improve your technique, theory, and creativity. Master your craft with interactive tabs and structured practice routines." />
        <link rel="canonical" href="https://riff.quest/exercises" />
      </Head>

      {/* Hero Section */}
      <div className="relative overflow-hidden border-b border-white/5 bg-zinc-950/50 py-12 lg:py-20">
        <div className="absolute inset-0 z-0 text-left px-4">
             <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-zinc-500 hover:text-white transition-colors">
                <span className="text-lg">←</span> Back to Home
             </Link>
        </div>
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute -left-1/4 -top-1/4 h-[500px] w-[500px] rounded-full bg-cyan-500/10 blur-[120px]" />
          <div className="absolute -right-1/4 -bottom-1/4 h-[500px] w-[500px] rounded-full bg-teal-500/10 blur-[120px]" />
        </div>

        <div className="container relative z-10 mx-auto px-4 text-center mt-8">
            <Badge variant="outline" className="mb-6 border-cyan-500/30 bg-cyan-500/10 px-4 py-1 text-xs font-bold text-cyan-400">
                <FaFire className="mr-2 h-3 w-3" />
                Training Library
            </Badge>
          <h1 className="mb-6 text-4xl font-bold italic tracking-tighter text-white sm:text-6xl lg:text-7xl">
            Interactive <span className="bg-gradient-to-r from-cyan-400 via-teal-400 to-cyan-500 bg-clip-text text-transparent">Guitar Exercise Library</span>
          </h1>
          <p className="mx-auto max-w-2xl text-base text-zinc-400 sm:text-lg">
            Browse through our curated collection of 60+ specialized guitar exercises. From spider walks to modal improvisation, we have everything you need to level up.
          </p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="sticky top-0 z-30 border-b border-white/5 bg-black/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-xl">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
              <Input
                placeholder="Search exercises (e.g. 'spider', 'legato', 'scales')..."
                className="h-12 border-white/10 bg-zinc-900/50 pl-12 text-zinc-200 placeholder:text-zinc-600 focus:border-cyan-500/50 focus:ring-cyan-500/20"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Category Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-2 flex items-center gap-2 text-xs font-bold text-zinc-500">
                <FaFilter className="h-3 w-3" /> Sort by:
              </span>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-bold transition-all duration-200",
                    selectedCategory === cat.id
                      ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.1)]"
                      : "border-white/5 bg-zinc-900/50 text-zinc-500 hover:border-white/20 hover:text-zinc-300"
                  )}
                >
                  <cat.icon className="h-3.5 w-3.5" />
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty Filters */}
          <div className="mt-4 flex flex-wrap items-center gap-4">
               <span className="text-xs font-bold text-zinc-500">Difficulty:</span>
               <div className="flex gap-2">
                    {difficulties.map((diff) => (
                        <button
                            key={diff}
                            onClick={() => setSelectedDifficulty(selectedDifficulty === diff ? null : diff)}
                            className={cn(
                                "rounded-lg border px-3 py-1 text-[10px] font-bold transition-all capitalize",
                                selectedDifficulty === diff
                                    ? "border-white/40 bg-white text-black"
                                    : "border-white/5 bg-zinc-950 text-zinc-500 hover:border-white/10"
                            )}
                        >
                            {diff}
                        </button>
                    ))}
               </div>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="container mx-auto px-4 py-12">
        {filteredExercises.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredExercises.map((ex) => {
              const slug = ex.id.replace(/_/g, "-");
              return (
                <Link key={ex.id} href={`/exercises/${slug}`} className="group h-full">
                  <div className="h-full transform transition-transform duration-300 hover:-translate-y-2">
                    <ExerciseCard exercise={ex} disableDialog={true} />
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="mb-6 rounded-full bg-zinc-900 p-8">
              <FaSearch className="h-12 w-12 text-zinc-700" />
            </div>
            <h3 className="text-2xl font-bold text-white">No exercises found</h3>
            <p className="mt-2 text-zinc-500">Try adjusting your search or filters to find what you're looking for.</p>
            <button 
              onClick={() => { setSearch(""); setSelectedCategory("all"); setSelectedDifficulty(null); }}
              className="mt-6 font-bold text-cyan-400 hover:text-cyan-300"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="container mx-auto px-4 py-12">
          <div className="relative overflow-hidden rounded-lg border border-white/10 bg-zinc-950 p-8 lg:p-12 text-center">
             <div className="absolute inset-0 z-0 opacity-20">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cyan-500/20 via-transparent to-transparent" />
             </div>
             <div className="relative z-10">
                <h2 className="text-3xl font-bold italic lg:text-4xl text-white mb-4">Want a custom plan?</h2>
                <p className="text-zinc-400 max-w-xl mx-auto mb-8 text-base">
                    Join Riff Quest today to build your own perfect practice routine tailored to your goals and skill level.
                </p>
                <Link 
                    href="/signup" 
                    className="inline-flex h-12 items-center justify-center rounded-lg bg-white px-10 text-base font-bold text-black transition-all hover:bg-zinc-100"
                >
                    Start Your Quest
                </Link>
             </div>
          </div>
      </div>
    </div>
  );
};
