import type {
  SongSectionMapConsensusSection,
  SongSectionMapStatus,
  SongSectionMapSubmission,
} from "feature/songs/types/songSectionMap.type";
import { isGenericSectionName } from "feature/songs/utils/sectionMapValidation.utils";

export const CLUSTER_TOLERANCE_SECONDS = 4;
// A single structurally-valid, practice-gated submission is enough to
// surface a map — crowd data is sparse (most song+video pairs only ever get
// one contributor), so requiring multi-user agreement kept the feature dark.
export const MIN_CONFIRMATIONS = 1;
export const VERIFIED_MIN_CONTRIBUTORS = 1;

interface ClusterPoint {
  userId: string;
  name: string;
  startTime: number;
}

interface Cluster {
  anchorTime: number;
  members: ClusterPoint[];
}

/** Majority non-generic name in the cluster; ties keep the first-seen name. */
const pickConsensusName = (members: ClusterPoint[]): string => {
  const counts = new Map<string, { count: number; original: string }>();
  for (const member of members) {
    if (isGenericSectionName(member.name)) continue;
    const key = member.name.trim().toLowerCase();
    const existing = counts.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      counts.set(key, { count: 1, original: member.name.trim() });
    }
  }

  let best: { count: number; original: string } | null = null;
  for (const entry of counts.values()) {
    if (!best || entry.count > best.count) best = entry;
  }
  return best ? best.original : "Unnamed";
};

/**
 * Deterministic left-to-right partition, not globally-optimal clustering —
 * acceptable at this scale, and it guarantees a user contributes to a given
 * cluster at most once. Each cluster's anchor is fixed at its first member's
 * time to avoid chain-drift from a long run of closely-spaced points.
 */
export const computeConsensusSections = (
  submissions: SongSectionMapSubmission[]
): SongSectionMapConsensusSection[] => {
  const points: ClusterPoint[] = submissions
    .flatMap((submission) =>
      submission.sections.map((section) => ({
        userId: submission.userId,
        name: section.name,
        startTime: section.startTime,
      }))
    )
    .sort((a, b) => a.startTime - b.startTime);

  const clusters: Cluster[] = [];
  for (const point of points) {
    const last = clusters[clusters.length - 1];
    const withinTolerance =
      last !== undefined &&
      point.startTime - last.anchorTime <= CLUSTER_TOLERANCE_SECONDS;
    const alreadyContributed =
      last !== undefined &&
      last.members.some((member) => member.userId === point.userId);

    if (last && withinTolerance && !alreadyContributed) {
      last.members.push(point);
    } else {
      clusters.push({ anchorTime: point.startTime, members: [point] });
    }
  }

  return clusters
    .map((cluster) => {
      const distinctUsers = new Set(cluster.members.map((m) => m.userId));
      const meanStartTime =
        cluster.members.reduce((sum, m) => sum + m.startTime, 0) /
        cluster.members.length;
      return {
        name: pickConsensusName(cluster.members),
        startTime: Math.round(meanStartTime),
        confirmations: distinctUsers.size,
      };
    })
    .filter((section) => section.confirmations >= MIN_CONFIRMATIONS)
    .sort((a, b) => a.startTime - b.startTime);
};

export interface UpsertSubmissionResult {
  submissions: SongSectionMapSubmission[];
  consensusSections: SongSectionMapConsensusSection[];
  contributorCount: number;
  status: SongSectionMapStatus;
}

/** Replaces the submitting user's prior entry (if any) and recomputes consensus. */
export const upsertSubmissionAndRecompute = (
  existingSubmissions: SongSectionMapSubmission[],
  incoming: SongSectionMapSubmission
): UpsertSubmissionResult => {
  const submissions = existingSubmissions
    .filter((s) => s.userId !== incoming.userId)
    .concat(incoming);

  const consensusSections = computeConsensusSections(submissions);
  const contributorCount = submissions.length;
  const status: SongSectionMapStatus =
    contributorCount >= VERIFIED_MIN_CONTRIBUTORS ? "verified" : "pending";

  return { submissions, consensusSections, contributorCount, status };
};
