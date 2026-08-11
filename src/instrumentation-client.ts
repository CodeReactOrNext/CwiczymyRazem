// Inicjalizacja Sentry po stronie przeglądarki.
// Ten plik ładuje sam Next.js (client instrumentation hook), więc działa zarówno
// z Turbopackiem, jak i z webpackiem — w przeciwieństwie do starego
// `sentry.client.config.ts`, który wstrzykiwał wyłącznie webpackowy plugin Sentry.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";
import {
  SENTRY_CONSOLE_LOG_LEVELS,
  SENTRY_ENABLED,
  sharedSentryOptions,
} from "lib/sentry/sentryOptions";

if (SENTRY_ENABLED) {
  Sentry.init({
    ...sharedSentryOptions,

    integrations: [
      Sentry.replayIntegration(),
      // console.warn / console.error trafiają do Sentry Logs
      Sentry.consoleLoggingIntegration({
        levels: [...SENTRY_CONSOLE_LOG_LEVELS],
      }),
    ],

    // 10% zwykłych sesji + 100% sesji z błędem trafia do Session Replay.
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
