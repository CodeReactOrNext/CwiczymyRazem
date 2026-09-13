# I want to play like Adam Jones — przebudowa roadmapy

**Data:** 2026-09-13
**Plik:** `src/data/roadmaps/i-want-to-play-like-adam-jones.json` (id bez zmian: `f078b316-…`)
**Zakres:** trzecia roadmapa z serii; ta sama metoda co
[Rhythm Guitar Basics](2026-09-13-rhythm-guitar-basics-rebuild.md) i
[John Mayer](2026-09-13-john-mayer-roadmap-rebuild.md).

## Diagnoza starej wersji (commit `23431984`)

49 kroków w 7 fazach, każdy `sessionsRequired: 8`. Problemy:

- **Roadmapa uczyła solówek gracza, który solówek nie gra.** Fazy 0–1 („String bend
  control”, „Legato phrasing fluency”, „Minor pentatonic variants”, „Dorian modal phrasing”,
  „Arpeggio fragment usage”) to program leadowy bluesowo-rockowy. Jones powiedział Guitar
  World: „I was always bored with three-hour solos”, a jego styl to tekstury i rytm.
- **Brak drop D.** Ani jedno wystąpienie w całym pliku — a to tuning, w którym Jones gra
  prawie wyłącznie (na Fear Inoculum praktycznie zawsze) i z którego wynika połowa jego
  techniki: power chord jednym palcem, „lift”, drony na pustych strunach.
- **Błąd rzeczowy o sprzęcie.** Krok „EQ and pickup selection” twierdził, że jego brzmienie
  bierze się „largely from playing through the neck pickup of a Gibson SG”. Jones gra na
  Les Paulu Custom Silverburst z 1979 z gorącym humbuckerem przy mostku, przez trzy
  zmiksowane wzmacniacze.
- **Brak sygnaturowych technik.** Nie było: podwójnych triol z palm mute, techniki „lift”
  (młotkowanie trzech strun jednym palcem bez kostki), naprzemiennych metrum 5/8+7/8,
  grupowania 7-7-2 wewnątrz 4/4, polirytmii, talk boxa, volume swelli, kontrolowanego
  sprzężenia, dysonansowych dwudźwięków.
- **Brak rodowodu.** Ani słowa o Robercie Frippie i King Crimson, Melvins, Helmet czy
  Meshuggah — jedynych wpływach, które Jones sam wymienia.
- **Faza „Tool Catalog Integration” bez treści.** 7 kroków nazywających utwory, bez tonacji,
  metrum, chwytów i riffów — i z **jedną** lekcją wideo na całą fazę.
- **Faza „Tone & Effects” to 7 kroków abstrakcji studyjnej** („Gain staging”, „Signal chain
  sculpting”) zamiast jego realnego rigu.
- **Kryteria ukończenia niesprawdzalne** („sounds intentional”, „feels natural”), brak
  źródeł, brak wymagań wstępnych, brak finału.
- **Krok bez ćwiczenia i bez flagi** (`suggestedExerciseId: undefined` bez `noExercise`).

## Program po przebudowie

**Poziom wejściowy:** Intermediate. Wymagania wstępne (w pierwszym kroku): power chordy i
barre, palm mute, alternate picking w umiarkowanym tempie, trzymanie czasu z metronomem w
4/4, gitara elektryczna, którą da się przestroić na drop D, i dowolny wzmacniacz lub symulator
z użytecznym wysokim gainem.

**Umiejętności końcowe** (ostatni krok, „What you can do now”): riffy w drop D z akordami
jednym palcem, „liftem”, dronami i stabilnym tłumieniem; liczenie i granie 7/8, 5/8, cykli
naprzemiennych, grupowań wewnątrz 4/4 i trzech na cztery; pisanie z barwą frygijską,
dysonansowymi dwudźwiękami i przesuwanymi klastrami; tekstura zamiast solówek; jego brzmienie
z trzech zmiksowanych głosów; sześć utworów Tool; własny nagrany utwór w nieparzystym metrum.

| Faza | Kroki | Sesje |
| --- | --- | --- |
| 1. Drop D and the Riff Hand | 6 | 37 |
| 2. Odd Meters and Cross Rhythms | 5 | 35 |
| 3. The Harmony of Menace | 5 | 32 |
| 4. Texture Instead of Solos | 5 | 29 |
| 5. The Sound | 5 | 27 |
| 6. Songs | 6 | 46 |
| 7. Writing and Performing | 6 | 40 |
| **Razem** | **38** | **246** |

Progresja: fundamenty (tuning, ręka riffowa, metrum, harmonia) → zastosowanie (tekstura,
brzmienie) → samodzielne wykonanie (sześć utworów, pisanie, nagranie).

Każdy krok ma `[What it is]`, `[Why it matters]`, `[How to practice]`, `[Sources]` (pierwszy
dodatkowo `[Before you start]`, ostatni `[What you can do now]`) i sprawdzalny warunek
ukończenia. `sessionsRequired` 5–8.

Osiem kroków ma `noExercise: true` — sześć utworów, pedalboard i finał; żadne ćwiczenie z
biblioteki ich nie reprezentuje, a każdy z nich ma lekcje wideo, więc drawer nadal ma co
odhaczyć.

## Audyt: co zachowano, zmieniono, usunięto, dodano

Postęp jest kluczowany po id kroku, więc **34 z 49 starych kroków zachowało id** (treść
przepisana od zera).

### Zachowane (id przeniesione) — 34 kroki, przykłady

| Stary krok | Nowy krok |
| --- | --- |
| Power chord variations | 1.2 Drop D: one finger, three strings |
| Palm muting precision | 1.3 Palm muting and the muted triplet |
| Legato phrasing fluency | 1.4 The lift: hammer-ons with no pick |
| Partial chord shapes | 1.5 Open-string drones under moving shapes |
| Odd-meter grooves | 2.1 Counting odd meters: 7/8 and 5/8 |
| Syncopated riffing | 2.3 Odd groupings inside 4/4 |
| Polyrhythmic feel | 2.4 Cross rhythms: three against four |
| Use of space | 2.5 Space: the power of not playing |
| Phrygian coloration use | 3.1 Phrygian and Phrygian dominant |
| Intervallic leaps | 3.2 Fourths, fifths and open intervals |
| Dissonant dyad usage | 3.3 Dissonant dyads: the half step and the tritone |
| Triad cluster voicings | 3.4 Clusters, sliding shapes and open-string voicings |
| Arpeggio fragment usage | 3.5 Chiming arpeggios and clean figures |
| Wide vibrato control | 4.1 Long notes: sustain, vibrato and the held bend |
| Sustain and feedback | 4.2 Controlled feedback |
| Percussive string scratches | 4.4 Noise as a part: scrapes, scratches, dead notes |
| Minor pentatonic variants | 4.5 Single-note melodies over a drone |
| Amp voicing control | 5.1 The rig: a Silverburst into three amps |
| EQ and pickup selection | 5.2 Pickup and EQ (poprawiony błąd o SG) |
| Stinkfist riff articulation | 6.1 Stinkfist and Ænema |
| Schism groove replication | 6.2 Schism: 5/8 plus 7/8 |
| Forty Six And Two leads | 6.3 Forty Six & 2 |
| Lateralus modal phrasing | 6.4 Lateralus: 9/8 and the long build |
| Parabola dynamics execution | 6.5 Parabola: other tunings and one real solo |
| Vicarious delay textures | 6.6 Vicarious, Jambi and 7empest |
| Riff development | 7.1 Riff development |
| Writing in odd meters | 7.2 Writing in odd meters |
| Lead-rhythm interplay | 7.5 Locking with bass and drums |

Pełna lista id: `src/data/roadmaps/staticRoadmaps.test.ts` (`JONES_CARRIED_OVER`).

### Dodane (nowe id) — 4 kroki

1.1 Where Jones comes from: Crimson, the Melvins and a sculptor's ear · 2.2 Riffs that
alternate meters: 5/8 plus 7/8 · 4.3 Volume swells and fade-ins · 7.6 Final: your own piece,
in odd time, recorded.

### Usunięte — 15 kroków (postęp na nich przestaje się liczyć)

- **Scalone w inne kroki:** Chromatic slide control → 1.4; String attack variety → 4.4;
  Accent placement control → 2.3; Octave riff voicings → 3.2; Chordal slides → 3.4;
  Muted chord stabs → 5.5; Gain staging → 5.1; Motif variation → 7.1; Tension and release
  → 7.3; Sober phrasing and tone → 6.1.
- **Poza stylem:** String bend control, Dorian modal phrasing, Chromatic approach lines,
  Double-stop melodies (język leadowy bluesowy, nie jego).
- **Abstrakcja bez zastosowania:** Signal chain sculpting.

### Świadomie pominięte

- **Drop B i inne stroje poza drop D** dostają jeden krok (Parabola), nie osobną fazę —
  Jones używa ich wyjątkowo.
- **Talk box jako osobna technika.** Bez sprzętu nie da się jej ćwiczyć, więc jest częścią
  kroku o pedalboardzie, z materiałem wideo na wypadek gdyby ktoś talk box miał.

## Ćwiczenia i lekcje

- Każde `suggestedExerciseId` istnieje w `exercisesAgregat` (sprawdza test). Biblioteka
  okazała się nieoczekiwanie dobrze dopasowana do tej roadmapy: **osiem ćwiczeń z rodziny
  `meter_*`** (7/8, 5/8, regrupowanie 8/8, hemiola 6/8↔3/4, 5/4↔7/4) obsługuje całą fazę
  rytmiczną i krok o pisaniu w nieparzystym metrum, `down_picking_doom_pulse` i `metal_gallop`
  odpowiadają dokładnie palm mute'owi i triolom, a `rhythm_training_medium` jest grane na
  tłumionej strunie, czyli jest ćwiczeniem martwych dźwięków.
- Lekcje YouTube zapisane **inline** (`lessons[]`), nie przez `suggestedLessonIds`.
  **93 sloty, 87 unikalnych filmów**, wszystkie zweryfikowane przez oEmbed YouTube. Stara
  wersja miała 44 id, w tym lekcje bez związku ze stylem (bebop legato Jensa Larsena, modalne
  ćwiczenia jazzowe, akustyczne bendy). Nowe obejmują m.in. rozbiory techniki „lift” (Ben
  Eller, Maya Neelakantan), wszystkie sześć utworów, brzmienie (Thomann „Hit the Tone” dla
  Schism i Lateralus) oraz liczenie metrum i polirytmii.

## Źródła programu

Zweryfikowane 2026-09-13:

- **Wypowiedzi Jonesa:** Guitar World 2006 — „I was always bored with three-hour solos”,
  „I think Joe Satriani is amazing, but after three songs he puts me to sleep”, „If it's
  tasteful and it's what the song needs, it's okay”, „There's a big difference between talent
  and gimmick”; o pisaniu — „You learn that not playing can be just as powerful as playing.
  You need to let things breathe… That silence just makes the times that I do play have much
  more impact”; o Frippie — nauczył go „attitude and discipline”; o Melvins — „Where I do more
  of a shoegazer thing onstage, Buzz will microwave a crowd”; wywiad Guitar World o Fear
  Inoculum i jego sygnaturowych pull-offach.
- **Analizy gry:** MusicRadar „Tool guitar lesson: 5 ways to play like Adam Jones” (power
  chordy jednym palcem w drop D, volume swelle, triole z palm mute i hammer-onami, naprzemienne
  metrum, cross rhythms w „Rosetta Stoned”); Premier Guitar, Levi Clay, „How to Riff Like
  Tool's Adam Jones” (drony na pustych strunach, 5/8+7/8, grupowanie 7-7-2 wewnątrz 4/4,
  D frygijska i frygijska dominantowa z interwałem Eb–F#, rozdzielone delaye z phaserem i
  flangerem); guitarguitar „How to Sound Like Tool's Adam Jones” (pull-through w „Jambi”,
  hammer slaps w „Ænema”, „textures, not notes”, mało nut i dużo przestrzeni, bas bierze
  zmiany harmoniczne); Riffhard „How to Get Adam Jones's Guitar Tone” (Les Paul Custom,
  Seymour Duncan JB przy mostku, dublowanie ścieżek).
- **Sprzęt:** Mixdown „Gear Rundown: Adam Jones of Tool” (Les Paul Custom Silverburst 1979,
  Marshall Super Bass 1976 z połączonymi kanałami przez Mesa 2×15, dwa Diezel VH4 przez Mesa
  4×12, Sunn Beta Lead na Lateralus, Roland JC-120 na 10,000 Days, Heil talk box w „Jambi”,
  Boss BF-2, DOD FX40B, MXR Micro Amp, Dyna Comp, Cry Baby 535Q, Line 6 DL4, Boss DD-5).
- **Utwory:** analizy „Schism” jako naprzemiennych taktów 5/8 i 7/8 sumujących się do 12/8, z
  riffem wokół D, A i F opartym na kwartach i kwintach; Guitar Lessons 365 (Carl Brown) o
  „Forty-Six & 2” w drop D i jego „numerous rhythmic challenges”.
- **Fakty:** Wikipedia, Adam Jones (musician) — nauka skrzypiec metodą Suzukiego i kontrabas
  w orkiestrze, brak lekcji gitary, Electric Sheep z Tomem Morello (Jones na basie), praca
  przy efektach specjalnych u Stana Winstona, drop D prawie wyłącznie na Fear Inoculum,
  okazjonalne drop B, inne stroje w „Parabola” i „Prison Sex”, 7/8 w intrze „7empest”, talk
  box w „Jambi”, depilator użyty jako kostka na Ænima i Lateralus, sygnaturowy Silverburst
  z 2020, Helmet wymieniony jako wpływ w wywiadzie z 1994.

## Uwagi

- Test `staticRoadmaps.test.ts` obejmuje teraz trzy przebudowane roadmapy (`REBUILT`).
- Zostały cztery: Marty Friedman, Jimi Hendrix, John Petrucci i Guitar Improvisation
  Fundamentals.
