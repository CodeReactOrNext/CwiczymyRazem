// Inicjalizacja Sentry po stronie serwera (Node runtime).
// Ładowane z `register()` w `src/instrumentation.ts`.
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
      Sentry.consoleLoggingIntegration({
        levels: [...SENTRY_CONSOLE_LOG_LEVELS],
      }),
    ],
  });
}
