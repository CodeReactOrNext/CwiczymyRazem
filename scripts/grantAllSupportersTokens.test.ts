// @vitest-environment node

/**
 * Bulk admin grant: hands every supporter the same number of extra tokens.
 *
 * The single-account sibling (`grantSupporterTokens`) tops a wallet *up to* a
 * target, which is the right move when fixing one person's balance. This one
 * *adds*, because a thank-you handed to the whole roll has to be worth the same
 * to everybody: topping up to 15 would pay the supporter who has never spent a
 * token and pay nothing at all to the one who has spent thirty.
 *
 * Written to `supporterTokens.granted`, never to `supportTotal`, for the reason
 * spelled out in `grantSupporterTokens`: the panel says the donation total out
 * loud, and inflating it would tell people they gave money they never gave.
 *
 * Only accounts carrying the badge are touched. Tokens without `isSupport` are
 * inert — every `/api/supporter/*` route answers 403 — so granting them to
 * somebody without one writes a number nobody can spend.
 *
 * Not idempotent, on purpose: running it twice grants twice. That is what the
 * confirm variable is guarding.
 *
 * Run with:
 *   GRANT_ALL_CONFIRM=yes npm run grant-all-tokens
 *   GRANT_ALL_CONFIRM=yes GRANT_ALL_TOKENS_QTY=25 npm run grant-all-tokens
 *
 * Guarded twice: by `--mode grant-all-tokens` so a plain `npm test` skips it,
 * and by the confirm variable so the mode alone is not enough.
 */
import * as admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

import { walletFromStored } from "../src/feature/supporterPanel/utils/supporterTokens";

const DEFAULT_QTY = 15;

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

const isGrantMode = (import.meta as any).env?.MODE === "grant-all-tokens";

(isGrantMode ? describe : describe.skip)("Grant every supporter tokens", () => {
  it(
    "adds the same grant to every badged account",
    async () => {
      if (process.env.GRANT_ALL_CONFIRM !== "yes") {
        throw new Error(
          "GRANT_ALL_CONFIRM is not 'yes' — refusing to write to every supporter",
        );
      }

      const qty = Number(process.env.GRANT_ALL_TOKENS_QTY ?? DEFAULT_QTY);
      if (!Number.isInteger(qty) || qty <= 0) {
        throw new Error(`GRANT_ALL_TOKENS_QTY must be a positive whole number, got "${qty}"`);
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
      console.log(`[grant-all-tokens] project: ${serviceAccount.project_id}`);

      const supporters = await firestore
        .collection("users")
        .where("isSupport", "==", true)
        .get();

      if (supporters.empty) {
        throw new Error("No accounts carry isSupport — nothing to grant");
      }

      // Read through the same reader the app uses, so a wallet still in the
      // monthly shape is normalised here exactly as it is everywhere else.
      const targets = supporters.docs.map((doc) => {
        const data = doc.data() ?? {};
        const { spent, granted } = walletFromStored(data.supporterTokens);
        return {
          ref: doc.ref,
          uid: doc.id,
          name: (data.displayName as string) ?? null,
          spent,
          before: granted,
          after: granted + qty,
        };
      });

      for (let index = 0; index < targets.length; index += 400) {
        const batch = firestore.batch();
        for (const target of targets.slice(index, index + 400)) {
          batch.update(target.ref, {
            supporterTokens: { spent: target.spent, granted: target.after },
          });
        }
        await batch.commit();
      }

      for (const target of targets) {
        console.log(
          `[grant-all-tokens] ${target.name ?? target.uid}: granted ` +
            `${target.before} -> ${target.after} (spent ${target.spent})`,
        );
      }
      console.log(
        `[grant-all-tokens] +${qty} tokens to ${targets.length} supporters`,
      );

      const check = await targets[0].ref.get();
      expect(check.data()?.supporterTokens).toMatchObject({
        granted: targets[0].after,
      });
    },
    120 * 1000,
  );
});
