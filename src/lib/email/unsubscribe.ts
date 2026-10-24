import { createHmac, timingSafeEqual } from "node:crypto";

import type { EmailCategory } from "./consent";
import { EMAIL_CATEGORIES } from "./consent";

/**
 * One-click unsubscribe (RFC 8058): the link in an email's `List-Unsubscribe`
 * header turns that one kind of email off without a login. The token names the
 * player and the kind, signed so nobody can unsubscribe someone else by
 * guessing a uid.
 */

const sign = (uid: string, category: EmailCategory, secret: string) =>
  createHmac("sha256", secret).update(`${uid}:${category}`).digest("base64url");

const isEmailCategory = (value: unknown): value is EmailCategory =>
  EMAIL_CATEGORIES.includes(value as EmailCategory);

export const createUnsubscribeToken = (
  uid: string,
  category: EmailCategory,
  secret: string,
): string =>
  `${Buffer.from(uid).toString("base64url")}.${category}.${sign(uid, category, secret)}`;

export const readUnsubscribeToken = (
  token: string,
  secret: string,
): { uid: string; category: EmailCategory } | null => {
  const [encodedUid, category, signature, ...rest] = token.split(".");
  if (rest.length || !encodedUid || !signature || !isEmailCategory(category)) {
    return null;
  }

  const uid = Buffer.from(encodedUid, "base64url").toString();
  const expected = Buffer.from(sign(uid, category, secret));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) {
    return null;
  }

  return { uid, category };
};

/**
 * The headers that give mail apps their own "Unsubscribe" button. Without
 * `EMAIL_UNSUBSCRIBE_SECRET` none are added, and the footer link to Settings is
 * the way out.
 */
export const unsubscribeHeaders = (
  uid: string | undefined,
  category: EmailCategory,
  baseUrl: string,
): Record<string, string> | undefined => {
  const secret = process.env.EMAIL_UNSUBSCRIBE_SECRET;
  if (!secret || !uid) return undefined;

  const token = createUnsubscribeToken(uid, category, secret);
  const url = `${baseUrl}/api/email/unsubscribe?token=${encodeURIComponent(token)}`;

  return {
    "List-Unsubscribe": `<${url}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };
};
