import {
  DAILY_QUEST_FAME_REWARD,
  DAILY_QUEST_POINTS_REWARD,
} from "feature/user/store/userSlice.questActions";
import { describe, expect, it } from "vitest";

import { DAILY_QUEST_REWARD } from "./useWhatNextSnapshot";

describe("DAILY_QUEST_REWARD", () => {
  it("promises exactly what claiming the quest pays", () => {
    expect(DAILY_QUEST_REWARD).toEqual({
      fame: DAILY_QUEST_FAME_REWARD,
      points: DAILY_QUEST_POINTS_REWARD,
    });
  });
});
