// @vitest-environment jsdom
import { configureStore } from "@reduxjs/toolkit";
import { statisticsInitial } from "constants/userStatisticsInitialData";
import type * as FirestoreModule from "firebase/firestore";
import { runTransaction } from "firebase/firestore";
import type { DailyQuest } from "types/api.types";
import type * as FirebaseUtilsModule from "utils/firebase/client/firebase.utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

import userReducer from "./userSlice";
import { updateQuestProgress } from "./userSlice.questActions";

vi.mock("firebase/firestore", async (importOriginal) => ({
  ...(await importOriginal<typeof FirestoreModule>()),
  doc: vi.fn(() => ({ __userRef: true })),
  runTransaction: vi.fn(),
}));

vi.mock("utils/firebase/client/firebase.utils", async (importOriginal) => ({
  ...(await importOriginal<typeof FirebaseUtilsModule>()),
  auth: { currentUser: { uid: "user1" } },
}));

vi.mock("feature/exercisePlan/data/exercisesAgregat", () => ({
  exercisesAgregat: [{ id: "spiderPermutation1234", title: "Spider Walk 1-2-3-4", premium: false }],
}));

vi.mock("posthog-js", () => ({ default: { capture: vi.fn() } }));

const today = new Date().toISOString().slice(0, 10);
const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

const questWith = (date: string, progress = 0): DailyQuest => ({
  date,
  isRewardClaimed: false,
  tasks: [
    {
      id: `quest_${date}_0`,
      type: "practice_total_time",
      title: "Practice for 15 minutes",
      isCompleted: false,
      progress,
      target: 15,
    },
  ],
});

const buildStore = (dailyQuest: DailyQuest) =>
  configureStore({
    reducer: { user: userReducer },
    preloadedState: {
      user: {
        userInfo: null,
        userAuth: "user1",
        currentUserStats: { ...statisticsInitial, timeZone: "UTC", dailyQuest },
        previousUserStats: null,
        raitingData: null,
        isFetching: null,
        isLoggedOut: null,
        timer: { creativity: 0, hearing: 0, technique: 0, theory: 0 },
        providerData: {
          providerId: null,
          uid: null,
          displayName: null,
          email: null,
          photoURL: null,
        },
        currentActivity: null,
      },
    } as never,
    middleware: (getDefault) => getDefault({ serializableCheck: false }),
  });

/** Stubs the quest transaction and records what it writes back. */
const stubStoredQuest = (stored: DailyQuest | null) => {
  const writes: Record<string, DailyQuest>[] = [];

  vi.mocked(runTransaction).mockImplementation(async (_db, updateFn: any) =>
    updateFn({
      get: async () => ({ data: () => ({ statistics: { dailyQuest: stored } }) }),
      update: (_ref: unknown, data: Record<string, DailyQuest>) => {
        writes.push(data);
      },
    }),
  );

  return writes;
};

/**
 * The quest set is drawn when the dashboard widget mounts and never rolled over
 * while the app stays open. A player whose server day flips at 17:00 local
 * (Los Angeles) practices straight through that boundary, so the session is
 * reported against a quest the store drew *yesterday* — and the reducer's date
 * guard used to drop the whole session on the floor.
 */
describe("updateQuestProgress across a server-day rollover", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("adopts the stored quest for today and scores the session against it", async () => {
    const store = buildStore(questWith(yesterday));
    const writes = stubStoredQuest(questWith(today));

    await store.dispatch(updateQuestProgress({ type: "practice_total_time", amount: 45 }) as never);

    const quest = store.getState().user.currentUserStats?.dailyQuest;
    expect(quest?.date).toBe(today);
    expect(quest?.tasks[0]).toMatchObject({ progress: 15, isCompleted: true });

    const published = writes.at(-1)?.["statistics.dailyQuest"];
    expect(published?.tasks[0]).toMatchObject({ progress: 15, isCompleted: true });
  });

  it("draws today's set when neither the client nor the server has one", async () => {
    const store = buildStore(questWith(yesterday));
    stubStoredQuest(questWith(yesterday));

    await store.dispatch(updateQuestProgress({ type: "practice_total_time", amount: 45 }) as never);

    const quest = store.getState().user.currentUserStats?.dailyQuest;
    expect(quest?.date).toBe(today);
    expect(quest?.tasks).toHaveLength(3);
  });

  it("leaves a quest that is already current alone", async () => {
    const store = buildStore(questWith(today));
    stubStoredQuest(questWith(today));

    await store.dispatch(updateQuestProgress({ type: "practice_total_time", amount: 10 }) as never);

    const quest = store.getState().user.currentUserStats?.dailyQuest;
    expect(quest?.tasks).toHaveLength(1);
    expect(quest?.tasks[0]).toMatchObject({ id: `quest_${today}_0`, progress: 10 });
  });
});
