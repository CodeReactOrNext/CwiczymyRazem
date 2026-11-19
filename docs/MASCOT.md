# Maskotka: Kostek

> Status: **w aplikacji** (od 2026-11-19). Źródło prawdy o rysunku to komponent
> [`src/components/Mascot/Kostek.tsx`](../src/components/Mascot/Kostek.tsx); wszystkie nastroje na żywo:
> `/dev/kostek`, miejsca w aplikacji na przykładowych danych: `/dev/mascot-showcase`.
> Wcześniej były tu maskotka-wzmacniacz „Riff” i kulka „Echo” — pliki w [docs/mascot/](mascot/) to
> szkice Riffa, zostają jako historia.

Kostek to maskotka Riff Quest **w stylu logo**: płaska biała bryła w kształcie kostki do gitary,
detale wycięte tłem, cyjan `#22d3ee` jako jedyny akcent, mimika tylko w oczach. Dwie okrągłe
„pływające” dłonie robią gesty. Ten plik mówi, jak wygląda, jak się rusza, gdzie go pokazujemy
i czego mu nie dorabiamy.

## 1. Kim jest

- Słuchacz. Kostek słyszy, jak grasz: cieszy się z czystej gry, smuci przy pudle, śpi, gdy nie grasz.
- Ciepły i rzeczowy. Cieszy się krótko; nie błaga, nie zawstydza, nie obraża się.
- Mówi rzadko i jednym zdaniem (§8).

## 2. Budowa

Rysowany w układzie 112 × 110 (viewBox `4 16 112 110`, z miejscem na dłonie). Dokładnie te części:

| Część | Rola |
|---|---|
| Ciało | kostka do gitary: szeroka i okrągła u góry, zwęża się do miękkiego czubka; jeden płaski kolor |
| Oczy | dwie wąskie pionowe szczeliny **wycięte** w ciele (maska — widać przez nie tło); emocję niesie ich wysokość, pochylenie albo zamiana na łuki / linię / spiralki |
| Dłonie | dwie okrągłe rękawice bez ramion, w kolorze ciała; kształty: dłoń, pięść, palec wskazujący, kciuk w górę, „rock” (dwa palce w górze) |
| Fale dźwięku | cienkie cyjanowe okręgi — jedyny akcent: słuchanie, reakcje, mówienie |
| Cień | mały owal pod czubkiem, w kolorze ciała, 18% krycia |

Kostek nie ma buzi, ramion, nóg, policzków, cieniowania ani ubrań. Nie dokładamy iskierek, „z”,
znaków zapytania itp.

## 3. Reguły rysunku

1. **Jeden kolor bryły** (`--mascot-fg`): złamana biel logo `#fbfbfa` na ciemnym tle, grafit
   `#18181b` w jasnym motywie (ustawione w `globals.css`). Bez gradientów, obrysów i tekstur.
2. **Detale wycięte tłem.** Oczy to dziury w bryle, nie naklejone kształty — w każdym motywie
   i na każdej karcie widać przez nie to, co pod spodem.
3. **Cyjan tylko jako akcent** (fale dźwięku). Żadnego innego koloru na postaci.
4. **Jeden kształt ciała.** Stany zmieniają przechylenie, ściśnięcie, oczy i dłonie — nigdy obrys.
   Dłonie są sprężynami: dochodzą do pozy z lekkim opóźnieniem i dobiciem, więc ruchy się nakładają.
5. **Ikona 16–32 px** to osobny, uproszczony rysunek: `KostekFace` (kostka z wyciętymi oczami).
6. **Żadnych kostiumów** (czapki, okulary, wersje świąteczne) bez decyzji właściciela.

## 4. Seria

Ikona w nagłówku (`KostekFace`) to seria: **pełna** — seria żyje, **przygaszona, z zamkniętymi oczami** —
przerwana. Widżet serii na dashboardzie: Kostek nie śpi, dopóki seria trwa.

## 5. Nastroje (`mood`)

| Stan | Twarz i ciało | Efekt | Gdzie |
|---|---|---|---|
| `idle` | oczy-kreski, oddycha i lekko się kołysze, dłonie unoszą się; z `lively` zerka, macha, przeciąga się; `arrive` — wskakuje i macha | — | domyślnie, logowanie, podsumowanie |
| `celebrate` | oczy-łuki, dwa podskoki, jedna dłoń „rock”, obie pompują | fale | po sesji, rekord, 3 gwiazdki |
| `hop` | jeden podskok, dłonie podrywają się | fala | rezerwowe |
| `levelUp` | przysiad, obrót w powietrzu, pięść i „rock” w górze | fale | nowy poziom |
| `approve` | oczy-łuki, kciuk w górę z kiwnięciem | — | zaliczone ćwiczenie, koniec ćwiczenia |
| `wave` | macha dłonią | — | pusty czat (powitanie) |
| `asleep` | zamknięte oczy, przechylony, dłonie opadłe | — | przerwana seria, puste krzesło |
| `chill` | zadowolone oczy, odchylona, dłonie za głową | — | dzień wolny, puste powiadomienia |
| `standby` | oczy w pół, przygaszona | — | rezerwowe |
| `wait` | stuka palcami, zerka w bok, wzdycha | — | pusty dziennik, szukanie przeciwnika |
| `ready` | zaciera dłonie, podryguje | — | puste cele, moje ćwiczenia |
| `focus` | zmrużone oczy, przysiad, pięści w gardzie | — | boss |
| `nudge` | wskazuje palcem w stronę `lookAt`, stuka nim | — | aktualizacja, blokada funkcji, kalendarz |
| `shrug` | dłonie do góry, wzrusza się | — | „za krótko”, pusta kolekcja |
| `dizzy` | spiralki, chwieje się, dłonie latają | — | przegrana z bossem |
| `lookAround` | dłoń nad oczami, wzrok i ciało na boki | — | brak wyników, ulubione |
| `warmup` | oczy w pół, rozciera dłonie | wolne fale | ładowanie sesji |
| `unplugged` | smutne oczy, bez fal, drapie się po głowie | — | 404, brak mikrofonu |
| `plugIn` | mignięcie oczu, podskok z dłońmi w górze | fale | sygnał złapany |
| `error` | spiralki, łapie się za głowę, oczy migoczą | — | ekran awarii |
| `listen` | dłoń przy „uchu”, pulsuje z sygnałem (`signal`) | fale wg sygnału | kalibracja, puste nagrania |
| `sad` / `surprised` / `think` | smutek / zaskoczenie (dłonie przy twarzy) / namysł (dłoń pod brodą) | — | rezerwowe |

Dodatkowo: `eyesClosed` (zasłania oczy dłońmi przy wpisywaniu hasła), `talking` (oczy pulsują w sylabach,
dłoń gestykuluje, słaba fala trzyma rytm), `lookAt` (kierunek wzroku i przechylenia), `short` (jeden podskok zamiast całej
radości), `arrive` (wskoczenie przy pojawieniu się).

Nowy stan najpierw trafia do tej tabeli, potem do kodu.

## 6. Ruch

- Warstwy: **poza** (sprężyna) → **oddech** (pętla) → **reakcja** (jednorazowa) → **twarz**.
- Ruchy przez kilka klatek kluczowych biegną po jednej gładkiej krzywej (`smoothMotion.ts`),
  bez zatrzymywania się na każdej klatce. Ruch jest **powściągliwy**: niskie podskoki, lekkie
  ściśnięcie, rzadkie akcje w spoczynku (co 4–7 s). Mniej znaczy dojrzalej.
- Pętle (oddech, mruganie, fale, akcje `lively`) działają **tylko, gdy Kostek jest na ekranie
  i karta jest na wierzchu.**
- Przy „ogranicz ruch”: tylko wyraz twarzy i poza, bez reakcji, pętli i efektów.

## 7. Gdzie wolno, gdzie nie

**Wolno:** puste stany, ekrany po graniu, seria, onboarding i kalibracja, logowanie, strony
błędów, ładowanie przed sesją, gra (boss, pojedynki, blokady), maile.

**Nie wolno:** w trakcie grania (sesja, tabulatura, strojenie); w nawigacji, na przyciskach,
w wierszach list; więcej niż jedna Kostek na ekranie (wyjątek: moment anime przechodzący w kartę
pod spodem); nad treścią.

Jeśli po usunięciu Kostek ekran nic nie traci — nie dodawaj jej. Dobieraj nastrój do tego, co
ekran mówi (§5); nie wszędzie ta sama poza.

## 8. Głos

- Odzywa się rzadko (`KostekSays`) i jednym krótkim zdaniem. Większość czasu milczy.
- Mówi o graniu, nie o sobie i nie o winie gracza: „Cisza. Pięć minut wystarczy.”,
  nie „Tęskniłam! Nie zawiedź mnie!”.
- Bez emoji i wielkich liter dla emfazy. Teksty przez `useTranslation`.

## 9. Moment anime

Pełnoekranowy przerywnik (`components/AnimeMoment`) z Kostek w roli głównej, tylko dla dużych
wygranych: koniec sesji (pełny raz dziennie, potem krótszy), nowy poziom, kamień milowy serii,
egzamin na 3 gwiazdki, rekord z bossem, odebrana gitara ze ścieżki.

## 10. Maile

Ilustracje w `public/images/email/*.jpg` (1200 × 600) generuje
[`scripts/renderMascotEmailArt.tsx`](../scripts/renderMascotEmailArt.tsx) z prawdziwego
komponentu — po zmianie rysunku uruchom go ponownie (polecenie w nagłówku skryptu).
