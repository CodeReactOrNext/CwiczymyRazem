// @vitest-environment node

/**
 * Runs the roadmap generator end to end for a few goals — the artists and the
 * library songs, the draft, the code checks, the review, the rewrite when one
 * is due, the descriptions and the quality gate — and writes down what came
 * out as numbers. Nothing is charged, no ticket is opened and no roadmap is
 * saved; the lesson search is left out (it spends the YouTube quota).
 *
 * This is how a change to the prompts is judged: the same goals before and
 * after, compared on the figures the audit of 2026-11-23 was built on —
 * whether the draft had to be rewritten, how many steps have an exercise that
 * really trains them, how many named songs the library has, how long the plan
 * is. Only the live models can show that, so it costs real money (about
 * $0.40 a goal) and is guarded by `--mode pipelineprobe`.
 *
 * Run with:
 *   npm run roadmap-pipeline-probe
 *   ROADMAP_PROBE_ONLY="knopfler" npm run roadmap-pipeline-probe
 *   ROADMAP_PROBE_GOALS=path/to/goals.json npm run roadmap-pipeline-probe
 *     (an array of { name, title?, goal, level, brief? })
 */
import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

import type { RoadmapPhase } from "../src/feature/aiCoach/types/roadmap.types";
import type { RoadmapBrief } from "../src/lib/roadmaps/generation/brief";
import type { RoadmapLevel } from "../src/lib/roadmaps/generation/levels";

const loadEnv = (name: string): string | undefined => {
  if (process.env[name]) return process.env[name];
  for (const file of [".env.development.local", ".env.local", ".env"]) {
    const envPath = path.resolve(__dirname, "..", file);
    if (!fs.existsSync(envPath)) continue;
    for (const line of fs.readFileSync(envPath, "utf-8").split(/\r?\n/)) {
      if (!line.startsWith(`${name}=`)) continue;
      let value = line.slice(name.length + 1).trim();
      if (/^(['"]).*\1$/.test(value)) value = value.slice(1, -1);
      if (value) return value;
    }
  }
  return undefined;
};

interface ProbeGoal {
  name: string;
  title?: string;
  goal: string;
  level: RoadmapLevel;
  brief?: RoadmapBrief | null;
}

/** One wide, one medium, one narrow — the three sizes the draft has to tell apart. */
const DEFAULT_GOALS: ProbeGoal[] = [
  {
    name: "wide: play like an artist",
    title: "Blues like Stevie Ray Vaughan",
    goal: "Play Texas blues like Stevie Ray Vaughan: the shuffle rhythm, big bends and wide vibrato, and his signature licks over a 12-bar blues.",
    level: "Intermediate",
  },
  {
    name: "medium: one skill area",
    title: "Sing and play",
    goal: "Sing and play at the same time: strumming that runs on autopilot while the voice leads, starting with easy songs.",
    level: "Beginner",
  },
  {
    name: "narrow: one song",
    title: "Sultans of Swing intro",
    goal: "Learn the intro and the first verse fills of Sultans of Swing by Dire Straits, fingerstyle like Mark Knopfler, clean at album tempo.",
    level: "Intermediate",
  },
];

const pct = (part: number, whole: number) =>
  whole ? Math.round((part / whole) * 1000) / 10 : 0;

const enabled = (import.meta as any).env?.MODE === "pipelineprobe";

describe.skipIf(!enabled)("roadmap pipeline probe", () => {
  it(
    "generates each goal and measures what came out",
    async () => {
      for (const name of ["OPENAI_API_KEY", "FIREBASE_SERVICE_ACCOUNT_JSON"]) {
        const value = loadEnv(name);
        if (value) process.env[name] = value;
      }
      const { extractGoalArtists } =
        await import("../src/lib/roadmaps/generation/goalArtists");
      const { findLibrarySong, findLibrarySongsByArtist } =
        await import("../src/lib/roadmaps/songLookup");
      const { draftRoadmapStructure, reviewRoadmapStructure } =
        await import("../src/lib/roadmaps/generation/structure");
      const { matchExercisesForStep } =
        await import("../src/lib/roadmaps/generation/exerciseMatch");
      const { describePhaseSteps } =
        await import("../src/lib/roadmaps/generation/descriptions");
      const { briefForModel, effectiveGoal } =
        await import("../src/lib/roadmaps/generation/brief");
      const { goalForModel } =
        await import("../src/lib/roadmaps/generation/goalContext");
      const { checkRoadmapQuality } =
        await import("../src/lib/roadmaps/generation/qualityGate");
      const { UsageLedger, estimateCostUsd } =
        await import("../src/lib/roadmaps/generation/usage");
      const { OVERUSED_EXERCISE_IDS, SESSIONS_PER_WEEK } =
        await import("../src/lib/roadmaps/generation/limits");
      const { DESCRIPTION_LENGTH, wordCount } =
        await import("../src/lib/roadmaps/generation/lengths");

      const fromFile = process.env.ROADMAP_PROBE_GOALS
        ? (JSON.parse(
            fs.readFileSync(process.env.ROADMAP_PROBE_GOALS, "utf-8"),
          ) as ProbeGoal[])
        : DEFAULT_GOALS;
      const only = (process.env.ROADMAP_PROBE_ONLY ?? "")
        .split(",")
        .map((term) => term.trim().toLowerCase())
        .filter(Boolean);
      const goals = fromFile.filter(
        (goal) =>
          !only.length ||
          only.some((term) => goal.name.toLowerCase().includes(term)),
      );

      const report: Record<string, unknown>[] = [];
      const out = path.resolve(__dirname, "roadmapPipelineProbe.report.json");

      for (const probe of goals) {
        const ledger = new UsageLedger();
        const brief = probe.brief ?? null;
        const promptGoal = goalForModel(
          effectiveGoal(probe.goal, brief),
          null,
          probe.title,
        );
        const started = Date.now();

        const artists = await extractGoalArtists(promptGoal, ledger);
        const librarySongs = (
          await Promise.all(artists.map(findLibrarySongsByArtist))
        ).flat();
        const extras = { librarySongs };

        const draft = await draftRoadmapStructure(
          promptGoal,
          probe.level,
          ledger,
          brief,
          extras,
        );
        const draftCalls = ledger.totals().calls;
        const structure = await reviewRoadmapStructure(
          promptGoal,
          probe.level,
          draft,
          {
            ledger,
            brief,
            extras,
            resolveSong: findLibrarySong,
            matchExercise: matchExercisesForStep,
          },
        );
        const skeletonCalls = ledger.totals().calls;

        // Three phases at a time, the way the job writes them — and, like the
        // job, a phase that comes back incomplete is asked for again.
        let describeRetries = 0;
        const describe = async (phaseIndex: number): Promise<RoadmapPhase> => {
          for (let attempt = 0; ; attempt += 1) {
            try {
              return await describePhaseSteps({
                goal: promptGoal,
                level: probe.level,
                phases: structure.phases,
                phaseIndex,
                brief: briefForModel(brief),
                ledger,
              });
            } catch (error) {
              if (attempt >= 2) throw error;
              describeRetries += 1;
            }
          }
        };
        const described: RoadmapPhase[] = [];
        for (let i = 0; i < structure.phases.length; i += 3) {
          const batch = structure.phases.slice(i, i + 3);
          described.push(
            ...(await Promise.all(
              batch.map((_phase, offset) => describe(i + offset)),
            )),
          );
        }

        const steps = described.flatMap((phase) => phase.steps);
        const withExercise = steps.filter((step) => step.suggestedExerciseId);
        const support = withExercise.filter(
          (step) => step.exerciseRole === "support",
        );
        const overused = withExercise.filter((step) =>
          (OVERUSED_EXERCISE_IDS as readonly string[]).includes(
            step.suggestedExerciseId as string,
          ),
        );
        const songSteps = steps.filter((step) => step.suggestedSong);
        const waiting = steps.filter(
          (step) => step.songRequest && !step.suggestedSong,
        );
        const bare = steps.filter(
          (step) => !step.suggestedExerciseId && !step.suggestedSong,
        );
        const sessions = steps.reduce(
          (sum, step) => sum + step.sessionsRequired,
          0,
        );
        const outsideLength = steps.filter((step) => {
          const range = step.skillType && DESCRIPTION_LENGTH[step.skillType];
          if (!range) return false;
          const words = wordCount(step.description);
          return words > range.max * 1.3 || words < range.min * 0.7;
        });
        const quality = checkRoadmapQuality(described);
        const usage = ledger.totals();

        report.push({
          name: probe.name,
          level: probe.level,
          minutes: Math.round((Date.now() - started) / 6000) / 10,
          costUsd: Math.round(estimateCostUsd(usage) * 100) / 100,
          calls: {
            artistsAndDraft: draftCalls,
            reviewAndRewrite: skeletonCalls - draftCalls,
            descriptions: usage.calls - skeletonCalls,
            describeRetries,
          },
          artists,
          librarySongsOffered: librarySongs.length,
          review: {
            codeChecksOnDraft: structure.review.mechanical ?? [],
            shapeIssues: structure.review.shapeIssues ?? 0,
            issues: structure.review.issues,
            suggestions: structure.review.suggestions,
            rewritten: structure.review.revised,
            codeChecksAfter: structure.review.remaining ?? [],
          },
          size: {
            phases: described.length,
            steps: steps.length,
            sessions,
            weeks: Math.ceil(sessions / SESSIONS_PER_WEEK),
          },
          exercises: {
            stepsWithExercisePct: pct(withExercise.length, steps.length),
            supportSharePct: pct(support.length, withExercise.length),
            overusedUses: overused.length,
            withSetup: steps.filter((step) => step.exerciseSetup).length,
            techniqueStepsWithNone: structure.stepsWithoutExercise ?? [],
            stepsWithNothingToPlay: bare.length,
          },
          songs: {
            linkedSteps: songSteps.length,
            stillWaiting: waiting.map(
              (step) =>
                `${step.songRequest?.title} — ${step.songRequest?.artist}`,
            ),
            firstSongPhase:
              described.findIndex((phase) =>
                phase.steps.some((step) => step.suggestedSong),
              ) + 1,
          },
          text: {
            outsideLengthBand: outsideLength.length,
            gateProblems: quality.problems,
            gateWarnings: quality.warnings,
          },
          plan: described.map((phase) => ({
            title: phase.title,
            steps: phase.steps.map(
              (step) =>
                `${step.title} [${step.skillType}; ex:${step.suggestedExerciseId ?? "-"}${
                  step.exerciseRole === "support" ? " (support)" : ""
                }; song:${step.suggestedSong?.title ?? (step.songRequest ? `? ${step.songRequest.title}` : "-")}; ses:${step.sessionsRequired}${
                  step.exerciseSetup ? `; setup:${step.exerciseSetup}` : ""
                }]`,
            ),
          })),
          sample: steps
            .filter((step) => step.exerciseRole === "support")
            .slice(0, 2)
            .concat(steps.slice(0, 1))
            .map((step) => ({
              title: step.title,
              summary: step.summary,
              description: step.description,
              successCriteria: step.successCriteria,
            })),
        });
        // Written after every goal: a later one failing keeps what is done.
        fs.writeFileSync(out, `${JSON.stringify(report, null, 2)}\n`);
      }

      console.log(
        `[roadmap-pipeline-probe] ${report.length} goals → ${out}\n`,
        JSON.stringify(
          report.map(({ plan: _plan, sample: _sample, ...head }) => head),
          null,
          1,
        ),
      );
      expect(report.length).toBe(goals.length);
    },
    45 * 60 * 1000,
  );
});
