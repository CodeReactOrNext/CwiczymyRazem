// @vitest-environment node

/**
 * One-off admin grant: hands a single account extra supporter tokens.
 *
 * Written to `supporterTokens.granted` rather than to `supportTotal`, because
 * the two mean different things. `supportTotal` is money the person actually
 * gave, and the panel says so out loud ("Given so far — $45"); inflating it to
 * conjure tokens would have the app telling someone they donated what they
 * never did. A grant is its own field, and like the rest of the wallet it keeps
 * until it is spent.
 *
 * Non-destructive: lifetime spending is left alone, and an existing grant is
 * raised to the target rather than stacked onto.
 *
 * Run with:
 *   GRANT_TOKENS_UID=<uid> npm run grant-tokens
 *   GRANT_TOKENS_UID=<uid> GRANT_TOKENS_QTY=50 npm run grant-tokens
 *
 * Guarded by `--mode granttokens` so a plain `vitest` / `npm run test` skips it.
 */
import * as admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

import { walletFromStored } from "../src/feature/supporterPanel/utils/supporterTokens";

const DEFAULT_QTY = 50;

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

const isGrantMode = (import.meta as any).env?.MODE === "granttokens";

(isGrantMode ? describe : describe.skip)("Grant supporter tokens", () => {
  it(
    "tops one account's wallet up to N granted tokens",
    async () => {
      const uid = process.env.GRANT_TOKENS_UID;
      if (!uid) {
        throw new Error(
          "GRANT_TOKENS_UID not set — refusing to guess which account to write to",
        );
      }

      const qty = Number(process.env.GRANT_TOKENS_QTY ?? DEFAULT_QTY);
      if (!Number.isFinite(qty) || qty <= 0) {
        throw new Error(`GRANT_TOKENS_QTY must be positive, got "${qty}"`);
      }

      const serviceAccountJson = readServiceAccountJson();
      if (!serviceAccountJson) {
        throw new Error(
          "FIREBASE_SERVICE_ACCOUNT_JSON not found in process.env or project .env files",
        );
      }
      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert(JSON.parse(serviceAccountJson)),
        });
      }

      const firestore = admin.firestore();
      const userRef = firestore.collection("users").doc(uid);
      const snapshot = await userRef.get();
      if (!snapshot.exists) throw new Error(`No user document for uid ${uid}`);

      const data = snapshot.data() ?? {};
      // Read through the same reader the app uses, so a wallet still in the
      // monthly shape is normalised here exactly as it is everywhere else.
      const { spent, granted: had } = walletFromStored(data.supporterTokens);

      await userRef.update({
        supporterTokens: { spent, granted: Math.max(had, qty) },
      });

      const written = (await userRef.get()).data()?.supporterTokens;
      expect(written).toMatchObject({ granted: Math.max(had, qty) });

      console.log(
        `[grant-tokens] ${uid}: granted ${Math.max(had, qty)} ` +
          `(was ${had}, spent ${spent} so far)`,
      );

      // Tokens are worthless without the badge — every panel route checks it —
      // so say so plainly rather than leaving a silently inert grant behind.
      if (data.isSupport !== true) {
        console.warn(
          `[grant-tokens] WARNING: ${uid} is not marked as a supporter. ` +
            "The tokens are stored, but /api/supporter/* will answer 403 until " +
            "the account is given the badge in /admin/users.",
        );
      }
    },
    60 * 1000,
  );
});
