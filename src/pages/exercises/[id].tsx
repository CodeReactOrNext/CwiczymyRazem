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
import { ChevronRight, Clock, Music, Lock, BarChart3, Zap, Activity, Headphones } from 'lucide-react';
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
  technique: 'bg-rose-500/10 text-rose-300',
  theory: 'bg-indigo-500/10 text-indigo-300',
  creativity: 'bg-amber-500/10 text-amber-300',
  hearing: 'bg-emerald-500/10 text-emerald-300',
  mixed: 'bg-cyan-500/10 text-cyan-300',
};

const difficultyColors: Record<string, { label: string; color: string }> = {
  beginner: { label: 'Beginner', color: 'bg-sky-500/10 text-sky-300' },
  easy: { label: 'Easy', color: 'bg-emerald-500/10 text-emerald-300' },
  medium: { label: 'Medium', color: 'bg-amber-500/10 text-amber-300' },
  hard: { label: 'Hard', color: 'bg-rose-500/10 text-rose-300' },
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
  const durationStr = exercise.timeInMinutes < 1 ? `${Math.round(exercise.timeInMinutes * 60)}s` : `${exercise.timeInMinutes} min`;
  const whySuffix = exercise.whyItMatters ? ` ${exercise.whyItMatters}` : '';
  const metaDescription = `${exercise.description}${whySuffix} ${difficultyInfo.label} guitar exercise. ${durationStr}. BPM ${bpmMin}–${bpmMax}.`.slice(
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
              <span className={`inline-block px-3 py-1.5 rounded-lg text-xs font-semibold ${categoryColor}`}>
                {categoryLabel}
              </span>
              <span className={`inline-block px-3 py-1.5 rounded-lg text-xs font-semibold capitalize ${difficultyInfo.color}`}>
                {difficultyInfo.label}
              </span>
              {exercise.premium && (
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-yellow-500/10 text-yellow-300">
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
            <div className="flex flex-wrap items-center gap-6 text-sm text-zinc-400 pt-4 border-t border-white/5">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                {exercise.timeInMinutes < 1 ? `${Math.round(exercise.timeInMinutes * 60)} seconds` : `${exercise.timeInMinutes} minutes`}
              </div>
              <div className="flex items-center gap-2">
                <Music className="w-4 h-4 text-cyan-400" />
                BPM {bpmMin}–{bpmMax}
              </div>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg bg-cyan-500 text-zinc-950 text-xs font-bold hover:bg-cyan-400 transition-colors"
              >
                Start Practice →
              </Link>
            </div>
          </div>
        </section>

        {/* Backing track alert */}
        {exercise.requiresBackingTrack && (
          <section className="px-6 mx-auto max-w-6xl pb-8">
            <div className="flex items-start gap-4 p-5 rounded-lg bg-amber-500/10">
              <div className="p-2 rounded-lg bg-amber-500/20 shrink-0">
                <Headphones className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-amber-400 mb-1">Backing track required</p>
                <p className="text-sm text-amber-300/70 leading-relaxed">
                  This exercise is designed to be practiced over a backing track or drone. Without one, you lose the harmonic context that makes the exercise effective — pick any backing track in the key of your choice and keep it looping throughout the session.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Tablature / Strumming pattern */}
        {(exercise.tablature || exercise.strummingPatterns) && (
          <section className="border-t border-white/5 pt-12">
            <div className="px-6 mx-auto max-w-6xl mb-8">
              <h2 className="text-2xl font-bold text-white mb-3">
                {exercise.tablature ? 'Tablature' : 'Strumming Pattern'}
              </h2>
              {exercise.tablature ? (
                <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-zinc-900">
                  <Lock className="w-4 h-4 text-cyan-400 shrink-0" />
                  <p className="text-sm text-zinc-300">
                    <span className="font-semibold text-white">Preview only.</span> Log in to access the fully interactive version with playback, tempo control, and real-time feedback.{' '}
                    <Link href="/login" className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors">
                      Sign in →
                    </Link>
                  </p>
                </div>
              ) : (
                <p className="text-sm text-zinc-500">Strum direction pattern to practice.</p>
              )}
            </div>

            {exercise.tablature && (
              <div className="px-6 mx-auto max-w-6xl pb-12">
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
              </div>
            )}
            {exercise.strummingPatterns && (
              <div className="px-6 mx-auto max-w-6xl pb-12">
                <StaticStrumPattern patterns={exercise.strummingPatterns} />
              </div>
            )}

            {exercise.tablature && exercise.whyItMatters && (
              <div className="px-6 mx-auto max-w-6xl pb-12">
                <div className="bg-zinc-900/50 rounded-lg p-6">
                  <h3 className="text-sm font-semibold text-cyan-400 mb-3 flex items-center gap-2">
                    <span className="inline-block w-1 h-1 bg-cyan-400 rounded-full"></span>
                    Why It Matters
                  </h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    {exercise.whyItMatters}
                  </p>
                </div>
              </div>
            )}

          </section>
        )}

        {/* Why it matters — always shown when no tablature */}
        {!exercise.tablature && exercise.whyItMatters && (
          <section className="px-6 mx-auto max-w-6xl pb-12 border-t border-white/5 pt-12">
            <h2 className="text-2xl font-bold text-white mb-6">Why This Exercise Matters</h2>
            <p className="text-zinc-400 leading-relaxed max-w-3xl">{exercise.whyItMatters}</p>
          </section>
        )}

        {/* Instructions */}
        {exercise.instructions.length > 0 && (
          <section className="px-6 mx-auto max-w-6xl pb-12 border-t border-white/5 pt-12">
            <h2 className="text-2xl font-bold text-white mb-8">How to Practice</h2>
            <ol className="space-y-4">
              {exercise.instructions.map((instruction, idx) => (
                <li key={idx} className="flex gap-4">
                  <span className="flex-shrink-0 w-6 h-6 rounded-lg bg-cyan-500/20 flex items-center justify-center text-xs font-bold text-cyan-400">
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

        {/* Additional text — SEO-oriented long-form content, supplied per-exercise */}
        {exercise.additionalText && (
          <section className="px-6 mx-auto max-w-6xl pb-12 border-t border-white/5 pt-12">
            <h2 className="text-2xl font-bold text-white mb-6">About This Exercise</h2>
            <div className="prose prose-zinc prose-invert max-w-3xl text-zinc-400 leading-relaxed whitespace-pre-line">
              {exercise.additionalText}
            </div>
          </section>
        )}

        {/* Related skills */}
        {exercise.relatedSkills && exercise.relatedSkills.length > 0 && (
          <section className="px-6 mx-auto max-w-6xl pb-12 border-t border-white/5 pt-12">
            <h2 className="text-2xl font-bold text-white mb-6">Skills You'll Develop</h2>
            <div className="flex flex-wrap gap-2">
              {exercise.relatedSkills.map((skill) => (
                <span
                  key={skill}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-500/10 text-cyan-300 capitalize"
                >
                  {skill.replace(/_|-/g, ' ')}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* CTA Section */}
        <section className="px-6 mx-auto max-w-6xl py-12 border-t border-white/5 relative">
          <div className="relative rounded-lg bg-gradient-to-br from-cyan-500/10 via-zinc-900 to-zinc-950 p-8 md:p-12">
            <div className="flex flex-col lg:flex-row items-center gap-12">
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-white mb-4">Ready to Practice?</h2>
                <p className="text-zinc-400 mb-8">
                  {exercise.premium
                    ? 'Upgrade to Premium to unlock this exercise and master it with our guided practice tools.'
                    : 'Start practicing this exercise right now with our interactive tablature and real-time feedback.'}
                </p>

                {/* Features List */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-cyan-500/20">
                      <Music className="h-5 w-5 text-cyan-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">Sound Recognition</p>
                      <p className="text-xs text-zinc-500">Real-time audio recognition</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-amber-500/20">
                      <BarChart3 className="h-5 w-5 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">Analytics</p>
                      <p className="text-xs text-zinc-500">Track your progress</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/20">
                      <Activity className="h-5 w-5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">Activity Heatmap</p>
                      <p className="text-xs text-zinc-500">Visualize your streak</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-500/20">
                      <Zap className="h-5 w-5 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">Real-time Feedback</p>
                      <p className="text-xs text-zinc-500">Instant corrections</p>
                    </div>
                  </div>
                </div>

                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-cyan-500 text-zinc-950 font-bold hover:bg-cyan-400 transition-colors"
                >
                  Start Practice →
                </Link>
              </div>
              <div className="hidden lg:block w-[450px] pointer-events-none flex-shrink-0">
                <Image
                  src="/images/how-it-works/step-3.png"
                  alt="Ready to practice"
                  width={450}
                  height={450}
                  className="w-full h-auto object-cover rounded-lg shadow-2xl"
                />
              </div>
              <div className="lg:hidden w-full h-56 mt-4">
                <Image
                  src="/images/how-it-works/step-3.png"
                  alt="Ready to practice"
                  width={300}
                  height={300}
                  className="w-full h-full object-cover rounded-lg shadow-2xl"
                />
              </div>
            </div>
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
