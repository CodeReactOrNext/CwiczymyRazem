# Maskotka: Riff

> Status: **w aplikacji** (od 2026-11-19). Źródło prawdy o rysunku to komponent
> [`src/components/Mascot/Riff.tsx`](../src/components/Mascot/Riff.tsx); wszystkie stany na żywo:
> `/dev/riff-moods`, wszystkie miejsca w aplikacji na przykładowych danych: `/dev/riff-showcase`.
> Pliki w [docs/mascot/](mascot/) to pierwsze szkice koncepcyjne — nieaktualne, zostają jako historia.

Riff to mały wzmacniacz combo z twarzą, rękami i ustami w maskownicy. Ten plik mówi, jak
wygląda, jak się rusza, gdzie go pokazujemy i czego mu nie dorabiamy.

## 1. Kim jest

- Sprzęt z charakterem: stoi obok gracza jak wzmacniacz na próbie. Gdy grasz — żyje, gdy nie
  grasz — stygnie.
- Ciepły i rzeczowy. Cieszy się głośno, ale krótko; nie błaga, nie zawstydza, nie obraża się.
- Mówi rzadko i jednym zdaniem (§9).

## 2. Budowa

Rysowany w układzie 200 × 175 (viewBox `0 18 200 175`), z lekką perspektywą 3/4: front i bok.

| Część | Rola |
|---|---|
| Obudowa (front + bok) | ciało; bok to ten sam prostokąt przesunięty w prawo |
| Złoty panel | twarz: oczy, dwie gałki, przełącznik, lampka, gniazdo jack |
| Oczy | dwa okręgi w granatowych oprawkach; lewe trochę większe (perspektywa) |
| Lampka (prawy dół panelu) | streak (§4) |
| Maskownica z głośnikiem | tkanina, stożek głośnika, **usta** wycięte w maskownicy |
| Plakietka „riff” | kremowa, lewy górny róg maskownicy |
| Metalowe narożniki | jedna nakładka odbita na cztery rogi |
| Rączka, nóżki | sylwetka |
| Kabel z wtyczką | wychodzi z gniazda, chowa się za obudowę, leży na podłodze |
| Ręce | dwa „makaronowe” ramiona z łokciem i kremowymi rękawiczkami |

Asymetrii panelu (oczy w lewo, gałki i lampka w prawo) nie „poprawiamy”.

## 3. Reguły rysunku

1. **Płaskie kolory, jeden kierunek światła (lewa góra).** Każda płaszczyzna ma 2–3 tony:
   jasny pas od światła, kolor bazowy, ciemny pas od dołu i od strony boku. Cienie rzucane
   (panel na obudowę, gałki i oczodoły na panel, panel na maskownicę) jako płaskie kształty
   z przezroczystością. **Bez gradientów, tekstur i obrysów.**
2. **Jedna grubość kremowej linii** (`LINE` = 2,4): lamówka, usta, zamknięte oczy, efekty.
3. **Geometria na kilku promieniach:** obudowa 14, maskownica 8, panel 6, plakietka 5.
   Wszystko symetryczne względem środka frontu (x = 95,5).
4. **Ręce bez obrysu**, cieniowane jak obudowa (ciemniejsza kopia wystaje z prawej dołu).
   Ręka, która jest przed obudową, rysuje się nad nią; zwisająca — za nią (liczone samo).
5. **Paleta zamknięta:** grafit obudowy, złoty panel, granat, krem, pomarańcz lampki, metal.
   Nowy kolor tylko dla efektu nastroju (§5) i tylko z palety aplikacji.
6. **Mały Riff (poniżej ~96 px wysokości) przełącza się sam na wersję uproszczoną:** bez pasów
   światła, cieni gałek, napisu „riff” i cienia narożników; ręce grubsze i jaśniejsze.
7. **Sama twarz 16–32 px** to osobny rysunek: `RiffFace` (nagłówek ze streakiem).
8. **Żadnych kostiumów** (czapki, okulary, wersje świąteczne) bez decyzji właściciela.

## 4. Lampka = streak

- **świeci i delikatnie „oddycha” poświatą** — streak żyje,
- **przygaszona** — dzień wolny / rozgrzewka,
- **zgaszona** — streak przerwany, Riff śpi.

Lampka mruga tylko w reakcji (przebudzenie, podłączenie, awaria), nigdy dla ozdoby.

## 5. Stany (`mood`)

| Stan | Poza i ręce | Efekt | Gdzie |
|---|---|---|---|
| `idle` | stoi, ręce luźno, kołysanie | — | domyślnie; z `lively` drobne akcje co 2–4 s |
| `celebrate` | podskoki, ręce w górę, potem macha | rozbłysk, fale dźwięku | po sesji, rekord, 3 gwiazdki |
| `hop` | jeden podskok, ręce w górę | fala dźwięku | zaliczone ćwiczenie |
| `levelUp` | napina bicepsy, gałki „do 11”, pięści w górę | rozbłysk | nowy poziom |
| `asleep` | zgarbiony, ręce zwisają, oczy zamknięte | „Zzz” | przerwany streak, puste powiadomienia, puste krzesło w pojedynkach |
| `standby` | przygaszony, ręce nisko | — | dzień wolny, pusty dziennik |
| `focus` | przykucnięty, gardą jak bokser, co chwilę cios | — | boss, puste cele |
| `nudge` | wychylony, wskazuje ręką (`lookAt`), druga na biodrze | „!” | zachęta do akcji obok |
| `shrug` | dłonie do góry, wzrusza ramionami | „?” | „za krótko”, pusta kolekcja |
| `dizzy` | chwieje się, ręce latają | gwiazdki nad głową | przegrana z bossem |
| `lookAround` | ręka nad oczami, rozgląda się | — | brak wyników, szukanie, ulubione |
| `warmup` | rozciera boki | para nad lampami | ładowanie sesji |
| `unplugged` | pochylony nad kablem, drapie się po głowie | „?” | 404, brak mikrofonu |
| `plugIn` | sam wpycha wtyczkę, potem ręce w górę | lampka zapala się | sygnał znaleziony, moje ćwiczenia |
| `error` | panika, ręce w górę | dym i iskry, migająca lampka | ekran awarii |
| `listen` | ręce zgięte, podskakuje z sygnałem | — | kalibracja, puste nagrania |

Dodatkowo: `eyesClosed` (zasłania twarz dłońmi — przy wpisywaniu hasła), `talking`
(usta w sylabach, gestykulacja), `lookAt` (kierunek wzroku i wskazywania).

Nowy stan najpierw trafia do tej tabeli, potem do kodu. Riff nie płacze i się nie złości.

## 6. Ruch

- Warstwy: **poza** (sprężyna) → **oddech** (pętla) → **reakcja** (jednorazowa) → **ręce** →
  **twarz**. Reakcje nie walczą z pozą.
- Wszystkie ruchy z wygładzaniem używają jednej krzywej (`EASE`).
- Pętle (oddech, kołysanie rąk, poświata lampy, „Zzz”, mruganie, akcje `lively`) działają
  **tylko, gdy Riff jest na ekranie i karta jest na wierzchu.**
- Przy „ogranicz ruch”: tylko poza i twarz, bez reakcji, pętli i efektów; tekst w dymku od razu.

## 7. Gdzie wolno, gdzie nie

**Wolno:** puste stany, ekrany po graniu, streak, onboarding i kalibracja, logowanie,
strony błędów, ładowanie przed sesją, gra (boss, pojedynki, blokady), maile.

**Nie wolno:**

- w trakcie grania (sesja, tabulatura, strojenie),
- w nawigacji, na przyciskach, w wierszach list i tabel,
- więcej niż jeden Riff na ekranie (wyjątek: moment anime przechodzący w kartę pod spodem),
- nad treścią — nigdy niczego nie zasłania.

Jeśli po usunięciu Riffa ekran nic nie traci — nie dodawaj go. Nie wszystkie puste stany
mają ten sam nastrój: dobieraj go do tego, co ekran mówi (§5).

## 8. Moment anime

Pełnoekranowy przerywnik (`components/AnimeMoment`) tylko dla dużych wygranych:
koniec sesji, nowy poziom, kamień milowy serii, egzamin na 3 gwiazdki, nowy rekord z bossem,
odebrana gitara ze ścieżki. Gra sam i sam przechodzi dalej (klik / Enter / Esc pomija).
Po sesji pełna wersja raz dziennie, kolejne sesje tego dnia — krótsza (`brief`).
Nie dodawaj go do rzeczy, które zdarzają się wiele razy w ciągu sesji.

## 9. Głos

- Odzywa się rzadko (`RiffSays`) i jednym krótkim zdaniem. Większość czasu milczy.
- Mówi o graniu, nie o sobie i nie o winie gracza: „Lampy zimne. Pięć minut wystarczy.”,
  nie „Tęskniłem! Nie zawiedź mnie!”.
- Bez emoji i wielkich liter dla emfazy. Teksty przez `useTranslation`.

## 10. Maile

Ilustracje w `public/images/email/*.jpg` (1200 × 600) generuje skrypt
[`scripts/renderRiffEmailArt.tsx`](../scripts/renderRiffEmailArt.tsx) z prawdziwego komponentu —
po zmianie rysunku uruchom go ponownie (polecenie w nagłówku skryptu).

## 11. Czego nie robić, żeby nie wyglądał „jak z AI”

- Nie generuj wariantów modelem obrazu i nie wstawiaj rastrów do aplikacji.
- Nie dodawaj detali „dla uroku”: połysków, tekstur, aur, drobnych śrubek. Każdy detal musi
  być widoczny w rozmiarze, w którym Riff się pokazuje.
- Nie mieszaj stylów: bez obrysów na jednych częściach i bez obrysu na innych, bez gradientów
  obok płaskich kolorów.
- Nie pokazuj go wszędzie i nie w tej samej pozie wszędzie.
