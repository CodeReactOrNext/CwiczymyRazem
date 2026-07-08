# CwiczymyRazem (riff.quest)

Web + desktop (Electron) aplikacja do ćwiczenia gry na gitarze: śledzenie sesji,
ćwiczenia, plany, punktacja, leaderboard, songi i playlisty.

## Stack

- **Next.js 16** (głównie Pages Router w `src/pages`, częściowo App Router w `src/app`), **React 19**, **TypeScript** (`strict`)
- **Firebase** (Firestore + Auth) po stronie klienta; **firebase-admin** po stronie serwera (API routes)
- Stan: **@tanstack/react-query** (dane serwerowe/async) + **zustand** (stan po stronie klienta). ⚠️ **Redux Toolkit / react-redux to legacy** — jest jeszcze w `src/store`, ale **nie używaj go w nowym kodzie**. Nową logikę stanu pisz na React Query (dane) lub zustand (UI/stan lokalny). Redux zostawiaj w spokoju, chyba że edytujesz istniejący kod, który już z niego korzysta.
- **Tailwind CSS** (+ `tailwindcss-themer` dla motywów), **Radix UI**, **framer-motion**
- **Electron** — natywne audio (ASIO/WASAPI) współdzieli DSP z webem
- Płatności: **Stripe**. Analityka: **PostHog**. Błędy: **Sentry**. Maile: **Resend** + React Email

## Komendy

- `npm run dev` — dev server (Next)
- `npm run build` — build produkcyjny (`prebuild` generuje sitemapy i eksport ćwiczeń)
- `npm run lint` / `npm run lint:fix` — ESLint (`src`)
- `npm test` — testy (Vitest, tryb watch); `npm run coverage` — z pokryciem
- `npm run format` — lint:fix + prettier
- `npm run electron:dev` — Next + Electron równolegle

Przed otwarciem PR-a: **musi przejść `npm run lint` i `npm test`**.

## Struktura

Kod feature'owy trzymamy w `src/feature/<nazwa>/` (np. `songs`, `practice`, `scoring`,
`exercisePlan`, `leadboard`). W środku typowo: `components/`, `services/`, `types/`, `hooks/`.

Współdzielone: `src/components` (UI), `src/lib`, `src/hooks`, `src/store` (Redux — legacy),
`src/utils`, `src/constants`, `src/layouts`, `src/providers`.

### Importy — używaj aliasów ścieżek, nie względnych `../../..`

Zdefiniowane w `tsconfig.json` (bez prefiksu `@`):
`feature/*`, `components/*`, `lib/*`, `hooks/*`, `store/*`, `utils/*`, `constants/*`,
`layouts/*`, `types/*`, `assets/*`, `data/*`, `styles/*`, `wrappers/*`.

Przykład: `import { SongCard } from "feature/songs/components/SongsGrid/SongCard";`

## Konwencje kodu

- **Prettier** (`.prettierrc.json`): podwójne cudzysłowy w TS/JS, **pojedyncze w JSX**,
  średniki, wcięcia 2 spacje, `bracketSameLine: true`. Nie formatuj ręcznie — użyj `npm run format`.
- **ESLint**: `eslint-config-next`, `simple-import-sort` (importy muszą być posortowane),
  `unused-imports` (żadnych nieużywanych importów/zmiennych).
- TypeScript `strict` — bez `any` tam, gdzie da się otypować; preferuj istniejące typy z `types/` i `feature/*/types`.
- Komponenty: funkcyjne + hooki. Trzymaj się wzorców widocznych w sąsiednich plikach danego feature'a.

## Testy

Vitest + Testing Library (`jsdom`). Testy kolokowane obok kodu jako `*.test.ts(x)`.
Setup w `vitest.setup.*`. Do nowej logiki (services, utils, reducery) dopisuj testy.

## Styl / UI

Wszystkie style pisz zgodnie z **[docs/STYLEGUIDE.md](docs/STYLEGUIDE.md)** — to jest źródło prawdy, przeczytaj je przed dotykaniem UI. Najważniejsze zasady:

- **Jak najmniej borderów** (a zwykle wcale). Hierarchię i separację buduj **tłem** (`bg-zinc-900/40` vs `bg-zinc-800/40`) i **odstępami** (`gap`, `space-y`, `mt`/`py`) — nie liniami, `border-*`, `divide-*` ani `<Separator/>`.
- **Style mają oddychać** — daj elementom przestrzeń, hojny padding/whitespace zamiast upychania. Separacja = większy odstęp, nie kreska.
- **Reużywaj komponenty** zamiast tworzyć nowe. Najpierw sięgnij po bazowe shadcn/ui z `src/assets/components/ui/*`, a potem istniejące komponenty feature'ów. Nowy komponent twórz dopiero, gdy naprawdę nie ma czego użyć.
- Reszta (dark-only, paleta semantyczna `zinc`+`cyan/amber/orange/emerald/purple`, `cn()`, brak cieni, warianty przez CVA, brak `uppercase`, hover bez `scale`) — patrz STYLEGUIDE.md.

## Firebase

Reguły dostępu: `firestore.rules` — pola `role`/`stripe*`/`premiumUntil` zapisuje wyłącznie
backend (Admin SDK), klient nie może ich modyfikować. Zmieniając model danych,
**zaktualizuj też `firestore.rules`**.

> ⚠️ **Jeśli zmieniasz `firestore.rules` — wyraźnie zgłoś to właścicielowi w komentarzu na GitHubie** (w opisie PR-a i/lub komentarzu do issue): wypisz, co konkretnie się zmieniło i dlaczego. Zmiany reguł mają wpływ na bezpieczeństwo, więc właściciel musi je świadomie zweryfikować przed mergem.

## Git / PR

- Domyślna gałąź: **`develop`** — nowe PR-y kieruj tutaj (nie na `master`).
- Jedna zmiana = jedna gałąź = jeden PR. W opisie PR linkuj issue (`Closes #123`).
- Nie commituj sekretów ani `.env*`.
- ⚠️ **Jeśli zmiana wymaga nowej / zmienionej zmiennej środowiskowej (`.env`, config, sekret)** — nie dodawaj jej po cichu. **Zgłoś to właścicielowi w komentarzu na GitHubie**: podaj nazwę zmiennej, do czego służy i gdzie ją ustawić (lokalnie / w hostingu). Właściciel musi ją dodać ręcznie, zanim zmiana zadziała.
