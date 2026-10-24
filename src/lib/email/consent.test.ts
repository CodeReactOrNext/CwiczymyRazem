import { describe, expect, it } from "vitest";

import {
  canSendEmail,
  effectiveEmailPreferences,
  isAnyEmailEnabled,
} from "./consent";

describe("canSendEmail", () => {
  it("sends nothing optional to someone who was never asked", () => {
    expect(canSendEmail({}, "streakReminders")).toBe(false);
    expect(canSendEmail(null, "seasonUpdates")).toBe(false);
    // The old default-on toggles are not consent on their own.
    expect(
      canSendEmail(
        { emailNotifications: { streakReminders: true } },
        "streakReminders",
      ),
    ).toBe(false);
  });

  it("sends nothing to someone who said no", () => {
    expect(
      canSendEmail({ emailConsent: { granted: false } }, "productUpdates"),
    ).toBe(false);
  });

  it("sends every kind to someone who said yes, unless they turned it off", () => {
    const user = {
      emailConsent: { granted: true },
      emailNotifications: { seasonUpdates: false },
    };

    expect(canSendEmail(user, "streakReminders")).toBe(true);
    expect(canSendEmail(user, "productUpdates")).toBe(true);
    expect(canSendEmail(user, "seasonUpdates")).toBe(false);
  });
});

describe("effectiveEmailPreferences", () => {
  it("shows every toggle off until the player agrees", () => {
    expect(
      effectiveEmailPreferences({
        emailNotifications: { streakReminders: true, seasonUpdates: true },
      }),
    ).toEqual({
      streakReminders: false,
      seasonUpdates: false,
      productUpdates: false,
    });
  });

  it("keeps an opt-out made before the player was asked", () => {
    expect(
      effectiveEmailPreferences({
        emailConsent: { granted: true },
        emailNotifications: { streakReminders: false },
      }),
    ).toEqual({
      streakReminders: false,
      seasonUpdates: true,
      productUpdates: true,
    });
  });
});

describe("isAnyEmailEnabled", () => {
  it("is a yes when at least one toggle is on", () => {
    expect(
      isAnyEmailEnabled({
        streakReminders: false,
        seasonUpdates: false,
        productUpdates: true,
      }),
    ).toBe(true);
    expect(
      isAnyEmailEnabled({
        streakReminders: false,
        seasonUpdates: false,
        productUpdates: false,
      }),
    ).toBe(false);
  });
});
