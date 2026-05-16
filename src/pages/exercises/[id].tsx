import { ExerciseCard } from 'feature/exercises/components/ExerciseCard/ExerciseCard';
import { StaticStrumPattern } from 'feature/exercises/components/StaticTablature/StaticStrumPattern';
import dynamic from 'next/dynamic';
import { exercisesAgregat } from 'feature/exercisePlan/data/exercisesAgregat';
import { Footer } from 'feature/landing/components/Footer';
import { getRelatedExercises } from 'feature/exercises/lib/getRelatedExercises';
import { serializeExercise, serializeExercises } from 'feature/exercises/lib/serializeExercise';
import { idToSlug, slugToId } from 'feature/exercises/lib/slugUtils';
import type { SerializedExercise } from 'feature/exercises/lib/serializeExercise';
import type { RelatedExerciseCard } from 'feature/exercises/lib/getRelatedExercises';
import { ChevronRight, Clock, Music, Lock } from 'lucide-react';
import type { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';

const TablatureViewer = dynamic(
  () => import('feature/exercisePlan/views/PracticeSession/components/TablatureViewer').then(m => m.TablatureViewer),
  { ssr: false }
);

interface ExerciseDetailPageProps {
  exercise: SerializedExercise;
  related: RelatedExerciseCard[];
}

const categoryLabels: Record<string, string> = {
  technique: 'Technique',
  theory: 'Theory',
  creativity: 'Creativity',
  hearing: 'Hearing',
  mixed: 'Mixed',
};

const categoryColors: Record<string, string> = {
  technique: 'bg-rose-500/10 text-rose-300 border-rose-500/20',
  theory: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20',
  creativity: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
  hearing: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
  mixed: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',
};

const difficultyColors: Record<string, { label: string; color: string }> = {
  easy: { label: 'Easy', color: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' },
  medium: { label: 'Medium', color: 'bg-amber-500/10 text-amber-300 border-amber-500/20' },
  hard: { label: 'Hard', color: 'bg-rose-500/10 text-rose-300 border-rose-500/20' },
};

const ExerciseDetailPage: React.FC<ExerciseDetailPageProps> = ({ exercise, related }) => {
  const categoryLabel = categoryLabels[exercise.category];
  const categoryColor = categoryColors[exercise.category];
  const difficultyInfo = difficultyColors[exercise.difficulty];
  const bpmMin = exercise.metronomeSpeed?.min || 60;
  const bpmMax = exercise.metronomeSpeed?.max || 180;

  // Build JSON-LD schemas
  const howtoPkg = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: exercise.title,
    description: exercise.description,
    totalTime: `PT${exercise.timeInMinutes}M`,
    tool: [
      { '@type': 'HowToTool', name: 'Guitar' },
      { '@type': 'HowToTool', name: 'Metronome' },
    ],
    step: exercise.instructions.map((text, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: `Step ${i + 1}`,
      text,
    })),
  };

  const breadcrumbPkg = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://riff.quest',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Exercises',
        item: 'https://riff.quest/exercises',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: exercise.title,
        item: `https://riff.quest/exercises/${idToSlug(exercise.id)}`,
      },
    ],
  };

  const webpagePkg = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: `${exercise.title} — Guitar Exercise | Riff Quest`,
    url: `https://riff.quest/exercises/${idToSlug(exercise.id)}`,
    description: exercise.description,
    isPartOf: {
      '@type': 'WebSite',
      url: 'https://riff.quest',
      name: 'Riff Quest',
    },
  };

  // Build meta description
  const metaDescription = `${exercise.description} ${difficultyInfo.label} guitar exercise. ${exercise.timeInMinutes} min. BPM ${bpmMin}–${bpmMax}.`.slice(
    0,
    155
  );

  return (
    <>
      <Head>
        <title>{exercise.title} — Guitar Exercise | Riff Quest</title>
        <meta name="description" content={metaDescription} />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={`${exercise.title} — Guitar Exercise | Riff Quest`} />
        <meta property="og:description" content={exercise.description} />
        <meta property="og:image" content="https://riff.quest/images/og-image.png" />
        <meta property="og:url" content={`https://riff.quest/exercises/${idToSlug(exercise.id)}`} />
        <link rel="canonical" href={`https://riff.quest/exercises/${idToSlug(exercise.id)}`} />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(howtoPkg) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbPkg) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webpagePkg) }}
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
              <Link
                href="/login"
                className="text-sm text-zinc-400 hover:text-white transition-colors"
              >
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
            <Link
              href={`/exercises/category/${exercise.category}`}
              className="hover:text-zinc-300 transition-colors capitalize"
            >
              {exercise.category}
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-zinc-400 truncate">{exercise.title}</span>
          </div>
        </div>

        {/* Hero section */}
        <section className="px-6 mx-auto max-w-6xl pb-12">
          <div className="flex flex-col gap-4 mb-8">
            {/* Badges */}
            <div className="flex gap-2 flex-wrap">
              <span className={`inline-block px-3 py-1.5 rounded-lg text-xs font-semibold border ${categoryColor}`}>
                {categoryLabel}
              </span>
              <span className={`inline-block px-3 py-1.5 rounded-lg text-xs font-semibold border capitalize ${difficultyInfo.color}`}>
                {difficultyInfo.label}
              </span>
              {exercise.premium && (
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border border-yellow-500/20 bg-yellow-500/10 text-yellow-300">
                  <Lock className="w-3.5 h-3.5" />
                  Premium
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-5xl sm:text-6xl font-bold tracking-tighter text-white leading-tight">
              {exercise.title}
            </h1>

            {/* Description */}
            <p className="text-lg text-zinc-400 leading-relaxed max-w-2xl">
              {exercise.description}
            </p>

            {/* Metadata */}
            <div className="flex flex-wrap gap-6 text-sm text-zinc-400 pt-4 border-t border-white/5">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                {exercise.timeInMinutes} minutes
              </div>
              <div className="flex items-center gap-2">
                <Music className="w-4 h-4 text-cyan-400" />
                BPM {bpmMin}–{bpmMax}
              </div>
            </div>
          </div>
        </section>

        {/* Tablature / Strumming pattern */}
        {(exercise.tablature || exercise.strummingPatterns) && (
          <section className="px-6 mx-auto max-w-6xl pb-12 border-t border-white/5 pt-12">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-1">
                {exercise.tablature ? 'Tablature' : 'Strumming Pattern'}
              </h2>
              <p className="text-sm text-zinc-500">
                {exercise.tablature
                  ? 'First few measures of the exercise.'
                  : 'Strum direction pattern to practice.'}
              </p>
            </div>

            {exercise.tablature && (
              <TablatureViewer
                measures={exercise.tablature}
                bpm={exercise.metronomeSpeed?.recommended || 120}
                isPlaying={false}
                startTime={null}
                countInRemaining={0}
                hideNotes={exercise.hideTablatureNotes}
                hideDynamicsLane={true}
                className="w-full"
              />
            )}
            {exercise.strummingPatterns && (
              <StaticStrumPattern patterns={exercise.strummingPatterns} />
            )}
          </section>
        )}

        {/* Instructions */}
        {exercise.instructions.length > 0 && (
          <section className="px-6 mx-auto max-w-6xl pb-12 border-t border-white/5 pt-12">
            <h2 className="text-2xl font-bold text-white mb-8">How to Practice</h2>
            <ol className="space-y-4">
              {exercise.instructions.map((instruction, idx) => (
                <li key={idx} className="flex gap-4">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center text-xs font-bold text-cyan-400">
                    {idx + 1}
                  </span>
                  <span className="text-zinc-300 leading-relaxed pt-0.5">{instruction}</span>
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* Tips */}
        {exercise.tips.length > 0 && (
          <section className="px-6 mx-auto max-w-6xl pb-12 border-t border-white/5 pt-12">
            <h2 className="text-2xl font-bold text-white mb-8">Tips & Techniques</h2>
            <ul className="space-y-3">
              {exercise.tips.map((tip, idx) => (
                <li key={idx} className="flex gap-3 text-zinc-300">
                  <span className="text-cyan-400 font-bold">•</span>
                  <span className="leading-relaxed">{tip}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* CTA Section */}
        <section className="px-6 mx-auto max-w-6xl py-12 border-t border-white/5">
          <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 via-zinc-900 to-zinc-950 p-8 md:p-12">
            <h2 className="text-3xl font-bold text-white mb-4">Ready to Practice?</h2>
            <p className="text-zinc-400 mb-8 max-w-md">
              {exercise.premium
                ? 'Upgrade to Premium to unlock this exercise and master it with our guided practice tools.'
                : 'Start practicing this exercise right now with our interactive tablature and real-time feedback.'}
            </p>
            <Link
              href={`/practice/exercise/${exercise.id}`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-cyan-500 text-zinc-950 font-bold hover:bg-cyan-400 transition-colors"
            >
              Start Practice →
            </Link>
          </div>
        </section>

        {/* Related exercises */}
        {related.length > 0 && (
          <section className="px-6 mx-auto max-w-6xl py-12 border-t border-white/5">
            <h2 className="text-2xl font-bold text-white mb-8">Related Exercises</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-2 gap-6">
              {related.map((ex) => (
                <ExerciseCard
                  key={ex.id}
                  exercise={ex}
                  href={`/exercises/${idToSlug(ex.id)}`}
                />
              ))}
            </div>
          </section>
        )}

        <Footer />
      </main>
    </>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = exercisesAgregat.map((ex) => ({
    params: { id: idToSlug(ex.id) },
  }));

  return {
    paths,
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps<ExerciseDetailPageProps> = async ({ params }) => {
  const slug = params!.id as string;
  const exerciseId = slugToId(slug);

  const raw = exercisesAgregat.find((ex) => ex.id === exerciseId);
  if (!raw) {
    return { notFound: true };
  }

  const exercise = serializeExercise(raw);
  const related = getRelatedExercises(
    exercise,
    serializeExercises(exercisesAgregat),
    4
  );

  return {
    props: { exercise, related },
  };
};

export default ExerciseDetailPage;
