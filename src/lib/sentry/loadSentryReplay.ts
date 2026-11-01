import * as Sentry from "@sentry/nextjs";

import { SENTRY_ENABLED } from "./sentryOptions";

let requested = false;

/**
 * Starts Session Replay for the logged-in app only.
 *
 * Replay (rrweb) is about a third of the Sentry client and is worth nothing on
 * public pages, which are where search visitors land and where load speed
 * matters for ranking. It is fetched from Sentry's CDN once the browser is idle,
 * so it never competes with the first render. Sample rates come from
 * `Sentry.init` in instrumentation-client. Errors thrown before it arrives are
 * still reported, only without a replay attached.
 */
export function loadSentryReplay(): void {
  if (requested || !SENTRY_ENABLED || typeof window === "undefined") return;
  requested = true;

  const load = () => {
    Sentry.lazyLoadIntegration("replayIntegration")
      .then((replayIntegration) => Sentry.addIntegration(replayIntegration()))
      .catch(() => {
        // Blocked by an ad blocker or offline: replay is optional.
        requested = false;
      });
  };

  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(load, { timeout: 10_000 });
  } else {
    setTimeout(load, 3_000);
  }
}
