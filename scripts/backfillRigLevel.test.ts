// @vitest-environment node

/**
 * Rerunnable migration: denormalizes each user's rig level to users/{uid}.rigLevel
 * so the gear leaderboard can order by it.
 *
 * Stored levels are derived from the static gear definitions (itemStats/effectStats),
 * so rerun this after any gear-balance change.
 *
 * Run with: npm run backfill-rig-level
 * Guarded by `--mode backfill` so a plain `vitest`/`npm run test` skips it.
 */
import fs from 'fs';
import * as admin from 'firebase-admin';
import path from 'path';
import { describe, it } from 'vitest';

import { getRigLevel } from '../src/feature/arsenal/data/rigLevel';

const PAGE_SIZE = 300;

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

(isBackfillMode ? describe : describe.skip)('Backfill rigLevel', () => {
  it('writes users/{uid}.rigLevel where missing or stale', async () => {
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
    const writer = firestore.bulkWriter();
    let scanned = 0;
    let updated = 0;
    let failed = 0;
    let lastDoc: admin.firestore.QueryDocumentSnapshot | undefined;

    for (;;) {
      let pageQuery = firestore
        .collection('users')
        .orderBy(admin.firestore.FieldPath.documentId())
        .limit(PAGE_SIZE);
      if (lastDoc) pageQuery = pageQuery.startAfter(lastDoc);

      const snapshot = await pageQuery.get();
      if (snapshot.empty) break;

      for (const doc of snapshot.docs) {
        scanned++;
        const data = doc.data();
        const computed = getRigLevel(data.arsenal ?? null);
        if (data.rigLevel !== computed) {
          updated++;
          writer.update(doc.ref, { rigLevel: computed }).catch((error) => {
            failed++;
            console.error(`[backfill-rig-level] write failed for ${doc.id}:`, error);
          });
        }
      }

      lastDoc = snapshot.docs[snapshot.docs.length - 1];
      if (snapshot.size < PAGE_SIZE) break;
    }

    await writer.close();
    console.log(
      `[backfill-rig-level] scanned ${scanned} users, updated ${updated}, failed ${failed}`
    );
    if (failed > 0) throw new Error(`${failed} writes failed`);
  }, 10 * 60 * 1000);
});
