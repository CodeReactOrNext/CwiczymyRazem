import type { CommunityExercise } from "feature/communityExercises/types";
import {
  communityDocId,
  communityExerciseId,
  communityToExercise,
} from "feature/communityExercises/utils/communityToExercise";
import type { Timestamp } from "firebase/firestore";
import { describe, expect, it } from "vitest";

const exercise: CommunityExercise = {
  id: "abc123",
  title: "Pentatonic all boxes in 5s",
  description: "Ascending in groups of 5",
  category: "technique",
  difficulty: "hard",
  relatedSkills: [],
  metronomeSpeed: { min: 40, max: 140, recommended: 80 },
  timeInMinutes: 5,
  instructions: [],
  tips: [],
  tablature: [],
  authorId: "user-1",
  authorUsername: "Cookie",
  createdAt: {} as Timestamp,
  averageRating: 0,
  ratingCount: 0,
  isPublic: false,
  playCount: 0,
  thanksCount: 0,
};

describe("communityDocId", () => {
  it("round-trips the id communityExerciseId builds", () => {
    expect(communityDocId(communityExerciseId("abc123"))).toBe("abc123");
  });

  it("is null for a library exercise", () => {
    expect(communityDocId("pentatonic_box_1")).toBeNull();
  });

  it("is null for the bare prefix", () => {
    expect(communityDocId("community-")).toBeNull();
  });
});

describe("communityToExercise", () => {
  it("gives the exercise the prefixed id and keeps its tempo range", () => {
    const converted = communityToExercise(exercise);
    expect(converted.id).toBe("community-abc123");
    expect(converted.metronomeSpeed).toEqual(exercise.metronomeSpeed);
    expect(converted.title).toBe(exercise.title);
  });
});
