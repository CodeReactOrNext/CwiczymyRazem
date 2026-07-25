// @vitest-environment node

/**
 * One-off backfill: seeds the shared `songSectionMaps` collection from the
 * section timings users already created privately at
 * users/{uid}/userSongs/{songId}.sections. Applies the exact same gates as
 * the live submit route (structural validation + "has practiced this song")
 * via the shared pure utils, so migrated data meets the same bar as new
 * submissions.
 *
 * Dry-run by default — only prints counts. Set BACKFILL_WRITE=1 to actually
 * write to songSectionMaps.
 *
 * Run with: npm run backfill-section-maps
 * Guarded by `--mode backfill-section-maps` so a plain `vitest`/`npm run test` skips it.
 */
import * as admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { describe, it } from 'vitest';

import type { SectionMapEntry, SongSectionMapSubmission } from '../src/feature/songs/types/songSectionMap.type';
import {
  computeConsensusSections,
  upsertSubmissionAndRecompute,
  VERIFIED_MIN_CONTRIBUTORS,
} from '../src/feature/songs/utils/sectionMapConsensus.utils';
import { validateSectionMapSubmission } from '../src/feature/songs/utils/sectionMapValidation.utils';
import { buildSongSectionMapId, extractVideoId } from '../src/feature/songs/utils/youtube.utils';

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

const isBackfillMode = (import.meta as any).env?.MODE === 'backfill-section-maps';

(isBackfillMode ? describe : describe.skip)('Backfill songSectionMaps', () => {
  it('seeds songSectionMaps from existing userSongs sections', async () => {
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
    const isWriteRun = process.env.BACKFILL_WRITE === '1';

    let usersScanned = 0;
    let docsScanned = 0;
    let submitted = 0;
    let skippedNoVideo = 0;
    let skippedNoSections = 0;
    let skippedInvalid = 0;
    let skippedNoPractice = 0;

    // songId__videoId -> accumulated, upserted submissions for that map.
    const submissionsByMapId = new Map<string, SongSectionMapSubmission[]>();
    const metaByMapId = new Map<string, { songId: string; videoId: string }>();

    let lastDoc: admin.firestore.QueryDocumentSnapshot | undefined;
    for (;;) {
      let pageQuery = firestore
        .collection('users')
        .orderBy(admin.firestore.FieldPath.documentId())
        .limit(PAGE_SIZE);
      if (lastDoc) pageQuery = pageQuery.startAfter(lastDoc);

      const snapshot = await pageQuery.get();
      if (snapshot.empty) break;

      for (const userDoc of snapshot.docs) {
        usersScanned++;
        const userId = userDoc.id;
        const username = (userDoc.data().displayName as string) || 'Unknown User';

        const userSongsSnapshot = await firestore
          .collection('users')
          .doc(userId)
          .collection('userSongs')
          .get();

        for (const songDoc of userSongsSnapshot.docs) {
          docsScanned++;
          const songId = songDoc.id;
          const data = songDoc.data();

          const youtubeUrl = data.youtubeUrl as string | undefined;
          const videoId = youtubeUrl ? extractVideoId(youtubeUrl) : null;
          if (!videoId) {
            skippedNoVideo++;
            continue;
          }

          const rawSections = (data.sections ?? []) as { name?: string; startTime?: number }[];
          if (rawSections.length === 0) {
            skippedNoSections++;
            continue;
          }

          const sections: SectionMapEntry[] = rawSections.map((s) => ({
            name: String(s.name ?? '').trim().slice(0, 60),
            startTime: Number(s.startTime),
          }));

          const validation = validateSectionMapSubmission({ sections });
          if (!validation.valid) {
            skippedInvalid++;
            continue;
          }

          const progressDoc = await firestore
            .collection('users')
            .doc(userId)
            .collection('songProgress')
            .doc(songId)
            .get();
          const progress = progressDoc.data() as
            | { sessionCount?: number; totalPracticeMs?: number }
            | undefined;
          const hasPracticed =
            (progress?.sessionCount ?? 0) > 0 || (progress?.totalPracticeMs ?? 0) > 0;
          if (!hasPracticed) {
            skippedNoPractice++;
            continue;
          }

          const mapId = buildSongSectionMapId(songId, videoId);
          const incoming: SongSectionMapSubmission = {
            userId,
            username,
            sections,
            submittedAt: admin.firestore.Timestamp.now(),
          };
          const existing = submissionsByMapId.get(mapId) ?? [];
          const upserted = upsertSubmissionAndRecompute(existing, incoming);
          submissionsByMapId.set(mapId, upserted.submissions);
          metaByMapId.set(mapId, { songId, videoId });
          submitted++;
        }
      }

      lastDoc = snapshot.docs[snapshot.docs.length - 1];
      if (snapshot.size < PAGE_SIZE) break;
    }

    const mapsWouldBeWritten = submissionsByMapId.size;

    // Resolve song titles for a human-readable summary (mapIds alone are
    // just `${songId}__${videoId}`, not useful to read at a glance).
    const uniqueSongIds = Array.from(
      new Set(Array.from(metaByMapId.values()).map((m) => m.songId))
    );
    const songById = new Map<string, { title: string; artist: string }>();
    for (const songId of uniqueSongIds) {
      const songDoc = await firestore.collection('songs').doc(songId).get();
      const songData = songDoc.data();
      songById.set(songId, {
        title: (songData?.title as string) ?? songId,
        artist: (songData?.artist as string) ?? '?',
      });
    }

    const summaries = Array.from(submissionsByMapId.entries()).map(([mapId, submissions]) => {
      const meta = metaByMapId.get(mapId)!;
      const song = songById.get(meta.songId);
      const consensusSections = computeConsensusSections(submissions);
      const contributorCount = submissions.length;
      const status: 'pending' | 'verified' =
        contributorCount >= VERIFIED_MIN_CONTRIBUTORS ? 'verified' : 'pending';
      return {
        mapId,
        songId: meta.songId,
        videoId: meta.videoId,
        title: song?.title ?? meta.songId,
        artist: song?.artist ?? '?',
        submissions,
        consensusSections,
        contributorCount,
        status,
      };
    });
    summaries.sort((a, b) => b.contributorCount - a.contributorCount);

    console.log(`[backfill-section-maps] ${summaries.length} candidate map(s):`);
    for (const s of summaries) {
      console.log(
        `  - "${s.title}" by ${s.artist} — ${s.contributorCount} contributor(s), ` +
          `${s.status}, ${s.consensusSections.length} confirmed section(s) [${s.mapId}]`
      );
    }

    if (isWriteRun) {
      const writer = firestore.bulkWriter();
      let failed = 0;
      for (const s of summaries) {
        writer
          .set(
            firestore.collection('songSectionMaps').doc(s.mapId),
            {
              songId: s.songId,
              videoId: s.videoId,
              submissions: s.submissions,
              consensusSections: s.consensusSections,
              contributorCount: s.contributorCount,
              status: s.status,
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true }
          )
          .catch((error) => {
            failed++;
            console.error(`[backfill-section-maps] write failed for ${s.mapId}:`, error);
          });
      }
      await writer.close();
      console.log(`[backfill-section-maps] wrote ${mapsWouldBeWritten - failed} maps, ${failed} failed`);
      if (failed > 0) throw new Error(`${failed} writes failed`);
    } else {
      console.log('[backfill-section-maps] DRY RUN — set BACKFILL_WRITE=1 to actually write.');
    }

    console.log(
      `[backfill-section-maps] usersScanned=${usersScanned} docsScanned=${docsScanned} ` +
        `submitted=${submitted} mapsWouldBeWritten=${mapsWouldBeWritten} ` +
        `skippedNoVideo=${skippedNoVideo} skippedNoSections=${skippedNoSections} ` +
        `skippedInvalid=${skippedInvalid} skippedNoPractice=${skippedNoPractice}`
    );
  }, 10 * 60 * 1000);
});
