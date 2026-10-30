---
name: riff-quest
description: Czym jest riff.quest (repo CwiczymyRazem) — gotowe opisy produktu, pętla „zagraj → zapisz → wróć jutro”, punkty vs Fame, mapa funkcji, pozycjonowanie i fakty, których nie wolno przekręcić (darmowe na zawsze, prawdziwe liczby). Użyj zawsze, gdy ktoś pyta „co to jest riff quest / o co chodzi w tej apce”, gdy trzeba opisać lub przedstawić produkt komuś innemu (pitch, bio, about, opis do sklepu/katalogu, mail do twórcy lub prasy, scenariusz filmu, post, odpowiedź na Discordzie, wprowadzenie nowej osoby do repo), oraz zanim napiszesz jakikolwiek tekst marketingowy, landing, wpis na blogu czy wiki, który mówi, czym aplikacja jest — nawet jeśli nikt nie użył słowa „wyjaśnij”.
---

# riff.quest — czym to jest

Ten skill daje kontekst produktowy: co aplikacja robi, dla kogo, jak o niej mówić i
czego o niej nie mówić. Nie jest specyfikacją funkcji — gdy trzeba coś zmienić w kodzie,
idź do kodu i `CLAUDE.md`.

## W jednym zdaniu

**EN:** riff.quest is a free guitar practice tracker that plays like a game: you log what
you practised, and it turns that time into points, a streak, a level and a place on the
rankings.

**PL:** riff.quest to darmowa aplikacja do śledzenia ćwiczeń na gitarze, która działa jak
gra: zapisujesz, co przećwiczone, a ona zamienia ten czas w punkty, serię dni, poziom i
miejsce w rankingu.

Hasło z landingu: *„The free guitar practice app that tracks real progress”*.
Problem, od którego wszystko się zaczęło (strona /about): *„Am I actually getting better?”*

## Pitch na akapit (EN)

> riff.quest replaces the practice notebook you were supposed to keep and never did. Play,
> log what you played, come back tomorrow: every session turns into points, a streak
> multiplier and a level, and the app shows which of the four areas — technique, theory,
> ear, creative work — you keep avoiding. When you don't know what to practise, it has
> 200+ exercises, ready-made routines, a guided learning path and personal roadmaps. When
> motivation dips, there are daily quests, monthly seasons, duels, boss fights and a
> collection of virtual gear to unlock. It's free, with no paywalls, built by one guitarist
> and funded by players on Buy Me a Coffee.

Skracaj albo rozwijaj pod odbiorcę (sekcja „Dopasuj do odbiorcy” niżej), ale trzymaj
kolejność: problem → pętla → co dostajesz → darmowe.

## Pętla, na której stoi cała apka

1. **Zagraj** — nawet 10 minut się liczy.
2. **Zapisz** — stoperem (Free Timer), ręcznie (Manual Log, do 7 dni wstecz) albo
   przechodząc ćwiczenie/rutynę/utwór w aplikacji. W tym momencie ruszają punkty, seria,
   umiejętności i zadania dnia.
3. **Wróć jutro** — seria (streak) mnoży wszystko, co logujesz: dzień 1 ×1.0, dzień 2 ×1.2,
   … od dnia 5 ×1.5. Opuszczony dzień zeruje serię, ale nigdy nie zabiera punktów, poziomu
   ani sprzętu.

Wszystko inne — rankingi, questy, Arsenal, bossy — jest nadbudową nad tą pętlą. Kiedy
tłumaczysz produkt, zaczynaj od niej, nie od listy funkcji.

## Pojęcia, które trzeba rozumieć

- **Punkty** to zapis pracy: ~22 pkt za godzinę ćwiczeń (× seria, + zdrowe nawyki).
  Wyznaczają poziom i miejsce w rankingach. Nie da się ich wydać.
- **Fame** to waluta do wydawania w Arsenale (skrzynki, gitary, efekty, części). Płaci za nią
  ćwiczenie, ale też questy, wyzwania, sezony i inni gracze (polubienia, zapisy playlist).
  Nie wpływa na poziom i **nie da się jej kupić za prawdziwe pieniądze**.
  Mylenie punktów z Fame to najczęstszy błąd — w tekstach rozdzielaj je zawsze.
- **Cztery kategorie**: Technique, Theory, Hearing, Creative work. Płacą tyle samo; podział
  istnieje po to, żeby gracz zobaczył, czego unika. Pod nie podpięte są 23 śledzone
  umiejętności (11 technicznych, po 4 w pozostałych).
- **Detekcja dźwięku jest opcjonalna.** Mikrofon lub interfejs audio mogą oceniać timing
  (a w ćwiczeniach z bendami — intonację), ale punkty biorą się z czasu, nie z celności.
  Wszystko działa bez podłączania czegokolwiek. Stanowisko apki: wynik z mikrofonu to druga
  opinia, „your ear is the judge”.

## Co jest w środku (skrót)

- **Ćwiczenie**: biblioteka 200+ ćwiczeń, 50+ gotowych rutyn, Auto Plan (sesja pod
  dostępny czas), Learning Path (36 kroków w dwóch modułach), Scale Map (9 rodzin skal),
  Mastery Roadmaps (osobista ścieżka 35–55 kroków), cele tempa na ćwiczeniu, Rotation,
  pliki Guitar Pro i edytor tabów, tryb Learn (tab czeka na każdą nutę).
- **Utwory**: tablica utworów, trudność oceniana przez społeczność, playlisty, poradniki
  „How to play…”.
- **Motywacja i rywalizacja**: 3 zadania dzienne, Weekly Milestones, miesięczne sezony
  i rankingi, Monthly Challenges (5 utworów z głosowania), anonimowe pojedynki 1v1 z ELO,
  Boss Fights (The Fretweaver, The Stone Colossus, The Changeling), ćwiczenie dnia.
- **Społeczność**: nagrania, gildie (50 zadań), czat, feed aktywności, Discord.
- **Arsenal**: kolekcjonerska gra za Fame — skrzynki, rzadkości od Common do Mythic,
  Workshop, Trader, Market, Guitar Builder, Rig Level.
- **Tone Studio**: wirtualny rig (amp sim, pedały, NAM; w desktopie także VST).
- **Aplikacja desktop** (Windows, macOS Apple Silicon, Linux): bezpośrednie wejście z
  interfejsu audio, niższa latencja. To samo konto i dane co w przeglądarce.

Pełna mapa — co jest czym, gdzie w apce, który artykuł wiki i który folder kodu —
jest w [references/feature-map.md](references/feature-map.md). Czytaj ją, gdy tekst ma
wchodzić w szczegóły jednej funkcji albo gdy wprowadzasz kogoś w repo.

## Fakty, których nie wolno przekręcić

Każdy z tych punktów był już kiedyś napisany źle — dlatego są tu wprost.

1. **Darmowe na zawsze, bez paywalli.** Utrzymanie z Buy Me a Coffee; wspierający
   głosują na to, co powstanie dalej (publiczna drabinka na /roadmap). W kodzie leżą
   martwe plany Pro/Master (Stripe, `PremiumGate`, flaga `premium` na ćwiczeniach), ale
   `userSlice` daje każdemu rolę `master`, więc nic nie jest zablokowane. Nie pisz
   o „darmowym planie”, „wersji Pro” ani „członkostwie”.
2. **Tylko prawdziwe liczby.** Hero landingu miało kiedyś zmyślone 145 000 godzin.
   Aktualne liczby są w `src/feature/landing/data/heroStats.ts` (generowane
   `npm run update-hero-stats`); stan 2026-10-29: ~3 980 graczy, ~18 600 sesji,
   ~10 500 godzin. Rozmiary katalogu podawaj jako dolną granicę („200+ exercises”),
   tak jak wiki. Jeśli liczba ma trafić do publikacji, sprawdź ją w pliku, nie w tym
   skillu — liczby rosną.
3. **To tracker z warstwą gry, nie gra rytmiczna.** Nie porównuj do Rocksmitha czy
   Yousiciana tak, jakby sednem był wynik z mikrofonu. Sednem jest zapisany czas
   i nawyk; detekcja to dodatek.
4. **Robi to jedna osoba.** „Built by a guitarist, for guitarists”, projekt z pasji,
   rozwijany pod feedback z Discorda. Nie wymyślaj zespołu, inwestorów ani firmy.
5. **Desktop nie ma wersji na Intel Mac**, a buildy nie są podpisane płatnym
   certyfikatem (SmartScreen / „right-click → Open” przy pierwszym uruchomieniu).
6. **Nazwy.** Publicznie: **riff.quest** (domena) albo **Riff Quest**. `CwiczymyRazem`
   („ćwiczymy razem”) to nazwa repo i projektu Firebase — nie używaj jej w tekstach dla
   graczy. Interfejs jest po angielsku, z tłumaczeniami pl/de/es.

## Dopasuj do odbiorcy

- **Gracz / ktoś, kto pierwszy raz słyszy o apce** — problem, pętla, „10 minut wystarczy”,
  „nic nie musisz podłączać”, darmowe. Ton jak w wiki (`src/content/wiki`): rzeczowo,
  bez żargonu, bez ścieżek URL i nazw pól. Zasady pisania wiki: `docs/WIKI.md`.
- **Nowa osoba w repo** — jedno zdanie o produkcie, potem pętla i punkty vs Fame (bo cała
  logika scoringu na tym stoi), potem odeślij do `CLAUDE.md` (stack, konwencje) i do
  feature-map po foldery. Wspomnij o pułapce z martwym kodem premium.
- **Media, twórcy, partnerzy** — pitch z akapitu, solo developer, darmowe, prawdziwe liczby
  z `heroStats.ts`, jedna-dwie wyróżniające funkcje dopasowane do odbiorcy (np. dla
  kanału o sprzęcie: Arsenal i Tone Studio; o nauce: Learning Path i roadmapy).
- **Opis dla wyszukiwarek / AI / katalogów** — zdania faktograficzne, encja na początku
  („riff.quest is a free guitar practice tracker…”), bez przymiotników typu
  „revolutionary”. Meta description ~150–160 znaków, z konkretem, nie parafraza tytułu.
- **Bio / krótki opis** (≤160 znaków) — one-liner z góry albo:
  *„Free guitar practice tracker that plays like a game: log sessions, keep a streak,
  climb the rankings.”*

Jeśli odbiorca nie jest jasny, zapytaj — długość i akcenty zależą od tego bardziej niż
od czegokolwiek innego.

## Źródła prawdy

- Treść dla graczy: `src/content/wiki/*.md` (EN; tłumaczenia w `pl/`, `de/`, `es/`) —
  najlepsze źródło, jak funkcja działa *z perspektywy gracza*. Liczby w wiki mogą odjechać
  od kodu; do sprawdzenia służy skill `wiki-audit`.
- Copy marketingowe: `src/pages/about.tsx`, `src/feature/landing/`, landingi
  `src/pages/features/*`, `public/locales/en/common.json` (`seo`).
- Stałe gry: punkty, seria i poziomy w `src/utils/gameLogic/`, odblokowania poziomem
  w `feature/levelGate/data/featureUnlocks.ts`, ceny i drop w `feature/arsenal/data/`.
  Gdy tekst podaje liczbę, znajdź ją tam.
