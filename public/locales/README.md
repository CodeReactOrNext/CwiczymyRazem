# Translations

`en/` is the source language. Every key lives here, it is bundled with the app, and
it is what the server renders — so nothing in the app is ever untranslated.

`pl/`, `de/`, `es/` are **overlays**: one file per namespace, fetched in the browser
when a player picks that language. Any key missing from an overlay falls back to the
English string, which is why the files may start out as `{}` and be filled in over
time — a half-translated language is still a usable app.

## Translating something

1. Find the key in `en/<namespace>.json`.
2. Copy it — with the same path — into `<locale>/<namespace>.json`.
3. Keep `{{placeholders}}` exactly as they are; they are filled in at runtime.

Only translate what you are sure about. A key you leave out stays English; a key you
translate wrongly is worse than one left out.

## Adding a language

`src/lib/i18n/locales.ts` — add it to `SUPPORTED_LOCALES` and create the folder here.
Nothing else needs to know about it.

## Scope

The chosen language applies **inside the logged-in app only** (see `LocalizedRegion`).
The landing page, blog and public song guides stay English: they are server-rendered
and indexed in one language.
