import { exercisesAgregat } from "feature/exercisePlan/data/exercisesAgregat";
import { defaultPlans } from "feature/exercisePlan/data/plansAgregat";
import type {
  DifficultyLevel,
  ExerciseCategory,
} from "feature/exercisePlan/types/exercise.types";
import {
  PRACTICE_PLANNER_EXAMPLE,
  PRACTICE_PLANNER_ROUTINE_IDS,
} from "feature/landing/data/practicePlanner";

export interface PlannerRoutineCard {
  id: string;
  title: string;
  description: string;
  category: ExerciseCategory | "mixed";
  difficulty: DifficultyLevel;
  /** Rounded the same way `PlanCard` rounds it, so both show one number. */
  minutes: number;
  exerciseCount: number;
}

export interface PlannerExampleBlock {
  exerciseId: string;
  title: string;
  description: string;
  category: ExerciseCategory;
  /** Set by hand in the wizard for the example; not the exercise default. */
  minutes: number;
  goal: string;
  /** Minute the block starts at, so the timeline can label 00:00–03:00. */
  startsAt: number;
}

export interface GuitarPracticePlannerPageProps {
  routines: PlannerRoutineCard[];
  exampleBlocks: PlannerExampleBlock[];
}

/**
 * Everything the landing quotes from the product is read from the same data
 * the app renders, at build time. A renamed plan or a deleted exercise fails
 * the build instead of shipping a page that quotes something that no longer
 * exists.
 */
export const buildGuitarPracticePlannerProps =
  (): GuitarPracticePlannerPageProps => {
    const routines = PRACTICE_PLANNER_ROUTINE_IDS.map((id) => {
      const plan = defaultPlans.find((candidate) => candidate.id === id);
      if (!plan) {
        throw new Error(`Practice planner landing: unknown plan "${id}"`);
      }
      return {
        id: plan.id,
        title: plan.title,
        description: plan.description,
        category: plan.category,
        difficulty: plan.difficulty,
        minutes: Math.round(
          plan.exercises.reduce((sum, ex) => sum + ex.timeInMinutes, 0),
        ),
        exerciseCount: plan.exercises.length,
      };
    });

    let startsAt = 0;
    const exampleBlocks = PRACTICE_PLANNER_EXAMPLE.blocks.map((block) => {
      const exercise = exercisesAgregat.find(
        (candidate) => candidate.id === block.exerciseId,
      );
      if (!exercise) {
        throw new Error(
          `Practice planner landing: unknown exercise "${block.exerciseId}"`,
        );
      }
      const result: PlannerExampleBlock = {
        exerciseId: exercise.id,
        title: exercise.title,
        description: exercise.description,
        category: exercise.category,
        minutes: block.minutes,
        goal: block.goal,
        startsAt,
      };
      startsAt += block.minutes;
      return result;
    });

    return { routines, exampleBlocks };
  };
