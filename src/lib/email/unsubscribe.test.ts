import { afterEach, describe, expect, it, vi } from "vitest";

import {
  createUnsubscribeToken,
  readUnsubscribeToken,
  unsubscribeHeaders,
} from "./unsubscribe";

const SECRET = "test-secret";

describe("unsubscribe tokens", () => {
  it("reads back the player and the kind of email it was made for", () => {
    const token = createUnsubscribeToken("uid123", "seasonUpdates", SECRET);

    expect(readUnsubscribeToken(token, SECRET)).toEqual({
      uid: "uid123",
      category: "seasonUpdates",
    });
  });

  it("refuses a token pointed at someone else", () => {
    const token = createUnsubscribeToken("uid123", "seasonUpdates", SECRET);
    const [, category, signature] = token.split(".");
    const forged = `${Buffer.from("victim").toString("base64url")}.${category}.${signature}`;

    expect(readUnsubscribeToken(forged, SECRET)).toBeNull();
  });

  it("refuses a token moved to another kind of email", () => {
    const token = createUnsubscribeToken("uid123", "seasonUpdates", SECRET);
    const [uid, , signature] = token.split(".");

    expect(
      readUnsubscribeToken(`${uid}.streakReminders.${signature}`, SECRET),
    ).toBeNull();
  });

  it("refuses a token signed with another secret, or no token at all", () => {
    const token = createUnsubscribeToken("uid123", "productUpdates", "other");

    expect(readUnsubscribeToken(token, SECRET)).toBeNull();
    expect(readUnsubscribeToken("", SECRET)).toBeNull();
    expect(readUnsubscribeToken("a.b.c.d", SECRET)).toBeNull();
  });
});

describe("unsubscribeHeaders", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("offers mail apps a one-click unsubscribe", () => {
    vi.stubEnv("EMAIL_UNSUBSCRIBE_SECRET", SECRET);

    const headers = unsubscribeHeaders(
      "uid123",
      "streakReminders",
      "https://riff.quest",
    );

    expect(headers?.["List-Unsubscribe-Post"]).toBe(
      "List-Unsubscribe=One-Click",
    );
    expect(headers?.["List-Unsubscribe"]).toMatch(
      /^<https:\/\/riff\.quest\/api\/email\/unsubscribe\?token=.+>$/,
    );
  });

  it("adds nothing until the secret is set", () => {
    vi.stubEnv("EMAIL_UNSUBSCRIBE_SECRET", "");

    expect(
      unsubscribeHeaders("uid123", "streakReminders", "https://riff.quest"),
    ).toBeUndefined();
  });
});
