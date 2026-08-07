import type {
  ChallengeNomination,
  ChallengeSubmission,
} from "feature/challenges/types/challenge.types";
import {
  FAME_CLEAR_BONUS,
  FAME_PER_SUBMISSION,
  POINTS_PER_SUBMISSION,
} from "feature/challenges/types/challenge.types";
import {
  calculateSubmissionReward,
  countParticipants,
  getClearedSongIds,
  groupSubmissionsBySong,
  rankNominations,
  remainingVotes,
} from "feature/challenges/utils/challengeProgress";
import { describe, expect, it } from "vitest";

const ts = (millis: number) => ({ toMillis: () => millis }) as any;

const submission = (
  overrides: Partial<ChallengeSubmission> &
    Pick<ChallengeSubmission, "songId" | "userId">,
): ChallengeSubmission =>
  ({
    id: `${overrides.userId}-${overrides.songId}`,
    challengeId: "2026-08",
    userName: "Player",
    recordingId: "rec",
    videoUrl: "https://youtu.be/x",
    title: "Cover",
    createdAt: ts(0),
    ...overrides,
  }) as ChallengeSubmission;

const nomination = (
  overrides: Partial<ChallengeNomination> & Pick<ChallengeNomination, "songId">,
): ChallengeNomination =>
  ({
    id: `2026-09__${overrides.songId}`,
    challengeId: "2026-09",
    title: "Song",
    artist: "Artist",
    nominatedBy: "u1",
    nominatedByName: "Player",
    voteCount: 0,
    voters: [],
    createdAt: ts(0),
    ...overrides,
  }) as ChallengeNomination;

describe("groupSubmissionsBySong", () => {
  it("buckets by song and puts the newest recording first", () => {
    const grouped = groupSubmissionsBySong([
      submission({ songId: "a", userId: "u1", createdAt: ts(100) }),
      submission({ songId: "a", userId: "u2", createdAt: ts(300) }),
      submission({ songId: "b", userId: "u1", createdAt: ts(200) }),
    ]);

    expect(grouped.get("a")?.map((s) => s.userId)).toEqual(["u2", "u1"]);
    expect(grouped.get("b")).toHaveLength(1);
  });
});

describe("getClearedSongIds", () => {
  it("returns only the given player's songs", () => {
    const cleared = getClearedSongIds(
      [
        submission({ songId: "a", userId: "u1" }),
        submission({ songId: "b", userId: "u2" }),
      ],
      "u1",
    );
    expect([...cleared]).toEqual(["a"]);
  });

  it("is empty for a signed-out viewer", () => {
    expect(
      getClearedSongIds([submission({ songId: "a", userId: "u1" })], null).size,
    ).toBe(0);
  });
});

describe("countParticipants", () => {
  it("counts distinct players, not recordings", () => {
    expect(
      countParticipants([
        submission({ songId: "a", userId: "u1" }),
        submission({ songId: "b", userId: "u1" }),
        submission({ songId: "a", userId: "u2" }),
      ]),
    ).toBe(2);
  });
});

describe("calculateSubmissionReward", () => {
  it("pays the flat reward for a regular song", () => {
    expect(calculateSubmissionReward(0, 5)).toEqual({
      points: POINTS_PER_SUBMISSION,
      fame: FAME_PER_SUBMISSION,
      isClear: false,
      isPaid: true,
    });
  });

  it("adds the clear bonus exactly on the last song", () => {
    expect(calculateSubmissionReward(4, 5)).toEqual({
      points: POINTS_PER_SUBMISSION,
      fame: FAME_PER_SUBMISSION + FAME_CLEAR_BONUS,
      isClear: true,
      isPaid: true,
    });
    expect(calculateSubmissionReward(3, 5).isClear).toBe(false);
  });

  it("pays nothing for a late run on a closed board", () => {
    expect(calculateSubmissionReward(0, 5, false)).toEqual({
      points: 0,
      fame: 0,
      isClear: false,
      isPaid: false,
    });
  });

  it("withholds the clear bonus too, but still counts the board as cleared", () => {
    expect(calculateSubmissionReward(4, 5, false)).toEqual({
      points: 0,
      fame: 0,
      isClear: true,
      isPaid: false,
    });
  });
});

describe("remainingVotes", () => {
  it("counts a nomination the player backed as a spent vote", () => {
    const nominations = [
      nomination({ songId: "a", voters: ["u1"] }),
      nomination({ songId: "b", voters: ["u2"] }),
    ];
    expect(remainingVotes(nominations, "u1")).toBe(2);
    expect(remainingVotes(nominations, "u2")).toBe(2);
  });

  it("never drops below zero and is zero when signed out", () => {
    const nominations = Array.from({ length: 9 }, (_, i) =>
      nomination({ songId: `s${i}`, voters: ["u1"] }),
    );
    expect(remainingVotes(nominations, "u1")).toBe(0);
    expect(remainingVotes(nominations, null)).toBe(0);
  });
});

describe("rankNominations", () => {
  it("orders by votes, breaking ties in favour of the earlier nomination", () => {
    const ranked = rankNominations([
      nomination({ songId: "late", voteCount: 3, createdAt: ts(200) }),
      nomination({ songId: "early", voteCount: 3, createdAt: ts(100) }),
      nomination({ songId: "top", voteCount: 9, createdAt: ts(999) }),
    ]);
    expect(ranked.map((n) => n.songId)).toEqual(["top", "early", "late"]);
  });

  it("does not mutate the input", () => {
    const input = [
      nomination({ songId: "a", voteCount: 1 }),
      nomination({ songId: "b", voteCount: 5 }),
    ];
    rankNominations(input);
    expect(input.map((n) => n.songId)).toEqual(["a", "b"]);
  });
});
