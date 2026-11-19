# Maskotka: Echo

> Status: **w aplikacji** (od 2026-11-19). Źródło prawdy o rysunku to komponent
> [`src/components/Mascot/Echo.tsx`](../src/components/Mascot/Echo.tsx); wszystkie nastroje na żywo:
> `/dev/echo`, miejsca w aplikacji na przykładowych danych: `/dev/mascot-showcase`.
> Echo zastąpiła wcześniejszą maskotkę-wzmacniacz „Riff” — pliki w [docs/mascot/](mascot/) to
> szkice tamtej postaci, zostają jako historia.

Echo to ciemny kamyk w kolorze aplikacji z dwojgiem świecących oczu, jednym cyjanowym refleksem i dwiema małymi „pływającymi” dłońmi (styl „Noir”). Celowo bez buzi, rumieńców i naklejek — ma być spokojna i dorosła, nie dziecinna. Ten plik mówi, jak wygląda, jak się rusza, gdzie ją
pokazujemy i czego jej nie dorabiamy.

## 1. Kim jest

- Słuchacz. Echo słyszy, jak grasz: cieszy się z czystej gry, smuci przy pudle, śpi, gdy nie grasz.
- Ciepła i rzeczowa. Cieszy się głośno, ale krótko; nie błaga, nie zawstydza, nie obraża się.
- Mówi rzadko i jednym zdaniem (§8).

## 2. Budowa

Rysowana w układzie 112 × 98 (viewBox `4 18 112 98`, z miejscem na dłonie). Dokładnie te części, żadnych nowych:

| Część | Rola |
|---|---|
| Ciało | jeden zaokrąglony kształt w grafitowym kolorze aplikacji, jeden ciemniejszy cień (prawy dół) |
| Refleks | cyjanowy łuk na lewej górnej krawędzi; gaśnie, gdy Echo jest „bez energii” (sen, dzień wolny, cisza) |
| Oczy | dwie świecące cyjanowe kreski; emocję niesie ich wysokość, pochylenie albo zamiana na łuki / linie / spiralki |
| Dłonie | dwie małe rękawice bez ramion, w kolorze ciała; kształty: dłoń, pięść, palec wskazujący, kciuk w górę |
| Fale dźwięku | cienkie cyjanowe okręgi: słuchanie, reakcje, mówienie |

Echo nie ma buzi, ramion, nóg, policzków ani ubrań. Nie dokładamy iskierek, „z”, znaków zapytania itp.
Jedyny drugi kolor to złoty błysk refleksu przy awarii.

## 3. Reguły rysunku

1. **Płaskie kolory:** grafit ciała, ciemniejszy cień, cyjan oczu i refleksu, przygaszony cyjan
   oczu przy zmęczeniu. Bez gradientów, obrysów, tekstur i połysków.
2. **Światło = energia.** Oczy i refleks świecą, gdy Echo jest aktywna; przygasają, gdy nie.
3. **Jeden kształt ciała.** Stany zmieniają przechylenie, ściśnięcie, oczy i dłonie — nigdy obrys ciała.
   Dłonie są sprężynami: dochodzą do pozy z lekkim opóźnieniem i dobiciem, więc każdy ruch się nakłada.
4. **Ikona 16–32 px** to osobny, uproszczony rysunek: `EchoFace` (ciało, refleks, oczy).
5. **Żadnych kostiumów** (czapki, okulary, wersje świąteczne) bez decyzji właściciela.

## 4. Seria

Ikona w nagłówku (`EchoFace`) to seria: **świecąca** — seria żyje, **ciemna, z zamkniętymi oczami** —
przerwana. Widżet serii na dashboardzie: Echo nie śpi, dopóki seria trwa.

## 5. Nastroje (`mood`)

| Stan | Twarz i ciało | Efekt | Gdzie |
|---|---|---|---|
| `idle` | oczy-kreski, oddycha i lekko się kołysze, dłonie unoszą się; z `lively` zerka, macha, przeciąga się; `arrive` — wskakuje i macha | — | domyślnie, logowanie, podsumowanie |
| `celebrate` | oczy-łuki, dwa podskoki, dłonie w górze pompują na zmianę | fale | po sesji, rekord, 3 gwiazdki |
| `hop` | jeden podskok, dłonie podrywają się | fala | rezerwowe |
| `levelUp` | przysiad, obrót w powietrzu, pięści w górę | fale | nowy poziom |
| `approve` | oczy-łuki, kciuk w górę z kiwnięciem | — | zaliczone ćwiczenie, koniec ćwiczenia |
| `wave` | macha dłonią | — | pusty czat (powitanie) |
| `asleep` | zamknięte oczy, refleks zgaszony, dłonie opadłe | — | przerwana seria, puste krzesło |
| `chill` | zadowolone oczy, odchylona, dłonie za głową | — | dzień wolny, puste powiadomienia |
| `standby` | oczy w pół, przygaszona | — | rezerwowe |
| `wait` | stuka palcami, zerka w bok, wzdycha | — | pusty dziennik, szukanie przeciwnika |
| `ready` | zaciera dłonie, podryguje | — | puste cele, moje ćwiczenia |
| `focus` | zmrużone oczy, przysiad, pięści w gardzie | — | boss |
| `nudge` | wskazuje palcem w stronę `lookAt`, stuka nim | — | aktualizacja, blokada funkcji, kalendarz |
| `shrug` | dłonie do góry, wzrusza się | — | „za krótko”, pusta kolekcja |
| `dizzy` | spiralki, chwieje się, dłonie latają | — | przegrana z bossem |
| `lookAround` | dłoń nad oczami, wzrok i ciało na boki | — | brak wyników, ulubione |
| `warmup` | światło narasta i opada, rozciera dłonie | wolne fale | ładowanie sesji |
| `unplugged` | smutne oczy, refleks zgaszony, drapie się po głowie | — | 404, brak mikrofonu |
| `plugIn` | światło zapala się, podskok z dłońmi w górze | fale | sygnał złapany |
| `error` | spiralki, łapie się za głowę, światło migocze | złoty błysk refleksu | ekran awarii |
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
- Pętle (oddech, mruganie, fale, akcje `lively`) działają **tylko, gdy Echo jest na ekranie
  i karta jest na wierzchu.**
- Przy „ogranicz ruch”: tylko wyraz twarzy i poza, bez reakcji, pętli i efektów.

## 7. Gdzie wolno, gdzie nie

**Wolno:** puste stany, ekrany po graniu, seria, onboarding i kalibracja, logowanie, strony
błędów, ładowanie przed sesją, gra (boss, pojedynki, blokady), maile.

**Nie wolno:** w trakcie grania (sesja, tabulatura, strojenie); w nawigacji, na przyciskach,
w wierszach list; więcej niż jedna Echo na ekranie (wyjątek: moment anime przechodzący w kartę
pod spodem); nad treścią.

Jeśli po usunięciu Echo ekran nic nie traci — nie dodawaj jej. Dobieraj nastrój do tego, co
ekran mówi (§5); nie wszędzie ta sama poza.

## 8. Głos

- Odzywa się rzadko (`EchoSays`) i jednym krótkim zdaniem. Większość czasu milczy.
- Mówi o graniu, nie o sobie i nie o winie gracza: „Cisza. Pięć minut wystarczy.”,
  nie „Tęskniłam! Nie zawiedź mnie!”.
- Bez emoji i wielkich liter dla emfazy. Teksty przez `useTranslation`.

## 9. Moment anime

Pełnoekranowy przerywnik (`components/AnimeMoment`) z Echo w roli głównej, tylko dla dużych
wygranych: koniec sesji (pełny raz dziennie, potem krótszy), nowy poziom, kamień milowy serii,
egzamin na 3 gwiazdki, rekord z bossem, odebrana gitara ze ścieżki.

## 10. Maile

Ilustracje w `public/images/email/*.jpg` (1200 × 600) generuje
[`scripts/renderMascotEmailArt.tsx`](../scripts/renderMascotEmailArt.tsx) z prawdziwego
komponentu — po zmianie rysunku uruchom go ponownie (polecenie w nagłówku skryptu).
