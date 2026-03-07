import fs from 'fs';
import path from 'path';
import { exercisesAgregat } from '../src/feature/exercisePlan/data/exercisesAgregat';

const exportExercises = () => {
  const simplifiedExercises = exercisesAgregat.map(ex => ({
    id: ex.id,
    title: ex.title,
    description: ex.description,
    difficulty: ex.difficulty,
    category: ex.category,
    timeInMinutes: ex.timeInMinutes,
    instructions: ex.instructions,
    tips: ex.tips,
    relatedSkills: ex.relatedSkills,
    youtubeVideoId: ex.youtubeVideoId,
    backingTracks: (ex.backingTracks || []).map(bt => ({
      name: bt.name,
      trackType: bt.trackType
    })),
    customGoal: ex.customGoal,
    customGoalDescription: ex.customGoalDescription
  }));

  const outputPath = path.join(__dirname, '../exercises_dump.json');
  fs.writeFileSync(outputPath, JSON.stringify(simplifiedExercises, null, 2), 'utf-8');
  console.log(`Successfully exported ${simplifiedExercises.length} exercises to ${outputPath}`);
};

exportExercises();
