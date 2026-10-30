# Mapa funkcji riff.quest

Każda pozycja: co to jest (językiem gracza) → gdzie w apce → artykuł wiki → kod.
Wiki leży w `src/content/wiki/<slug>.md`; kod w `src/feature/<folder>` (alias `feature/*`).
Stan na 2026-10-30. Liczby sprawdzaj w kodzie przed publikacją.

Spis: [Pętla i scoring](#pętla-i-scoring) · [Tryby ćwiczenia](#tryby-ćwiczenia) ·
[Prowadzone ścieżki](#prowadzone-ścieżki) · [Utwory](#utwory) ·
[Motywacja i rywalizacja](#motywacja-i-rywalizacja) · [Społeczność](#społeczność) ·
[Arsenal i brzmienie](#arsenal-i-brzmienie) · [Audio i platformy](#audio-i-platformy) ·
[Wsparcie projektu](#wsparcie-projektu)

## Pętla i scoring

- **Punkty, poziom, seria** — ~22 pkt/h ćwiczeń, mnożnik serii ×1.0 → ×1.5 (od 5. dnia),
  poziom z punktów. Wiki: `how-scoring-works`. Kod: `utils/gameLogic/`.
- **Fame** — waluta Arsenalu; płaci ją ćwiczenie (krzywa dzienna, malejąca po godzinach),
  questy, wyzwania, sezony, polubienia i zapisy cudzych playlist. Wiki: `fame`.
- **Cztery kategorie i 23 umiejętności** — Technique / Theory / Hearing / Creative work.
  Wiki: `the-four-categories`, `skills-and-achievements`. Kod: `feature/skills`.
- **Osiągnięcia** — odznaki za kamienie milowe. Kod: `feature/achievements`.
- **Logowanie sesji** — Free Timer (stoper per kategoria) i Manual Log (do 7 dni wstecz),
  edycja zapisanych sesji w dzienniku. Wiki: `practice-sessions-and-logging`.
  Kod: `feature/logger`, `feature/practiceLog`, `feature/report`.

## Tryby ćwiczenia

Hub ćwiczeń (/timer) ma trzy drzwi: Continue, Pick a training, Practice on your own;
biblioteki i narzędzia niżej. Wiki: `practice-modes-overview`.

- **Practice Routines** — gotowe (50+), własne i udostępnione przez społeczność plany,
  ćwiczenie po ćwiczeniu. Wiki: `exercise-plans-and-auto-plan`. Kod: `feature/exercisePlan`.
- **Auto Plan** — sesja dobrana do czasu, który masz.
- **Exercise Library** — 200+ ćwiczeń z tabulaturą, metronomem, podkładem; plus ćwiczenia
  od społeczności. Kod: `feature/exercises`, `feature/communityExercises`.
- **Sesja ćwiczenia** — tab (AlphaTab), metronom, prędkości, opcjonalna detekcja nut,
  tryb **Learn** (tab czeka na każdą nutę; wymaga mikrofonu, tylko widok na dużym ekranie,
  nie na telefonie).
  Kod: `feature/exercisePlan/views/PracticeSession`.
- **Exercise Goals** — tempo startowe i docelowe na ćwiczeniu, kamienie milowe po trzy
  czyste przebiegi. Wiki: `exercise-goals`. Kod: `feature/exerciseGoals`.
- **Rotation** — utwory, ćwiczenia i umiejętności najdłużej nieruszane w ćwiczeniu są na górze;
  jedno tapnięcie startuje krótką sesję. Wiki: `rotation`. Kod: `feature/rotation`.
- **Guitar Pro i edytor tabów** — import plików GP z odtwarzaniem, własne ćwiczenia
  w edytorze (/tab-editor), automatyczny podkład. Kod: `feature/autoBacking`,
  `feature/backingTrack`. Landing: /features/guitar-tab-editor.
- **Ćwiczenie dnia** — jedno ćwiczenie dla wszystkich, ranking dnia; #1 dostaje rzadką
  nagrodę. Kod: `feature/dailyExercise`.
- **Narzędzia** — metronom i stroik (/tools). Kod: `feature/metronome`, `feature/tuner`.

## Prowadzone ścieżki

- **Learning Path (Journey)** — moduły krok po kroku z egzaminami, 36 kroków w dwóch
  modułach (m.in. Fretboard Mastery). Wiki: `journey-and-scale-tree`. Kod: `feature/journey`.
  Landing: /features/guitar-learning-path.
- **Scale Map** — drzewo kształtów skal, 9 rodzin, każdy box zaliczany w docelowym tempie.
  Kod: `feature/scaleTree`.
- **Mastery Roadmaps** — osobista ścieżka generowana pod poziom i cel: 6–8 faz po 6–9
  kroków; krok zalicza 8 zapisanych sesji. Wiki: `ai-coach-and-weekly-milestones`.
  Kod: `feature/aiCoach`, widok /my-roadmaps. Landing: /features/guitar-roadmap.
- **Onboarding** — staż → cel → pierwszy plan, potem checklista pierwszych kroków
  (pierwsza sesja, pierwszy utwór, drugi dzień).
  Kod: `feature/onboarding`.

## Utwory

- **Song board i biblioteka** — utwory, które grasz, statusy nauki, czas na utworze liczy
  się do sesji. Trudność oceniana przez graczy (tiery, Skill Power). Playlisty do
  udostępniania. Wiki: `songs-playlists-and-difficulty`. Kod: `feature/songs`,
  `feature/song-library`.
- **Poradniki utworów** — publiczne strony /song-library/[slug] („How to play …”), ważne
  dla SEO.

## Motywacja i rywalizacja

- **Home i 3 zadania dzienne** — 40 Fame za komplet. Wiki: `dashboard-and-daily-quests`.
  Kod: `feature/dashboard` (konfigurowalny przez Customize).
- **Weekly Milestones** — drabinka tygodniowych celów; poziom odblokowuje się raz za Fame
  i płaci co tydzień spełnienia. Odblokowanie sekcji od 3. poziomu gracza.
  Wiki: `ai-coach-and-weekly-milestones`.
- **Rankingi i sezony** — sezon miesięczny, all-time i ranking sprzętu; top 10 sezonu
  dostaje Fame. Wiki: `leaderboard-and-seasons`. Kod: `feature/leadboard`.
- **Monthly Challenges** — 5 utworów z głosowania co miesiąc; nagranie płaci Fame,
  komplet daje bonus; archiwalne plansze grywalne, ale bez nagród.
  Wiki: `monthly-challenges`. Kod: `feature/challenges`.
- **Duels** — anonimowy pojedynek 1v1 na tym samym ćwiczeniu, 48 h, najlepszy przebieg
  wygrywa, ranking ELO. Kod: `feature/duels`. Landing: /features/guitar-duels.
- **Boss Fights** — ćwiczenia z mikrofonem ubrane w walkę: The Fretweaver (chromatyka),
  The Stone Colossus (zmiany akordów), The Changeling (progresje). Poziomy trudności.
  Kod: `feature/bosses`. Landing: /features/guitar-boss-fights.

## Społeczność

- **Recordings** — nagrania coverów, polubienia i komentarze (płacą autorowi Fame).
  Wiki: `recordings-and-community`. Kod: `feature/recordings`.
- **Guilds** — gildie od 5. poziomu: czat, wspólna drabinka 50 zadań w 10 rozdziałach,
  wspólny schowek, herb. Kod: `feature/guilds`.
- **Chat, feed aktywności, Live now** — drawer Community obok dzwonka; odpowiedzi,
  wzmianki, kto teraz ćwiczy. Kod: `feature/chat`, `feature/logs`, `feature/logsBox`.
- **Discord** — serwer społeczności i bot. Kod: `feature/discordBot`.

## Arsenal i brzmienie

- **Arsenal** — kolekcjonowanie wirtualnych gitar i efektów za Fame: Cases, Collection,
  Rig, Workshop (renowacja, buildy, mody), Commissions (od 30. poziomu), Trader, Market
  (handel między graczami), Dex. Rzadkości Common → Mythic, Item Level, Rig Level.
  Nic tu nie poprawia gry na gitarze — to nagroda za pracę gdzie indziej.
  Wiki: `arsenal-and-gear`. Kod: `feature/arsenal`, `feature/guitarBuilder`.
  Landing: /features/guitar-practice-rewards.
- **Tone Studio** — wirtualny tor sygnału: noise gate, pedały, symulacja wzmacniacza
  (także modele NAM), kolumna i mikrofon; w desktopie na żywo przez ASIO i z wtyczkami VST.
  Kod: `feature/toneStudio`.

## Audio i platformy

- **Detekcja nut** — mikrofon lub interfejs, kalibracja per gitara; ocenia timing
  (3 stopnie), na ćwiczeniach z bendami intonację; strumming po ataku; hunty nut i akordów;
  ear training. Opcjonalna — punkty nie zależą od celności.
  Wiki: `note-detection`.
- **Aplikacja desktop** — Electron: Windows (.exe), macOS Apple Silicon (.dmg), Linux
  (.AppImage); brak Intel Mac. Natywne audio (ASIO/WASAPI), niższa latencja, ekran nie
  gaśnie, skróty w trayu, auto-update. Pobieranie z GitHub releases
  (Michaljapko/riff-quest-releases). Wiki: `desktop-app`. Kod: `electron/`.
  Landing: /features/desktop-guitar-practice-app.
- **Języki** — EN (domyślny), PL, DE, ES. Tłumaczenia w `public/locales/`, wiki w
  `src/content/wiki/{pl,de,es}`.

## Wsparcie projektu

- **Buy Me a Coffee** — jedyne źródło finansowania; wszystkie funkcje darmowe.
- **Supporter** — wspierający zgłaszają pomysły i głosują, co powstanie dalej.
  Kod: `feature/supporterPanel`, `feature/support`.
- **Publiczna roadmapa (/roadmap)** — drabinka progów finansowania z tym, co zostanie
  zbudowane za kolejne kwoty. Kod: `feature/roadmap`.
- **Martwy kod premium** — `feature/premium` (plany Pro/Master, Stripe, `PremiumGate`) nie
  działa, bo `feature/user/store/userSlice.ts` nadaje wszystkim rolę `master`.
  Nie traktuj go jako stanu produktu.
