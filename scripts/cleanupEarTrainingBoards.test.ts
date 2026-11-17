// @vitest-environment node

/**
 * One-off cleanup of the Play by Ear leaderboards (earTrainingEasy/Medium/Hard).
 *
 * Until 2026-11-17 those boards took every point of a run: the self-marked
 * "I had it +1" ones too, with no time limit, so a few entries reached the
 * thousands by clicking. New runs rank only what the mic heard within one
 * attempt (earTrainingBoardScore); the entries written before can't be told
 * apart, so this clears them.
 *
 * Dry run (reads only, writes the report + a full backup of every entry):
 *   npm run cleanup-ear-boards
 * Delete what the report lists:
 *   npm run cleanup-ear-boards:apply
 * EAR_BOARD_MIN_SCORE limits the report to entries at or above that score
 * (default 0 = every entry). Apply deletes exactly the report's entries and
 * skips any whose score changed since. Report path: CLEANUP_REPORT env var, or
 * ear-board-cleanup.json in the OS temp dir. Guarded by `--mode` so a plain
 * `vitest`/`npm run test` skips it.
 */
import * as admin from 'firebase-admin';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { describe, it } from 'vitest';

const BOARDS = ['earTrainingEasy', 'earTrainingMedium', 'earTrainingHard'];
const REPO_ROOT = path.resolve(__dirname, '..');
const REPORT_PATH = process.env.CLEANUP_REPORT ?? path.join(os.tmpdir(), 'ear-board-cleanup.json');
const MIN_SCORE = Number(process.env.EAR_BOARD_MIN_SCORE ?? 0) || 0;

const readServiceAccountJson = (): string | undefined => {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) return process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  for (const file of ['.env.development.local', '.env.local', '.env']) {
    const envPath = path.resolve(REPO_ROOT, file);
    if (!fs.existsSync(envPath)) continue;
    for (const line of fs.readFileSync(envPath, 'utf-8').split(/\r?\n/)) {
      if (!line.startsWith('FIREBASE_SERVICE_ACCOUNT_JSON=')) continue;
      let value = line.slice('FIREBASE_SERVICE_ACCOUNT_JSON='.length).trim();
      if ((value.startsWith("'") && value.endsWith("'")) || (value.startsWith('"') && value.endsWith('"'))) {
        value = value.slice(1, -1);
      }
      if (value) return value;
    }
  }
  return undefined;
};

const initFirestore = () => {
  const serviceAccountJson = readServiceAccountJson();
  if (!serviceAccountJson) throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON not found in process.env or project .env files');
  if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(JSON.parse(serviceAccountJson)) });
  return admin.firestore();
};

interface ReportedEntry {
  path: string;
  board: string;
  userId: string;
  displayName: string | null;
  score: number;
  updatedAt: string | null;
  /** The whole document, so a deleted entry can be written back if needed. */
  data: Record<string, unknown>;
}

const mode = (import.meta as any).env?.MODE;

(mode === 'cleanup-ear-dry' ? describe : describe.skip)('Play by Ear boards — dry run', () => {
  it('lists the board entries to remove and backs them up', async () => {
    const db = initFirestore();
    const reported: ReportedEntry[] = [];
    for (const board of BOARDS) {
      const snapshot = await db.collection('exerciseLeaderboards').doc(board).collection('entries').get();
      for (const doc of snapshot.docs) {
        const data = doc.data();
        const score = Number(data.score) || 0;
        if (score < MIN_SCORE) continue;
        reported.push({
          path: doc.ref.path,
          board,
          userId: doc.id,
          displayName: data.displayName ?? null,
          score,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() ?? null,
          data: { ...data, updatedAt: data.updatedAt?.toDate?.()?.toISOString() ?? null },
        });
      }
    }
    reported.sort((a, b) => a.board.localeCompare(b.board) || b.score - a.score);
    fs.writeFileSync(REPORT_PATH, JSON.stringify(reported, null, 2));
    console.table(reported.map(({ board, displayName, score, updatedAt }) => ({
      board, displayName, score, date: updatedAt?.slice(0, 10),
    })));
    console.log(`${reported.length} entries (score >= ${MIN_SCORE}). Report: ${REPORT_PATH}`);
  }, 600_000);
});

(mode === 'cleanup-ear-apply' ? describe : describe.skip)('Play by Ear boards — apply', () => {
  it('deletes the entries listed in the report', async () => {
    if (!fs.existsSync(REPORT_PATH)) throw new Error(`No report at ${REPORT_PATH} — run the dry run first`);
    const reported: ReportedEntry[] = JSON.parse(fs.readFileSync(REPORT_PATH, 'utf-8'));
    const db = initFirestore();
    let deleted = 0;
    for (const entry of reported) {
      const ref = db.doc(entry.path);
      const current = await ref.get();
      // A score that moved since the report was written was never reviewed.
      if (!current.exists || current.data()?.score !== entry.score) {
        console.log(`Skipped ${entry.path} — changed since the report`);
        continue;
      }
      await ref.delete();
      deleted++;
    }
    console.log(`Deleted ${deleted} of ${reported.length} entries.`);
  }, 600_000);
});
