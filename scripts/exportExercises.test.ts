import { describe, it } from 'vitest';
import fs from 'fs';
import path from 'path';
import { exercisesAgregat } from '../src/feature/exercisePlan/data/exercisesAgregat';

describe('Export Exercises', () => {
  it('should export exercises to JSON', () => {
    const simplifiedExercises = exercisesAgregat
      .filter(ex => !ex.isPlayalong)
      .map(ex => ({
        id: ex.id,
        title: ex.title,
        description: ex.description,
        difficulty: ex.difficulty,
        category: ex.category,
        youtubeVideoId: ex.youtubeVideoId,
        customGoal: ex.customGoal,
        customGoalDescription: ex.customGoalDescription
      }));

    const outputPath = path.resolve(__dirname, '../exercises_dump.json');
    fs.writeFileSync(outputPath, JSON.stringify(simplifiedExercises, null, 2), 'utf-8');
    console.log(`Successfully exported ${simplifiedExercises.length} exercises to ${outputPath}`);
  });
});
