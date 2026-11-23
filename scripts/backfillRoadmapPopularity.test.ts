// @vitest-environment node

/**
 * Rerunnable migration: counts the players who have progress saved on each
 * curated roadmap and stores the number in roadmapStats/{roadmapId}, where
 * the roadmap cards read it. (A player's own roadmap needs no stored number:
 * the board's listing already counts who is on it.)
 *
 * The app keeps the curated counts fresh by itself afterwards (a count older
 * than a day is taken again the next time the page is opened), so this is for
 * the first fill and for whenever the numbers need resetting.
 *
 * Run with: npm run backfill-roadmap-popularity
 * Guarded by `--mode backfill` so a plain `vitest`/`npm run test` skips it.
 */
import fs from 'fs';
import * as admin from 'firebase-admin';
import path from 'path';
import { describe, it } from 'vitest';

import roadmaps from '../src/data/roadmaps';
import {
  countRoadmapPlayers,
  writeRoadmapPopularity,
} from '../src/lib/roadmaps/roadmapPopularity';

// Vitest only auto-loads .env files matching its mode, so fall back to the
// project env files Next.js uses in dev.
const readServiceAccountJson = (): string | undefined => {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    return process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  }
  for (const file of ['.env.development.local', '.env.local', '.env']) {
    const envPath = path.resolve(__dirname, '..', file);
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

const isBackfillMode = (import.meta as any).env?.MODE === 'backfill';

(isBackfillMode ? describe : describe.skip)('Backfill roadmap popularity', () => {
  it('writes roadmapStats/{roadmapId}.players for every curated roadmap', async () => {
    const serviceAccountJson = readServiceAccountJson();
    if (!serviceAccountJson) {
      throw new Error(
        'FIREBASE_SERVICE_ACCOUNT_JSON not found in process.env or project .env files'
      );
    }
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(serviceAccountJson)),
      });
    }

    const firestore = admin.firestore();
    const counts = await countRoadmapPlayers(
      firestore,
      roadmaps.map((roadmap) => roadmap.id)
    );
    await writeRoadmapPopularity(firestore, counts);

    console.log(
      `[backfill-roadmap-popularity] wrote ${Object.keys(counts).length} curated roadmaps`
    );
    console.table(counts);
  }, 10 * 60 * 1000);
});
