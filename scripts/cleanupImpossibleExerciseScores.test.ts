// @vitest-environment node

/**
 * One-off cleanup: removes exercise leaderboard entries that no single attempt
 * at the exercise could have scored. New runs that outlast the exercise are kept
 * off the boards by isRunWithinExerciseTime; this clears what got on before.
 *
 * Entries carry no run length, so each score is held against the most one
 * attempt could possibly earn: every note of the tab (or every strum of the
 * pattern) hit at full combo and perfect timing, at the fastest tempo the
 * exercise allowed, for the exercise's whole time plus the run slack. Time and
 * tempo are taken from the catalogue as it stood the day the score was written
 * (read from git history, the longer of that version and the one before, for
 * deploy lag), so scores set under an older, longer version stay. The tab
 * itself is today's — git can't evaluate old tabs — which is why only scores
 * well past the bound (FLAG_RATIO) are flagged. Hunts, ear training and
 * exercises outside the catalogue have no computable bound and are left alone.
 *
 * Dry run (reads only, writes the report): npm run cleanup-exercise-scores
 * Delete what the report lists:            npm run cleanup-exercise-scores:apply
 * Review the report between the two — apply deletes exactly its entries, and
 * skips any whose score changed since. Report path: CLEANUP_REPORT env var, or
 * exercise-score-cleanup.json in the OS temp dir.
 * Guarded by `--mode` so a plain `vitest`/`npm run test` skips it.
 */
import { execFileSync } from 'child_process';
import * as admin from 'firebase-admin';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { describe, it } from 'vitest';

import { exercisesAgregat } from '../src/feature/exercisePlan/data/exercisesAgregat';
import type { Exercise } from '../src/feature/exercisePlan/types/exercise.types';
import { RUN_TIME_MIN_TOLERANCE_MS, RUN_TIME_TOLERANCE_RATIO } from '../src/feature/exercisePlan/utils/exerciseTimeLimit';

/** How far past the bound a score must be to count as impossible. */
const FLAG_RATIO = 1.5;
/** Highest tempo the metronome goes to; the bound for exercises without a range. */
const METRONOME_MAX_BPM = 208;
const REPO_ROOT = path.resolve(__dirname, '..');
const REPORT_PATH = process.env.CLEANUP_REPORT ?? path.join(os.tmpdir(), 'exercise-score-cleanup.json');

const readServiceAccountJson = (): string | undefined => {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    return process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  }
  for (const file of ['.env.development.local', '.env.local', '.env']) {
    const envPath = path.resolve(REPO_ROOT, file);
    if (!fs.existsSync(envPath)) continue;
    for (const line of fs.readFileSync(envPath, 'utf-8').split(/\r?\n/)) {
      if (!line.startsWith('FIREBASE_SERVICE_ACCOUNT_JSON=')) continue;
      let value = line.slice('FIREBASE_SERVICE_ACCOUNT_JSON='.length).trim();
      if (
        (value.startsWith("'") && value.endsWith("'")) ||
        (value.startsWith('"') && value.endsWith('"'))
      ) {
        value = value.slice(1, -1);
      }
      if (value) return value;
    }
  }
  return undefined;
};

const initFirestore = () => {
  const serviceAccountJson = readServiceAccountJson();
  if (!serviceAccountJson) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON not found in process.env or project .env files');
  }
  if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.cert(JSON.parse(serviceAccountJson)) });
  }
  return admin.firestore();
};

// ── Catalogue history ─────────────────────────────────────────────────────────

interface CatalogVersion {
  /** Commit date, ISO. */
  date: string;
  minutes: number;
  maxBpm: number;
}

/**
 * Every version of every catalogue exercise's time and tempo ceiling, oldest
 * first, read straight out of the exercise files at each commit that touched them.
 */
const readCatalogHistory = (): Map<string, CatalogVersion[]> => {
  const log = execFileSync(
    'git',
    ['log', '--format=C %h %cI', '--name-only', '--', 'src/feature/exercisePlan/data/'],
    { cwd: REPO_ROOT, maxBuffer: 1 << 28 }
  ).toString();
  const specs: { commit: string; date: string; file: string }[] = [];
  let commit = '';
  let date = '';
  for (const line of log.split(/\r?\n/)) {
    if (line.startsWith('C ')) {
      [, commit, date] = line.split(' ');
    } else if (line.endsWith('.ts')) {
      specs.push({ commit, date, file: line });
    }
  }

  const blobs = execFileSync('git', ['cat-file', '--batch'], {
    cwd: REPO_ROOT,
    input: specs.map((spec) => `${spec.commit}:${spec.file}`).join('\n') + '\n',
    maxBuffer: 1 << 30,
  }).toString('latin1');

  const history = new Map<string, CatalogVersion[]>();
  let cursor = 0;
  for (const spec of specs) {
    const headerEnd = blobs.indexOf('\n', cursor);
    const header = blobs.slice(cursor, headerEnd);
    cursor = headerEnd + 1;
    if (header.endsWith('missing')) continue;
    const size = Number(header.split(' ')[2]);
    const body = blobs.slice(cursor, cursor + size);
    cursor += size + 1;

    const ids = [...body.matchAll(/\bid:\s*["'`]([A-Za-z0-9_#-]+)["'`]/g)];
    ids.forEach((match, index) => {
      const segment = body.slice(match.index, ids[index + 1]?.index ?? body.length);
      const minutes = /timeInMinutes:\s*([0-9.]+)/.exec(segment);
      if (!minutes) return;
      const maxBpm = /metronomeSpeed:\s*\{[^}]*max:\s*([0-9]+)/.exec(segment);
      const versions = history.get(match[1]) ?? [];
      versions.push({ date: spec.date, minutes: Number(minutes[1]), maxBpm: maxBpm ? Number(maxBpm[1]) : 0 });
      history.set(match[1], versions);
    });
  }
  for (const versions of history.values()) versions.sort((a, b) => a.date.localeCompare(b.date));
  return history;
};

/**
 * Time and tempo ceiling of the exercise on the day a score was written — the
 * longer of the version live then and the one before it. Without a date, or
 * without history, the most generous version it ever had.
 */
const catalogAt = (exercise: Exercise, versions: CatalogVersion[] | undefined, writtenAt: Date | null) => {
  const current = { minutes: exercise.timeInMinutes, maxBpm: exercise.metronomeSpeed?.max ?? 0 };
  let picked: { minutes: number; maxBpm: number }[] = versions ?? [];
  if (versions?.length && writtenAt) {
    let live = 0;
    versions.forEach((version, index) => {
      if (new Date(version.date) <= writtenAt) live = index;
    });
    picked = [versions[live], versions[Math.max(0, live - 1)]];
  } else {
    picked = [...picked, current];
  }
  return {
    minutes: Math.max(...picked.map((version) => version.minutes)),
    maxBpm: Math.max(current.maxBpm, ...picked.map((version) => version.maxBpm)),
  };
};

// ── Score bound ───────────────────────────────────────────────────────────────

/** Most one hit was ever worth at a tempo: full combo, perfect timing, under
 *  both the current (fourth-root) and the earlier (linear) tempo bonus. */
const maxPointsPerHit = (bpm: number) =>
  800 * Math.max(1, (bpm / 100) ** 0.25, 1 + (bpm - 100) * 0.001);

const runSeconds = (minutes: number) => {
  const ms = minutes * 60_000;
  return (ms + Math.max(ms * RUN_TIME_TOLERANCE_RATIO, RUN_TIME_MIN_TOLERANCE_MS)) / 1000;
};

/** Hits per beat the exercise asks for, or null when there is nothing to count. */
const hitsPerBeat = (exercise: Exercise): number | null => {
  if (exercise.tablature?.length) {
    let notes = 0;
    let beats = 0;
    for (const measure of exercise.tablature) {
      for (const beat of measure.beats) {
        notes += beat.notes.length;
        beats += beat.duration;
      }
    }
    return beats > 0 ? notes / beats : null;
  }
  if (exercise.strummingPatterns?.length) {
    // Strum scoring grants up to 800 a hit too — same bound per hit.
    return Math.max(
      ...exercise.strummingPatterns.map(
        (pattern) => pattern.strums.filter((strum) => strum.direction !== 'miss').length / pattern.timeSignature[0]
      )
    );
  }
  return null;
};

// ── Report ────────────────────────────────────────────────────────────────────

interface FlaggedEntry {
  path: string;
  exerciseId: string;
  userId: string;
  displayName: string | null;
  score: number;
  bound: number;
  ratio: number;
  bpm: number | null;
  minutes: number;
  boundBpm: number;
  updatedAt: string | null;
}

const mode = (import.meta as any).env?.MODE;

(mode === 'cleanup-scores-dry' ? describe : describe.skip)('Impossible exercise scores — dry run', () => {
  it('writes the entries no attempt could have scored to the report', async () => {
    const db = initFirestore();
    const history = readCatalogHistory();
    const catalog = new Map(exercisesAgregat.map((exercise) => [exercise.id, exercise]));

    const snapshot = await db.collectionGroup('entries').get();
    let scanned = 0;
    let bounded = 0;
    const flagged: FlaggedEntry[] = [];

    for (const doc of snapshot.docs) {
      if (doc.ref.parent.parent?.parent?.id !== 'exerciseLeaderboards') continue;
      scanned++;
      const exerciseId = doc.ref.parent.parent.id;
      const exercise = catalog.get(exerciseId);
      if (!exercise) continue;
      const perBeat = hitsPerBeat(exercise);
      if (!perBeat) continue;
      bounded++;

      const data = doc.data();
      const score = Number(data.score) || 0;
      const writtenAt: Date | null = data.updatedAt?.toDate?.() ?? null;
      const then = catalogAt(exercise, history.get(exerciseId), writtenAt);
      const bpm = Math.max(then.maxBpm, Number(data.bpm) || 0) || METRONOME_MAX_BPM;
      const bound = perBeat * (bpm / 60) * runSeconds(then.minutes) * maxPointsPerHit(bpm);
      const ratio = score / bound;
      if (ratio <= FLAG_RATIO) continue;

      flagged.push({
        path: doc.ref.path,
        exerciseId,
        userId: doc.id,
        displayName: data.displayName ?? null,
        score,
        bound: Math.round(bound),
        ratio: Math.round(ratio * 100) / 100,
        bpm: data.bpm ?? null,
        minutes: then.minutes,
        boundBpm: bpm,
        updatedAt: writtenAt?.toISOString() ?? null,
      });
    }

    flagged.sort((a, b) => b.ratio - a.ratio);
    fs.writeFileSync(REPORT_PATH, JSON.stringify(flagged, null, 2));
    console.log(`Scanned ${scanned} entries, ${bounded} with a computable bound, flagged ${flagged.length}.`);
    console.table(flagged.map(({ exerciseId, displayName, score, bound, ratio, minutes, boundBpm, updatedAt }) => ({
      exerciseId, displayName, score, bound, ratio, minutes, boundBpm, date: updatedAt?.slice(0, 10),
    })));
    console.log(`Report: ${REPORT_PATH}`);
  }, 600_000);
});

(mode === 'cleanup-scores-apply' ? describe : describe.skip)('Impossible exercise scores — apply', () => {
  it('deletes the entries listed in the report', async () => {
    if (!fs.existsSync(REPORT_PATH)) throw new Error(`No report at ${REPORT_PATH} — run the dry run first`);
    const flagged: FlaggedEntry[] = JSON.parse(fs.readFileSync(REPORT_PATH, 'utf-8'));
    const db = initFirestore();

    let deleted = 0;
    for (const entry of flagged) {
      const ref = db.doc(entry.path);
      const current = await ref.get();
      // A score that moved since the report was written was never reviewed.
      if (!current.exists || current.data()?.score !== entry.score) {
        console.log(`Skipped ${entry.path} — changed since the report`);
        continue;
      }
      await ref.delete();
      deleted++;
      console.log(`Deleted ${entry.path} (${entry.displayName}, ${entry.score})`);
    }
    console.log(`Deleted ${deleted} of ${flagged.length} entries.`);
  }, 600_000);
});
