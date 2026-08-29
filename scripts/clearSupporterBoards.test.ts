// @vitest-environment node

/**
 * One-off admin wipe: empties the supporter panel's two voting boards.
 *
 * Destructive and asked for. What it takes out:
 *   - `roadmapIdeas` and `gearProposals` — every idea and every gear spec on
 *     the boards, whatever their status,
 *   - `roadmapVotes` and `gearVotes` — the backing ledgers, one document per
 *     supporter, holding `votes: { itemId: weight }`.
 *
 * The ledgers go with the boards rather than surviving them. A ledger is a map
 * keyed by item id, so leaving one behind after its items are deleted keeps a
 * per-person cap (`MAX_BACKING_PER_IDEA`) pinned against rows that no longer
 * exist — the supporter would silently have less room on the fresh board than
 * everybody else.
 *
 * What it deliberately does NOT touch is `supporterTokens.spent`. Tokens burned
 * on a board are burned, which is the rule the whole economy rests on (see
 * `lib/support/roadmapBoard`), and quietly refunding them here would make this
 * script a way to mint currency. Handing spending back is a separate, conscious
 * grant — that is what `grant-tokens` is for.
 *
 * Everything is dumped to JSON before a single delete goes out: the file is the
 * only way back.
 *
 * Run with:
 *   CLEAR_BOARDS_CONFIRM=yes npm run clear-boards
 *   CLEAR_BOARDS_CONFIRM=yes CLEAR_BOARDS=roadmap npm run clear-boards
 *   CLEAR_BOARDS_CONFIRM=yes CLEAR_BOARDS_BACKUP=/path/to/dump.json npm run clear-boards
 *
 * Guarded twice: by `--mode clear-boards` so a plain `npm test` skips it, and
 * by the confirm variable so the mode alone is not enough.
 */
import * as admin from "firebase-admin";
import fs from "fs";
import os from "os";
import path from "path";
import { describe, expect, it } from "vitest";

/** Which collections each board owns: the items, then the backing ledgers. */
const BOARDS = {
  roadmap: ["roadmapIdeas", "roadmapVotes"],
  gear: ["gearProposals", "gearVotes"],
} as const;

type BoardName = keyof typeof BOARDS;

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

const requestedBoards = (): BoardName[] => {
  const raw = (process.env.CLEAR_BOARDS ?? "").trim();
  if (!raw) return ["roadmap", "gear"];

  const names = raw.split(",").map((name) => name.trim().toLowerCase());
  for (const name of names) {
    if (!(name in BOARDS)) {
      throw new Error(
        `CLEAR_BOARDS got "${name}" — expected roadmap, gear, or both comma-separated`,
      );
    }
  }
  return names as BoardName[];
};

const isWipeMode = (import.meta as any).env?.MODE === "clear-boards";

(isWipeMode ? describe : describe.skip)("Clear the supporter boards", () => {
  it(
    "dumps the boards to disk, then empties them and their backing ledgers",
    async () => {
      if (process.env.CLEAR_BOARDS_CONFIRM !== "yes") {
        throw new Error(
          "CLEAR_BOARDS_CONFIRM is not 'yes' — refusing to wipe the boards",
        );
      }

      const boards = requestedBoards();
      const collections = boards.flatMap((board) => [...BOARDS[board]]);

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
      console.log(`[clear-boards] project: ${serviceAccount.project_id}`);
      console.log(`[clear-boards] boards: ${boards.join(", ")}`);

      // --- Read everything first ------------------------------------------

      const backup: Record<string, unknown> = {
        at: new Date().toISOString(),
        project: serviceAccount.project_id,
        boards,
      };
      const refs: admin.firestore.DocumentReference[] = [];

      for (const name of collections) {
        const snap = await firestore.collection(name).get();
        backup[name] = snap.docs.map((doc) => ({
          id: doc.id,
          data: plain(doc.data()),
        }));
        refs.push(...snap.docs.map((doc) => doc.ref));
        console.log(`[clear-boards] ${name}: ${snap.size} docs`);
      }

      const backupPath =
        process.env.CLEAR_BOARDS_BACKUP ??
        path.join(os.tmpdir(), `supporter-boards-backup-${Date.now()}.json`);
      fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2), "utf-8");
      console.log(`[clear-boards] backup written to ${backupPath}`);

      // --- Then delete it --------------------------------------------------

      for (let index = 0; index < refs.length; index += 400) {
        const batch = firestore.batch();
        for (const ref of refs.slice(index, index + 400)) batch.delete(ref);
        await batch.commit();
      }
      console.log(`[clear-boards] deleted ${refs.length} documents`);

      // --- And check it is actually gone -----------------------------------

      for (const name of collections) {
        const left = await firestore.collection(name).get();
        console.log(`[clear-boards] ${name} now holds ${left.size} docs`);
        expect(left.size).toBe(0);
      }
    },
    120 * 1000,
  );
});
