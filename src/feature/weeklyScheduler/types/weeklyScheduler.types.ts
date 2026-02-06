import type { Timestamp } from "firebase/firestore";
import type { Exercise, ExercisePlan } from "feature/exercisePlan/types/exercise.types";

export type DayOfWeek = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";

export interface DaySchedule {
  planId?: string;
  exerciseId?: string;
  songId?: string;
  completed: boolean;
  completedAt?: Timestamp;
}

export interface WeeklySchedule {
  weekStartDate: Timestamp;
  userId: string;
  days: {
    [K in DayOfWeek]: DaySchedule;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type ScheduleItem = Exercise | ExercisePlan;

export interface ScheduleItemWithType {
  item: ScheduleItem;
  type: "exercise" | "plan";
}
