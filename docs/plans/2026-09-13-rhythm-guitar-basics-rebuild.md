# Rhythm Guitar Basics — przebudowa roadmapy

**Data:** 2026-09-13
**Plik:** `src/data/roadmaps/rhythm-guitar-basics.json` (id roadmapy bez zmian: `d44c57a7-…`)
**Zakres:** zadanie 5 z serii „przebudowa istniejących roadmap”.

## Diagnoza starej wersji (commit `23431984`)

47 kroków w 7 fazach, każdy z `sessionsRequired: 8`. Główne problemy:

- **Zły punkt wejścia.** Faza 1 („Single-String Technique”: niezależność palców,
  hammer-ony, pull-offy, slide'y, alternate picking) to technika solowa, nie rytmiczna.
  Użytkownik szukający „rhythm basics” zaczynał od 7 kroków, które nie prowadzą do
  akompaniamentu.
- **Odwrócona kolejność.** Puls i metronom (faza 4) pojawiały się *po* akordach i
  strummingu (fazy 2–3). Ósemki i pauzy były uczone po palm mutingu i akcentach.
- **Kroki bez zastosowania w grze.** „Warm-up routine”, „Focused repetition”,
  „Error isolation”, „Consistent practice schedule”, „Thumb position control” to
  nawyki ćwiczeniowe, nie umiejętności rytmiczne.
- **Faza akordowa poza tematem.** Sus, septymy, slash chords, „partial barre
  preparation”, „voicing economy” to słownik harmoniczny; z rytmem ma związek tylko
  ozdabianie sus (zachowane).
- **Brak sprawdzalnych warunków.** Opisy i kryteria ukończenia były ogólne („feels
  smooth”, „controlled”), bez tempa, liczby taktów ani czynności do wykonania.
- **Brak źródeł i uzasadnienia**, dlaczego dany krok jest potrzebny.
- **Brak finału.** Roadmapa kończyła się „harmonogramem ćwiczeń”, nie wykonaniem
  partii rytmicznej.

W drzewie roboczym leżała też niezacommitowana wersja pośrednia (42 kroki, id kroków
niebędące UUID, źródła częściowo niemożliwe do zweryfikowania). Została zastąpiona.

## Program po przebudowie

**Poziom wejściowy:** Beginner. Wymagania wstępne (zapisane w pierwszym kroku):
nastrojona gitara, kostka, dwa akordy otwarte (Em, Am) choćby powoli. Bez wcześniejszego
treningu rytmu.

**Umiejętności końcowe** (zapisane w ostatnim kroku, sekcja „What you can do now”):
puls bez klika, czyste akordy otwarte zmieniane w tempie utworu, czytanie i zapisywanie
schematów, pauzy, akcenty, palm mute i „chucks” używane świadomie, feel prosty,
shuffle i szesnastkowy, przeprowadzenie całego utworu z podkładem lub z zespołem.

Progresja: fundamenty (puls → dłoń → akordy) → zastosowanie (schematy → artykulacja →
synkopa i feel) → samodzielne wykonanie (utwory → performance).

| Faza | Kroki | Sesje |
| --- | --- | --- |
| 1. Pulse and the Strumming Hand | 4 | 22 |
| 2. Open Chords in Time | 5 | 35 |
| 3. Eighth Notes and Strum Patterns | 6 | 39 |
| 4. Muting, Accents and Dynamics | 5 | 31 |
| 5. Syncopation, Feel and Groove | 7 | 48 |
| 6. Playing Songs | 5 | 33 |
| 7. Performance | 5 | 33 |
| **Razem** | **37** | **241** |

Każdy krok ma sekcje `[What it is]`, `[Why it matters]`, `[How to practice]`, `[Sources]`
(pierwszy dodatkowo `[Before you start]`, ostatni `[What you can do now]`) oraz
`successCriteria` z tempem, liczbą taktów lub konkretną czynnością do sprawdzenia
(nagranie, test luki metronomu, One Minute Changes). `sessionsRequired` 5–8, skalibrowane
do zakresu kroku (nie stałe 8).

Trzy kroki performance'owe (cały utwór z podkładem, gra z innymi, finałowe wykonanie)
mają `noExercise: true` — nie ma ćwiczenia w bibliotece, które je reprezentuje; status
ustawia się ręcznie w drawerze, tak jak przewiduje `StepStatusControl`.

## Audyt: co zachowano, zmieniono, usunięto, dodano

Postęp użytkownika jest zapisany w `userRoadmapProgress.stepProgress` pod **id kroku**
(`getRoadmapCompletion` liczy tylko kroki obecne w JSON-ie). Dlatego każdy krok starej
wersji, który ma odpowiednik w nowej, **zachował swoje id** — zapisane sesje i odhaczone
zasoby liczą się dalej. Roadmapa nie jest kopiowana do Firestore per użytkownik
(`AiCoachView.mergeWithProgress` nakłada postęp na statyczny JSON), więc migracja
danych nie jest potrzebna.

### Zachowane (id przeniesione, treść przepisana) — 27 kroków

| Stary krok | Nowy krok |
| --- | --- |
| Metronome consistency | 1.1 Feel the pulse before you play |
| Downstroke consistency | 1.2 Quarter-note downstrokes |
| Quarter-note pulse | 1.3 Count out loud and find beat one |
| Counting rests | 1.4 Rests, long notes and clean stops |
| Common open chords | 2.1 Essential open chords, ringing clean |
| Smooth chord changes | 2.2 Two-chord changes on the beat |
| Chord fingering economy | 2.3 Change without stopping the strum |
| Bass note awareness | 2.5 Strum the right strings |
| Eighth-note feel | 3.1 The eighth-note pendulum |
| Accent placement | 4.1 Accents and the backbeat |
| Palm muting basics | 4.2 Palm muting |
| Muted strumming | 4.3 Percussive chucks |
| Chord ringing control | 4.4 Long and short |
| Strum dynamics | 4.5 Loud and soft |
| Syncopation basics | 5.1 Syncopation: hits between the beats |
| Upstroke control | 5.3 Off-beat upstrokes: the skank |
| Triplet subdivision | 5.4 Shuffle and swing feel |
| Groove locking | 5.7 Lock in with the drums |
| Chord progression mapping | 6.1 Read a chord chart and map the song |
| Song strumming adaptation | 6.2 Choose and adapt a strum pattern |
| Suspended chords | 6.3 Sus-chord embellishments and fills |
| Section transitions | 6.4 Section changes, intros and endings |
| Learning by ear | 6.5 Learn a song by ear |
| Tempo change control | 7.2 Tempo range and stamina |
| Recording self-review | 7.3 Record, review and fix |
| Playing with others | 7.4 Play with other people |
| Dynamic arrangement | 7.5 Your rhythm part, start to finish |

### Dodane (nowe id) — 10 kroków

2.4 Four-chord loops from real songs · 3.2 Your first patterns · 3.3 Count and read
strum patterns · 3.4 THE pattern (D DU UDU) · 3.5 Rests inside a pattern · 3.6 Change
chords inside a pattern · 5.2 Anticipated chord changes (the push) · 5.5 Sixteenth notes
and the funk scratch · 5.6 Switch subdivisions without changing tempo · 7.1 Play a whole
song with the track.

### Usunięte — 20 kroków (postęp na nich przestaje się liczyć)

- Cała faza „Single-String Technique” (7): technika solowa, poza celem roadmapy.
- Open chord transposition, Partial chord voicings, Thumb position control (treść
  pozycji kciuka wchłonięta do 2.1).
- Open seventh chords, Major/minor shapes, Slash chord reading, Partial barre
  preparation, Voicing economy: słownik akordowy, nie rytm.
- Intro and outro patterns (scalone z 6.4), Simplified accompaniment (scalone z 6.2).
- Warm-up routine, Focused repetition, Slow-to-fast buildup (scalone z 7.2), Error
  isolation (scalone z 7.3), Consistent practice schedule: nawyki, nie umiejętności.

### Świadomie pominięte

- **Power chordy jako osobny krok.** W bibliotece nie ma ćwiczenia na power chordy;
  zamiast tego są zastosowaniem w kroku 4.2 (palm muting). Jeśli powstanie takie
  ćwiczenie, to naturalne miejsce na krok „Power chords and the chug” jest po 4.2.
- **Kapodaster.** Poza zakresem „basics”.

## Ćwiczenia i lekcje

- Każde `suggestedExerciseId` istnieje w `exercisesAgregat` (sprawdza to nowy test
  `src/data/roadmaps/staticRoadmaps.test.ts`). Schematy strummingu dobrano po
  faktycznej sekwencji uderzeń z `strummingPatterns.ts` (np. `strumming_pattern_6` to
  „Old Faithful” bez ostatniego upstroke'u, `strumming_pattern_12` to kształt zmiany
  antycypowanej, `strumming_pattern_14` to skank).
- Lekcje YouTube są zapisane **inline** (`lessons[]`, jak w roadmapie improwizacji), nie
  przez `suggestedLessonIds`, więc nie zależą od kolekcji `youtubeLessons` w Firestore.
  Wszystkie 32 filmy zweryfikowano przez endpoint oEmbed YouTube (tytuł i kanał w JSON-ie
  są tym, co zwrócił YouTube). 30 z nich pochodzi ze starej wersji roadmapy.

## Źródła programu

Zweryfikowane 2026-09-13 (strona lub wyszukiwarka):

- JustinGuitar, Beginner Course Grade 1 — 7 modułów: Before You Begin; A & D Chords;
  Rhythm & Chord Changes; Capo, Minor Chords & Up Strums; Metronome, Stretches & THE
  Pattern; Basic Theory & Strumming Development; Air Changes, Dynamics & Consolidation.
  Grade 2, moduł 12: Rock Power Chords & palm muting. Ćwiczenie One Minute Changes.
- Hal Leonard Guitar Method Book 1 (Schmid, Koch) — akordy C, G, G7, D, D7, A7, Em;
  rytmy do ósemek; strumming; pełne utwory.
- Berklee Online, „Rhythm and Groove Guitar” — time-feel, synkopa; tyg. 4–5 muted
  rhythms/scratch; tyg. 6–7 szesnastki; tyg. 8–9 triole i synkopa; duety rytmiczne.
- Berklee Press, „Reading Contemporary Guitar Rhythms” (M.T. Szymczak) — czytanie
  rytmu, synkopa, chord charts.
- Soundbrenner, „5 metronome exercises to build your internal clock” — half-time click
  (2 i 4), whole-note click, silent bars, offbeat click, tempo check-ins.
- TrueFire blog, Jon Finn, „Mastering Your Internal Clock” — przewidywanie beatu,
  redukcja klika, palm-muted downstrokes jako test timingu.
- Fretjam, palm muting — pozycja dłoni „between the bridge and the first pickup”.
- JamPlay, Dave Isaacs, „Strumming is Drumming” — akcent na 2 i 4 z werblem.
- Premier Guitar, Alex Nolan, „Rhythm Rules: 16th-Note Accents” — akcenty na
  upstroke'ach, praktyka na tłumionych strunach 60–75 BPM.
- Hooktheory, „I analyzed the chords of 1,300 popular songs” + Trends — I→V najczęstsza
  zmiana, I–V–vi–IV.
- Andy Guitar, „Blues shuffle and swing strumming”; StudyBass, „Shuffle and Swing
  Rhythms” — feel triolowy, nie mieszać prostego i shuffle w utworze.
- Guitar Tricks „Chord Anticipation”, Fundamental Changes „Changing Chords While
  Strumming”, Song Notes „Open String Strumming Trick” — zmiana na „and” 4, air changes.
- Acoustic Guitar magazine, „How to Use Sus and Add Embellishments with Open Chord
  Shapes” — sus2/sus4 w akompaniamencie (James Taylor).
- Gracze jako wzorce: Freddie Green (freddiegreen.org, Acoustic Guitar — „four to the
  bar”, gitara jako część perkusji), Malcolm Young (Premier Guitar „Rhythm Is King”,
  Guitar Player), Nile Rodgers (Premier Guitar „The Emperor of Chuck”, Guitar World /
  Cory Wong).

## Do zrobienia poza tym zadaniem

- Wiki (`ai-coach-and-weekly-milestones.md`) mówi, że każdy krok wymaga „8 logged
  practice sessions”. Faktyczny mechanizm to odhaczanie zasobów w drawerze
  (`withResourceStatus`) lub ręczny status; `sessionsRequired` waży tylko procent na
  dashboardzie. Warto poprawić przy audycie wiki.
- Przy okazji: nowy test wykrył w roadmapie Petrucciego dwa id ćwiczeń ze spacją na
  końcu (`hammer_on_sequence_5_7_9 `, `composition_challenge `), przez co practice kit
  tych kroków był pusty. Spacje usunięte w tej samej zmianie (2 znaki, bez zmian treści).
