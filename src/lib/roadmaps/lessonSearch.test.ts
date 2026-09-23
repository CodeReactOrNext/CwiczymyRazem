import { beforeEach, describe, expect, it, vi } from "vitest";

process.env.OPENAI_API_KEY = "test";
process.env.UPSTASH_VECTOR_REST_URL = "https://vector.test";
process.env.UPSTASH_VECTOR_REST_TOKEN = "test";

vi.mock("openai", () => ({
  default: class {
    embeddings = {
      create: async () => ({
        data: [{ embedding: [0.1] }],
        usage: { total_tokens: 12 },
      }),
    };
  },
}));

const query = vi.fn();
vi.mock("@upstash/vector", () => ({
  Index: class {
    query = (...args: unknown[]) => query(...args);
  },
}));

const stored: Record<string, Record<string, unknown>> = {};
vi.mock("utils/firebase/api/firebase.config", () => ({
  firestore: {
    collection: () => ({ doc: (id: string) => ({ id }) }),
    getAll: async (...refs: { id: string }[]) =>
      refs.map(({ id }) => ({ exists: id in stored, data: () => stored[id] })),
  },
}));

const judgeLessons = vi.fn();
vi.mock("./lessonJudge", () => ({
  MAX_LESSONS_PER_STEP: 3,
  judgeLessons: (...args: unknown[]) => judgeLessons(...args),
}));

const reserveLiveSearch = vi.fn();
const searchYoutube = vi.fn();
const indexLiveLesson = vi.fn();
vi.mock("./youtubeLive", () => ({
  liveQuery: (title: string) => `${title} guitar lesson`,
  reserveLiveSearch: () => reserveLiveSearch(),
  searchYoutube: (...args: unknown[]) => searchYoutube(...args),
  indexLiveLesson: (...args: unknown[]) => indexLiveLesson(...args),
  toLiveCandidate: (lesson: { videoId: string; title: string }) => ({
    videoId: lesson.videoId,
    title: lesson.title,
    channelName: "",
  }),
}));

const { searchLessonsForStep } = await import("./lessonSearch");

const lesson = (videoId: string, title: string) => ({
  videoId,
  title,
  channelName: "Channel",
  thumbnailUrl: "",
  duration: 600,
  status: "indexed",
});

beforeEach(() => {
  Object.keys(stored).forEach((key) => delete stored[key]);
  stored.fret = lesson("fret", "Memorize the fretboard");
  stored.ear = lesson("ear", "Learn melodies by ear");
  query.mockReset().mockResolvedValue([
    { id: "fret", score: 0.86, metadata: { qualityScore: 8 } },
    { id: "ear", score: 0.79, metadata: { qualityScore: 8 } },
    { id: "far", score: 0.5, metadata: { qualityScore: 9 } },
  ]);
  judgeLessons.mockReset();
  reserveLiveSearch.mockReset().mockResolvedValue(true);
  searchYoutube.mockReset().mockResolvedValue([]);
  indexLiveLesson.mockReset();
});

describe("searchLessonsForStep", () => {
  it("keeps what the judge picked from the index, not what is nearest", async () => {
    judgeLessons.mockResolvedValue(["ear"]);

    const { lessons } = await searchLessonsForStep({
      stepTitle: "Recall 2 bars by ear",
    });

    expect(lessons.map((l) => l.videoId)).toEqual(["ear"]);
    // Only candidates above the floor reach the judge.
    const { candidates } = judgeLessons.mock.calls[0][0];
    expect(candidates.map((c: { videoId: string }) => c.videoId)).toEqual([
      "fret",
      "ear",
    ]);
    expect(searchYoutube).not.toHaveBeenCalled();
  });

  it("searches YouTube when the judge keeps nothing, and adds what passes", async () => {
    judgeLessons.mockResolvedValueOnce([]).mockResolvedValueOnce(["yt1"]);
    searchYoutube.mockResolvedValue([
      { ...lesson("yt1", "Transcribing melodies by ear"), description: "" },
      // Already in the index and already judged: not offered twice.
      { ...lesson("fret", "Memorize the fretboard"), description: "" },
    ]);
    indexLiveLesson.mockImplementation(
      async (found: { videoId: string; title: string }) => ({
        videoId: found.videoId,
        title: found.title,
        channelName: "Channel",
        thumbnailUrl: "",
      }),
    );

    const { lessons } = await searchLessonsForStep({
      stepTitle: "Recall 2 bars by ear",
    });

    expect(searchYoutube).toHaveBeenCalledWith(
      "Recall 2 bars by ear guitar lesson",
    );
    const liveCandidates = judgeLessons.mock.calls[1][0].candidates;
    expect(liveCandidates.map((c: { videoId: string }) => c.videoId)).toEqual([
      "yt1",
    ]);
    expect(lessons.map((l) => l.videoId)).toEqual(["yt1"]);
  });

  it("leaves the step empty when today's live searches are spent", async () => {
    judgeLessons.mockResolvedValue([]);
    reserveLiveSearch.mockResolvedValue(false);

    const { lessons } = await searchLessonsForStep({
      stepTitle: "Recall 2 bars by ear",
    });

    expect(lessons).toEqual([]);
    expect(searchYoutube).not.toHaveBeenCalled();
  });

  it("never searches live when asked not to", async () => {
    judgeLessons.mockResolvedValue([]);

    await searchLessonsForStep({ stepTitle: "Ear", live: false });

    expect(reserveLiveSearch).not.toHaveBeenCalled();
  });

  it("falls back to the closest lessons, strictly, when the judge fails", async () => {
    judgeLessons.mockRejectedValue(new Error("model down"));

    const { lessons } = await searchLessonsForStep({ stepTitle: "Ear" });

    // Only the candidate above the stricter fallback floor (0.8).
    expect(lessons.map((l) => l.videoId)).toEqual(["fret"]);
  });
});
