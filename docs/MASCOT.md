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
| Dłonie | dwie okrągłe rękawice bez ramion, w kolorze ciała; kształty: dłoń, pięść, palec wskazujący, „rock” (dwa palce w górze) |
| Rekwizyty | przedmiot trzymany w dłoni, gdy sam gest kółkiem nic nie mówi: tabliczka z ptaszkiem, lupa, mikrofon, wtyk jack z kablem, miecz, skrzynia (case z arsenału). Płaskie: kolor ciała, jego cień i cyjan na części, która niesie znaczenie |
| Fale dźwięku | cienkie cyjanowe okręgi — jedyny akcent: słuchanie, reakcje, mówienie |
| Cień | mały owal pod czubkiem, w kolorze ciała, 18% krycia |

Kostek nie ma buzi, ramion, nóg, policzków, cieniowania ani ubrań. Rekwizyty tylko z listy wyżej (nowy
najpierw tutaj) i najwyżej jeden naraz. Nie dokładamy iskierek, „z”,
znaków zapytania itp. Dłonie trzymamy **z boku albo poniżej ciała, nigdy przy górnych rogach głowy** —
okrągłe rękawice nad głową czytają się jak uszy.

## 3. Reguły rysunku

1. **Jeden kolor bryły** (`--mascot-fg`): złamana biel logo `#fbfbfa` na ciemnym tle, grafit
   `#18181b` w jasnym motywie (ustawione w `globals.css`). Na ciemnych powierzchniach jasnego motywu
   (`force-dark`: moment anime, wejście do sesji, baner wsparcia) wraca wersja z ciemnego motywu. Bez gradientów, obrysów i tekstur.
2. **Detale wycięte tłem.** Oczy to dziury w bryle, nie naklejone kształty — w każdym motywie
   i na każdej karcie widać przez nie to, co pod spodem.
3. **Cyjan tylko jako akcent** (fale dźwięku). Żadnego innego koloru na postaci.
4. **Jeden kształt ciała.** Stany zmieniają przechylenie, ściśnięcie, oczy i dłonie — nigdy obrys.
   Dłonie są sprężynami: dochodzą do pozy z lekkim opóźnieniem i dobiciem, więc ruchy się nakładają.
5. **Ikona 16–32 px** to osobny, uproszczony rysunek: `KostekFace` (kostka z wyciętymi oczami).
6. **Żadnych kostiumów** (czapki, okulary, wersje świąteczne) bez decyzji właściciela.

## 4. Seria

Seria w nagłówku to **płomień** (ikona `Flame`), nie Kostek: pomarańczowy, gdy seria żyje, szary, gdy
przerwana. Widżet serii na dashboardzie: Kostek nie śpi, dopóki seria trwa.

## 5. Nastroje (`mood`)

| Stan | Twarz i ciało | Efekt | Gdzie |
|---|---|---|---|
| `idle` | oczy-kreski, oddycha i lekko się kołysze, dłonie unoszą się; z `lively` zerka, macha, przeciąga się; `arrive` — wskakuje i macha | — | domyślnie, logowanie, podsumowanie, pasek odpowiedzi po słabszym przebiegu |
| `celebrate` | oczy-łuki, dwa podskoki, jedna dłoń „rock”, obie pompują | fale | po sesji, rekord, 3 gwiazdki, przerywnik w połowie planu po serii od 16 trafień |
| `hop` | jeden podskok, dłonie podrywają się | fala | rezerwowe |
| `levelUp` | przysiad, obrót w powietrzu, pięść i „rock” w górze | fale | nowy poziom |
| `approve` | oczy-łuki, podnosi tabliczkę z ptaszkiem i kiwa głową, co chwilę nią potrząsa | — | zaliczone ćwiczenie, koniec ćwiczenia (pasek odpowiedzi w sesji), przerywnik w połowie planu |
| `wave` | macha dłonią | — | pusty czat (powitanie), Home przed pierwszą sesją |
| `asleep` | zamknięte oczy, przechylony, dłonie opadłe | — | przerwana seria |
| `emptyCase` | trzyma skrzynię za rączkę, obraca ją do góry dnem, potrząsa — nic nie wypada — i wzrusza wolną dłonią | — | pusta kolekcja (arsenał) |
| `duel` | zmrużone oczy, miecz w górze, druga dłoń w pięść; jedno cięcie na wejście, potem garda | — | pojedynki: puste krzesło |
| `chill` | mocno odchylona w tył, oczy zamknięte w uśmiechu, dłonie puszczone nisko i szeroko, długi wolny oddech | — | dzień wolny, puste powiadomienia |
| `standby` | oczy w pół, przygaszona | — | rezerwowe |
| `wait` | stuka palcami, zerka w bok, wzdycha | — | pusty dziennik, szukanie przeciwnika |
| `ready` | zaciera dłonie, podryguje | — | onboarding (krok „graj”) |
| `focus` | zmrużone oczy, przysiad, pięści w gardzie | — | rezerwowe |
| `nudge` | wskazuje palcem w stronę `lookAt`, stuka nim | — | aktualizacja, blokada funkcji, kalendarz |
| `shrug` | dłonie do góry, wzrusza się | — | „za krótko”, pusta kolekcja |
| `dizzy` | spiralki, chwieje się, dłonie latają | — | przegrana z bossem |
| `lookAround` | lupa w dłoni: opuszcza ją, patrząc w lewo, i podnosi do oka, patrząc w prawo | — | brak wyników, ulubione, puste „moje ćwiczenia” i cele |
| `warmup` | oczy w pół, rozciera dłonie | wolne fale | rezerwowe |
| `unplugged` | smutne oczy, bez fal; trzyma wtyk z kablem, dźga nim w bok dwa razy i patrzy na niego | — | 404, konfiguracja wejścia bez sygnału |
| `micOff` | smutne oczy, bez fal; podnosi mikrofon, potrząsa nim i opuszcza | — | mikrofon zablokowany |
| `micReady` | otwarte oczy na gracza, wyprostowany; wyciąga mikrofon w jego stronę z lekkim podrygiem, chwilę trzyma i opuszcza | fala przy uniesieniu | prośba o dostęp do mikrofonu (pogodny odpowiednik `micOff`) |
| `plugIn` | mignięcie oczu, podskok z dłońmi w górze | fale | sygnał złapany |
| `error` | wstrząs, przewraca się na bok i osiada; spiralki, dłonie opadłe na ziemię, chwieje się oszołomiona | — | ekran awarii |
| `listen` | jedno wielkie ucho z boku głowy (dłoń zamienia się w ucho, cyjanowy zawijas w środku), pochylony w jego stronę; ucho strzyże, ciało pulsuje z sygnałem (`signal`) | fale wg sygnału | kalibracja, puste nagrania |
| `sad` | smutek | — | niezdany egzamin: ekran wyniku i podsumowanie sesji (bez celebracji i fanfar); przegrany pojedynek (remis i walkower bez wyniku zostają przy `idle`) |
| `surprised` / `think` | zaskoczenie (dłonie przy twarzy) / namysł (dłoń pod brodą) | — | rezerwowe |

Dodatkowo: `eyesClosed` (zasłania oczy dłońmi przy wpisywaniu hasła), `talking` (oczy pulsują w sylabach,
dłoń gestykuluje, słaba fala trzyma rytm), `lookAt` (kierunek wzroku i przechylenia), `short` (jeden podskok zamiast całej
radości), `arrive` (wskoczenie przy pojawieniu się, raz na zamontowanie), `cue` (każda zmiana wartości =
krótki podskok, np. przejście do następnego kroku).

Nowy stan najpierw trafia do tej tabeli, potem do kodu.

## 6. Ruch

- Warstwy: **poza** (sprężyna) → **oddech** (pętla) → **reakcja** (jednorazowa) → **twarz**.
- Ruchy przez kilka klatek kluczowych biegną po jednej gładkiej krzywej (`smoothMotion.ts`),
  bez zatrzymywania się na każdej klatce. Ruch jest **powściągliwy**: niskie podskoki, lekkie
  ściśnięcie, rzadkie akcje w spoczynku (co 4–7 s). Mniej znaczy dojrzalej.
- **Oczy się przekształcają, nie podmieniają.** Każdy wyraz to ten sam kształt (kapsuła o
  szerokości, wysokości, wygięciu i pochyleniu), więc kreska płynnie wygina się w łuk albo spłaszcza
  w linię. Żadnego przenikania przez przezroczystość; spiralka rozwija się z kropki.
- Pętle (oddech, mruganie, fale, akcje `lively`) działają **tylko, gdy Kostek jest na ekranie
  i karta jest na wierzchu.**
- **Wejście do sesji to przejście `feature/sessionEntry`**: po naciśnięciu przycisku ciemne, skośne pasy
  wjeżdżają z prawej, Kostek (`KostekStill`, bez dłoni) wlatuje i uderza czubkiem w sześć strun przez cały
  ekran, po czym wszystko zjeżdża w lewo i odsłania sesję. Pasy wjeżdżają na stronę, z której gracz
  wchodzi — zmiana trasy albo podmiana ekranu na sesję (`useSessionEntryGate`) czeka, aż ją zakryją.
  Pierwsze uderzenie jest zainscenizowane jak moment anime (§9): linie skupienia, pierścienie, smugi,
  rozrzut kostek i nut oraz dwa kolorowe powidoki Kostka (cyjan i bursztyn — to efekt sceny, nie kolor
  postaci). Kostek czuje każde uderzenie: przy zamachu mruży oczy, na uderzeniu zaciska je w kreski,
  podczas wybrzmienia przechodzą w łuki radości, a potem otwiera je (na chwilę szerzej) i wraca do
  skupienia. Twarze przełączają się twardym cięciem jak klatki anime — warstwy oczu nad ciałem
  (`KostekStill` z `part`/`face`), bez przenikania. Przy długim ładowaniu gra dalej, a pod strunami
  pojawia się lista kroków. Całość to animacje CSS samego transform/opacity (bez filtrów, masek i cieni),
  więc działa na kompozytorze i nie przycina, gdy strona parsuje nuty albo dekoduje dźwięk. Animowanego
  `Kostek` nie dawaj tam, gdzie główny wątek jest zajęty.
- Przy „ogranicz ruch”: tylko wyraz twarzy i poza, bez reakcji, pętli i efektów.

## 7. Gdzie wolno, gdzie nie

**Wolno:** puste stany, ekrany po graniu, seria, onboarding i kalibracja, logowanie, strony
błędów, ładowanie przed sesją, gra (boss, pojedynki, blokady), maile.

W onboardingu Kostek stoi nad krokami przez cały czas i zadaje pytania w dymku (`KostekSays`
z `heading`); przejście do kolejnego kroku to podskok (`cue`), zmiana miny i nowe pytanie wpisywane
w dymku — bez znikania i ponownego pojawiania się.

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
wygranych: nowy poziom, kamień milowy serii, egzamin na 3 gwiazdki, rekord z bossem, odebrana gitara
ze ścieżki. Zwykły koniec sesji dostaje wersję **spokojną** (`calm`): Kostek, tytuł i liczby na
przygaszonych liniach skupienia — bez wstrząsu, pierścieni, smug i rozrzutu — żeby pełny pokaz coś
znaczył, gdy się pojawia.

## 10. Maile

Ilustracje w `public/images/email/*.jpg` (1200 × 600) generuje
[`scripts/renderMascotEmailArt.tsx`](../scripts/renderMascotEmailArt.tsx) z prawdziwego
komponentu — po zmianie rysunku uruchom go ponownie (polecenie w nagłówku skryptu).
