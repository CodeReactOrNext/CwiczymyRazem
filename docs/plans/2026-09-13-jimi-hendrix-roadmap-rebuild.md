# Play in the style of Jimi Hendrix — przebudowa roadmapy

**Data:** 2026-09-13
**Plik:** `src/data/roadmaps/play-in-the-style-of-jimi-hendrix.json` (id bez zmian: `0cbc5208-…`)
**Zakres:** czwarta roadmapa z serii; ta sama metoda co
[Rhythm Guitar Basics](2026-09-13-rhythm-guitar-basics-rebuild.md),
[John Mayer](2026-09-13-john-mayer-roadmap-rebuild.md) i
[Adam Jones](2026-09-13-adam-jones-roadmap-rebuild.md).

## Diagnoza starej wersji (commit `23431984`)

52 kroki w 7 fazach, każdy `sessionsRequired: 8` — 416 sesji, najdłuższa roadmapa w aplikacji.
Problemy:

- **Odwrócona kolejność.** Zaczynała od siedmiu kroków o bendach i wibracie, zanim padł
  jakikolwiek akord. Hendrix był zawodowym gitarzystą rytmicznym R&B, zanim został solistą:
  grał w zespole Isley Brothers od 1964, potem u Little Richarda, na trasach chitlin' circuit.
  Rytm jest u niego pierwszy — historycznie i muzycznie.
- **Rozdrobnienie.** Pięć niemal identycznych kroków o bendach i wibracie („Vibrato depth
  control”, „Vibrato speed modulation”, „Bend pitch accuracy”, „Microtonal bend nuance”) po
  8 sesji każdy, czyli 40 sesji na jedną umiejętność. Faza brzmieniowa miała osiem kroków,
  w tym „Tone knob sculpting” i „Pedal timing discipline”.
- **Brak strojenia.** Hendrix nagrywał pół tonu niżej (Eb). Roadmapa nie wspominała o tym ani
  razu, a bez tego nie da się grać z nagraniami.
- **Brak faktu o odwróconej gitarze.** Grał na praworęcznym Stratocasterze przestrunowanym
  i odwróconym — dlatego gałki głośności i tonu leżą pod dłonią, co jest częścią jego techniki,
  a nie ciekawostką.
- **Brak rodowodu.** Ani słowa o Curtisie Mayfieldzie (o którym sam powiedział, że wpłynął na
  niego bardziej niż ktokolwiek, z kim grał do tamtej pory), Stevie Cropperze, Isley Brothers
  czy bluesmanach.
- **Brak sygnaturowych rzeczy.** Akord Hendrixa (7#9) miał krok bez jednej konkretnej
  informacji, czym ten akord jest. Nie było barre jednym palcem przez trzy struny, ślizgających
  się sekst, zasady „grać tylko dwie–trzy nuty z kształtu”, ani sprzężenia jako instrumentu.
- **Faza repertuarowa bez treści.** Siedem kroków nazywających utwory, bez tonacji, akordów
  i technik, z pojedynczymi lekcjami.
- **Krok bez ćwiczenia i bez flagi** (`suggestedExerciseId: undefined` bez `noExercise`).
- **Kryteria ukończenia niesprawdzalne**, brak źródeł, wymagań wstępnych i finału.

## Program po przebudowie

**Poziom wejściowy:** Intermediate. Wymagania wstępne (w pierwszym kroku): akordy barowe,
pentatonika molowa w dwóch pozycjach, bend o cały ton trafiający w dźwięk, umiejętność
utrzymania 12-bar bluesa. Ramię tremolo przydaje się w jednej fazie, ale nie jest konieczne.

**Umiejętności końcowe:** jego styl rytmiczny (akordy z kciukiem, kształty częściowe,
ślizgające się seksty, tłumiony comping), metoda ozdabiania akordów z „Little Wing”, riffy na
7#9 i akordach dominantowych, słownik leadowy, brzmienie Strat–Marshall–Fuzz Face na własnym
sprzęcie, siedem utworów i nagrany własny set.

| Faza | Kroki | Sesje |
| --- | --- | --- |
| 1. The R&B School | 6 | 38 |
| 2. Chord Embellishment | 5 | 32 |
| 3. Dominant Harmony and Chord Riffs | 5 | 32 |
| 4. The Lead Voice | 6 | 38 |
| 5. The Sound | 5 | 29 |
| 6. Songs | 7 | 51 |
| 7. Performance | 4 | 28 |
| **Razem** | **38** | **248** |

Progresja: fundamenty (szkoła R&B → ozdabianie → harmonia dominantowa) → zastosowanie
(głos solowy, brzmienie) → samodzielne wykonanie (siedem utworów, improwizacja, trio, nagranie).

Każdy krok ma `[What it is]`, `[Why it matters]`, `[How to practice]`, `[Sources]` (pierwszy
dodatkowo `[Before you start]`, ostatni `[What you can do now]`) i sprawdzalny warunek
ukończenia. `sessionsRequired` 5–8 zamiast stałych 8; 416 sesji zeszło do 248.

Dziewięć kroków ma `noExercise: true` — siedem utworów, pedalboard i finał.

## Audyt: co zachowano, zmieniono, usunięto, dodano

**35 z 52 starych kroków zachowało id** (treść przepisana od zera). Zgodność wszystkich
przeniesionych id ze starą wersją sprawdzona programowo wobec `git HEAD`.

### Zachowane (id przeniesione) — 35 kroków, przykłady

| Stary krok | Nowy krok |
| --- | --- |
| Thumb-over bass fretting | 1.2 Thumb over the neck |
| Partial chord inversions | 1.3 Partial shapes: two or three notes of a chord |
| Parallel thirds and sixths | 1.4 Sliding sixths and soul double stops |
| Left-hand muting rhythms | 1.5 Left-hand muting and the percussive strum |
| Groove-driven comping | 1.6 Sixteenth-note R&B comping |
| Legato hammer-ons pull-offs | 2.1 Hammer-ons and pull-offs around a chord shape |
| Suspended chord textures | 2.2 Choosing the notes: sus, add, next scale degree |
| Double-stop hammer-ons | 2.3 Double-stop embellishments |
| Movable bass lines | 2.4 Bass lines and moving inner voices |
| Sharp nine voicings | 3.1 The Hendrix chord: 7#9 |
| Chordal stab dynamics | 3.3 Chord riffs: riffing off a shape |
| Whole and half bends | 4.1 Bends: to pitch, past it, and back down |
| Vibrato depth control | 4.2 Vibrato: hand, and bar |
| Octave melody control | 4.4 Octaves as a melodic voice |
| Blues scale phrasing | 4.6 Phrasing: space, call and response, vocal line |
| Tone knob sculpting | 5.1 The rig: a flipped Strat into a Marshall |
| Fuzz and overdrive feel | 5.2 Fuzz, and the volume knob as the gain control |
| Wah pedal articulation | 5.3 Wah: rhythm instrument and voice |
| Univibe and modulation | 5.4 Uni-Vibe, Octavia and the studio tricks |
| Controlled amp feedback | 5.5 Feedback as an instrument |
| Purple Haze chord riffing | 6.2 Purple Haze and Foxey Lady |
| Little Wing chord-melody | 6.3 Little Wing: the embellishment masterclass |
| Castles slide phrasing | 6.4 The Wind Cries Mary and Castles Made of Sand |
| Axis dynamics and tone | 6.5 Red House: the slow blues |
| Voodoo wah soloing | 6.6 Voodoo Child (Slight Return) |
| Electric Lady improvisation | 6.7 All Along the Watchtower |
| Cross-string phrasing | 7.1 Improvising in the style |
| Intervallic voice leading | 7.2 Rhythm and lead as one part |
| Dynamic accent control | 7.3 Playing in a trio |

Pełna lista id: `src/data/roadmaps/staticRoadmaps.test.ts` (`HENDRIX_CARRIED_OVER`).

### Dodane (nowe id) — 3 kroki

1.1 Where Hendrix came from, and how to tune like him · 6.1 Hey Joe: the R&B chord part ·
7.4 Final: a recorded Hendrix set.

### Usunięte — 17 kroków (postęp na nich przestaje się liczyć)

- **Scalone w inne kroki:** Vibrato speed modulation, Bend pitch accuracy, Microtonal bend
  nuance i Pre-bend release → 4.1 i 4.2; Major pentatonic blending → 4.5; Slide and glissando
  → 2.5; Palm muting control → 1.5; Octave slides i Minor-major octave shifts → 4.4;
  Touch sensitive dynamics → 5.2; Muted percussive strums → 1.5; Ghost note placement i
  Upstroke-driven accents → 1.6; Volume knob swells → 5.2; Foxy Lady riff feel → 6.2.
- **Poza zakresem:** Left-hand strength conditioning (ogólny trening siły),
  Pedal timing discipline (mieści się w kroku o wah).

### Świadomie pominięte

- **Machine Gun i długie improwizacje z Band of Gypsys.** Materiał na osobną roadmapę;
  fragmenty tego myślenia są w kroku 7.2 (rytm i lead jako jedna partia).
- **Odtwarzanie triku z zębami i podpalania gitary.** Nie są techniką gry.

## Ćwiczenia i lekcje

- Każde `suggestedExerciseId` istnieje w `exercisesAgregat` (sprawdza test). Dobór pod
  czynność: `chord_spotlight_drill` na kciuk (bo wymaga tłumienia piątej struny),
  `interval_hunt` na seksty, `chord_degree_hunt_tensions` na 7#9, `unison_bend_drill` na
  bendy unisono, `string_skipping_basic` na oktawy, `rhythm_triole` na shuffle,
  `one_chord_improv` na partię łączącą rytm z leadem.
- Lekcje YouTube zapisane **inline** (`lessons[]`). **103 sloty, 95 unikalnych filmów**,
  wszystkie zweryfikowane przez oEmbed YouTube. Stara wersja miała 73 id, w tym sporo
  niezwiązanych ze stylem (lekcje klasyczne, legato jazzowe, metalowe palm muting).
  Nowe obejmują wszystkie siedem utworów, rozbiory kciuka i ozdobników, technikę wah,
  sprzężenie, ramię tremolo i brzmienie (m.in. seria Mikela Bluniego o ustawieniach jego
  wzmacniaczy).

## Źródła programu

Zweryfikowane 2026-09-13:

- **Wypowiedzi Hendrixa:** o Curtisie Mayfieldzie i The Impressions (trasa 1963) — „He
  probably influenced me more than anyone I'd ever played with up to that time, that sweet
  sound of his”.
- **Analizy gry:** Guitar Player, Dale Turner, „Jimi Hendrix: The Five Rules of His Powerful
  Rhythm Style” (figury funkowe z otwartych strun i chwytów z kciukiem, double stopy,
  kształty częściowe w „Foxey Lady” i „Purple Haze”; 7#9 i napięcie wobec tercji małej w
  „Spanish Castle Magic”; synkopowane riffy jednonutowe z tłumieniem, slurami, trylami i
  bendami w „If 6 Was 9”, „Voodoo Child”, „Gypsy Eyes”); MusicRadar „Learn the ultimate Jimi
  Hendrix rhythm guitar chord lesson” (kciuk zamiast barre, barre jednym palcem przez trzy
  struny, „playing only two or three notes from each shape”, 7#9, lista utworów czysto
  rytmicznych i funk-rockowych); Premier Guitar, Jon MacLennan, „Hendrix Rhythms Made Easy”
  (zamiana barre na chwyty z kciukiem, młotki i ściągnięcia tworzące melodię nad trzymanym
  akordem, double stopy przy inwersjach z tercją w basie, ozdabianie następnym stopniem
  skali, terminowanie u Little Richarda, Isley Brothers i Kinga Curtisa); Guitar World
  (najczęstszy double stop: kwarta czysta → tercja mała → kwarta, wyższa nuta trzymana);
  Lick Library, Sam Bell, „Technique Primer: Jimi Hendrix Playing Style”.
- **Akord i utwory:** Fender, „Purple Reign: The Hendrix Chord” (palcowanie E7#9, obie tercje
  w jednym akordzie); Thalia Capos, „The Genius of Hendrix: Little Wing Chords with
  Embellishments” (e-moll, ozdobniki diatoniczne kontra wzięte z akordu chwili — cis w takcie
  h-moll, f w drugim takcie a-moll).
- **Sprzęt:** Ground Guitar (Stratocastery z połowy lat 60. „flipped for left-handed use”,
  biały Olympic White z 1968 z Woodstock, struny .010–.038 według Rogera Mayera, Marshall
  Super 100 JTM45/100 z kolumnami 4×12 od 1966, Fuzz Face od 1966, Vox V846, Uni-Vibe częściej
  od 1969, Octavia zaprojektowana przez Rogera Mayera); zZounds i Guitar.com (łańcuch: gitara →
  wah → Fuzz Face → Uni-Vibe → wzmacniacz).
- **Fakty:** Wikipedia, Jimi Hendrix — zespół Isley Brothers 1964, Upsetters Little Richarda
  od końca 1964, Wilson Pickett, Sam Cooke, Ike i Tina Turner, Jackie Wilson, chitlin' circuit;
  wpływy bluesowe Muddy Waters, B.B. King, Howlin' Wolf, Robert Johnson; albumy Are You
  Experienced (1967), Axis: Bold as Love (1967), Electric Ladyland (1968); pionierskie użycie
  gitary jako elektronicznego źródła dźwięku i efektów (fuzz, wah, phasing).
- **Strojenie:** pół tonu niżej (Eb) jest udokumentowane w materiałach lekcyjnych i
  transkrypcjach; bezpośrednich wypowiedzi samego Hendrixa na ten temat praktycznie nie ma,
  więc w roadmapie jest to opisane jako fakt o nagraniach, nie jako jego cytat.

## Uwagi

- Test `staticRoadmaps.test.ts` obejmuje teraz cztery przebudowane roadmapy (`REBUILT`).
- Zostały trzy: Marty Friedman, John Petrucci i Guitar Improvisation Fundamentals.
