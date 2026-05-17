import { ExerciseCard } from 'feature/exercises/components/ExerciseCard/ExerciseCard';
import { idToSlug } from 'feature/exercises/lib/slugUtils';
import { serializeExercises } from 'feature/exercises/lib/serializeExercise';
import { exercisesAgregat } from 'feature/exercisePlan/data/exercisesAgregat';
import { Footer } from 'feature/landing/components/Footer';
import { ArrowRight, ChevronRight } from 'lucide-react';
import type { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';

interface ExerciseCategoryPageProps {
  category: string;
  categoryLabel: string;
  categoryDescription: string;
  exercises: Array<{
    id: string;
    title: string;
    difficulty: 'easy' | 'medium' | 'hard';
    category: string;
    description: string;
    timeInMinutes: number;
    premium?: boolean;
  }>;
}

const categoryInfo: Record<
  string,
  { label: string; description: string; color: string; icon: string }
> = {
  technique: {
    label: 'Technique',
    description: 'Build real muscle memory with finger patterns, speed drills, and precision exercises.',
    color: 'text-rose-400',
    icon: '🎸',
  },
  theory: {
    label: 'Theory',
    description: 'Understand the music you play with fretboard mapping, voice leading, and harmony.',
    color: 'text-indigo-400',
    icon: '📚',
  },
  hearing: {
    label: 'Ear Training',
    description: 'Train your musician\'s ear with interval recognition, play by ear, and pitch matching.',
    color: 'text-emerald-400',
    icon: '👂',
  },
  creativity: {
    label: 'Creativity',
    description: 'Break patterns and find your voice with improvisation, phrasing, and composition.',
    color: 'text-amber-400',
    icon: '✨',
  },
};

const ExerciseCategoryPage: React.FC<ExerciseCategoryPageProps> = ({
  category,
  categoryLabel,
  exercises,
}) => {
  const info = categoryInfo[category];

  return (
    <>
      <Head>
        <title>{categoryLabel} Guitar Exercises — {exercises.length}+ Drills | Riff Quest</title>
        <meta
          name="description"
          content={`${exercises.length} ${categoryLabel.toLowerCase()} guitar exercises with interactive tabs, audio playback, and progress tracking. ${info.description}`}
        />
        <link rel="canonical" href={`https://riff.quest/exercises/${category}`} />
        <meta property="og:title" content={`${categoryLabel} Guitar Exercises | Riff Quest`} />
        <meta property="og:description" content={info.description} />
        <meta property="og:url" content={`https://riff.quest/exercises/${category}`} />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://riff.quest/images/og-image.png" />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'ItemList',
              name: `${categoryLabel} Exercises`,
              description: info.description,
              url: `https://riff.quest/exercises/${category}`,
              numberOfItems: exercises.length,
              itemListElement: exercises.slice(0, 10).map((ex, i) => ({
                '@type': 'ListItem',
                position: i + 1,
                item: {
                  '@type': 'HowTo',
                  name: ex.title,
                  url: `https://riff.quest/exercises/${idToSlug(ex.id)}`,
                },
              })),
            }),
          }}
        />
      </Head>

      <main className="min-h-screen bg-zinc-950 text-zinc-300 overflow-x-hidden">
        {/* Top nav */}
        <nav className="sticky top-0 z-50 border-b border-white/5 bg-zinc-950/90 backdrop-blur-sm">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
            <Link href="/" className="transition-opacity hover:opacity-70">
              <Image
                src="/images/longlightlogo.svg"
                alt="Riff Quest"
                width={120}
                height={32}
                className="h-6 w-auto"
              />
            </Link>
            <div className="flex items-center gap-6">
              <Link href="/login" className="text-sm text-zinc-400 hover:text-white transition-colors">
                Login
              </Link>
              <Link
                href="/signup"
                className="text-sm font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                Start Free →
              </Link>
            </div>
          </div>
        </nav>

        {/* Breadcrumb */}
        <div className="pt-8 px-6 mx-auto max-w-6xl">
          <div className="flex items-center gap-2 text-xs text-zinc-500 mb-8 tracking-widest">
            <Link href="/" className="hover:text-zinc-300 transition-colors">
              Home
            </Link>
            <ChevronRight className="h-3 w-3" />
            <Link href="/exercises" className="hover:text-zinc-300 transition-colors">
              Exercises
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-zinc-400">{categoryLabel}</span>
          </div>
        </div>

        {/* Hero section */}
        <section className="px-6 mx-auto max-w-6xl pb-16">
          <div className="text-5xl mb-4">{info.icon}</div>
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tighter text-white leading-tight mb-6">
            {categoryLabel} Exercises
          </h1>
          <p className="text-lg text-zinc-400 leading-relaxed max-w-2xl mb-8">
            {info.description}
          </p>
          <div className="flex items-center gap-4 text-sm text-zinc-400">
            <span className="font-semibold text-white">{exercises.length} exercises</span>
            <span>·</span>
            <Link href="/exercises" className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
              Browse all categories <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </section>

        {/* Exercise grid */}
        <section className="px-6 mx-auto max-w-6xl pb-16 border-t border-white/5 pt-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {exercises.map((exercise) => (
              <ExerciseCard
                key={exercise.id}
                exercise={exercise}
                href={`/exercises/${idToSlug(exercise.id)}`}
              />
            ))}
          </div>

          {exercises.length === 0 && (
            <div className="text-center py-12">
              <p className="text-zinc-400 mb-6">No exercises found in this category.</p>
              <Link
                href="/exercises"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-cyan-500 text-zinc-950 font-bold hover:bg-cyan-400 transition-colors"
              >
                Back to exercises <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </section>

        {/* Other categories */}
        <section className="px-6 mx-auto max-w-6xl pb-16 border-t border-white/5 pt-12">
          <h2 className="text-2xl font-bold text-white mb-8">Other Categories</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(categoryInfo).map(([cat, info]) => {
              if (cat === category) return null;
              const count = exercises.length; // placeholder, will be calculated properly
              return (
                <Link
                  key={cat}
                  href={`/exercises/category/${cat}`}
                  className="rounded-2xl border border-white/5 bg-zinc-900/40 hover:bg-zinc-900/70 transition-colors p-6"
                >
                  <div className="text-3xl mb-3">{info.icon}</div>
                  <h3 className="font-bold text-white mb-1">{info.label}</h3>
                  <p className="text-xs text-zinc-500">{info.description.slice(0, 60)}...</p>
                </Link>
              );
            })}
          </div>
        </section>

        <Footer />
      </main>
    </>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  const categories = ['technique', 'theory', 'hearing', 'creativity'];
  return {
    paths: categories.map((cat) => ({
      params: { name: cat },
    })),
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps<ExerciseCategoryPageProps> = async ({
  params,
}) => {
  const category = params!.name as string;

  if (!categoryInfo[category]) {
    return { notFound: true };
  }

  const exercises = serializeExercises(exercisesAgregat)
    .filter((ex) => ex.category === category && !ex.isHiddenFromLibrary)
    .map((ex) => ({
      id: ex.id,
      title: ex.title,
      difficulty: ex.difficulty as 'easy' | 'medium' | 'hard',
      category: ex.category,
      description: ex.description,
      timeInMinutes: ex.timeInMinutes,
      premium: ex.premium,
    }));

  return {
    props: {
      category,
      categoryLabel: categoryInfo[category].label,
      categoryDescription: categoryInfo[category].description,
      exercises,
    },
  };
};

export default ExerciseCategoryPage;
