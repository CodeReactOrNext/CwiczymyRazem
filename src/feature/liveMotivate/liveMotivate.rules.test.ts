import {
  decideLiveMotivate,
  LIVE_HYPE_BONUS,
  LIVE_HYPE_WINDOW_MS,
  LIVE_MOTIVATE_FAME,
  LIVE_MOTIVATE_MAX_PER_DAY,
  LIVE_MOTIVATE_MAX_PER_SESSION,
  liveDayKey,
  liveSessionKey,
} from "feature/liveMotivate/liveMotivate.rules";
import { describe, expect, it } from "vitest";

const NOW = Date.UTC(2026, 10, 26, 18, 0, 0);

describe("liveSessionKey", () => {
  it("prefers the session start over the exercise timestamp", () => {
    expect(liveSessionKey({ timestamp: 200, sessionStartedAt: 100 })).toBe(100);
  });

  it("falls back to the timestamp for activities without a session start", () => {
    expect(liveSessionKey({ timestamp: 200 })).toBe(200);
  });
});

describe("decideLiveMotivate", () => {
  const base = { senderId: "a", recipientId: "b", nowMs: NOW };

  it("pays the flat amount on a fresh session", () => {
    const d = decideLiveMotivate({ ...base, session: null, sender: null });
    expect(d).toMatchObject({ ok: true, recipientFame: LIVE_MOTIVATE_FAME, hype: false });
    if (d.ok) {
      expect(d.session.motivators).toEqual(["a"]);
      expect(d.sender).toEqual({ day: liveDayKey(NOW), count: 1 });
    }
  });

  it("refuses the player's own session", () => {
    expect(decideLiveMotivate({ ...base, recipientId: "a", session: null, sender: null })).toEqual({
      ok: false,
      reason: "SELF",
    });
  });

  it("refuses a second motivation from the same player in one session", () => {
    const session = { motivators: ["a"], times: [NOW - 5000], hypeAwarded: false };
    expect(decideLiveMotivate({ ...base, session, sender: null })).toEqual({
      ok: false,
      reason: "ALREADY",
    });
  });

  it("stops once the session has had its share", () => {
    const motivators = Array.from({ length: LIVE_MOTIVATE_MAX_PER_SESSION }, (_, i) => `u${i}`);
    const session = { motivators, times: motivators.map(() => NOW - 600_000), hypeAwarded: true };
    expect(decideLiveMotivate({ ...base, session, sender: null })).toEqual({
      ok: false,
      reason: "SESSION_FULL",
    });
  });

  it("stops the sender at the daily limit, and resets on a new day", () => {
    const sender = { day: liveDayKey(NOW), count: LIVE_MOTIVATE_MAX_PER_DAY };
    expect(decideLiveMotivate({ ...base, session: null, sender })).toEqual({
      ok: false,
      reason: "DAILY_LIMIT",
    });
    const yesterday = { day: liveDayKey(NOW - 86_400_000), count: LIVE_MOTIVATE_MAX_PER_DAY };
    expect(decideLiveMotivate({ ...base, session: null, sender: yesterday }).ok).toBe(true);
  });

  it("adds the Hype bonus on the third motivation within the window, once", () => {
    const session = { motivators: ["x", "y"], times: [NOW - 30_000, NOW - 10_000], hypeAwarded: false };
    const d = decideLiveMotivate({ ...base, session, sender: null });
    expect(d).toMatchObject({ ok: true, hype: true, hypeCount: 3, recipientFame: LIVE_MOTIVATE_FAME + LIVE_HYPE_BONUS });

    const after = { motivators: ["x", "y", "z"], times: [NOW - 30_000, NOW - 10_000, NOW - 5_000], hypeAwarded: true };
    expect(decideLiveMotivate({ ...base, session: after, sender: null })).toMatchObject({
      ok: true,
      hype: false,
      recipientFame: LIVE_MOTIVATE_FAME,
    });
  });

  it("does not count motivations older than the window toward Hype", () => {
    const old = NOW - LIVE_HYPE_WINDOW_MS - 1;
    const session = { motivators: ["x", "y"], times: [old, NOW - 1000], hypeAwarded: false };
    expect(decideLiveMotivate({ ...base, session, sender: null })).toMatchObject({ ok: true, hype: false });
  });
});
