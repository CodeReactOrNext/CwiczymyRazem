// @vitest-environment node

/**
 * One-off admin delete: removes a single recording from Firestore.
 *
 * The client-side `deleteRecording` service only lets the author remove their
 * own document and deliberately leaves the `comments` subcollection behind, so
 * moderation and any cross-user takedown has to go through the Admin SDK.
 *
 * What it takes out:
 *   - `recordings/<id>` with its subcollections (recursiveDelete) — the
 *     `comments` written under it would otherwise be orphaned,
 *   - every `logs` document carrying that `recordingId`, because the activity
 *     feed renders those entries with a link to a recording that is gone.
 *
 * Everything is dumped to JSON before the first delete goes out — the file is
 * the only way back.
 *
 * Run with:
 *   RECORDING_ID=<id> DELETE_RECORDING_CONFIRM=yes npm run delete-recording
 *   RECORDING_ID=<id> DELETE_RECORDING_CONFIRM=yes DELETE_RECORDING_BACKUP=/path/to/dump.json npm run delete-recording
 *
 * Guarded twice: by `--mode delete-recording` so a plain `npm test` skips it,
 * and by the confirm variable so the mode alone is not enough.
 */
import * as admin from "firebase-admin";
import fs from "fs";
import os from "os";
import path from "path";
import { describe, expect, it } from "vitest";

// Vitest only auto-loads .env files matching its mode, so fall back to the
// project env files Next.js uses in dev.
const readServiceAccountJson = (): string | undefined => {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    return process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  }
  for (const file of [".env.development.local", ".env.local", ".env"]) {
    const envPath = path.resolve(__dirname, "..", file);
    if (!fs.existsSync(envPath)) continue;
    for (const line of fs.readFileSync(envPath, "utf-8").split(/\r?\n/)) {
      if (!line.startsWith("FIREBASE_SERVICE_ACCOUNT_JSON=")) continue;
      let value = line.slice("FIREBASE_SERVICE_ACCOUNT_JSON=".length).trim();
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

/** Timestamps and refs do not survive JSON.stringify — say what they were. */
const plain = (value: unknown): unknown => {
  if (value === null || typeof value !== "object") return value;
  if (typeof (value as any).toDate === "function") {
    return (value as any).toDate().toISOString();
  }
  if (Array.isArray(value)) return value.map(plain);
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
      key,
      plain(entry),
    ]),
  );
};

const isDeleteMode = (import.meta as any).env?.MODE === "delete-recording";

(isDeleteMode ? describe : describe.skip)("Delete a single recording", () => {
  it(
    "dumps the recording, its comments and its log entries to disk, then removes them",
    async () => {
      const recordingId = process.env.RECORDING_ID;
      if (!recordingId) {
        throw new Error("RECORDING_ID is not set — nothing to delete");
      }
      if (process.env.DELETE_RECORDING_CONFIRM !== "yes") {
        throw new Error(
          "DELETE_RECORDING_CONFIRM is not 'yes' — refusing to delete the recording",
        );
      }

      const serviceAccountJson = readServiceAccountJson();
      if (!serviceAccountJson) {
        throw new Error(
          "FIREBASE_SERVICE_ACCOUNT_JSON not found in process.env or project .env files",
        );
      }

      const serviceAccount = JSON.parse(serviceAccountJson);
      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
      }

      const firestore = admin.firestore();
      console.log(`[delete-recording] project: ${serviceAccount.project_id}`);
      console.log(`[delete-recording] recording: ${recordingId}`);

      // --- Read everything first ------------------------------------------

      const recordingRef = firestore.collection("recordings").doc(recordingId);
      const recordingSnap = await recordingRef.get();
      if (!recordingSnap.exists) {
        throw new Error(`recordings/${recordingId} does not exist`);
      }

      const subcollections: Record<string, unknown[]> = {};
      let subDocs = 0;
      for (const sub of await recordingRef.listCollections()) {
        const subSnap = await sub.get();
        subDocs += subSnap.size;
        subcollections[sub.id] = subSnap.docs.map((subDoc) => ({
          id: subDoc.id,
          data: plain(subDoc.data()),
        }));
      }

      const logSnap = await firestore
        .collection("logs")
        .where("recordingId", "==", recordingId)
        .get();

      const backup = {
        at: new Date().toISOString(),
        project: serviceAccount.project_id,
        recording: {
          id: recordingSnap.id,
          data: plain(recordingSnap.data()),
          subcollections,
        },
        logs: logSnap.docs.map((doc) => ({
          id: doc.id,
          data: plain(doc.data()),
        })),
      };

      const backupPath =
        process.env.DELETE_RECORDING_BACKUP ??
        path.join(
          os.tmpdir(),
          `recording-${recordingId}-backup-${Date.now()}.json`,
        );
      fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2), "utf-8");

      const data = recordingSnap.data() ?? {};
      console.log(
        `[delete-recording] "${data.title}" by ${data.userDisplayName} (${data.userId}) — ` +
          `${subDocs} documents in subcollections, ${logSnap.size} log entries`,
      );
      console.log(`[delete-recording] backup written to ${backupPath}`);

      // --- Then delete it --------------------------------------------------

      // Takes the subcollections with it — a plain delete would leave the
      // comments orphaned under a document that no longer exists.
      await firestore.recursiveDelete(recordingRef);
      console.log(`[delete-recording] deleted recordings/${recordingId}`);

      for (let index = 0; index < logSnap.docs.length; index += 400) {
        const batch = firestore.batch();
        for (const doc of logSnap.docs.slice(index, index + 400)) {
          batch.delete(doc.ref);
        }
        await batch.commit();
      }
      console.log(`[delete-recording] deleted ${logSnap.size} log entries`);

      // --- And check it is actually gone -----------------------------------

      const left = await recordingRef.get();
      const commentsLeft = (
        await recordingRef.collection("comments").get()
      ).size;
      const logsLeft = (
        await firestore
          .collection("logs")
          .where("recordingId", "==", recordingId)
          .get()
      ).size;

      console.log(
        `[delete-recording] done — recording exists: ${left.exists}, comments left: ` +
          `${commentsLeft}, logs left: ${logsLeft}`,
      );

      expect(left.exists).toBe(false);
      expect(commentsLeft).toBe(0);
      expect(logsLeft).toBe(0);
    },
    5 * 60 * 1000,
  );
});
