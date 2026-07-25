import type { SongSectionMapSubmission } from "feature/songs/types/songSectionMap.type";
import { Timestamp } from "firebase/firestore";
import { describe, expect, it } from "vitest";

import {
  CLUSTER_TOLERANCE_SECONDS,
  computeConsensusSections,
  upsertSubmissionAndRecompute,
  VERIFIED_MIN_CONTRIBUTORS,
} from "./sectionMapConsensus.utils";

const submission = (
  userId: string,
  sections: { name: string; startTime: number }[]
): SongSectionMapSubmission => ({
  userId,
  username: userId,
  sections,
  submittedAt: Timestamp.now(),
});

describe("computeConsensusSections", () => {
  it("clusters 3 distinct users near one timestamp into a single confirmed section", () => {
    const submissions = [
      submission("u1", [{ name: "Chorus", startTime: 30 }]),
      submission("u2", [{ name: "Chorus", startTime: 31 }]),
      submission("u3", [{ name: "Chorus", startTime: 29 }]),
    ];
    const result = computeConsensusSections(submissions);
    expect(result).toHaveLength(1);
    expect(result[0].confirmations).toBe(3);
    expect(result[0].name).toBe("Chorus");
  });

  it("includes single-contributor sections now that MIN_CONFIRMATIONS is 1", () => {
    const submissions = [submission("u1", [{ name: "Bridge", startTime: 60 }])];
    const result = computeConsensusSections(submissions);
    expect(result).toHaveLength(1);
    expect(result[0].confirmations).toBe(1);
  });

  it("does not let the same user inflate a single cluster's confirmations", () => {
    const submissions = [
      submission("u1", [
        { name: "Intro", startTime: 0 },
        { name: "Intro?", startTime: 2 },
      ]),
      submission("u2", [{ name: "Intro", startTime: 1 }]),
    ];
    const result = computeConsensusSections(submissions);
    // u1's second point can't join the same cluster as its first, so it forms
    // its own cluster (confirmations: 1) instead of inflating the first
    // cluster's confirmations to 3.
    expect(result).toHaveLength(2);
    expect(result[0].confirmations).toBe(2);
    expect(result[1].confirmations).toBe(1);
  });

  it("never lets a generic name win over a real name, even if more frequent", () => {
    const submissions = [
      submission("u1", [{ name: "Section 2", startTime: 10 }]),
      submission("u2", [{ name: "Section 2", startTime: 11 }]),
      submission("u3", [{ name: "Verse", startTime: 9 }]),
    ];
    const result = computeConsensusSections(submissions);
    expect(result[0].name).toBe("Verse");
  });

  it("falls back to Unnamed when every contributor used a generic name", () => {
    const submissions = [
      submission("u1", [{ name: "Section 1", startTime: 5 }]),
      submission("u2", [{ name: "", startTime: 6 }]),
    ];
    const result = computeConsensusSections(submissions);
    expect(result[0].name).toBe("Unnamed");
  });

  it("joins a point exactly at the cluster tolerance boundary", () => {
    const submissions = [
      submission("u1", [{ name: "Solo", startTime: 100 }]),
      submission("u2", [
        { name: "Solo", startTime: 100 + CLUSTER_TOLERANCE_SECONDS },
      ]),
    ];
    const result = computeConsensusSections(submissions);
    expect(result).toHaveLength(1);
    expect(result[0].confirmations).toBe(2);
  });

  it("splits into a new cluster just past the tolerance boundary", () => {
    const submissions = [
      submission("u1", [{ name: "Solo", startTime: 100 }]),
      submission("u2", [
        { name: "Solo", startTime: 100 + CLUSTER_TOLERANCE_SECONDS + 1 },
      ]),
    ];
    const result = computeConsensusSections(submissions);
    // Two singleton clusters, each independently meeting MIN_CONFIRMATIONS=1.
    expect(result).toHaveLength(2);
    expect(result.every((s) => s.confirmations === 1)).toBe(true);
  });
});

describe("upsertSubmissionAndRecompute", () => {
  it("replaces a user's prior submission instead of duplicating it", () => {
    const first = submission("u1", [{ name: "Verse", startTime: 10 }]);
    const second = submission("u1", [{ name: "Verse", startTime: 12 }]);

    const afterFirst = upsertSubmissionAndRecompute([], first);
    expect(afterFirst.contributorCount).toBe(1);

    const afterSecond = upsertSubmissionAndRecompute(
      afterFirst.submissions,
      second
    );
    expect(afterSecond.contributorCount).toBe(1);
    expect(afterSecond.submissions[0].sections[0].startTime).toBe(12);
  });

  it("flips status from pending to verified exactly at VERIFIED_MIN_CONTRIBUTORS", () => {
    let submissions: SongSectionMapSubmission[] = [];
    let result;
    for (let i = 0; i < VERIFIED_MIN_CONTRIBUTORS - 1; i++) {
      result = upsertSubmissionAndRecompute(
        submissions,
        submission(`u${i}`, [{ name: "Chorus", startTime: 30 }])
      );
      submissions = result.submissions;
      expect(result.status).toBe("pending");
    }

    result = upsertSubmissionAndRecompute(
      submissions,
      submission("u-final", [{ name: "Chorus", startTime: 30 }])
    );
    expect(result.contributorCount).toBe(VERIFIED_MIN_CONTRIBUTORS);
    expect(result.status).toBe("verified");
  });
});
