# I want to play in the style of John Mayer — przebudowa roadmapy

**Data:** 2026-09-13
**Plik:** `src/data/roadmaps/i-want-to-play-in-the-style-of-john-maye.json` (id bez zmian: `58c48c07-…`)
**Zakres:** kolejne zadanie z serii „przebudowa istniejących roadmap”; ta sama metoda co
[Rhythm Guitar Basics](2026-09-13-rhythm-guitar-basics-rebuild.md).

## Diagnoza starej wersji (commit `23431984`)

46 kroków w 7 fazach, każdy `sessionsRequired: 8`. Problemy:

- **Roadmapa nie była o Mayerze.** 40 z 46 kroków to ogólne tematy („Fingerstyle control”,
  „Shell-voicing familiarity”, „Modal color application”, „Voice-leading principles”), które
  pasowałyby do dowolnego gitarzysty. Nazwisko pojawiało się głównie w zdaniu „in the John
  Mayer style”, doklejonym do opisu.
- **Brak analizy gry artysty.** Nie było: kciuka na szóstej strunie (podstawa jego rytmu),
  slapu kciukiem (Neon, Stop This Train, Why Georgia), mieszania pentatoniki durowej z molową,
  rake'ów, sekst, ćwierćtonów, grania za beatem. Zamiast tego shell voicingi i modalna harmonia,
  których w jego graniu praktycznie nie ma.
- **Brak rodowodu.** Ani słowa o SRV, Hendrixie, trzech Kingach, Buddym Guyu czy Curtisie
  Mayfieldzie — a to z nich zbudowany jest jego język.
- **Ostatnia faza bez materiału.** „Gravity solo interpretation”, „Neon chordal technique”,
  „Stop This Train fingerstyle” itd. opisywały utwory ogólnikami, bez tonacji, akordów, chwytów
  i bez jednej lekcji wideo (6 kroków, razem 1 lekcja).
- **Niesprawdzalne warunki ukończenia.** „Phrases breathe”, „tone is consistent and
  intentional”, „feels natural” — bez tempa, taktów i czynności do wykonania.
- **Dwa kroki bez ćwiczenia i bez flagi.** `suggestedExerciseId: undefined` bez
  `noExercise: true` (m.in. „Diatonic chord substitution”, cała faza repertuarowa).
- **Brak źródeł** i uzasadnienia, dlaczego krok jest potrzebny.

## Program po przebudowie

**Poziom wejściowy:** Intermediate. Wymagania wstępne (w pierwszym kroku): czyste barre, box
pentatoniki molowej w dwóch tonacjach, bend o cały ton, 12-bar z shuffle, plus podstawy
fingerpickingu albo kostka z szesnastkami.

**Umiejętności końcowe** (ostatni krok, sekcja „What you can do now”): trzy strony grania
Mayera — rytm na chwytach z kciukiem z ozdobnikami w stylu Hendrixa, akustyczny groove ze
slapem kciuka, lead bluesowy z jego frazowaniem — plus jego brzmienie na własnym sprzęcie
i prowadzenie tria jako jedyny gitarzysta.

| Faza | Kroki | Sesje |
| --- | --- | --- |
| 1. Blues Roots: The Lineage | 6 | 36 |
| 2. Thumb Chords and Hendrix-Style Rhythm | 6 | 41 |
| 3. Acoustic Groove: The Thumb-Slap Style | 5 | 34 |
| 4. Lead Vocabulary: Blues into Pop | 8 | 54 |
| 5. Tone and Touch | 4 | 21 |
| 6. Songs: Three Sides of Mayer | 4 | 31 |
| 7. Performance | 4 | 28 |
| **Razem** | **37** | **245** |

Progresja: fundamenty (rodowód bluesowy, bendy, wibrato, rake'i) → zastosowanie (rytm z
kciukiem, akustyczny groove, słownik leadowy, brzmienie) → samodzielne wykonanie (cztery
utwory, własne solo, trio, nagrany set).

Każdy krok ma `[What it is]`, `[Why it matters]`, `[How to practice]`, `[Sources]` (pierwszy
dodatkowo `[Before you start]`, ostatni `[What you can do now]`) i warunek ukończenia z
tempem, liczbą taktów lub konkretną rzeczą do nagrania. `sessionsRequired` 5–8.

Siedem kroków ma `noExercise: true` — utwory i występy, których żadne ćwiczenie z biblioteki
nie reprezentuje; status ustawia się ręcznie w drawerze.

## Audyt: co zachowano, zmieniono, usunięto, dodano

Postęp jest kluczowany po id kroku, więc **31 z 46 starych kroków zachowało id** (treść
przepisana). Roadmapa nie jest kopiowana per użytkownik, więc migracja nie jest potrzebna.

### Zachowane (id przeniesione) — 31 kroków, przykłady

| Stary krok | Nowy krok |
| --- | --- |
| Controlled string bending | 1.3 Bending to pitch: whole, half and quarter tones |
| Wide expressive vibrato | 1.4 Vibrato that sings |
| Legato articulation (+ Chromatic slide control) | 1.5 Slides and legato along the string |
| Thumb-over fretting | 2.1 Thumb over the neck: fretting the bass |
| Major7 and add9 shapes | 2.2 Pinky embellishments: sus4, 6 and 9 |
| Voice-leading between chords | 2.3 Hendrix inversions and bass motion |
| Triad voicings across neck | 2.4 Licks over chords |
| Double-stop precision | 2.5 Sixths and soul double stops |
| Fingerstyle control | 3.1 Thumb and index only |
| Thumb bass independence | 3.2 The thumb slap on 2 and 4 |
| Stop This Train fingerstyle | 3.3 The slap-flick pattern |
| Neon chordal technique | 3.4 Neon: slap-pop triplets |
| Room For Squares comping | 3.5 Why Georgia |
| Major pentatonic harmony | 4.2 Mixing major and minor: pentatonic equator |
| Use of space (+ Micro-timing nuance) | 4.4 Space, and playing behind the beat |
| Continuum-era tone craft | 5.3 The rig |
| Gravity solo interpretation | 6.1 Gravity: 6/8, G major pentatonic, thumb Dmaj7 |
| Slow Dancing phrasing | 6.2 Slow Dancing: thumb chords, add11, double stops |
| Chord melody integration | 6.4 Waiting on the World to Change |
| Pocket timing control | 7.3 Play with a rhythm section: the trio format |

Pełna lista id jest w `src/data/roadmaps/staticRoadmaps.test.ts` (`MAYER_CARRIED_OVER`).

### Dodane (nowe id) — 6 kroków

1.1 Where Mayer comes from: the blues you inherit · 1.6 Rakes and double stops · 6.3 The Trio:
Who Did You Think I Was and Vultures · 7.1 Your own solo in his language · 7.2 One guitar,
three sides · 7.4 Final: a three-song Mayer set, recorded.

### Usunięte — 15 kroków (postęp na nich przestaje się liczyć)

- **Scalone w inne kroki:** Chromatic slide control → 1.5; Micro-timing nuance → 4.4;
  Blues-inflected chromatics → 4.7; Thumbed bass chord grooves → 3.1/3.2; Syncopated comping
  patterns → 2.6; Dynamic comping contrast → 5.2.
- **Poza stylem:** Shell-voicing familiarity, Triad pair connections, Modal color application,
  Diatonic chord substitution, Voice-leading principles (harmonia jazzowa, nie jego język).
- **Zbędne lub ogólne:** Palm muting nuance i Ghost-note strumming (wchłonięte przez 2.6),
  Brush strumming control, Alternating bass patterns.

### Świadomie pominięte

- **Looper i Dead & Company.** Jego granie w Dead to osobny temat (i cytat o „no lead guitar”
  wykorzystałem w kroku 7.3), ale repertuar Dead wykracza poza „w stylu Mayera”.
- **Sob Rock / Last Train Home.** Brzmienie lat 80. z chorusem to wariant kroku 5.3, nie
  osobny materiał.

## Ćwiczenia i lekcje

- Każde `suggestedExerciseId` istnieje w `exercisesAgregat` (sprawdza test). Dobór pod konkretną
  czynność, nie po nazwie: `muting_spotlight_drill` na rake'i, `chicken_pickin` na pop struny
  w Neon, `interval_hunt` na seksty, `chord_degree_hunt_triads` na znajdowanie 4, 6 i 9 w
  akordzie, `one_string_backing` na granie poziome wzdłuż struny.
- Lekcje YouTube zapisane **inline** (`lessons[]`), nie przez `suggestedLessonIds` — nie zależą
  od kolekcji `youtubeLessons` w Firestore. **83 filmy zweryfikowane** przez oEmbed YouTube
  (tytuł i kanał w JSON-ie to odpowiedź YouTube); stara wersja miała 81 id, z których część była
  niezwiązana ze stylem (np. „Chord Switching Practice — C to D”, lekcje klasyczne).
  Dodane m.in. pełne klinki Berklee 2004 i 2008, rozbiór lekcji z Instagrama (2020), lekcje
  utworów od JustinGuitar, Marty Music, Jona MacLennana, Paula Davidsa i Six String
  Fingerpicking.

## Źródła programu

Zweryfikowane 2026-09-13:

- **Wypowiedzi Mayera:** wywiad Guitar World 2017 (archiwum johnmayer.info) — „I can 'do' a lot
  of other people that I admire, like Robert Cray, B.B. King or Stevie Ray”, „If I'm doing my
  job right, you shouldn't have to pay attention to what I'm playing”, o Dead & Company: „there
  is no lead guitar”; Watch What Happens Live (za Guitar.com) — „legacy all-time favourite,
  Stevie Ray Vaughan”; lekcja na Instagram Live 7.05.2020 (Live For Live Music) — nakładanie
  się pentatonik, „pentatonic equator”, słuchanie wokalistów; klinki Berklee 2004 i 2008.
- **Analizy gry:** MusicRadar „5 things you can learn” (przestrzeń, double stopy z rake'ami,
  slide'y i hammer-ony wymiennie, granie za beatem, ćwierćtony) i „4 Mayer chords to try”
  (Emaj9, Badd11, D/F#, Dmaj7 z kciukiem); Premier Guitar „The Many Sides of John Mayer”
  (Arthur Rotfeld) i „The Acoustic Side of John Mayer” (Jon MacLennan — slap jak „turn a key”,
  Mayfield i Cropper) oraz „Blueprints: John Mayer's Tonal Foundation”; Liberty Park Music
  „John Mayer's Influences”, „Commonly Used Techniques” i „A practice regimen…” (kolejność:
  kciuk → double stopy → legato → bendy → licki na akordach); Guitar World „12 playing tips”;
  Fundamental Changes „Play Guitar Like John Mayer”.
- **Utwory:** Guitar Music Theory (Desi Serna) „Gravity — how does this song work?” (G-dur, 6/8,
  G–C6, refren z pożyczkami z g-moll, solo poziomo po drugiej strunie); Guitar Club „Gravity”
  (Dan Holton, kształty CAGED); Guitar Lessons 365 „Slow Dancing in a Burning Room” (chwyty z
  kciukiem, seria szybkich slide'ów na double stopach); Your Guitar Academy „Who Did You Think
  I Was” (riff na A7 + pentatonika molowa); Toby's Music Lessons „The John Mayer Fingerstyle
  Technique in 6 Steps”; Six String Fingerpicking „Advanced Percussive Techniques”; LickLibrary
  „Why Georgia” (Tom Quayle).
- **Fakty:** Wikipedia — kaseta SRV od sąsiada, „genealogical hunt”, Berklee 1997 (dwa
  semestry, u Tomo Fujity), John Mayer Trio 2005 z Pino Palladino i Steve'em Jordanem, Try!
  (2005), Continuum (2006), sygnowane Stratocastery i PRS Silver Sky (2018).

## Uwagi

- Nowy test `staticRoadmaps.test.ts` obejmuje teraz obie przebudowane roadmapy
  (`REBUILT`): sekcje opisu, flaga `noExercise` i zachowane id.
- Pozostałe pięć roadmap czeka na ten sam zabieg; wzorzec i pułapki opisane w pamięci projektu.
