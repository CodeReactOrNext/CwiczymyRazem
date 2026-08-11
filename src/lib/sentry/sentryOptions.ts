/**
 * Wspólna konfiguracja Sentry dla wszystkich runtime'ów (client / server / edge).
 *
 * Inicjalizacja klienta MUSI żyć w `src/instrumentation-client.ts` — od Next.js 16
 * buildy idą przez Turbopack, a Turbopack nie wstrzykuje starego
 * `sentry.client.config.ts` do bundle'a (robił to wyłącznie webpackowy plugin Sentry).
 */

// DSN projektu riff-quest. Trzymany w kodzie (jak wygenerował wizard), ale można go
// nadpisać zmienną środowiskową, gdyby projekt w Sentry się zmienił.
const FALLBACK_DSN =
  "https://0844bc5d4f1ff110a6dcf20097e8c413@o4510635176099840.ingest.de.sentry.io/4510635202052176";

export const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN || FALLBACK_DSN;

export interface SentryEnabledInput {
  dsn?: string;
  nodeEnv?: string;
  /** `NEXT_PUBLIC_SENTRY_ENABLED` — wymusza włączenie/wyłączenie niezależnie od `NODE_ENV`. */
  override?: string;
}

/**
 * Domyślnie raportujemy tylko z buildów produkcyjnych — w dev logi lecą do konsoli.
 * Override pozwala włączyć Sentry lokalnie (debug) albo wyciszyć je na produkcji.
 */
export const resolveSentryEnabled = ({
  dsn,
  nodeEnv,
  override,
}: SentryEnabledInput): boolean => {
  if (!dsn) {
    return false;
  }
  if (override === "true" || override === "1") {
    return true;
  }
  if (override === "false" || override === "0") {
    return false;
  }
  return nodeEnv === "production";
};

export interface SentryEnvironmentInput {
  /** `VERCEL_ENV`: production | preview | development. */
  vercelEnv?: string;
  nodeEnv?: string;
}

/** Rozdziela produkcję od preview deploymentów, żeby błędy dało się filtrować w Sentry. */
export const resolveSentryEnvironment = ({
  vercelEnv,
  nodeEnv,
}: SentryEnvironmentInput): string =>
  vercelEnv || nodeEnv || "development";

export const SENTRY_ENABLED = resolveSentryEnabled({
  dsn: SENTRY_DSN,
  nodeEnv: process.env.NODE_ENV,
  override: process.env.NEXT_PUBLIC_SENTRY_ENABLED,
});

export const SENTRY_ENVIRONMENT = resolveSentryEnvironment({
  vercelEnv: process.env.NEXT_PUBLIC_VERCEL_ENV,
  nodeEnv: process.env.NODE_ENV,
});

/** Opcje wspólne dla `Sentry.init()` we wszystkich runtime'ach. */
export const sharedSentryOptions = {
  dsn: SENTRY_DSN,
  environment: SENTRY_ENVIRONMENT,
  // Trace'y: pełne próbkowanie — ruch jest na tyle mały, że nie przepalimy limitu.
  tracesSampleRate: 1,
  // Wysyłka logów (Sentry Logs) — patrz consoleLoggingIntegration w każdym runtime.
  enableLogs: true,
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
  sendDefaultPii: true,
};

/** Poziomy console.* przepisywane na logi w Sentry. */
export const SENTRY_CONSOLE_LOG_LEVELS = ["warn", "error"] as const;
