# Sentry

Monitoring błędów: projekt `riff-quest / javascript-nextjs` (region EU).

## Gdzie co siedzi

| Plik | Runtime | Ładowany przez |
| --- | --- | --- |
| `src/instrumentation-client.ts` | przeglądarka | Next.js (client instrumentation hook) |
| `src/sentry.server.config.ts` | Node (SSR, API routes) | `register()` w `src/instrumentation.ts` |
| `src/sentry.edge.config.ts` | edge | `register()` w `src/instrumentation.ts` |
| `src/lib/sentry/sentryOptions.ts` | wszystkie | wspólne opcje (`dsn`, `environment`, logi, PII) |
| `next.config.js` (`withSentryConfig`) | build | upload source map, release |

Wyłapywanie błędów:

- `onRequestError` w `src/instrumentation.ts` — błędy rzucone na serwerze (SSR, API routes
  Pages Routera, route handlery App Routera),
- `src/pages/_error.tsx` — błędy stron Pages Routera,
- `src/app/global-error.tsx` — błędy renderowania App Routera,
- `src/components/ErrorBoundary/ErrorBoundary.tsx` — błędy renderowania Reacta w kliencie,
- `consoleLoggingIntegration` — `console.warn` / `console.error` lecą do Sentry Logs.

> ⚠️ **Nie wracaj do `sentry.client.config.ts` w rootcie.** Od Next.js 16 build idzie
> Turbopackiem (w `next.config.js` jest `turbopack: {}`), a ten plik wstrzykiwał do bundle'a
> wyłącznie webpackowy plugin Sentry — czyli klient nigdy się nie inicjalizował.
> Inicjalizacja klienta musi być w `src/instrumentation-client.ts`, bo ten plik ładuje sam Next.

## Zmienne środowiskowe

| Zmienna | Wymagana | Do czego |
| --- | --- | --- |
| `SENTRY_AUTH_TOKEN` | do czytelnych stack trace'ów | upload source map przy buildzie (ustaw w Vercelu; bez niego błędy dojdą, ale ze zminifikowanym stackiem) |
| `NEXT_PUBLIC_SENTRY_DSN` | nie | nadpisuje DSN wbudowany w kod |
| `NEXT_PUBLIC_SENTRY_ENABLED` | nie | `true` = włącz Sentry również poza produkcją (debug lokalny), `false` = wycisz na produkcji |

`environment` w Sentry bierze się z `NEXT_PUBLIC_VERCEL_ENV` (`production` / `preview`),
a w razie jego braku z `NODE_ENV` — dzięki temu preview deploymenty nie zaśmiecają produkcji.

## Jak sprawdzić, że działa

1. **Serwer:** wejdź na `/api/sentry-example-api` — endpoint rzuca wyjątek i loguje info.
2. **Klient:** w konsoli przeglądarki na produkcji odpal `setTimeout(() => { throw new Error("sentry smoke test") })`.
3. **Lokalnie:** `NEXT_PUBLIC_SENTRY_ENABLED=true npm run build && npm start`, potem punkty 1–2.
   W `npm run dev` Sentry jest domyślnie wyłączone.

Jeśli w konsoli przeglądarki nie widać requestów do `*.ingest.de.sentry.io`, sprawdź czy
event nie jest blokowany przez adblocka — `tunnelRoute` jest świadomie wyłączone
w `next.config.js` (oszczędność requestów edge na Vercelu), więc część zdarzeń
od użytkowników z adblockiem nie dotrze.

## Ograniczenia Turbopacka

Przy buildzie Turbopackiem Sentry nie robi instrumentacji build-time, więc:

- opcje w `withSentryConfig` pod kluczem `webpack.*` (m.in. `automaticVercelMonitors`,
  `treeshake`) nie mają efektu,
- API routes nie są automatycznie owijane — błędy z nich łapie `onRequestError`,
  ale tylko te faktycznie **rzucone**. Jeśli handler łapie wyjątek i sam zwraca 500,
  dorzuć w `catch` `Sentry.captureException(error)`.
