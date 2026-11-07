# What Next: centrum dowodzenia „co teraz”

**Data:** 2026-11-07
**Pozycja w roadmapie:** `what-next` w `src/feature/roadmap/data/roadmap.data.ts`
> A command center that tells you what to do next: which exercise, which plan, and which goal is closest.

## 1. Problem

Aplikacja ma kilkanaście pętli: daily quest, ćwiczenie dnia, streak, cele tempa, kalendarz, rotacja, Journey, roadmapy AI, skill tree, scale tree, songi, challenge miesiąca, duele, bossy, gildie, osiągnięcia, sezon, arsenal (skrzynki, trader, warsztat). Każda pętla pilnuje tylko swojego „następnego kroku”:

- `getNextUnfinishedStep` w roadmapach,
- `findCurrentPlacement` w skill tree,
- „najbardziej zardzewiały” element w `RotationSpotlight`,
- `NextUpCard`, który pokazuje następne poziomy,
- `getGettingStartedProgress` dla nowych graczy.

Nic nie zestawia tych pętli razem. Gracz sam musi sprawdzić pięć ekranów, żeby wiedzieć, co ma zrobić.

**What Next** zbiera sygnały ze wszystkich modułów, nadaje im wagi i układa je w osobistą roadmapę. Na górze jest jedna główna akcja, pod nią to, co jest do zrobienia dziś, potem ten tydzień, a na końcu horyzont.

## 2. Zasady produktowe

1. **Główną akcją zawsze jest granie.** Na pierwszym miejscu stoi ćwiczenie, cel, song albo krok ścieżki. Ekonomia to nagroda, nie zadanie. **Arsenal pojawia się wyłącznie w pasku „Odbierz”** (darmowe skrzynki z `caseTokens`). Pity, trader, rynek i nowe przedmioty nie trafiają na roadmapę.
2. **Odbieranie nagród nie zajmuje miejsca na roadmapie.** Wszystko, co jest do odebrania (daily quest, kamień milowy tygodnia, osiągnięcia, darmowe skrzynki, questy gildii, nagrody z drzewek), ląduje w jednym pasku „Odbierz” z przyciskiem „Odbierz wszystko”, jeśli się da.
3. **Każda rekomendacja mówi, dlaczego się pojawiła.** Na przykład: „Brakuje 1 czystego przejścia do 120 BPM”, „Streak 12 dni, zostały 4 h”, „2 utwory do końca challenge'u, zostało 5 dni”.
4. **Każda rekomendacja ma deep link prosto do akcji**, a nie do listy, w której trzeba szukać.
5. **Bez upselli.** Rola jest obecnie wymuszona na `master` dla wszystkich (`userSlice.ts:82,99,621`), więc nic nie jest zablokowane premium. Jedyne blokady to poziomy (`FEATURE_UNLOCKS`) i te pokazujemy jako horyzont: „Gildie od lvl 5, brakuje 340 pkt”.
6. **Różnorodność.** W top 3 może być najwyżej jedna akcja z danego źródła.

## 3. Wygląd

Według STYLEGUIDE: separacja tłem i odstępami, bez borderów, paleta semantyczna, komponenty z `src/assets/components/ui/*`.

```
┌ Odbierz (pasek, tylko gdy jest co odebrać) ────────────────────────┐
│  Daily quest +40 Fame · 2 osiągnięcia · 1 darmowa skrzynka  [Odbierz wszystko]
└────────────────────────────────────────────────────────────────────┘

  NASTĘPNY KROK  (hero)
  Cel tempa: „Spider 1-2-3-4” 112 → 120 BPM
  Brakuje 1 czystego przejścia do następnego etapu          [Graj ▶]
  ~10 min · etap 4/7

  Zagraj sesję:  [15 min]  [30 min]  [45 min]   ← składa top akcje praktyki w jedną sesję

  DZIŚ ─────────────────────────────────
  • Streak 12 dni, zostały 4 h                         (amber)
  • Ćwiczenie dnia: jesteś 7. na 23, nagroda dla top 3   (cyan)
  • Daily quest: 2/3 zadań („10 min teorii”)
  • Duel z @x: Twój ruch, zostało 6 h
  • Kalendarz: 2 z 3 pozycji zrobione

  W TOKU (Twoje ścieżki) ───────────────
  • Journey · Fundamentals: krok 5/12 „Akordy otwarte”
  • Roadmapa „John Mayer”: faza 2, checkpoint gotowy
  • Skill tree: następne „Legato 3”
  • Songi: „Wonderwall” (learning, 9 dni bez grania)
  • Rotacja: 3 zardzewiałe pozycje

  TEN TYDZIEŃ / SEZON ──────────────────
  • Kamień milowy: 4/5 dni po 20 min
  • Challenge listopada: 2/4 utwory, zostało 23 dni
  • Sezon: 14. miejsce, 120 pkt do @rival (top 10 płaci Fame)
  • Balans: 0 min słuchu w tym tygodniu

  HORYZONT ─────────────────────────────
  • Lvl 18 za 410 pkt: Epic gear + skrzynka
  • Osiągnięcie „Marathon” 9/10 sesji
  • Boss Colossus: następny savepoint w fazie 10
```

**Gdzie to żyje:**

- **Strona `/next`** pokazuje pełną roadmapę. W sidebarze stoi zaraz pod „Home” pod nazwą **„What Next”**, ikona `Compass`. Nazwa jest wspólna dla UI i roadmapy, a tekst idzie przez klucze i18n jak reszta nawigacji.
- **Widget `what-next` na Home** to hero z jedną akcją, paskiem „Odbierz” i linkiem „Zobacz całą roadmapę”. Jest domyślnie pierwszy w nowym layoucie. Dla istniejących layoutów dodajemy go na górę przez migrację w `dashboardLayout.ts`.
- **Raport po sesji** (opcjonalnie, F3) dostaje mały blok „Co dalej” z 1–2 akcjami obok `NextUpCard`.

## 4. Architektura

Nowy feature: `src/feature/whatNext/`

```
types/whatNext.types.ts
providers/                 ← czyste funkcje: (snapshot, now) => NextAction[]
  claims.provider.ts
  streak.provider.ts
  dailyQuest.provider.ts
  dailyExercise.provider.ts
  goals.provider.ts
  calendar.provider.ts
  journey.provider.ts
  roadmaps.provider.ts
  skillTree.provider.ts
  scaleTree.provider.ts
  songs.provider.ts
  rotation.provider.ts
  challenge.provider.ts
  duels.provider.ts
  guilds.provider.ts
  milestones.provider.ts
  season.provider.ts
  balance.provider.ts
  achievements.provider.ts
  bosses.provider.ts
  progression.provider.ts   (level, odblokowania)
  onboarding.provider.ts    (getting started, dominuje u nowych graczy)
  *.provider.test.ts
utils/rankActions.ts (+ test)  ← scoring, różnorodność, podział na sekcje
utils/buildSession.ts (+ test) ← składa sesję na X minut (F3)
hooks/useWhatNextSnapshot.ts   ← zbiera dane z istniejących hooków
hooks/useWhatNext.ts           ← snapshot → providers → rank
store/whatNext.store.ts        ← zustand + persist: dismiss/snooze, ostatnio kliknięte
components/WhatNextView.tsx, NextActionHero.tsx, NextActionRow.tsx, ClaimStrip.tsx, ActionLane.tsx
components/WhatNextWidget.tsx  ← widget dashboardu
```

### 4.1 Model

```ts
type NextActionSource =
  | "claims" | "streak" | "dailyQuest" | "dailyExercise" | "goals" | "calendar"
  | "journey" | "roadmap" | "skillTree" | "scaleTree" | "songs" | "rotation"
  | "challenge" | "duels" | "guilds" | "milestones" | "season" | "balance"
  | "achievements" | "bosses" | "progression" | "onboarding";

type NextActionKind =
  | "claim"      // zero wysiłku, nagroda leży
  | "expiring"   // ma deadline (streak, duel, daily)
  | "continue"   // coś w toku
  | "start"      // nic nie rozpoczęte, a powinno
  | "balance"    // luka w kategoriach
  | "horizon";   // cel długoterminowy, tylko informacja + link

type NextActionLane = "claim" | "now" | "today" | "inProgress" | "week" | "horizon";

interface NextAction {
  id: string;                 // stabilny, np. "goal:abc123:stage" (do dismiss/snooze)
  source: NextActionSource;
  kind: NextActionKind;
  isPractice: boolean;        // tylko praktyka może trafić do hero i do sesji
  titleKey: string;           // i18n + params
  reasonKey: string;
  params?: Record<string, string | number>;
  href: string;
  deadlineAt?: number;        // epoch ms
  progress?: { value: number; max: number };
  estMinutes?: number;
  reward?: { fame?: number; points?: number; caseTokens?: number; label?: string };
  sessionItem?: SessionItem;  // jeśli da się wrzucić do „Zagraj X min”
  score: number;              // liczony w rankActions
}
```

### 4.2 Snapshot (pobieranie danych)

`useWhatNextSnapshot()` korzysta wyłącznie z istniejących hooków i serwisów. Nie powstaje nowy zapis do Firestore, więc **nie zmieniamy `firestore.rules`**.

| Dane | Źródło |
|---|---|
| statystyki, lvl, streak, daily quest | `selectCurrentUserStats`, `selectDailyQuest` (Redux tylko do odczytu, bo tam już jest) + `getReconciledStreak` |
| nagrody do odebrania | `useRewardLedger()` |
| resety/deadline'y | `getResetSchedule()` |
| songi learning, cele, następny krok roadmap, rotacja | `usePlannerSources(uid)` (gotowy agregator z kalendarza) |
| kalendarz dziś | `useCalendar(uid)` + `isItemDone` |
| ćwiczenie dnia | `useDailyExercise(uid)` |
| Journey | `firebaseGetJourneyProgress(uid)` + wyciągnięty util statusu (F0) |
| skill tree | `getAllBpmProgress` + `computeRoadmapProgress` / `findCurrentPlacement` |
| scale tree | `useScaleTree()` + helper nagród (F0) |
| challenge | `useCurrentChallenge()`, `useChallengeSubmissions`, `getClearedSongIds`, `daysLeftInChallenge` |
| duele | `useDuelOverview(uid)` |
| gildie | `useGuilds(enabled = lvl ≥ 5)` |
| kamienie milowe tygodnia | `useMilestoneProgress()` |
| sezon | `useUserRank` + `getLeaderboardNeighbors` |
| osiągnięcia | `buildAchievementPanelState` |
| bossy | `getBossRecords(uid)` + `nextSavepoint` |
| balans kategorii | logi tygodnia (`firebaseGetUserRaprotsLogs` / `computeProgressData`) |
| onboarding | `getGettingStartedProgress()` |

**Progresywne ładowanie.** Każde źródło jest osobnym zapytaniem React Query ze `staleTime`. Provider dostaje `undefined`, dopóki dane się ładują, i wtedy po prostu nic nie zwraca. Hero pokazuje się, gdy dotrą źródła praktyki, a reszta sekcji dociąga się później.

**Koszt.** Strona robi ok. 15 odczytów. Większość jest już w cache React Query, bo te same hooki działają na Home. Widget na Home używa tylko lekkiego podzbioru: claims, streak, daily, cele, `usePlannerSources`, kalendarz i daily exercise. Jeśli koszt urośnie, w F4 można dodać endpoint `/api/what-next` z agregacją po stronie serwera.

### 4.3 Ranking (`rankActions.ts`)

```
score = base[kind]
      × urgency(deadlineAt)        // 1 + 2·max(0, 1 − hoursLeft/24) dla deadline'ów < 24 h
      × closeness(progress)        // 1 + 1.5·(value/max)^2, bo „najbliższy cel” wygrywa
      × staleness                  // songi/rotacja: rośnie z dniami bez grania
      × userIntent                 // ×1.3 jeśli źródło to coś, co gracz sam ustawił (cel, kalendarz, roadmapa)
      × snoozePenalty              // 0, jeśli odłożone; ×0.6, jeśli kliknięte, a niezrobione w ostatnich 24 h
```

Startowe wartości `base`: `expiring` 100, `continue` 70, `start` 50, `balance` 40, `horizon` 10. `claim` nie konkuruje, bo zawsze idzie do paska.

**Dobór hero** to najwyższy wynik z `isPractice === true`. Wyjątek: streak zagrożony i zostało mniej niż 3 h. Wtedy hero brzmi „Uratuj streak” i podpowiada najkrótszą sensowną akcję praktyki, np. ćwiczenie dnia.

**Różnorodność:** po sortowaniu w top 3 zostaje najwyżej 1 akcja na źródło.

**Sekcje** wynikają z `kind` i deadline'u:

- `claim` → pasek „Odbierz”,
- deadline ≤ dziś → „Dziś”,
- `continue` → „W toku”,
- deadline ≤ 7 dni lub cel tygodniowy → „Ten tydzień”,
- `horizon` → „Horyzont”.

**Nowy gracz:** jeśli `getGettingStartedProgress` nie jest ukończony, onboarding przejmuje hero, a sekcje Horyzont i Ten tydzień są zwinięte.

Wagi trzymamy w jednym obiekcie `RANK_WEIGHTS` z testami snapshotowymi typu „przy takim stanie hero = X”, żeby dało się je stroić bez ryzyka.

### 4.4 Reguły per źródło (v1)

| Źródło | Sygnał | Akcja / tekst | Kind | Link |
|---|---|---|---|---|
| claims | `achievements.claimable`, `caseTokens`, milestone `isClaimableNode`, daily quest kompletny i nieodebrany, guild `quests.claimable`, nagroda w scale tree / Journey / roadmapie | „Odbierz: …” | claim | inline (hooki `useClaim*`) |
| streak | `!didPracticeToday && dayWithoutBreak > 0` | „Streak N dni, zostało Xh” | expiring | `/timer` |
| dailyQuest | taski z `progress < target` | treść taska | expiring | `questRoutes` (do wyciągnięcia) |
| dailyExercise | `me === null` lub `me.rank > 1` | „Ćwiczenie dnia: zagraj” / „Jesteś 7., popraw wynik” | expiring | `/practice/exercise/{id}` |
| goals | aktywny cel, `cleanRuns/3`, etap w `goalStages` | „Brakuje N czystych przejść do X BPM” | continue | `/practice/goal/{id}` |
| goals (brak) | 0 celów i ćwiczenie z progresem BPM | „Ustaw cel tempa dla …” (`suggestTargetBpm`) | start | `/goals` |
| calendar | pozycje dziś, niezrobione | „Plan na dziś: 2/3” | expiring | `itemHref(item)` / `/calendar` |
| calendar (pusty) | brak pozycji w tygodniu | „Zaplanuj tydzień automatycznie” | start | `/calendar/plan` |
| journey | pierwszy krok `available` lub `in-progress` | „Journey · moduł: krok N/M” | continue | `/journey?module=&step=` |
| roadmap | `nextRoadmapStep` / `getPhaseCheckState === ready` | „Roadmapa X: krok / checkpoint gotowy” | continue | `/ai-coach?roadmapId=&step=` |
| skillTree | `findCurrentPlacement` | „Skill tree: następne …” | continue | `/practice/exercise/{id}` |
| skillTree | `availablePoints > 0` | „Masz N punktów umiejętności do wydania” | claim-like (pasek) | `/profile/skills` |
| scaleTree | węzeł `in_progress` | „Skale: … (x/y)” | continue | `/scale-tree` |
| songs | `learning`, sortowane po `lastPracticedAt` | „Wonderwall: 9 dni bez grania” | continue | `/songs/practice/{id}` |
| songs (pusto) | brak songów | „Dodaj pierwszy utwór” | start | `/songs?view=explore` |
| rotation | `rusty` > 0 | „3 zardzewiałe pozycje w rotacji” | continue | `/rotation` |
| challenge | songi niezaliczone, `daysLeftInChallenge` | „Challenge: 2/4, zostało N dni” (+bonus za komplet) | continue/expiring | `/challenges` |
| duels | `me.attempts === 0` lub `!me.isReady`, `endsAt` | „Duel z X: Twój ruch, zostało Yh” | expiring | `/practice/duel/{id}` |
| guilds | `each.done === false` | „Quest gildii: Twoja część X/Y” | continue | `/guilds?tab=quests` (F0) |
| guilds (founder) | `applications.length` | „N podań do gildii” | today | `/guilds?tab=members` |
| milestones | progres najbliższego tieru < max | „Tydzień: 4/5 dni po 20 min” | week | `/summary` |
| season | `nextRival.gap`, koniec sezonu | „120 pkt do 13. miejsca” (+nagroda top 10) | week | `/seasons` |
| balance | 0 min w kategorii w tym tygodniu | „0 min słuchu w tym tygodniu” + ćwiczenie z tej kategorii | balance | `/practice/exercise/{id}` |
| achievements | `state === "ready"` lub progres ≥ 80% | „Marathon 9/10” | horizon | `/profile/achievements` |
| bosses | `runs === 0` / `nextSavepoint` | „Pokonaj Colossusa do fazy 10” | horizon | `/practice/boss/{id}` |
| progression | `getNextMilestone(lvl)`, `pointsToReachLvl` | „Lvl 18 za 410 pkt: …” | horizon | `/profile` |
| levelGate | funkcja zablokowana | „Gildie od lvl 5” | horizon | — |
| onboarding | kroki `getGettingStartedProgress` | „Pierwsza sesja / pierwszy song / drugi dzień” | start | wg kroku |

Plany ćwiczeń (`exercisePlans`) nie mają stanu „dzień N”. W v1 rekomendujemy **ostatnio grany plan** (`planId` z logów) jako akcję `continue` z linkiem `/timer/plans?planId=`, a gdy planów brak, `getDailyExerciseRecommendation()` jako `start`.

### 4.5 „Zagraj X min” (F3)

`buildSession(actions, minutes)` bierze akcje `isPractice` z `sessionItem` w kolejności rankingu i pakuje je zachłannie do budżetu. Każda kategoria trafia do sesji najwyżej raz, chyba że braknie innych akcji.

Do odpalenia sesji reużywamy mechanizmu, którym kalendarz gra cały dzień (`buildDayPlan` w `practiceCalendar/utils`). **Do sprawdzenia w F3:** czy ten mechanizm da się wywołać z listą pozycji spoza kalendarza. Jeśli nie, alternatywą jest zapisanie tymczasowej pozycji w kalendarzu na dziś.

### 4.6 Dismiss / snooze

W `whatNext.store.ts` (zustand + `persist`, localStorage) trzymamy `snoozed: Record<actionId, untilMs>` i `clicked: Record<actionId, ms>`. W menu wiersza są opcje „Nie dziś” (do lokalnej północy) i „Ukryj na tydzień”.

Bez Firestore w v1, więc bez zmian w regułach. Synchronizacja między urządzeniami może przyjść później przez `users/{uid}/settings/whatNext`, **wtedy trzeba zaktualizować `firestore.rules` i zgłosić to właścicielowi**.

## 5. Potrzebne refaktory (F0, małe osobne PR-y)

1. **Journey:** wyciągnąć `mergeStepsWithProgress` i `buildModuleWithStatus` z `journey/view/JourneyView.tsx` do `feature/journey/utils/journeyStatus.ts` i dodać `getNextJourneyStep(modules)` z testami.
2. **Daily quest:** przenieść `questRoutes` z `DailyQuestWidget.tsx` do `feature/user/store/dailyQuest.routes.ts` (albo podobnego miejsca), żeby korzystały z niego widget i provider.
3. **Scale tree:** dodać helper `getClaimableScaleRewards(statuses, claimedRewards)` z testem.
4. **Gildie:** zakładki w `GuildsView` czytają `?tab=` (dziś to lokalny `useState`).
5. **Logi:** helper `getLastPlayedPlanId(logs)` i `getWeekCategoryMinutes(logs)` (jeśli `computeProgressData` nie wystarczy).

## 6. Fazy

**F0: refaktory** (sekcja 5). Każdy jako osobny PR, bez zmian w UI.

**F1: silnik + widget na Home**
- Typy, `rankActions`, providery: claims, streak, dailyQuest, dailyExercise, goals, calendar, journey, roadmap, skillTree, songs, onboarding.
- Testy jednostkowe dla każdego providera i rankingu (scenariusze: nowy gracz, streak zagrożony, wszystko zrobione, gracz tylko od songów).
- `WhatNextWidget`: hero + pasek „Odbierz”, rejestracja w `widgetCatalog`, `WidgetContent` i migracja layoutu.
- PostHog: `what_next_viewed`, `what_next_action_clicked {source, kind, lane, rank}`, `what_next_claim_all`.

**F2: strona `/next` jako pełna roadmapa**
- Pozostałe providery: scaleTree, rotation, challenge, duels, guilds, milestones, season, balance, achievements, bosses, progression/levelGate, ostatni plan.
- Sekcje (lanes), dismiss/snooze, wpis w sidebarze, i18n.
- Stan „Wszystko zrobione na dziś 🎸” z jedną akcją horyzontu zamiast pustej strony.

**F3: „Zagraj X min” + domknięcie**
- `buildSession`, przyciski 15/30/45 min.
- Blok „Co dalej” w raporcie po sesji.
- Wiki `src/content/wiki/what-next.md` według `docs/WIKI.md` (dla gracza, bez wzorów).
- `done: true` dla `what-next` w `roadmap.data.ts`.

**F4 (opcjonalnie)**
- Endpoint `/api/what-next` agregujący po stronie serwera (jeśli koszt odczytów albo czas ładowania okaże się problemem).
- Narzędzie MCP `get_what_next` dla coacha AI (`docs/mcp/riff-quest-coach`), żeby ChatGPT/Claude mogły powiedzieć „co dziś”.
- Strojenie wag na podstawie danych z PostHoga (CTR per source/rank).

## 7. Ryzyka

- **Szum:** zbyt wiele wierszy zabija sens. W widoku domyślnym każda sekcja ma limit 3–5 pozycji i przycisk „pokaż więcej”.
- **Sprzeczne sygnały** (streak vs długi cel): rozstrzyga reguła hero („uratuj streak” tylko przy < 3 h).
- **Rozjazd danych:** providery czytają te same utilsy co moduły źródłowe, bez kopiowania logiki, żeby po zmianie zasad w module rekomendacja zmieniła się sama.
- **Redux:** czytamy istniejące selektory (statystyki i daily quest są tylko tam), ale żaden nowy stan nie trafia do Reduxa.
- **Brak nowych zmiennych środowiskowych** i zmian `firestore.rules` w F1–F3.

## 8. Otwarte pytania do właściciela

1. ~~Czy `/next` ma być osobną stroną z widgetem na Home, czy zastąpić górę Home?~~ **Ustalone (2026-11-07):** osobna strona `/next` + widget `what-next` na Home.
2. ~~Czy ekonomia arsenalu ma się pojawiać?~~ **Ustalone:** tylko pasek „Odbierz” (darmowe skrzynki). Bez pity, tradera, rynku i nowych przedmiotów.
3. ~~Nazwa w UI?~~ **Ustalone:** „What Next”.
