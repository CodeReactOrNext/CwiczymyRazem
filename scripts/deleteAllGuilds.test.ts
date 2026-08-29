// @vitest-environment node

/**
 * One-off admin wipe: removes every guild from Firestore.
 *
 * Destructive and asked for. What it takes out:
 *   - every document in `guilds`, with its `applications`, `stash`, `stashLog`
 *     and `chat` subcollections (recursiveDelete),
 *   - every reserved tag in `guildTags`, so the names and tags are free again,
 *   - `guildId` and `guildBadge` on every user document that carries one —
 *     both are Admin-SDK-only fields, and a member left holding a badge for a
 *     guild that no longer exists cannot found or join another one
 *     (`foundGuild` refuses anybody whose `guildId` is set).
 *
 * Gear parked in a guild stash was detached from its owner's inventory when it
 * was deposited (see `lib/guild/stashTransfer`), so deleting the shelf destroys
 * it. That is why everything is dumped to JSON before a single delete goes out:
 * the file is the only way back.
 *
 * Run with:
 *   DELETE_GUILDS_CONFIRM=yes npm run delete-guilds
 *   DELETE_GUILDS_CONFIRM=yes DELETE_GUILDS_BACKUP=/path/to/dump.json npm run delete-guilds
 *
 * Guarded twice: by `--mode delete-guilds` so a plain `npm test` skips it, and
 * by the confirm variable so the mode alone is not enough.
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

const isWipeMode = (import.meta as any).env?.MODE === "delete-guilds";

(isWipeMode ? describe : describe.skip)("Delete every guild", () => {
  it(
    "dumps the guilds to disk, then removes them and every trace on the users",
    async () => {
      if (process.env.DELETE_GUILDS_CONFIRM !== "yes") {
        throw new Error(
          "DELETE_GUILDS_CONFIRM is not 'yes' — refusing to wipe the guilds",
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
      console.log(`[delete-guilds] project: ${serviceAccount.project_id}`);

      // --- Read everything first ------------------------------------------

      const guildSnap = await firestore.collection("guilds").get();
      const backup: Record<string, unknown> = {
        at: new Date().toISOString(),
        project: serviceAccount.project_id,
        guilds: [],
        guildTags: [],
        users: [],
      };

      let subDocs = 0;
      for (const doc of guildSnap.docs) {
        const subcollections: Record<string, unknown[]> = {};
        for (const sub of await doc.ref.listCollections()) {
          const subSnap = await sub.get();
          subDocs += subSnap.size;
          subcollections[sub.id] = subSnap.docs.map((subDoc) => ({
            id: subDoc.id,
            data: plain(subDoc.data()),
          }));
        }
        (backup.guilds as unknown[]).push({
          id: doc.id,
          data: plain(doc.data()),
          subcollections,
        });
      }

      const tagSnap = await firestore.collection("guildTags").get();
      (backup.guildTags as unknown[]).push(
        ...tagSnap.docs.map((doc) => ({ id: doc.id, data: plain(doc.data()) })),
      );

      // A full scan rather than a filtered query: the two fields are projected,
      // the collection is a few thousand documents, and a stale badge left
      // behind by a missing index would lock somebody out of guilds for good.
      const userSnap = await firestore
        .collection("users")
        .select("guildId", "guildBadge")
        .get();
      const marked = userSnap.docs.filter((doc) => {
        const data = doc.data();
        return data.guildId !== undefined || data.guildBadge !== undefined;
      });
      (backup.users as unknown[]).push(
        ...marked.map((doc) => ({ uid: doc.id, data: plain(doc.data()) })),
      );

      const backupPath =
        process.env.DELETE_GUILDS_BACKUP ??
        path.join(os.tmpdir(), `guilds-backup-${Date.now()}.json`);
      fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2), "utf-8");

      console.log(
        `[delete-guilds] found ${guildSnap.size} guilds (${subDocs} documents in their ` +
          `subcollections), ${tagSnap.size} reserved tags, ${marked.length} users to clear`,
      );
      console.log(`[delete-guilds] backup written to ${backupPath}`);

      // --- Then delete it --------------------------------------------------

      for (const doc of guildSnap.docs) {
        // Takes the subcollections with it — a plain delete would leave the
        // chat and the stash orphaned under a document that no longer exists.
        await firestore.recursiveDelete(doc.ref);
        console.log(`[delete-guilds] deleted guild ${doc.id}`);
      }

      const commitInChunks = async (
        refs: admin.firestore.DocumentReference[],
        apply: (
          batch: admin.firestore.WriteBatch,
          ref: admin.firestore.DocumentReference,
        ) => void,
      ) => {
        for (let index = 0; index < refs.length; index += 400) {
          const batch = firestore.batch();
          for (const ref of refs.slice(index, index + 400)) apply(batch, ref);
          await batch.commit();
        }
      };

      await commitInChunks(
        tagSnap.docs.map((doc) => doc.ref),
        (batch, ref) => batch.delete(ref),
      );

      await commitInChunks(
        marked.map((doc) => doc.ref),
        (batch, ref) =>
          batch.update(ref, {
            guildId: admin.firestore.FieldValue.delete(),
            guildBadge: admin.firestore.FieldValue.delete(),
          }),
      );

      // --- And check it is actually gone -----------------------------------

      const guildsLeft = await firestore.collection("guilds").get();
      const tagsLeft = await firestore.collection("guildTags").get();
      const usersLeft = (
        await firestore.collection("users").select("guildId", "guildBadge").get()
      ).docs.filter((doc) => {
        const data = doc.data();
        return data.guildId !== undefined || data.guildBadge !== undefined;
      });

      console.log(
        `[delete-guilds] done — guilds left: ${guildsLeft.size}, tags left: ${tagsLeft.size}, ` +
          `users still carrying a guild: ${usersLeft.length}`,
      );

      expect(guildsLeft.size).toBe(0);
      expect(tagsLeft.size).toBe(0);
      expect(usersLeft.length).toBe(0);
    },
    10 * 60 * 1000,
  );
});
