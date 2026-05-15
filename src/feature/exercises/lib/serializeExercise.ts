import type { Exercise, DifficultyLevel, ExerciseCategory, TablatureMeasure, StrumPattern, BackingTrack } from 'feature/exercisePlan/types/exercise.types';
import type { GuitarSkillId } from 'feature/skills/skills.types';

/**
 * JSON-safe version of Exercise — removes non-serializable fields like StaticImageData.
 */
export interface SerializedExercise {
  id: string;
  premium?: boolean;
  title: string;
  description: string;
  difficulty: DifficultyLevel;
  category: ExerciseCategory;
  timeInMinutes: number;
  instructions: string[];
  tips: string[];
  metronomeSpeed: { min: number; max: number; recommended: number } | null;
  relatedSkills: GuitarSkillId[];
  videoUrl?: string | null;
  imageUrl?: string | null;
  spotifyId?: string;
  youtubeVideoId?: string;
  isPlayalong?: boolean;
  links?: { label: string; url: string }[];
  tablature?: TablatureMeasure[];
  backingTracks?: BackingTrack[];
  gpFileUrl?: string;
  hideTablatureNotes?: boolean;
  customGoal?: string;
  customGoalDescription?: string;
  strummingPatterns?: StrumPattern[];
  examBacking?: { url: string; sourceBpm: number };
}

/**
 * Serialize a single Exercise for use in Next.js getStaticProps.
 * Strips non-JSON-safe fields: `image`, `_generatorConfig`, `riddleConfig`.
 * Converts undefined to null for JSON serialization.
 */
export function serializeExercise(ex: Exercise): SerializedExercise {
  const {
    image: _,
    _generatorConfig: __,
    riddleConfig: ___,
    ...rest
  } = ex;

  // Convert undefined values to null for Next.js JSON serialization
  const cleaned = JSON.parse(JSON.stringify(rest)) as SerializedExercise;
  return cleaned;
}

/**
 * Serialize multiple exercises.
 */
export function serializeExercises(exercises: Exercise[]): SerializedExercise[] {
  return exercises.map(serializeExercise);
}
