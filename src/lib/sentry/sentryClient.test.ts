// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";

const sentry = vi.hoisted(() => ({
  init: vi.fn(),
  captureException: vi.fn(),
  consoleLoggingIntegration: vi.fn(() => ({})),
}));

vi.mock("@sentry/nextjs", () => sentry);
vi.mock("./sentryOptions", () => ({
  SENTRY_ENABLED: true,
  SENTRY_CONSOLE_LOG_LEVELS: ["warn", "error"],
  sharedSentryOptions: { dsn: "https://test@example.invalid/1" },
}));

import { bufferEarlyErrors, captureException, loadSentry } from "./sentryClient";

describe("sentryClient", () => {
  it("replays errors thrown before the SDK arrived, then hands over", async () => {
    const removeListener = vi.spyOn(window, "removeEventListener");
    bufferEarlyErrors();
    const early = new Error("before sentry");
    window.dispatchEvent(new ErrorEvent("error", { error: early }));

    await loadSentry();
    await loadSentry();

    expect(sentry.init).toHaveBeenCalledTimes(1);
    expect(sentry.captureException).toHaveBeenCalledWith(early, {
      tags: { early_error: true },
    });

    // Sentry's own handlers own window errors now; the buffer is detached.
    expect(removeListener).toHaveBeenCalledWith("error", expect.any(Function));
    expect(removeListener).toHaveBeenCalledWith(
      "unhandledrejection",
      expect.any(Function),
    );
  });

  it("forwards captureException through the lazy SDK", async () => {
    const error = new Error("boundary");
    captureException(error, { tags: { source: "test" } });
    await loadSentry();
    expect(sentry.captureException).toHaveBeenCalledWith(error, {
      tags: { source: "test" },
    });
  });
});
