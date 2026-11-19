# Maskotka: Echo

> Status: **w aplikacji** (od 2026-11-19). Źródło prawdy o rysunku to komponent
> [`src/components/Mascot/Echo.tsx`](../src/components/Mascot/Echo.tsx); wszystkie nastroje na żywo:
> `/dev/echo`, miejsca w aplikacji na przykładowych danych: `/dev/mascot-showcase`.
> Echo zastąpiła wcześniejszą maskotkę-wzmacniacz „Riff” — pliki w [docs/mascot/](mascot/) to
> szkice tamtej postaci, zostają jako historia.

Echo to ciemny kamyk w kolorze aplikacji z dwojgiem świecących oczu i jednym cyjanowym refleksem (styl „Noir”). Celowo bez buzi, rumieńców i naklejek — ma być spokojna i dorosła, nie dziecinna. Ten plik mówi, jak wygląda, jak się rusza, gdzie ją
pokazujemy i czego jej nie dorabiamy.

## 1. Kim jest

- Słuchacz. Echo słyszy, jak grasz: cieszy się z czystej gry, smuci przy pudle, śpi, gdy nie grasz.
- Ciepła i rzeczowa. Cieszy się głośno, ale krótko; nie błaga, nie zawstydza, nie obraża się.
- Mówi rzadko i jednym zdaniem (§8).

## 2. Budowa

Rysowana w układzie 100 × 98 (viewBox `10 18 100 98`). Dokładnie te części, żadnych nowych:

| Część | Rola |
|---|---|
| Ciało | jeden zaokrąglony kształt w grafitowym kolorze aplikacji, jeden ciemniejszy cień (prawy dół) |
| Refleks | cyjanowy łuk na lewej górnej krawędzi; gaśnie, gdy Echo jest „bez energii” (sen, dzień wolny, cisza) |
| Oczy | dwie świecące cyjanowe kreski; emocję niesie ich wysokość, pochylenie albo zamiana na łuki / linie / spiralki |
| Fale dźwięku | cienkie cyjanowe okręgi: słuchanie, reakcje, mówienie |

Echo nie ma buzi, rąk, nóg, policzków ani ubrań. Nie dokładamy iskierek, „z”, znaków zapytania itp.
Jedyny drugi kolor to złoty błysk refleksu przy awarii.

## 3. Reguły rysunku

1. **Płaskie kolory:** grafit ciała, ciemniejszy cień, cyjan oczu i refleksu, przygaszony cyjan
   oczu przy zmęczeniu. Bez gradientów, obrysów, tekstur i połysków.
2. **Światło = energia.** Oczy i refleks świecą, gdy Echo jest aktywna; przygasają, gdy nie.
3. **Jeden kształt ciała.** Stany zmieniają przechylenie, ściśnięcie i oczy — nigdy obrys ciała.
4. **Ikona 16–32 px** to osobny, uproszczony rysunek: `EchoFace` (ciało, refleks, oczy).
5. **Żadnych kostiumów** (czapki, okulary, wersje świąteczne) bez decyzji właściciela.

## 4. Seria

Ikona w nagłówku (`EchoFace`) to seria: **świecąca** — seria żyje, **ciemna, z zamkniętymi oczami** —
przerwana. Widżet serii na dashboardzie: Echo nie śpi, dopóki seria trwa.

## 5. Nastroje (`mood`)

| Stan | Twarz i ciało | Efekt | Gdzie |
|---|---|---|---|
| `idle` | oczy-kreski, ledwie oddycha, mruga; z `lively` rzadko zerka, przechyla się, puszcza falę | — | domyślnie, logowanie, podsumowanie |
| `celebrate` | oczy-łuki, dwa sprężyste podskoki | fale | po sesji, rekord, 3 gwiazdki |
| `hop` | jeden podskok, oczy-łuki | fala | zaliczone ćwiczenie |
| `levelUp` | przysiad, obrót w powietrzu | fale | nowy poziom |
| `asleep` | zamknięte oczy (przygaszone linie), refleks zgaszony, przechylona | — | przerwana seria, puste powiadomienia, puste krzesło |
| `standby` | oczy w pół, przygaszona | — | dzień wolny, pusty dziennik |
| `focus` | zmrużone oczy, przysiad, sprężyste kiwanie | — | boss, puste cele |
| `nudge` | przechylona w stronę `lookAt`, co chwilę zaczepia | — | zachęta do akcji obok |
| `shrug` | wzrok w bok, kołysze się | — | „za krótko”, pusta kolekcja |
| `dizzy` | spiralki zamiast oczu, chwieje się | — | przegrana z bossem |
| `lookAround` | wzrok i ciało na boki | — | brak wyników, szukanie, ulubione |
| `warmup` | światło powoli narasta i opada | wolne fale | ładowanie sesji |
| `unplugged` | smutne, pochylone oczy, refleks zgaszony, patrzy w dół | — | 404, brak mikrofonu |
| `plugIn` | światło zapala się z mignięciem, podskok | fale | sygnał złapany, moje ćwiczenia |
| `error` | spiralki, światło migocze, nerwowe drżenie | złoty błysk refleksu | ekran awarii |
| `listen` | wzrok w górę, pulsuje z sygnałem (`signal`) | fale wg sygnału | kalibracja, puste nagrania |
| `sad` / `surprised` / `think` | smutek / zaskoczenie / namysł | — | rezerwowe |

Dodatkowo: `eyesClosed` (zamknięte oczy przy wpisywaniu hasła), `talking` (oczy pulsują w sylabach,
słaba fala trzyma rytm), `lookAt` (kierunek wzroku i przechylenia), `short` (jeden podskok zamiast całej
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
