# Audyt nazw ćwiczeń + propozycja konwencji

**Data:** 2026-08-13
**Issue:** #786
**Zakres:** 225 ćwiczeń z `exercisesAgregat` (`src/feature/exercisePlan/data/exerises/**`)
**Status:** **propozycja do decyzji właściciela — w kodzie nic nie zostało zmienione** (zgodnie z prośbą w tickecie).

---

## 1. Skrót — dlaczego jest "rozpierdol"

Nazwy nie są złe pojedynczo. Problem w tym, że **powstawały w kilku falach, każda z inną konwencją**,
i teraz obok siebie w bibliotece stoją cztery różne style nazywania tego samego rodzaju rzeczy.
Siedem konkretnych przyczyn:

1. **Cztery separatory na raz.** `—` (85 tytułów), ` - ` (45), ` – ` (12), `: ` (27), plus jeden `/`
   ("Angular / Economy Picking") i nawiasy ("Chord Practice (Configurable)"). 77 tytułów nie ma
   separatora wcale.
2. **Raz nazwa mówi co grasz, raz jak się nazywa technika, raz jest hasłem reklamowym.**
   `chicken_pickin` nazywa się "Snap and Pop", `jazz_chord_melody` → "Bass and Chords",
   `metal_tremolo_picking` → "Phrygian Assault Thrash Tremolo Picking". Gracz szukający
   "chicken pickin" nie znajdzie go ani wzrokiem, ani wyszukiwarką.
3. **Sufiksy-wypełniacze doklejane losowo.** "Exercise" (32×), "Drill" (35×), "Practice" (4×),
   "Challenge" (2×), "Master/Mastery" (2×). Te słowa nie odróżniają niczego od niczego — każde
   ćwiczenie jest ćwiczeniem.
4. **Rodziny się nie grupują.** Człon rodzinny raz jest z przodu ("Tapping – Simple Melody"),
   raz z tyłu ("Melodic Tapping Compositions"), raz go nie ma ("Snap and Pop"). Po alfabecie
   rodzina rozjeżdża się po całej liście, więc nie widać "co jest do czego".
5. **Tytuł potrafi nie mieć nic wspólnego z `id`** (18 przypadków, §4.4). Utrudnia to pracę nad
   kodem i psuje wyszukiwarkę, która porównuje tekst tytułu.
6. **Wewnętrzne numery wyciekły do UI.** "Strumming Pattern 2 … 32" — bez 1 i bez 17, gracz widzi
   dwie dziury w numeracji. "Finger Independence Exercise 1a" sugeruje serię 1b/1c, której nie ma.
7. **Trudność zakodowana w nazwie na trzy sposoby**, mimo że karta ma osobny badge trudności:
   "Ear Training Level 1/2/3", "Rhythm Training — Easy/Medium/Hard",
   "Chord Quality: The Big Four / All Seven".

Do tego dwie rzeczy strukturalne, które wyszły przy okazji audytu (§8): **12 ćwiczeń
`musician_fitness_lvl2_*` w ogóle nie jest zarejestrowanych w `exercisesAgregat`**, oraz
**historyczne logi łączą się z ćwiczeniem po tytule, nie po `id`** — czyli sama zmiana nazw
bez poprawki w `Logs.tsx` zerwie te linki.

---

## 2. Zakres i metoda

- Źródło: `exercisesAgregat` → **225 ćwiczeń**, z tego 4 mają `isHiddenFromLibrary`
  (`fret_click_fret5_all`, `fret_click_fret7_all`, `fret_click_fret9_all`, `first_melody`).
- Tytuł jest **inline w plikach `.ts`**, nie ma go w `public/locales/*` — czyli jedna nazwa =
  jedno miejsce zmiany.
- Gdzie gracz widzi nazwę:
  | Miejsce | Plik | Ograniczenie |
  |---|---|---|
  | Karta w bibliotece | `feature/exercises/components/ExerciseCard` | `line-clamp-2` |
  | Karta w kreatorze planu | `…/SelectExercisesStep/components/ExerciseCard.tsx` | `line-clamp-1` na mobile, 2 od `sm` |
  | Nagłówek sesji | `…/PracticeSession/components/ExerciseHeroHeader.tsx` | `truncate` — **jedna linia, ucina** |
  | Logi / feed | `layouts/LogsBoxLayout/…/Logs.tsx` | jedna linia |
  | Leaderboard ćwiczenia | `EarTrainingLeaderboardDialog` | jedna linia |
  | Wyszukiwarka globalna | `components/GlobalSearch` | dopasowanie po tekście tytułu |
  | Landing SEO | `feature/seoLanding/components/ExerciseShowcase.tsx` | — |
- **Nazwy nie są w URL-ach.** Slug powstaje z `id` (`idToSlug`), a auto-generowane strony
  `/exercises/*` zostały zdjęte (patrz komentarz w `public/sitemap-static.xml`). Zmiana tytułów
  **nie rusza SEO ani linków**.
- Średnia długość tytułu: 31,5 znaku. **95 tytułów ma > 34 znaki**, 36 przekracza 40, najdłuższy
  ma 60 ("The Most Important Part of Music Theory - Playalong Tutorial").

---

## 3. Proponowana konwencja

### Wzór

```
Rodzina — Wariant
```

Maksymalnie dwa człony. Człon pierwszy mówi **do jakiej rodziny należy ćwiczenie**,
człon drugi **czym różni się od rodzeństwa**.

### Reguły

| # | Reguła | Dlaczego |
|---|---|---|
| **R1** | **Jeden separator: `—` (em dash, ze spacjami).** `–` (en dash) tylko w zakresach liczb ("Frets 6–12"). `-` tylko wewnątrz wyrazów złożonych ("Hammer-on", "Down-Up"). Zero `:`, `/`, `(…)`, `[…]`, `\|`, `#`. | Dziś 5 stylów naraz; separator przestał cokolwiek znaczyć. |
| **R2** | **Rodzina zawsze z przodu.** "Tapping — Melodic Lines", nie "Melodic Tapping Compositions". | Lista sortuje się alfabetycznie → rodzina zbija się w jeden blok. Od razu widać, ile jest wariantów i który jest który. |
| **R3** | **Bez słów-wypełniaczy:** Exercise, Drill, Practice, Training, Challenge, Mastery, Master. Wyjątek: kiedy słowo naprawdę niesie informację (np. "Click" — klikasz myszą zamiast grać). | Każde ćwiczenie jest ćwiczeniem. Te słowa zjadają 6–10 znaków z budżetu i nic nie odróżniają. |
| **R4** | **Wariant mówi, czym to się różni od siostrzanego ćwiczenia** — zakres progów, liczba strun, tempo, ruch. Jeśli nie umiesz dopisać wariantu, to prawdopodobnie masz duplikat (§4.5). | To jest sedno zgłoszenia: "nie wiadomo, które jest do czego". |
| **R5** | **Bez trudności w nazwie.** Karta ma badge `beginner/easy/medium/hard`. Wyjątek: serie stopniowane, gdzie poziom **jest** wariantem ("Rhythm Training — Easy/Medium/Hard"). Wtedy zawsze `Easy/Medium/Hard`, nigdy `Level 1/2/3` ani `Basics/Advanced`. | STYLEGUIDE §8: nie powielaj tekstem tego, co widać. |
| **R6** | **Bez marketingu i przymiotników mocy:** Master, Blitz, Assault, Doom, Iron, Dark, Ultimate, Advanced. Nazwa opisuje, nie sprzedaje. | "Neoclassical Sweep Master" nie mówi ani co grasz, ani jak trudne. |
| **R7** | **Tytuł ma być rozpoznawalny w `id`.** Jeśli `id` mówi `chicken_pickin`, tytuł zawiera "Chicken Pickin'". | Wyszukiwarka, logi i praca nad kodem opierają się na jednym słowniku pojęć. |
| **R8** | **Liczby tylko wtedy, gdy coś znaczą dla gracza** ("3 Strings", "Frets 6–12", "1-2-3-4"). Numery porządkowe (Pattern 17, Exercise 1a) tylko w seriach, które gracz przechodzi po kolei — i wtedy bez dziur. | — |
| **R9** | **≤ 34 znaki.** Docelowo 20–30. | Nagłówek sesji ma `truncate`, karta na mobile `line-clamp-1`. |
| **R10** | **Angielski, Title Case, bez wykrzykników i pytań-clickbaitów.** Nazwa ma być stwierdzeniem, nie nagłówkiem z YouTube'a. | 12 tytułów to dziś przeklejone tytuły filmów. |

### Słownik — jedno pojęcie, jedno słowo

| Pojęcie | Słowo | Nie używamy |
|---|---|---|
| Grasz na gitarze, mikrofon ocenia | **Note Hunt** | Sweep, Search, Find |
| Klikasz pozycję na diagramie (bez gitary) | **Click Hunt** | Click Drill, Fret Click |
| Wyścig z zegarem (12 nut w 90 s) | **Timed Hunt** | String Hunt, Whole Neck Sweep |
| Gra do filmu / backingu | *(bez słowa w tytule — jest badge "Playalong")* | Playalong, Play-Along, Playalongs, Playalong Tutorial |
| Pająk po strunach | **Spider** | Spider Walk, Spider Crawl, Spider Pattern |
| Permutacje palców na jednej strunie | **Finger Permutations** | Spider Exercise - X Permutation |
| Fragment znanego riffu | **Riff Vault** | *(już spójne — zostaje)* |

---

## 4. Audyt szczegółowy

### 4.1 Separatory

| Styl | Ile | Przykład |
|---|---|---|
| `—` em dash | 85 | Riff Vault — Thunderstruck |
| ` - ` łącznik | 45 | Spider Exercise - 1-2-3-4 Permutation |
| `: ` dwukropek | 27 | Chord Quality: The Big Four |
| ` – ` en dash | 12 | First Bend – Whole Step |
| `(…)` nawias | 4 | Chord Practice (Configurable) |
| ` / ` ukośnik | 1 | Angular / Economy Picking |
| `[…]` i `\|` | 12 (niezarejestrowane, §8.2) | `[Level 2] … \| 7th Chords…` |

W dodatku `–` bywa użyty raz jako separator ("First Bend – Whole Step"), a raz poprawnie jako
zakres ("Frets 6–12") — w tej samej bibliotece.

### 4.2 Sufiksy-wypełniacze

"Exercise" 32×, "Drill" 35×, "Practice" 4×, "Challenge" 2×, "Master/Mastery" 2× —
łącznie **76 tytułów** zawiera co najmniej jedno takie słowo (82 razem z "Training").
Skrajny przykład: **"Spider X Pattern Exercise"** — trzy słowa opisowe i jedno puste.
A obok **"Bend & Release"** i **"Unison Bending"**, gdzie nie ma żadnego sufiksu.
Nie ma reguły, kiedy się dokleja.

### 4.3 Rodzina raz z przodu, raz z tyłu

| Rodzina | Z przodu | Z tyłu / brak |
|---|---|---|
| Tapping | Tapping – Simple Melody, Tapping – Two-Voice Phrase | Melodic Tapping Compositions, Tapping Triadic Cascades |
| Spider | Spider Chromatics, Spider Legato | Horizontal Spider Exercise, Single String Spider Exercise, Advanced Spider Stairs Exercise |
| String skipping | String Skipping — 2 Notes Per String | Pentatonic String Skips, Melodic Skip Sequences, Spread Triad Arpeggios |
| Sweep | Sweep Picking Motion Drill – 3 Strings | 3-String Sweep Synchronization, 5-String Sweep Cascades, Neoclassical Sweep Master |
| Vibrato | Vibrato — Low Position, Vibrato — High Position | Vibrato Control, Vibrato Sustain — … |

### 4.4 Tytuł ≠ `id` (18 przypadków)

| `id` | Tytuł | Komentarz |
|---|---|---|
| `chicken_pickin` | Snap and Pop | nazwa techniki zniknęła |
| `jazz_chord_melody` | Bass and Chords | dwie różne rzeczy |
| `rhythm_triole` | Triplets Drill | `triole` to nie angielski |
| `string_sweep_a` … `_low_e` | String Hunt — A … | `sweep` w `id`, `hunt` w tytule, katalog `stringHuntA` |
| `whole_neck_sweep` | Whole Neck Hunt | jw. |
| `fret_stretch_drill` | Wide Fret Span Sequences | — |
| `string_skipping_basic` | Pentatonic String Skips | — |
| `string_skipping_arpeggios` | Spread Triad Arpeggios | — |
| `string_skipping_melodic` | Melodic Skip Sequences | — |
| `dynamic_crescendo` | Dynamic Range Control | — |
| `rhythmic_pocket_mastery` | Subdivision Control | — |
| `tone_color_exploration` | Tonal Palette Discovery | — |
| `metal_tremolo_picking` | Phrygian Assault Thrash Tremolo Picking | — |
| `jp_stretching` | Petrucci Stretching Exercise | `jp` = inicjały, nieczytelne w kodzie |
| `chromatic_spider_walk` | Chromatic Spider Drill | — |
| `spider_basic` | Horizontal Spider Exercise | — |
| `all_strings_open_repetition` | All Strings Open Repetition (katalog `stringRepetition`) | katalog ≠ `id` |
| `earTrainingEasy/Medium/Hard` | Ear Training Level 1/2/3 | jedyne `id` w camelCase — reszta to `snake_case` |

### 4.5 Nazwy, które nie odróżniają rodzeństwa (najgorszy objaw)

| Para / grupa | Co widzi gracz | Co to naprawdę jest |
|---|---|---|
| `spider_chromatics` "Spider Chromatics - 1-2-3-4" vs `chromatic_spider_walk` "Chromatic Spider Drill" | dwie różne nazwy | **ten sam wzór 1-2-3-4 po wszystkich strunach**, różnią się tylko pozycją (progi 1–4 vs 5–8) i wartością rytmiczną. Kandydat do scalenia. |
| `spider_chromatics` vs `spider_permutation_1234` "Spider Exercise - 1-2-3-4 Permutation" | oba "1-2-3-4" | jedno idzie przez struny, drugie siedzi na jednej strunie |
| `sweep_picking_motion_drill` "Sweep Picking Motion Drill – 3 Strings" (easy) vs `sweep_picking_3_string` "3-String Sweep Synchronization" (hard) | dwa sweepy na 3 strunach o zupełnie różnych nazwach | jedno jest wejściem w technikę, drugie ćwiczeniem synchronizacji rąk |
| `bend_and_release` "Bend & Release" vs `precision_bending_drill` "Precision Bend & Release" | nazwy prawie identyczne | pierwsze: długi bend + powolny release; drugie: nuta referencyjna → bend do niej (kontrola intonacji) |
| `string_skipping_basic` "Pentatonic String Skips" (**hard**) vs `string_skipping_two_notes` "String Skipping — 2 Notes Per String" (**easy**) | nazwa "basic"/"Skips" sugeruje łatwiejsze | odwrotnie niż sugerują nazwy |
| `muting_discipline_drill` vs `muting_spotlight_drill` vs `chord_spotlight_drill` | "Spotlight" 2×, "Discipline" 1× | "spotlight" to metafora wewnętrzna, dla gracza nic nie znaczy |
| `random_note_hunt` / `chromatic_note_hunt` / `fretboard_region_hunt` / `interval_hunt` / `string_sweep_*` / `fret_click_*` | "Hunt", "Click Drill", "Hunt" | **kluczowa różnica jest niewidoczna: "Click Drill" robisz myszą bez gitary, "Hunt" grasz na gitarze**. To jedyna informacja, której gracz naprawdę potrzebuje przed kliknięciem. |

### 4.6 Numeracja widoczna dla gracza

- `strumming_pattern_*`: numery **2–16, 18–32**. Brakuje 1 i 17 → w bibliotece widać dwie dziury.
  (Pattern 1 to de facto `strumming_basic` "Basic Down Strumming", tylko nazwany inaczej.)
- `finger_independence_1a` "Finger Independence Exercise 1a" — brak 1b, 2a itd.
- `musician_fitness_lvl1_s*` — "Level #1 Session #1", `#` w tytule, długa lista tematów po
  łączniku (do 57 znaków).

### 4.7 Trzy sposoby kodowania poziomu

| Seria | Konwencja |
|---|---|
| `rhythm_training_*`, `improv_prompt_*` | "— Easy / Medium / Hard" |
| `earTraining*` | "Level 1 / 2 / 3" |
| `ear_chord_quality_*` | ": The Big Four / All Seven" |
| `ear_tuning_*` | ": (brak) / Fine" |
| `ear_mode_*` | "Major, Minor or Dorian?" / "Name That Mode" — **wspólnego rdzenia nie ma wcale** |

### 4.8 Duplikacja informacji, która jest już w UI

- Słowo **"Playalong"** w 9 tytułach ćwiczeń i 8 tytułach planów, choć karta i nagłówek sesji
  mają czerwony badge "Playalong" (`ExerciseCard.tsx:118`, `ExerciseHeroHeader.tsx:33`).
  Do tego w trzech pisowniach: `Playalong`, `Play-Along`, `Playalongs`.
- Trudność w tytule (§4.7) obok badge'a trudności.
- To wprost łamie STYLEGUIDE §8 ("nie powielaj informacji tekstem").

---

## 5. Propozycje nazw

Kolumna **Jest** = obecny `title`. **Propozycja** = nazwa zgodna z §3. `id` **nie zmieniamy nigdzie**.
Wiersze oznaczone ✅ zostają bez zmian.

### 5.1 Spider (11)

| `id` | Jest | Propozycja |
|---|---|---|
| `spider_quarter_notes` | Spider — One Note Per Beat | ✅ |
| `spider_one_string` | Single String Spider Exercise | Spider — One String |
| `spider_basic` | Horizontal Spider Exercise | Spider — Shifting Up the Neck |
| `spider_chromatics` | Spider Chromatics - 1-2-3-4 | Spider — 1-2-3-4, Frets 1–4 |
| `chromatic_spider_walk` | Chromatic Spider Drill | Spider — 1-2-3-4, Frets 5–8 |
| `spider_legato_basic` | Spider Legato - Basic | Spider — Legato, No Picking |
| `spider_string_skipping` | String Skipping Spider Exercise | Spider — String Skipping |
| `spider_stairs_hard` | Advanced Spider Stairs Exercise | Spider — Stairs & Wide Stretch |
| `spider_x` | Spider X Pattern Exercise | Spider — Diagonal X |
| `spider_x_extended` | Extended Spider X Exercise | Spider — Diagonal X, Extended |
| `finger_independence_1a` | Finger Independence Exercise 1a | Spider — Anchor the Other Fingers |

> Uwaga: przy tej numeracji `spider_chromatics` i `chromatic_spider_walk` stają się jawnym
> duplikatem (§4.5). Do decyzji: zostawić jako dwie pozycje (progi 1–4 / 5–8) albo scalić.

### 5.2 Finger Permutations (24)

Wszystkie 24 to **jedna struna, cztery palce w zadanej kolejności** — czyli coś innego niż
pająki po strunach. Jedna reguła:

```
Spider Exercise - X-X-X-X Permutation   →   Finger Permutations — X-X-X-X
```

| `id` | Jest | Propozycja |
|---|---|---|
| `spider_permutation_1234` | Spider Exercise - 1-2-3-4 Permutation | Finger Permutations — 1-2-3-4 |
| `spider_permutation_1243` | Spider Exercise - 1-2-4-3 Permutation | Finger Permutations — 1-2-4-3 |
| `spider_permutation_1324` | Spider Exercise - 1-3-2-4 Permutation | Finger Permutations — 1-3-2-4 |
| `spider_permutation_1342` | Spider Exercise - 1-3-4-2 Permutation | Finger Permutations — 1-3-4-2 |
| `spider_permutation_1423` | Spider Exercise - 1-4-2-3 Permutation | Finger Permutations — 1-4-2-3 |
| `spider_permutation_1432` | Spider Exercise - 1-4-3-2 Permutation | Finger Permutations — 1-4-3-2 |
| `spider_permutation_2134` | Spider Exercise - 2-1-3-4 Permutation | Finger Permutations — 2-1-3-4 |
| `spider_permutation_2143` | Spider Exercise - 2-1-4-3 Permutation | Finger Permutations — 2-1-4-3 |
| `spider_permutation_2314` | Spider Exercise - 2-3-1-4 Permutation | Finger Permutations — 2-3-1-4 |
| `spider_permutation_2341` | Spider Exercise - 2-3-4-1 Permutation | Finger Permutations — 2-3-4-1 |
| `spider_permutation_2413` | Spider Exercise - 2-4-1-3 Permutation | Finger Permutations — 2-4-1-3 |
| `spider_permutation_2431` | Spider Exercise - 2-4-3-1 Permutation | Finger Permutations — 2-4-3-1 |
| `spider_permutation_3124` | Spider Exercise - 3-1-2-4 Permutation | Finger Permutations — 3-1-2-4 |
| `spider_permutation_3142` | Spider Exercise - 3-1-4-2 Permutation | Finger Permutations — 3-1-4-2 |
| `spider_permutation_3214` | Spider Exercise - 3-2-1-4 Permutation | Finger Permutations — 3-2-1-4 |
| `spider_permutation_3241` | Spider Exercise - 3-2-4-1 Permutation | Finger Permutations — 3-2-4-1 |
| `spider_permutation_3412` | Spider Exercise - 3-4-1-2 Permutation | Finger Permutations — 3-4-1-2 |
| `spider_permutation_3421` | Spider Exercise - 3-4-2-1 Permutation | Finger Permutations — 3-4-2-1 |
| `spider_permutation_4123` | Spider Exercise - 4-1-2-3 Permutation | Finger Permutations — 4-1-2-3 |
| `spider_permutation_4132` | Spider Exercise - 4-1-3-2 Permutation | Finger Permutations — 4-1-3-2 |
| `spider_permutation_4213` | Spider Exercise - 4-2-1-3 Permutation | Finger Permutations — 4-2-1-3 |
| `spider_permutation_4231` | Spider Exercise - 4-2-3-1 Permutation | Finger Permutations — 4-2-3-1 |
| `spider_permutation_4312` | Spider Exercise - 4-3-1-2 Permutation | Finger Permutations — 4-3-1-2 |
| `spider_permutation_4321` | Spider Exercise - 4-3-2-1 Permutation | Finger Permutations — 4-3-2-1 |

Zysk: 29 znaków zamiast 37, znika kolizja z `spider_chromatics`, a plany "[Part 1] Spider
Permutations – Index-Led" zaczynają pasować do nazw ćwiczeń, które zawierają.

### 5.3 String skipping (4)

| `id` | Jest | Propozycja |
|---|---|---|
| `string_skipping_two_notes` | String Skipping — 2 Notes Per String | String Skipping — 2 Per String |
| `string_skipping_basic` | Pentatonic String Skips | String Skipping — Pentatonic |
| `string_skipping_melodic` | Melodic Skip Sequences | String Skipping — Melodic Lines |
| `string_skipping_arpeggios` | Spread Triad Arpeggios | String Skipping — Spread Triads |

### 5.4 Sweep (6)

| `id` | Jest | Propozycja |
|---|---|---|
| `sweep_picking_motion_drill` | Sweep Picking Motion Drill – 3 Strings | Sweep — 3 Strings, First Steps |
| `sweep_picking_motion_drill_6_string` | Sweep Picking Motion Drill – 6 Strings | Sweep — 6 Strings, Full Span |
| `sweep_picking_3_string` | 3-String Sweep Synchronization | Sweep — 3 Strings, Hand Sync |
| `sweep_5_string_cascade` | 5-String Sweep Cascades | Sweep — 5-String Cascades |
| `sweep_neoclassical` | Neoclassical Sweep Master | Sweep — Neoclassical Runs |
| `mini_arpeggio` | Mini Arpeggio – Em7 | Sweep — Em7 Mini Arpeggio |

### 5.5 Legato (7)

| `id` | Jest | Propozycja |
|---|---|---|
| `hammer_on_sequence_5_7_9` | Hammer-ons – 5-7-9 Sequence | Legato — Hammer-ons 5-7-9 |
| `hammer_on_pentatonic_run` | Hammer-on Pentatonic Run – 3 Strings | Legato — Hammer-on Pentatonic |
| `pull_off_pentatonic_run` | Dark Pull-off Pentatonic Run | Legato — Pull-off Pentatonic |
| `legato_hammer_pull_run` | Legato Hammer-Pull Scale Run | Legato — Scale Run |
| `legato_continuous_flow` | Continuous Legato Flow | Legato — Continuous Flow |
| `legato_sextuplets_4_5_7` | Legato Sextuplets – 4-5-7 | Legato — Sextuplets 4-5-7 |
| `legato_trill_sprint` | Legato Trill Sprints | Legato — Trills |

### 5.6 Tapping (5)

| `id` | Jest | Propozycja |
|---|---|---|
| `tapping_single_string` | Tapping – Simple Melody | Tapping — Simple Melody |
| `tapping_pull_hammer` | Tapping – Two-Voice Phrase | Tapping — Two Voices |
| `tapping_descending_target` | Tapping – Descending Target Drill | Tapping — Descending Targets |
| `tapping_melodic_lines` | Melodic Tapping Compositions | Tapping — Melodic Lines |
| `tapping_triadic_cascade` | Tapping Triadic Cascades | Tapping — Triad Cascades |

### 5.7 Bending (7)

| `id` | Jest | Propozycja |
|---|---|---|
| `first_bend` | First Bend – Whole Step | Bending — First Whole Step |
| `first_bend_half_step` | First Bend – Half Step | Bending — First Half Step |
| `bend_and_release` | Bend & Release | Bending — Slow Release |
| `precision_bending_drill` | Precision Bend & Release | Bending — Match the Reference |
| `high_register_bends` | High Register Bends – 15th Fret | Bending — High Frets, 15th |
| `unison_bend_drill` | Unison Bending | Bending — Unison Bends |
| `expressive_bend_phrasing` | Expressive Bend Phrasing | Bending — Inside a Phrase |

### 5.8 Vibrato (5)

| `id` | Jest | Propozycja |
|---|---|---|
| `vibrato_control_drill` | Vibrato Control | Vibrato — Speed & Width |
| `vibrato_sustain_drill` | Vibrato Sustain — Hold It for the Whole Bar | Vibrato — Hold a Whole Bar |
| `vibrato_finger_isolation` | Vibrato — One Finger at a Time | ✅ |
| `vibrato_low_position` | Vibrato — Low Position (Frets 1–5) | Vibrato — Frets 1–5 |
| `vibrato_high_position` | Vibrato — High Position (Frets 12–17) | Vibrato — Frets 12–17 |

### 5.9 Muting (3)

| `id` | Jest | Propozycja |
|---|---|---|
| `muting_discipline_drill` | Muting Discipline Drill | Muting — Both Hands |
| `muting_spotlight_drill` | Muting Spotlight — Pick One, Kill the Rest | Muting — One Note at a Time |
| `chord_spotlight_drill` | Chord Spotlight — D Major Muting Drill | Muting — Inside a D Chord |

### 5.10 Kostkowanie i prędkość (13)

| `id` | Jest | Propozycja |
|---|---|---|
| `alternate_picking_cross_string` | Alternate Picking Cross-String | Alternate Picking — Cross-String |
| `alternate_picking_pentatonic_a_positions` | A Pentatonic Alternate Picking — Position Drill | Alternate Picking — A Pentatonic |
| `economy_picking_angular` | Angular / Economy Picking | Economy Picking — Angular Lines |
| `hybrid_picking_independence` | Hybrid Picking Independence | Hybrid Picking — Wide Intervals |
| `chicken_pickin` | Snap and Pop | Hybrid Picking — Chicken Pickin' |
| `jazz_chord_melody` | Bass and Chords | Hybrid Picking — Bass + Chords |
| `speed_burst_chromatic_blitz` | Speed Burst Chromatic Blitz | Chromatic — Speed Bursts |
| `chromatic_accents` | Chromatic Accent Dynamics | Chromatic — Moving Accents |
| `metal_gallop` | Iron Gallop — Thrash Rhythm Drill | Gallop Picking — Thrash Rhythm |
| `metal_tremolo_picking` | Phrygian Assault Thrash Tremolo Picking | Tremolo Picking — Phrygian Riff |
| `down_picking_doom_pulse` | Doom Pulse — Slow Down Picking Control | Down Picking — Slow & Heavy |
| `pinky_power_drill` | Pinky-Led Patterns | ✅ |
| `pentatonic_string_crossing_3` | Pentatonic String Crossing — 3 Strings | Pentatonic — String Crossing |

### 5.11 Rozciąganie (2)

| `id` | Jest | Propozycja |
|---|---|---|
| `jp_stretching` | Petrucci Stretching Exercise | Stretch — Petrucci Pattern |
| `fret_stretch_drill` | Wide Fret Span Sequences | Stretch — Wide Fret Spans |

### 5.12 Rytm, timing, dynamika (10)

| `id` | Jest | Propozycja |
|---|---|---|
| `rhythm_training_easy` | Rhythm Training — Easy | ✅ |
| `rhythm_training_medium` | Rhythm Training — Medium | ✅ |
| `rhythm_training_hard` | Rhythm Training — Hard | ✅ |
| `quarter_notes_drill` | Quarter Notes Drill | Timing — Quarter Notes |
| `rhythm_triole` | Triplets Drill | Timing — Triplets |
| `rhythmic_pocket_mastery` | Subdivision Control | Timing — Switch Subdivisions |
| `metronome_gap_test` | Metronome Gap Test | Timing — Metronome Gap Test |
| `open_g_repetition` | Open G String Repetition | Timing — Open G Repeats |
| `all_strings_open_repetition` | All Strings Open Repetition | Timing — All Open Strings |
| `dynamic_crescendo` | Dynamic Range Control | Dynamics — Soft to Loud |

### 5.13 Strumming (4 + 30 patternów)

Cztery "charakterowe":

| `id` | Jest | Propozycja |
|---|---|---|
| `strumming_basic` | Basic Down Strumming | Strumming 1 — All Downs |
| `strumming_down_up` | Down-Up Strumming | Strumming — Down-Up |
| `strumming_rock` | Rock Strumming Patterns | Strumming — Rock Accents |
| `strumming_funk` | Funk Rhythm Guitar | Strumming — Funk 16ths |

30 ponumerowanych (`strumming_pattern_2` … `_32`): kształt **`Strumming Pattern N — opis`**
jest w zasadzie dobry (rodzina z przodu, numer jako porządek), ale **28 z 30 tytułów przekracza
34 znaki** — sam prefiks "Strumming Pattern 10 — " zjada 23 znaki, więc na opis zostaje nic.
Trzy poprawki:

1. **Skrócić prefiks do `Strumming N — `** (14 znaków). Wtedy numerowane i charakterowe
   warianty siedzą w jednej rodzinie: "Strumming 10 — Syncopated Ups" (29) obok
   "Strumming — Funk 16ths" (22).
2. **Zasypać dziurę na 1** — `strumming_basic` to faktycznie "wszystkie downy", czyli wzór 1
   (propozycja wyżej).
3. **Dziura na 17** — do decyzji: dodać brakujący wzór albo przenumerować 1–31.
   *Rekomendacja: dodać brakujący wzór*, bo przenumerowanie zerwie zgodność `id` ↔ tytuł
   dla 15 ćwiczeń (R7) i pomiesza logi.

Pełna lista (w nawiasie długość tytułu):

| `id` | Jest | Propozycja |
|---|---|---|
| `strumming_pattern_2` | Strumming Pattern 2 — Quarter Downs + Final Up (46) | Strumming 2 — Downs + Final Up (30) |
| `strumming_pattern_3` | Strumming Pattern 3 — All Eighth Notes (38) | Strumming 3 — All Eighths (25) |
| `strumming_pattern_4` | Strumming Pattern 4 — Down-Skip-Down-Up (39) | Strumming 4 — Down-Skip-Down-Up (31) |
| `strumming_pattern_5` | Strumming Pattern 5 — Down-Up Skip (34) | Strumming 5 — Down-Up Skip (26) |
| `strumming_pattern_6` | Strumming Pattern 6 — Syncopated Upstroke (41) | Strumming 6 — Syncopated Ups (28) |
| `strumming_pattern_7` | Strumming Pattern 7 — Inside Upstrokes (38) | Strumming 7 — Inside Upstrokes (30) |
| `strumming_pattern_8` | Strumming Pattern 8 — Two Downs then Down-Up (44) | Strumming 8 — Downs, Down-Up (28) |
| `strumming_pattern_9` | Strumming Pattern 9 — Skip First & (34) | Strumming 9 — Skip First & (26) |
| `strumming_pattern_10` | Strumming Pattern 10 — Syncopated Upstroke Run (46) | Strumming 10 — Upstroke Run (27) |
| `strumming_pattern_11` | Strumming Pattern 11 — Syncopated Mid-Bar Down (46) | Strumming 11 — Mid-Bar Down (27) |
| `strumming_pattern_12` | Strumming Pattern 12 — Starts on Upstroke (41) | Strumming 12 — Starts on Up (27) |
| `strumming_pattern_13` | Strumming Pattern 13 — Soft Landing (35) | Strumming 13 — Soft Landing (27) |
| `strumming_pattern_14` | Strumming Pattern 14 — All Upstrokes (36) | Strumming 14 — All Upstrokes (28) |
| `strumming_pattern_15` | Strumming Pattern 15 — Upstrokes + One Down (43) | Strumming 15 — Ups + One Down (29) |
| `strumming_pattern_16` | Strumming Pattern 16 — Double Down-Up (37) | Strumming 16 — Double Down-Up (29) |
| `strumming_pattern_18` | Strumming Pattern 18 — Half-Time Feel (37) | Strumming 18 — Half-Time Feel (29) |
| `strumming_pattern_19` | Strumming Pattern 19 — Down-Up on Beat 1 (40) | Strumming 19 — Down-Up on Beat 1 (32) |
| `strumming_pattern_20` | Strumming Pattern 20 — Mixed Syncopation (40) | Strumming 20 — Mixed Syncopation (32) |
| `strumming_pattern_21` | Strumming Pattern 21 — Upstroke Ending (38) | Strumming 21 — Upstroke Ending (30) |
| `strumming_pattern_22` | Strumming Pattern 22 — Mid-Bar Upstroke (39) | Strumming 22 — Mid-Bar Upstroke (31) |
| `strumming_pattern_23` | Strumming Pattern 23 — Full 1-2, Quarter 3-4 (44) | Strumming 23 — Dense to Sparse (30) |
| `strumming_pattern_24` | Strumming Pattern 24 — Opens on Upstroke (40) | Strumming 24 — Opens on Up (26) |
| `strumming_pattern_25` | Strumming Pattern 25 — Late Upstroke (36) | Strumming 25 — Late Upstroke (28) |
| `strumming_pattern_26` | Strumming Pattern 26 — Two Down-Up Groups (41) | Strumming 26 — Down-Up Pairs (28) |
| `strumming_pattern_27` | Strumming Pattern 27 — Upstroke Lead-In (39) | Strumming 27 — Upstroke Lead-In (31) |
| `strumming_pattern_28` | Strumming Pattern 28 — Upstroke into Downs (42) | Strumming 28 — Up, Then Downs (29) |
| `strumming_pattern_29` | Strumming Pattern 29 — Skip the & of 3 (38) | Strumming 29 — Skip the & of 3 (30) |
| `strumming_pattern_30` | Strumming Pattern 30 — Opens Slow, Ends Fast (44) | Strumming 30 — Slow to Fast (27) |
| `strumming_pattern_31` | Strumming Pattern 31 — All Eighths, Skip Last (45) | Strumming 31 — Skip the Last Up (31) |
| `strumming_pattern_32` | Strumming Pattern 32 — Double Upstroke Gaps (43) | Strumming 32 — Off-Beat Pairs (29) |

### 5.14 Akordy i harmonia (7)

| `id` | Jest | Propozycja |
|---|---|---|
| `chord_practice_configurable` | Chord Practice (Configurable) | Chord Practice — Pick Your Chords |
| `scale_practice_configurable` | Scale Practice (Configurable) | Scale Practice — Pick Your Scale |
| `smooth_chord_transitions` | Smooth Chord Transitions | Chords — Smooth Changes |
| `minimal_motion_voice_leading` | Minimal-Motion Voice Leading | Chords — Least Finger Motion |
| `guide_tone_voice_leading` | Guide Tone Voice-Leading Drill | Chords — Guide Tones |
| `build_the_chord` | Build the Chord | ✅ (albo "Note Hunt — Chord Tones", jeśli chcemy pełną spójność rodziny Hunt) |
| `fingerstyle_descending_arpeggios` | Fingerstyle: Descending Arpeggios | Fingerstyle — Descending Arpeggios |

### 5.15 Fretboard — Click Hunts (20)

Dziś: `<zakres> — Click Drill` (rodzina na końcu, 39–47 znaków).
Propozycja: **`Click Hunt — <zakres>`** (rodzina z przodu, 20–34 znaki), zakresy w en dashu.

| `id` | Jest | Propozycja |
|---|---|---|
| `fret_click_low_e_open` | Low E String: Open Position — Click Drill | Click Hunt — Low E, Frets 0–6 |
| `fret_click_low_e_high` | Low E String: Frets 6–12 — Click Drill | Click Hunt — Low E, Frets 6–12 |
| `fret_click_a_open` | A String: Open Position — Click Drill | Click Hunt — A String, Frets 0–6 |
| `fret_click_a_high` | A String: Frets 6–12 — Click Drill | Click Hunt — A String, Frets 6–12 |
| `fret_click_d_full` | D String: Frets 0–12 — Click Drill | Click Hunt — D String, Frets 0–12 |
| `fret_click_g_full` | G String: Frets 0–12 — Click Drill | Click Hunt — G String, Frets 0–12 |
| `fret_click_b_full` | B String: Frets 0–12 — Click Drill | Click Hunt — B String, Frets 0–12 |
| `fret_click_high_e_full` | High e String: Frets 0–12 — Click Drill | Click Hunt — High e, Frets 0–12 |
| `fret_click_octaves_dg_open` | D & G Strings: Open Position — Click Drill | Click Hunt — D & G, Frets 0–6 |
| `fret_click_octaves_dg_high` | D & G Strings: Frets 6–12 — Click Drill | Click Hunt — D & G, Frets 6–12 |
| `fret_click_octaves_be_open` | B & High e Strings: Open Position — Click Drill | Click Hunt — B & e, Frets 0–6 |
| `fret_click_octaves_be_high` | B & High e Strings: Frets 6–12 — Click Drill | Click Hunt — B & e, Frets 6–12 |
| `fret_click_box_0_4` | Box: Frets 0–4 — Click Drill | Click Hunt — Box 0–4 |
| `fret_click_box_4_8` | Box: Frets 4–8 — Click Drill | Click Hunt — Box 4–8 |
| `fret_click_box_8_12` | Box: Frets 8–12 — Click Drill | Click Hunt — Box 8–12 |
| `fret_click_fret5_all` | Fret 5, All Strings — Click Drill | Click Hunt — Fret 5, All Strings |
| `fret_click_fret7_all` | Fret 7, All Strings — Click Drill | Click Hunt — Fret 7, All Strings |
| `fret_click_fret9_all` | Fret 9, All Strings — Click Drill | Click Hunt — Fret 9, All Strings |
| `fret_click_whole_natural` | Whole Neck: Natural Notes — Click Drill | Click Hunt — Whole Neck, Naturals |
| `fret_click_whole_chromatic` | Whole Neck: Every Note — Click Drill | Click Hunt — Whole Neck, All Notes |

### 5.16 Fretboard — Interval Clicks (4)

| `id` | Jest | Propozycja |
|---|---|---|
| `interval_click_box_0_4` | Intervals: Open Box — Click Drill | Interval Clicks — Box 0–4 |
| `interval_click_box_5_9` | Intervals: Middle Box — Click Drill | Interval Clicks — Box 5–9 |
| `interval_click_box_8_12` | Intervals: Upper Box — Click Drill | Interval Clicks — Box 8–12 |
| `interval_click_whole_fretboard` | Intervals: Whole Fretboard — Click Drill | Interval Clicks — Whole Neck |

> Dodatkowa korzyść: "Open Box / Middle Box / Upper Box" znikają na rzecz konkretnych progów —
> gracz nie musi zgadywać, gdzie jest "middle".

### 5.17 Fretboard — Note Hunts, grane (5) i na czas (6)

| `id` | Jest | Propozycja |
|---|---|---|
| `random_note_hunt` | Random Note Hunt | Note Hunt — Naturals |
| `chromatic_note_hunt` | Chromatic Note Hunt | Note Hunt — All Notes |
| `fretboard_region_hunt` | Fretboard Region Hunt | Note Hunt — In a Region |
| `interval_hunt` | Interval Hunt | Note Hunt — Intervals |
| `string_sweep_low_e` | String Hunt — Low E | Timed Hunt — Low E String |
| `string_sweep_a` | String Hunt — A | Timed Hunt — A String |
| `string_sweep_d` | String Hunt — D | Timed Hunt — D String |
| `string_sweep_g` | String Hunt — G | Timed Hunt — G String |
| `string_sweep_b` | String Hunt — B | Timed Hunt — B String |
| `whole_neck_sweep` | Whole Neck Hunt | Timed Hunt — Whole Neck |
| `fretboard_mastery` | Fretboard Mastery | Fretboard — Move the Melody |

"Timed" niesie realną informację (wyścig z zegarem, 12 nut w 90 s przy 60 BPM) i odróżnia egzamin
od zwykłego polowania.

### 5.18 Słuch (13)

| `id` | Jest | Propozycja |
|---|---|---|
| `earTrainingEasy` | Ear Training Level 1 | Play by Ear — Easy |
| `earTrainingMedium` | Ear Training Level 2 | Play by Ear — Medium |
| `earTrainingHard` | Ear Training Level 3 | Play by Ear — Hard |
| `ear_chord_quality_basics` | Chord Quality: The Big Four | Chord Quality — The Big Four |
| `ear_chord_quality_advanced` | Chord Quality: All Seven | Chord Quality — All Seven |
| `ear_progression_basics` | Progression Builder: Three Chords | Progression Builder — 3 Chords |
| `ear_progression_advanced` | Progression Builder: Four Chords | Progression Builder — 4 Chords |
| `ear_tuning_trainer` | Tune It By Ear | Tune By Ear — Basics |
| `ear_tuning_precision` | Tune It By Ear: Fine | Tune By Ear — Fine |
| `ear_mode_basics` | Major, Minor or Dorian? | Name That Mode — Three Modes |
| `ear_mode_advanced` | Name That Mode | Name That Mode — All Six |
| `tone_matching_challenge` | Tone Matching Challenge | Tone — Match the Reference |
| `sing_what_you_play` | Sing What You Play | ✅ |

Dwie zmiany merytoryczne: `earTraining*` to **granie zagranej melodii z powrotem** (mikrofon),
a nie quiz — "Play by Ear" mówi to wprost i przestaje kolidować z quizami klikanymi.
Para `ear_mode_*` po raz pierwszy dostaje wspólny rdzeń, więc stoi obok siebie na liście.

### 5.19 Kreatywność i brzmienie (14)

| `id` | Jest | Propozycja |
|---|---|---|
| `improv_prompt_easy` | Improv Prompts — Easy | ✅ |
| `improv_prompt_medium` | Improv Prompts — Medium | ✅ |
| `improv_prompt_hard` | Improv Prompts — Hard | ✅ |
| `one_chord_improv` | Single Chord Improvisation | Improv — One Chord |
| `one_string_backing` | Single String Phrasing | Improv — One String |
| `triad_improvisation` | Triad Improvisation | Improv — Triads Only |
| `chord_tone_improvisation` | Chord Tone Improvisation | Improv — Chord Tones |
| `two_notes_per_bar_phrasing` | Two-Notes-Per-Bar Phrasing | Phrasing — Two Notes Per Bar |
| `call_and_response_phrasing` | Call and Response Phrasing | Phrasing — Call & Response |
| `composition_challenge` | Composition Challenge | Composition — Short Phrases |
| `tone_color_exploration` | Tonal Palette Discovery | Tone — Pick Position & Angle |
| `naked_tone_melody` | Clean Tone — Slow Melody | ✅ |
| `first_melody` | First Melody — One String | ✅ (ukryte w bibliotece) |
| `pentatonic_box1_up_down` | Pentatonic Box 1 — Up and Down | ✅ |

### 5.20 Riff Vault (5) — wzorzec do naśladowania

| `id` | Tytuł |
|---|---|
| `seven_nation_army_riff_preview` | Riff Vault — Seven Nation Army ✅ |
| `crazy_train_riff_preview` | Riff Vault — Crazy Train ✅ |
| `thunderstruck_riff_preview` | Riff Vault — Thunderstruck ✅ |
| `master_of_puppets_riff_preview` | Riff Vault — Master of Puppets ✅ |
| `sweet_child_o_mine_riff_preview` | Riff Vault — Sweet Child O' Mine ✅ |

Jedyna rodzina w całej bibliotece, która **już** spełnia R1–R4: wspólny rdzeń z przodu,
jeden separator, wariant mówi wszystko, `id` zgodne z tytułem. To jest wzór dla reszty.

### 5.21 Playalongi Guitar Playalongs (10)

Badge "Playalong" jest na karcie i w nagłówku sesji, więc słowo wypada z tytułu (R5/§4.8).
Zostaje sam temat:

| `id` | Jest | Propozycja |
|---|---|---|
| `gp_pentatonic_10min_workout` | 10 Min Guitar Play-Along - Pentatonic Scale Workout | Pentatonic Workout — 10 min |
| `gp_speed_builder_part1` | Guitar Speed Builder Part 1 - Pentatonic Scale Workout | Pentatonic Speed Builder |
| `gp_sweep_picking_15min` | Sweep Picking 15-Minutes Practice - Playalong with Tabs | Sweep Picking — 15 min |
| `gp_stamina_picking_workout` | Stamina Picking Workout - Alternate Picking Playalong | Alternate Picking — Stamina |
| `gp_alternate_picking_speed_builder` | How to Get Faster at Alternate Picking - Speed Builder | Alternate Picking — Speed Builder |
| `gp_gallop_picking_10_levels` | 10 Levels of Galloping - Gallop Picking Playalong | Gallop Picking — 10 Levels |
| `gp_rock_metal_riffs` | Rock and Metal Riffs for Guitar - Playalong | Rock & Metal Riffs |
| `gp_music_theory_essential` | The Most Important Part of Music Theory - Playalong Tutorial | Music Theory Essentials |
| `gp_drop2_chords_arpeggios` | Chords and Arpeggios for Lead Guitar - Drop 2 | Drop 2 Chords & Arpeggios |
| `gp_pentatonic_tutorial` | Do You Use This Pentatonic? - Guitar Playalong | Pentatonic — Beyond Box 1 † |

† do potwierdzenia z treścią filmu — obecny tytuł jest pytaniem clickbaitowym i nie mówi,
o którą pentatonikę chodzi.

### 5.22 Playalongi pozostałe (2 + seria MusicianFitness)

| `id` | Jest | Propozycja |
|---|---|---|
| `pentatonic_playalong_best_of` | Pentatonic Best Of - Guitar Playalongs | Pentatonic Best Of |
| `metal_playalong_basic` | Metal Guitar Playalong | Metal Rhythm & Lead |

**Seria MusicianFitness** — dziś cztery różne konwencje w jednej serii:

| Zakres | Kształt tytułu |
|---|---|
| L1 s1–s8 (w bibliotece) | `Level #1 Session #3 - Open Chords, Powerchords, Strumming` |
| L2 s9–s11 (niezarejestrowane) | `[Level 2] Beginner Guitar Workout #9 \| 7th Chords, Syncopated Strumming` |
| L2 s12–s15 | `[Level 2] Week 13 \| Power Chords, Dominant 7ths & Syncopated Strumming` |
| L2 s16–s20 | `COMPLETE 20 Min Guitar Workout \| Week 16`, `20 min Guitar Workout - Fundamentals (Week 18)`, `Guitar Fundamentals Mastered? Try To Keep Up! (Week 20)` |

Propozycja: jedna, ciągła seria — numeracja i tak już biegnie 1→20:

```
Beginner Workout 1   …   Beginner Workout 20
```

Tematy ("7th Chords, Syncopated Strumming") są **już w `description`** — nie muszą być w tytule.
Nazwisko autora ("- MusicianFitness") też nie: plan ma pole `author` z avatarem i nazwą.

| `id` | Jest | Propozycja |
|---|---|---|
| `musician_fitness_lvl1_s1` | Level #1 Session #1 - Spider Crawls, Strumming, Chords | Beginner Workout 1 |
| `musician_fitness_lvl1_s2` | Level #1 Session #2 - Speeding Up & Changing Chords | Beginner Workout 2 |
| `musician_fitness_lvl1_s3` | Level #1 Session #3 - Open Chords, Powerchords, Strumming | Beginner Workout 3 |
| `musician_fitness_lvl1_s4` | Level #1 Session #4 - Pinky Control, Smooth Chord Changes | Beginner Workout 4 |
| `musician_fitness_lvl1_s5` | Level #1 Session #5 - Smoke on the Water | Beginner Workout 5 |
| `musician_fitness_lvl1_s6` | Level #1 Session #6 - Riffs, Chords, Spider Crawls | Beginner Workout 6 |
| `musician_fitness_lvl1_s7` | Level #1 Session #7 - Spider Crawls, Common Chords, Songs | Beginner Workout 7 |
| `musician_fitness_lvl1_s8` | Level #1 Session #8 - Practice Session | Beginner Workout 8 |
| `musician_fitness_lvl2_s9` † | [Level 2] Beginner Guitar Workout #9 \| 7th Chords, Syncopated Strumming | Beginner Workout 9 |
| `musician_fitness_lvl2_s10` † | [Level 2] Beginner Guitar Workout #10 \| Chord Progressions, Pentatonic Scale | Beginner Workout 10 |
| `musician_fitness_lvl2_s11` † | [Level 2] Beginner Guitar Workout #11 \| Chord Progressions, Pentatonic Scale | Beginner Workout 11 |
| `musician_fitness_lvl2_s12` † | [Level 2] Beginner Guitar Practice Session Week #12 | Beginner Workout 12 |
| `musician_fitness_lvl2_s13` † | [Level 2] Week 13 \| Power Chords, Dominant 7ths & Syncopated Strumming | Beginner Workout 13 |
| `musician_fitness_lvl2_s14` † | [Level 2] Week 14 \| Pentatonic Triplets, Smooth Chord Changes | Beginner Workout 14 |
| `musician_fitness_lvl2_s15` † | [Level 2] Week 15 \| Rhythm Changes, Smooth Strumming | Beginner Workout 15 |
| `musician_fitness_lvl2_s16` † | COMPLETE 20 Min Guitar Workout \| Week 16 | Beginner Workout 16 |
| `musician_fitness_lvl2_s17` † | COMPLETE 20 Min Guitar Workout \| Week 17 | Beginner Workout 17 |
| `musician_fitness_lvl2_s18` † | 20 min Guitar Workout - Fundamentals (Week 18) | Beginner Workout 18 |
| `musician_fitness_lvl2_s19` † | 20 min Guitar Workout - Fundamentals (Week 19) | Beginner Workout 19 |
| `musician_fitness_lvl2_s20` † | Guitar Fundamentals Mastered? Try To Keep Up! (Week 20) | Beginner Workout 20 |

† ćwiczenie nie jest zarejestrowane w `exercisesAgregat` — do gracza trafia tylko jako plan (§8.2).

Tytuły planów jednoćwiczeniowych powinny wtedy brzmieć tak samo jak ćwiczenie
("Level #1 Session #3 - MusicianFitness" → "Beginner Workout 3").

---

## 6. Co zostawić bez zmian

19 nazw jest już dobrych — spełniają R1–R9 i nie wymagają ruchu:

- cała rodzina **Riff Vault** (5),
- **Rhythm Training — Easy/Medium/Hard** i **Improv Prompts — Easy/Medium/Hard** (6) —
  to wzór dla serii stopniowanych,
- **Spider — One Note Per Beat**, **Vibrato — One Finger at a Time**,
  **Pentatonic Box 1 — Up and Down**, **Clean Tone — Slow Melody**, **First Melody — One String**,
  **Sing What You Play**, **Build the Chord**, **Pinky-Led Patterns**.

Osobno: **numeracja i opisy 30 wzorów strummingu** są sensowne merytorycznie — zmienia się tylko
prefiks i długość (§5.13), nie treść nazwy.

---

## 7. Podsumowanie liczbowe

| | Dziś | Po zmianie |
|---|---|---|
| Ćwiczeń w bibliotece | 225 | 225 |
| Proponowanych zmian nazwy | — | 206 (w tym 24 permutacje, 20 Click Huntów i 30 wzorów strummingu zmienianych jedną regułą) + 12 niezarejestrowanych (§8.2) |
| Nazw bez zmian | — | 19 |
| Tytułów > 34 znaków | 95 | 0 |
| Różnych separatorów | 6 | 1 |
| Tytułów ze słowem "Playalong" | 9 (+8 planów) | 0 |
| Tytułów ze słowem Exercise/Drill/Practice/Challenge/Master | 76 | 5 (Chord Practice, Scale Practice, Rhythm Training ×3 — tam słowo niesie treść) |

---

## 8. Ryzyka i koszt wdrożenia

### 8.1 Logi historyczne łączą się po **tytule**, nie po `id` — ⚠️ blokada

`src/layouts/LogsBoxLayout/components/Logs/Logs.tsx:1030`:

```ts
const matchedExercise = genericLog.exerciseTitle
  ? exercisesAgregat.find((ex) => ex.title === genericLog.exerciseTitle) ?? null
  : null;
```

W Firestore zapisany jest **tekst tytułu**. Po zmianie nazwy każdy stary log przestanie się
podlinkowywać do ćwiczenia (nazwa w feedzie zostanie, ale zniknie link/leaderboard).

**Do zrobienia przed batchem 1** (jedna z opcji):
- dopisywać `exerciseId` do logu i dopasowywać po `id`, z `title` jako fallbackiem — najczystsze;
- albo dodać w danych ćwiczenia pole `legacyTitles?: string[]` i szukać po nim jako drugim kroku.

### 8.2 12 ćwiczeń `musician_fitness_lvl2_*` nie jest zarejestrowanych

Są zdefiniowane w `data/exerises/metalPlayalong/metalPlayalong.ts` i wymienione w
`FREE_EXERCISE_IDS`, ale **nie ma ich w `rawExercises`** w `exercisesAgregat.ts` — do gracza
docierają wyłącznie jako jednoćwiczeniowe plany (`plansAgregat.ts`). Efekt: w bibliotece
ćwiczeń serii nie widać, a `FREE_EXERCISE_IDS` niesie martwe wpisy.
**Do decyzji: zarejestrować czy usunąć.** (Sam plik nazywa się `metalPlayalong.ts`, choć trzyma
20 sesji MusicianFitness — osobny dług porządkowy.)

### 8.3 Co się **nie** zepsuje

- **URL-e i SEO** — slugi liczone z `id` (`idToSlug`), a strony `/exercises/*` nie są generowane.
- **Leaderboardy, ulubione, plany, rekordy BPM** — wszystko na `id`.
- **Tłumaczenia** — tytułów nie ma w `public/locales/*`, więc nie ma czego synchronizować.

### 8.4 Miejsca do poprawienia razem ze zmianą nazw

| Plik | Co |
|---|---|
| `src/components/GlobalSearch/GlobalSearch.test.tsx:51,76` | test asercjuje `"Horizontal Spider Exercise"` |
| `src/pages/tab-editor/publish.tsx:422` | placeholder `e.g. Spider Exercise — 1-2-3-4 Permutation` |
| `src/feature/exercisePlan/data/plans/**` | tytuły planów jednoćwiczeniowych (`Level #1 Session #3 - MusicianFitness`) powielają tytuł ćwiczenia w innym brzmieniu |
| `src/feature/seoLanding/content/*` | teksty landingów mówiące o "Spider Exercises" |

### 8.5 Dodatkowo zauważone (poza zakresem, ale to też nazwa)

- Pole logu nazywa się **`exceriseTitle`** (literówka, `types/api.types.ts:151`,
  `ActivityLog/activityLog.types.ts:33`) — obok poprawnego `exerciseTitle` w innych typach.
  Dwie nazwy tego samego pola w jednym systemie.
- Katalog danych to **`data/exerises/`** (brakuje `c`).
- Katalogi ćwiczeń nie zawsze zgadzają się z `id`: `stringHuntA/` → `string_sweep_a`,
  `wholeNeckHunt/` → `whole_neck_sweep`, `stringRepetition/` → `all_strings_open_repetition`,
  `tripletsDrill/` → `rhythm_triole`, `jpStretch/jpStretching.ts` → `jp_stretching`.
- `id` `earTrainingEasy/Medium/Hard` to jedyne camelCase wśród 225 — reszta `snake_case`.

> Rekomendacja: **`id` zostawić w spokoju**. Nie są widoczne dla gracza, a ich zmiana rusza
> leaderboardy, ulubione i historię. Wystarczy, że tytuły przestaną im przeczyć.

---

## 9. Proponowana kolejność wdrożenia

| Batch | Zakres | Ryzyko |
|---|---|---|
| **0** | Naprawa dopasowania logów po `id` (§8.1) | wymagane przed resztą |
| **1** | Rodziny mechaniczne, zmiana regułą: 24 permutacje, 20 Click Huntów, 4 Interval Clicks, 6 Timed Huntów | zerowe merytorycznie, duży efekt porządkowy |
| **2** | Rodziny techniczne: Spider, Legato, Tapping, Bending, Vibrato, Muting, Sweep, String Skipping | jw. |
| **3** | Playalongi (gp_\*, MusicianFitness, metal, pentatonic) + decyzja z §8.2 | wymaga decyzji o serii L2 |
| **4** | Słuch, kreatywność, rytm, akordy | — |
| **5** | Strumming: Pattern 1, dziura na 17, skrócenie najdłuższych opisów | wymaga decyzji (§5.13) |

Każdy batch to jeden PR z jedną rodziną — łatwo cofnąć, łatwo obejrzeć w diffie.

---

## 10. Do decyzji właściciela

1. **Duplikaty** — scalić czy rozdzielić nazwami: `spider_chromatics` × `chromatic_spider_walk`
   (ten sam wzór, inna pozycja), `bend_and_release` × `precision_bending_drill`?
2. **Strumming 17** — dodać brakujący wzór czy przenumerować całą serię 1–31?
3. **Seria MusicianFitness L2** (12 ćwiczeń) — zarejestrować w bibliotece czy zostawić
   wyłącznie jako plany i wyczyścić martwe wpisy w `FREE_EXERCISE_IDS`?
4. **"Click Hunt" vs "Click Drill"** — czy przyjmujemy parę *Note Hunt (grasz) / Click Hunt
   (klikasz)*, czy wolisz zostawić słowo "Drill"?
5. **Playalongi** — czy zgoda na zdjęcie słowa "Playalong" z tytułów, skoro badge jest już
   na karcie i w nagłówku sesji?
6. **`build_the_chord`** — zostaje "Build the Chord" (ładna nazwa, poza konwencją) czy wchodzi
   do rodziny jako "Note Hunt — Chord Tones"?
