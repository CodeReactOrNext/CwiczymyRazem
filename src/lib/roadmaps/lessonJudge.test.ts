import type * as OpenAiJson from "lib/roadmaps/generation/openaiJson";
import { beforeEach, describe, expect, it, vi } from "vitest";

const completeJson = vi.fn();
vi.mock("./generation/openaiJson", async () => {
  const actual = await vi.importActual<typeof OpenAiJson>(
    "./generation/openaiJson",
  );
  return {
    ...actual,
    completeJson: (...args: unknown[]) => completeJson(...args),
  };
});

const { acceptedPicks, judgeLessons } = await import("./lessonJudge");

const candidates = [
  {
    videoId: "a",
    title: "Ear training: transcribe a melody",
    channelName: "X",
  },
  { videoId: "b", title: "Memorize the fretboard", channelName: "Y" },
  { videoId: "c", title: "Learn melodies by ear", channelName: "Z" },
];

beforeEach(() => completeJson.mockReset());

describe("acceptedPicks", () => {
  it("keeps real candidates once each, best first, capped", () => {
    expect(
      acceptedPicks(
        {
          picks: [
            { videoId: "c", why: "" },
            { videoId: "made-up", why: "" },
            { videoId: "c", why: "" },
            { videoId: "a", why: "" },
          ],
        },
        candidates,
        3,
      ),
    ).toEqual(["c", "a"]);
    expect(
      acceptedPicks(
        { picks: candidates.map(({ videoId }) => ({ videoId, why: "" })) },
        candidates,
        2,
      ),
    ).toHaveLength(2);
  });

  it("answers nothing for an empty or missing answer", () => {
    expect(acceptedPicks({ picks: [] }, candidates)).toEqual([]);
    expect(acceptedPicks(null, candidates)).toEqual([]);
  });
});

describe("judgeLessons", () => {
  it("asks nothing when there is nothing to judge", async () => {
    expect(await judgeLessons({ stepTitle: "Ear", candidates: [] })).toEqual(
      [],
    );
    expect(completeJson).not.toHaveBeenCalled();
  });

  it("returns what the judge picked and shows it every candidate", async () => {
    completeJson.mockResolvedValue({ picks: [{ videoId: "a", why: "fits" }] });

    const picked = await judgeLessons({
      stepTitle: "Recall 2 bars by ear",
      candidates,
    });

    expect(picked).toEqual(["a"]);
    const prompt = completeJson.mock.calls[0][0].user as string;
    expect(prompt).toContain("Recall 2 bars by ear");
    candidates.forEach(({ videoId }) =>
      expect(prompt).toContain(`videoId=${videoId}`),
    );
  });
});
