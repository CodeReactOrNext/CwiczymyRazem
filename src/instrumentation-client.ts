// Inicjalizacja Sentry po stronie przeglądarki.
// Ten plik ładuje sam Next.js (client instrumentation hook), więc działa zarówno
// z Turbopackiem, jak i z webpackiem — w przeciwieństwie do starego
// `sentry.client.config.ts`, który wstrzykiwał wyłącznie webpackowy plugin Sentry.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/
//
// SDK nie jest tu importowane statycznie: ładuje się dopiero po `load`, gdy
// przeglądarka jest bezczynna (lib/sentry/sentryClient). Błędy sprzed startu są
// buforowane i wysyłane, gdy Sentry wystartuje.

import type * as Sentry from "@sentry/nextjs";
import {
  bufferEarlyErrors,
  getLoadedSentry,
  loadSentryWhenIdle,
} from "lib/sentry/sentryClient";

bufferEarlyErrors();
loadSentryWhenIdle();

export const onRouterTransitionStart: typeof Sentry.captureRouterTransitionStart =
  (...args) => getLoadedSentry()?.captureRouterTransitionStart(...args);
