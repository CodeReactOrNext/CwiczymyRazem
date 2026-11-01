import type * as SentryNS from "@sentry/nextjs";

import {
  SENTRY_CONSOLE_LOG_LEVELS,
  SENTRY_ENABLED,
  sharedSentryOptions,
} from "./sentryOptions";

/**
 * The browser Sentry SDK, loaded after the page instead of with it.
 *
 * Sentry with tracing is ~130 KB gzipped, and every page (landing, blog, song
 * guides included) used to download and run it before hydration. It is now
 * fetched once the browser is idle after `load`. Errors thrown before that are
 * not lost: `bufferEarlyErrors` catches them with plain window listeners and
 * they are replayed into Sentry once it has started (without breadcrumbs, which
 * did not exist yet).
 */

type Sentry = typeof SentryNS;

let sentryPromise: Promise<Sentry> | null = null;
let loaded: Sentry | null = null;

const MAX_BUFFERED = 20;
const buffered: unknown[] = [];

const onError = (event: ErrorEvent) => {
  if (buffered.length < MAX_BUFFERED) buffered.push(event.error ?? event.message);
};
const onRejection = (event: PromiseRejectionEvent) => {
  if (buffered.length < MAX_BUFFERED) buffered.push(event.reason);
};

/** Starts collecting uncaught errors until Sentry takes over. Call once, early. */
export function bufferEarlyErrors(): void {
  if (!SENTRY_ENABLED || typeof window === "undefined") return;
  window.addEventListener("error", onError);
  window.addEventListener("unhandledrejection", onRejection);
}

/** Loads and initialises the SDK once; later calls share the same promise. */
export function loadSentry(): Promise<Sentry> | null {
  if (!SENTRY_ENABLED || typeof window === "undefined") return null;
  if (sentryPromise) return sentryPromise;

  sentryPromise = import("@sentry/nextjs").then((Sentry) => {
    Sentry.init({
      ...sharedSentryOptions,
      integrations: [
        // console.warn / console.error trafiają do Sentry Logs
        Sentry.consoleLoggingIntegration({
          levels: [...SENTRY_CONSOLE_LOG_LEVELS],
        }),
      ],
      // 10% zwykłych sesji + 100% sesji z błędem trafia do Session Replay.
      // Replay itself is only added in the logged-in app: loadSentryReplay.
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
    });

    // Sentry's own global handlers are live now; hand over what came before.
    window.removeEventListener("error", onError);
    window.removeEventListener("unhandledrejection", onRejection);
    for (const error of buffered.splice(0)) {
      Sentry.captureException(error, { tags: { early_error: true } });
    }

    loaded = Sentry;
    return Sentry;
  });
  sentryPromise.catch(() => {
    // Blocked by an ad blocker or offline: monitoring is optional.
  });
  return sentryPromise;
}

/** Loads Sentry when the browser is idle after the page has finished loading. */
export function loadSentryWhenIdle(): void {
  if (!SENTRY_ENABLED || typeof window === "undefined") return;

  const start = () => {
    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(() => void loadSentry(), { timeout: 5_000 });
    } else {
      setTimeout(() => void loadSentry(), 2_000);
    }
  };

  if (document.readyState === "complete") start();
  else window.addEventListener("load", start, { once: true });
}

/** `Sentry.captureException` that works before the SDK has arrived. */
export function captureException(
  error: unknown,
  context?: Parameters<Sentry["captureException"]>[1],
): void {
  void loadSentry()?.then((Sentry) => Sentry.captureException(error, context));
}

/** The SDK if it has already started, for callers that must stay synchronous. */
export const getLoadedSentry = (): Sentry | null => loaded;
