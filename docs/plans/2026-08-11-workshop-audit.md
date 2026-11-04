# Audyt modułu Workshop (scrap → parts → repair / build / mod)

**Data:** 2026-08-11
**Zakres:** `src/feature/arsenal/**` (Workshop, Parts, dane `workshop.ts` / `scrapYield.ts` /
`partSupply.ts` / `itemStats.ts`), `src/pages/api/arsenal/workshop/*`, `scrap-guitar.ts`,
`scrap-effect.ts` oraz punkty styku: `ArsenalView`, `firestore.rules`, wiki.
**Status:** audyt — **żadnej zmiany w kodzie modułu** (issue #779 wprost o to prosi).
Ten plik to jedyna zmiana w repo.

Każde znalezisko ma id (`W-xx`), priorytet, miejsce w kodzie i propozycję. Liczby w sekcji
o ekonomii nie są „na oko" — policzone zostały bezpośrednio z produkcyjnych tabel
(`getBuildRecipeParts`, `getRepairQuote`, `getPartSupply`, `RARITY_BUILD_GAIN`) tymczasowym
skryptem, który po zebraniu wyników usunięto.

Priorytety: **P0** = błąd/eksploit, naprawić przed dalszym rozwojem · **P1** = mocno psuje
odbiór lub balans · **P2** = wyraźna poprawa · **P3** = kosmetyka / dług.

---

## 1. Mapa modułu — jak to dziś działa

```
Collection ──(scrap)──►  arsenal.parts  ──►  Workshop ──► repair / build / mod
  GuitarCard              (portfel)            WorkshopTab
  EffectCard                                     ├── WorkshopRack   (wybór itemu)
  ScrapConfirmDialog                             └── WorkshopBench  (3 × JobCard)
  api/arsenal/scrap-guitar                            └── WorkshopJobModal
  api/arsenal/scrap-effect                                 ├── RewardPanel + GateRow
                                                           ├── CostList / BuildLadder
                                                           └── ModPicker → WorkshopResultView
```

Warstwa danych (`data/workshop.ts`, 980 linii) jest w całości deterministyczna i współdzielona
klient ↔ API: klient wysyła tylko `itemId`, a route liczy ten sam kosztorys jeszcze raz
w transakcji Firestore. To dobry, świadomy wybór i **największa zaleta tego modułu** — warto go
utrzymać przy każdej kolejnej zmianie.

Co jeszcze jest zrobione dobrze (żeby audyt nie brzmiał jak sama lista skarg):

- recepty są stałe i wyprowadzone z BOM-u przedmiotu — da się je planować, a `BuildLadder`
  pokazuje całą ścieżkę, nie tylko następny krok;
- `partSupply.ts` (ranking części po realnej podaży z tabel dropów) to bardzo dobry pomysł —
  sam się rebalansuje po dodaniu nowej gitary;
- komentarze w `workshop.ts` / `scrapYield.ts` tłumaczą *dlaczego*, nie *co*;
- `data/workshop.test.ts` (738 linii) pokrywa warstwę danych naprawdę porządnie.

---

## 2. P0 — bezpieczeństwo i poprawność danych

### W-01 · Reguły Firestore unieważniają cały serwerowy anty-cheat (P0)

`firestore.rules:12-18` pozwala zalogowanemu użytkownikowi zapisać **dowolne** pole własnego
dokumentu poza `role` / `stripe*` / `premiumUntil`. To znaczy, że z konsoli przeglądarki
(klient ma zainicjalizowany Firebase SDK) można ustawić:

- `arsenal.parts` — dowolny portfel części, łącznie z Unique,
- `arsenal.inventory[].buildLevel` → `getEffectiveRarity` policzy z tego Custom Shop,
- `arsenal.inventory[].features[].points`, `arsenal.inventory[].condition`,
- `rigLevel` i `statistics.fame` — czyli pozycję w rankingu gearowym wprost.

Cała argumentacja z docstringów („the client only says *which* item, never what it should cost",
„Server-side only — the client never rolls") broni się tylko przed manipulacją **requestem**;
nie broni przed zapisem z pominięciem API. Dla modułu, który zasila leaderboard, to problem
numer jeden.

**Propozycja:** zawęzić `allow write` na `/users/{userId}` — pola zapisywane wyłącznie przez
Admin SDK: `arsenal.*`, `rigLevel`, `statistics.fame`. Realnie oznacza to przeniesienie
pozostałych klienckich zapisów fame (`playlists.service.ts`, `rewardService.ts`,
`gettingStartedQuest.service.ts`, `toggleLikeRecording.ts`, …) na route'y API — to osobny,
większy ticket, ale bez niego reszta tego audytu dotyczy gry, w którą i tak można oszukiwać.

> ⚠️ Zmiana `firestore.rules` wymaga świadomej akceptacji właściciela (patrz CLAUDE.md) —
> dlatego **nie ruszam ich w tym PR**, tylko zgłaszam.

### W-02 · `scrap-guitar` / `scrap-effect` nie są transakcyjne — gubią części (P0)

`src/pages/api/arsenal/scrap-guitar.ts:36-91` (i bliźniaczy `scrap-effect.ts:36-80`) robią
`userRef.get()` → obliczenia → `userRef.update()` **poza transakcją**, podczas gdy
`workshop/build|repair|mod` operują na tym samym polu `arsenal.parts` w `runTransaction`.

Skutek: dwa równoległe requesty (dwie karty przeglądarki, podwójny klik po timeoucie, scrap
w trakcie builda) nadpisują sobie portfel — część łupu znika albo, gorzej, wraca część już
wydana na build. To samo dotyczy `sell-guitar`, `sell-guitars-bulk`, `sell-effect(s)-bulk`,
`equip-guitar`, `update-rig`, `update-pedalboard`.

**Propozycja:** przenieść te route'y na `firestore.runTransaction` (wzorzec jest już
w `workshop/build.ts`), a najlepiej wyciągnąć wspólny helper `withUserTransaction(userId, fn)` —
osiem route'ów powtarza dziś identyczne ~40 linii bootstrapu (auth → ref → get → dane → update).

### W-03 · Fame w Redux nie jest odświeżany po pracy w warsztacie (P0/P1)

`ArsenalView.tsx:37-38` bierze fame z `selectCurrentUserStats` (Redux — legacy store).
`useOpenCase.ts:19` i `useBuyTraderOffer.ts:19` po mutacji robią `dispatch(deductFame(...))`.
**Trzy hooki warsztatu tego nie robią** (`useWorkshopBuild/Repair/Mod`), a build pobiera
`getBuildFameCost(level)` po stronie serwera.

Skutek: po każdym buildzie licznik Fame w headerze i bramka `fame` w `getBuildQuote` pokazują
wartość sprzed operacji. Gracz widzi „gotowe do budowy", klika i dostaje 400
(*Not enough Fame*) — bez oczywistego powodu, aż do przeładowania strony.

**Propozycja:** `useWorkshopBuild.onSuccess` → `dispatch(deductFame(...))` (route już liczy
`newFame`, wystarczy zwrócić też pobraną kwotę). Docelowo: fame w React Query zamiast Reduxa,
ale to szerszy refactor.

### W-04 · Fałszywy pusty stan podczas ładowania (P0, trywialna naprawa)

`ArsenalView.tsx:174-178` renderuje `<WorkshopTab data={data} />` **bez** guardu `isLoading`,
którego używają zakładki Collection i Dex. Zanim `useArsenalData` się rozstrzygnie,
`getWorkshopEntries(undefined)` zwraca `[]`, więc gracz z pełnym magazynem widzi komunikat
*„Open a case first"*. Przy wolnym łączu to pierwsze, co zobaczy po wejściu w Workshop.

**Propozycja:** ten sam `isLoading ? <Skeleton/>` co w pozostałych zakładkach; docelowo
skeleton racka + ławy, nie pojedynczy prostokąt.

### W-05 · `subtractParts` po cichu nie nalicza brakujących linii (P1)

`data/workshop.ts:353-365`: `const row = remaining.find(...); if (row) row.qty -= part.qty;` —
gdy wiersza nie ma, koszt **nie jest pobierany**, a job i tak się wykonuje. Dziś chroni to
transakcja (kosztorys liczony jest z tego samego portfela), ale to jedyna linia obrony i nic
o niej nie krzyczy.

**Propozycja:** rzucać `Error("WALLET_DESYNC")` przy braku wiersza lub `qty` schodzącym poniżej
zera i logować do Sentry — awaria powinna być głośna, nie darmowa.

### W-06 · Martwe kody błędów w API (P3)

`workshop/build.ts:161-173` mapuje `REQUIREMENT_DISTINCT` i `REQUIREMENT_UNIQUE`, których
`getBuildQuote` nie potrafi już wyprodukować (checki to wyłącznie `condition` i `fame`).
Zostałość po starym modelu „losowej" recepty — myli przy debugowaniu.

---

## 3. Ekonomia i balans — z policzonymi liczbami

### W-07 · Odwrócona opłacalność: Mythic jest **najgorszym** kandydatem do warsztatu (P1)

Koszt 9 poziomów builda jest identyczny dla każdej rzadkości (ta sama recepta, 450 Fame łącznie).
Zysk Item Level za ten sam rachunek:

| mint rarity | Δ Item Level za buildy 1→9 | kończy jako |
|---|---|---|
| Common | **+31** | Epic |
| Uncommon | +46 | Legendary |
| Rare | +64 | Mythic |
| **Epic** | **+82** | Custom Shop |
| Legendary | +73 | Custom Shop |
| **Mythic** | **+60** | Custom Shop |

Czyli: Epic > Legendary > Rare > **Mythic**. Powód jest mechaniczny — Mythic ma tylko *jeden*
awans (do Custom Shop, na poziomie 3), więc poziomy 4–9 dają mu płaskie +5, podczas gdy Rare
inkasuje skoki awansów (+8, +17, +25). Komentarz przy `RARITY_BUILD_GAIN`
(`itemStats.ts:379-383`) deklaruje coś odwrotnego: *„parts poured into a Mythic go a lot
further"*. Marginalnie — nie idą.

**Propozycja (do wyboru):**
- pozwolić Mythic/Custom Shop zbierać dalsze poziomy z rosnącym `RARITY_BUILD_GAIN`
  (np. +1 co 3 poziomy powyżej ladderu), albo
- uzależnić koszt builda od rzadkości (dziś stały), albo
- dać Custom Shop własną, czwartą „promocję" — kosmetyczną (serial / foil / tytuł), która
  domyka ścieżkę top-tier itemu.

W każdym wariancie: dopisać do `workshop.test.ts` test pilnujący, że „wyższa rzadkość ⇒ nie
mniejszy zwrot z tego samego rachunku".

### W-08 · Unique parts to ślepa uliczka — w całej grze są **dwie** gitary Mythic (P1)

Poziomy 3 / 6 / 9 żądają 1 / 2 / 3 sztuk Unique **tej konkretnej części**, którą ma BOM itemu.
Unique wypada wyłącznie z Mythic (`scrapYield.ts:66`), a Mythic w rosterze są dwa:

| część Unique | jedyne źródło |
|---|---|
| bridge | JTY |
| pickup | Stratocaster Heavy Relic |
| body | Stratocaster Heavy Relic |
| enclosure | jeden pedał Mythic |

Pełny build jednego itemu na archetypie TWIN (**19 z 59 gitar**) wymaga 6 × Unique bridge, czyli
**sześciu teardownów dokładnie tej jednej gitary JTY** — przy szansie Mythic 0,1–1,43% na case
(`caseDefinitions.ts`). Do tego trzeba zniszczyć swój najrzadszy drop, żeby ulepszyć słabszy.
Trader Unique nie sprzedaje (świadomie).

**Propozycja:** rozdzielić „Unique" od „konkretnego Mythica":
- Unique jako **waluta ogólna** (jeden typ „Unique component"), albo
- craft: `5 × Legendary tej samej części → 1 × Unique`, albo
- zamienić bramkę Unique na warunek nie-materiałowy (np. Museum + N buildów), a Unique zostawić
  jako skrót/przyspieszacz.

W obecnym kształcie poziomy 6 i 9 to zawartość, której >99% graczy nigdy nie zobaczy.

### W-09 · Koszt renowacji rośnie z rzadkością, koszt builda nie — awans karze gracza (P1)

`getRepairQuote` mnoży receptę przez `REPAIR_RARITY_MULT[subject.rarity]` — i to przez rzadkość
**efektywną** (po awansach), nie mintową (`workshop.ts:711`). Pełna ścieżka Relic → Museum:

| rarity | Worn | Good | Mint | Museum |
|---|---|---|---|---|
| Common | 6 screws | 10 screws + 3 pot | 4 pot + 4 neck | 4 neck/Epic + 3 bridge/Epic |
| Mythic | 24 screws | 40 screws + 12 pot | 16 pot + 16 neck | 16 neck/Epic + 12 bridge/Epic |
| Custom Shop | 30 screws | 50 screws + 15 pot | 20 pot + 20 neck | **20 neck/Epic + 15 bridge/Epic** |

Jednocześnie buildy 7–9 **wymagają** Museum. Czyli: awansujesz item (build 3/6) → mnożnik napraw
rośnie o klasę → następna bramka kondycji jest wyższa i droższa. Jeden teardown przedmiotu
Epic/Rare daje 1–2 części Epic, więc 35 części Epic to ~20–30 teardownów **na jedną renowację**.

**Propozycja:** liczyć mnożnik od `mintRarity` (spójnie z `getItemValue` i scrapem, gdzie już
tak jest — `itemStats.ts:435-445`), spłaszczyć `REPAIR_RARITY_MULT` do ~1 / 1.2 / 1.4 / 1.7 / 2
i/lub dopuścić skok o kilka klas naraz (dziś: cztery osobne joby, cztery kliknięcia).

### W-10 · Koszt Fame jest dekoracją (P2)

`BUILD_FAME_PER_LEVEL = 10` → cały ladder 1–9 to 450 Fame, przy cenie case'a rzędu setek Fame
i części Legendary u Tradera za 450 Fame **za sztukę**. Bramka Fame nigdy realnie nie blokuje,
a zajmuje: własny `WorkshopCheck`, cały wiersz w `CostList`, komponent `FameCoin` i gałąź
w `getBuildBlocker`. Dużo UI za zero decyzji.

**Propozycja:** albo wyjąć Fame z builda (i uprościć trzy pliki), albo nadać jej wagę —
np. `10 × level²` (poziom 9 = 810, ladder ≈ 2 850), żeby był to realny drugi tor kosztu,
konkurujący z otwieraniem case'ów.

### W-11 · Scrap ignoruje włożoną pracę (P2)

`getScrapYield` (`scrapYield.ts:139`) patrzy na `rarity` **mintową**, features i BOM — `buildLevel`
nie wpływa na nic. Rozebranie itemu na build 9 (dziesiątki części Legendary + Unique) daje
dokładnie tyle, co świeży drop. To świadome (nie wolno zamykać pętli Unique → awans → Unique),
ale w praktyce oznacza: **decyzja o wpompowaniu części w item jest nieodwracalna i niewidoczna
w UI**. Nigdzie nie ma ostrzeżenia „ten przedmiot ma build 7, teardown zwróci 9 śrubek".

**Propozycja:** zwracać część inwestycji poniżej progu awansu (np. 40% wydanych części, bez
Unique) *albo* zostawić bez zwrotu, ale wyraźnie ostrzegać w `ScrapConfirmDialog`
(„Build 7 · zainwestowano 61 części — teardown ich nie zwróci").

### W-12 · Mody są najtańszym Item Levelem i omijają bramkę kondycji (P2)

Mod kosztuje jeden stały rachunek (np. `hand-wound`: 2 Legendary pickup + 2 Epic pot + 8 screws)
i daje `points` 1:1 do Item Level, z zakresem podbitym o `MOD_ROLL_BONUS = 2`. Nie wymaga ani
kondycji, ani Fame, ani awansu. Re-roll można powtarzać w nieskończoność. Przy 15 slotach
(Custom Shop) to główny, a przy tym najmniej ryzykowny sink.

**Propozycja:** wyrównać ekonomię — koszt moda skalowany rzadkością itemu **albo** bramka
kondycji także dla modów (spójność: „warsztat nie tknie zdezelowanego instrumentu"),
plus rosnący koszt kolejnych re-rolli tego samego moda (2. re-roll ×1.5, 3. ×2 …).

### W-13 · Re-roll może obniżyć wartość bez ostrzeżenia (P1, UX + ekonomia)

`rollModPoints` losuje jednostajnie w `[min, max + 2]` i **zawsze** nadpisuje. Mod z rolem
maksymalnym po re-rollu spadnie z prawdopodobieństwem rzędu 80–90%. Jedyne ostrzeżenie to
`title=` na przycisku (`ModPicker.tsx:137`) — niewidoczne na mobile i dla klawiatury. Nie ma
potwierdzenia, nie ma undo, a rachunek już wyszedł z portfela.

**Propozycja:** dialog potwierdzenia pokazujący aktualną wartość, zakres i szansę poprawy
(`(max - points) / (max - min + 1)`), a docelowo tryb „keep the better roll" jako droższa
opcja (klasyczny, czytelny sink na nadmiar części).

---

## 4. Logika i przypadki brzegowe

### W-14 · BOM jako bramka modów wycina połowę puli — Telecaster „nie ma przetworników" (P1)

`getFittableMods` (`workshop.ts:881-895`) filtruje mody po tym, czy `FEATURE_PART_UPGRADES[f.id]`
występuje w BOM-ie. Ale BOM to **lista salvage'owa** (co da się odzyskać przy rozbiórce),
nie spis podzespołów. Efekt policzony na produkcyjnych danych:

| archetyp (BOM) | ile gitar | dostępnych modów |
|---|---|---|
| `body/bridge/pickup/pot` (SINGLECUT) | 20 | 19 / 25 |
| `tuners/neck/screws/bridge` (TWIN) | **19** | **15 / 25** |
| `pickup/neck/body/tuners` (STRAT) | 14 | 17 / 25 |
| `neck/pot/pickup/tuners` (SUPER_HSS) | 3 | 21 / 25 |
| `body/pickup/pot` (HEADLESS) | 2 | 17 / 25 |

Dla 19 gitar (TWIN — Telecaster, superstraty, siedmiostrunowce) **niedostępne są wszystkie mody
przetworników i elektroniki**: `hand-wound`, `active-preamp`, `coil-split`, `cts-pots`,
`push-pull`, `phase-switch`, `treble-bleed`, `pio-caps`, a także mody body. Gracz nie dostaje
żadnego wyjaśnienia poza „nothing else fits this build". Zapas nad limitem slotów jest zerowy:
TWIN ma 15 dopasowalnych modów przy `RARITY_MAX_FEATURES["Custom Shop"] = 15`.

Dodatkowa niespójność: **roller case'ów tej bramki nie stosuje** — `rollItemFeatures`
(`itemStats.ts:313`) losuje z całej puli, więc Telecaster **może wypaść z case'a**
z `hand-wound pickups`, których warsztat nigdy by na niego nie założył (i które potem da się
tylko re-rollować, dzięki fallbackowi w `getModQuote:960-963`).

**Propozycja:** rozdzielić dwie listy — `SALVAGE_BOM` (dzisiejszy, do scrapa) i `FITTABLE_PARTS`
(co instrument fizycznie ma, do modów). TWIN dostaje `pickup`/`pot`/`body` do modów, ale nadal
nie oddaje ich przy teardownie. Test regresyjny: „każdy archetyp ma > `RARITY_MAX_FEATURES`
dopasowalnych modów przy Custom Shop".

### W-15 · „Mods fitted" na ławie pokazuje dziennik, nie mody (P1)

`WorkshopBench.tsx:248-263` renderuje pod nagłówkiem **„Mods fitted"** zawartość
`entry.buildLog`, a build log to wymyślona etykieta z `getBuildModName` (`workshop.ts:523-546`),
która bierze nazwę *prawdziwego* feature'a pasującego do najlepszej części z recepty. Skutek:
po zwykłym buildzie na liście „zamontowanych modów" pojawia się np. „Hand-wound pickups",
mimo że przedmiot **nie ma** tego feature'a ani jego punktów. Prawdziwe mody (`features`
z wartościami) widać wyłącznie po otwarciu modala.

To jednocześnie: mylące (dwie różne rzeczy pod jedną nazwą), rosnące bez końca i marnujące
najlepsze miejsce na ekranie.

**Propozycja:** rozdzielić na dwie sekcje — **„Mods"** (z `subject.features`: etykieta + `+N`
+ przycisk re-roll, czyli to, po co gracz przychodzi) i opcjonalny **„Build log"** (zwijany,
ostatnie 5, z jasnym opisem, że to kronika prac). Etykiety z `getBuildModName` przestawić
na neutralne („Bench work · build 4"), żeby nie udawały feature'ów.

### W-16 · Niespójne komunikaty blokad (P2)

- build: `getBuildBlocker` nazywa brakującą część konkretnie („3 more Legendary necks") — **dobre**;
- repair: `blockedNote` zahardkodowane na `"not enough parts"` (`WorkshopBench.tsx:192`) —
  nigdy nie mówi *czego* brakuje, mimo że `repairQuote.recipe` ma pełną informację;
- mod: `getModBlocker` daje trzy ogólniki bez wskazania części.

**Propozycja:** wspólny `describeBlocker(recipe, checks)` używany przez wszystkie trzy karty.

### W-17 · Ciche przełączenie przedmiotu na ławie (P2)

`WorkshopTab.tsx:26-27`: `entries.find(id) ?? entries[0]`. Gdy wybrany item zniknie (scrap,
sprzedaż, wystawienie na market w drugiej karcie), ława **bez słowa** przeskakuje na inny
przedmiot. Klucz `key={selected.id}` resetuje stan, ale gracz może kliknąć „Promote" na czymś,
czego nie wybierał.

**Propozycja:** zachować `selectedId` i pokazać krótki stan „Ten przedmiot zniknął z magazynu"
z przyciskiem powrotu do racka, zamiast auto-podmiany.

### W-18 · `BuildLadder` liczy 9 kosztorysów przy każdym renderze, także zwiniętym (P3)

`BuildLadder.tsx:36-54` — `levels` jest liczone przed sprawdzeniem `open`, bez `useMemo`.
9 × (`getBuildRecipeParts` + `priceRecipe`) na każdy render modala.

**Propozycja:** `useMemo` po `[subject, wallet]` + wczesny `return`, gdy zwinięty.

### W-19 · Brak limitu na `buildLog` i brak dat (P3)

`build.ts:108` i `mod.ts:137-140` dopisują do tablicy w dokumencie użytkownika bez ograniczenia.
Przy graczu z 50 przedmiotami × 20 buildów to setki stringów w dokumencie czytanym przy każdym
wejściu do Arsenalu. Wpisy nie mają timestampów, więc i tak nie da się z nich zrobić historii.

**Propozycja:** `buildLog` jako `{ label, at }[]` przycinany do ostatnich 20 (`slice(-20)`).

### W-20 · `getBuildStep` poza ladderem rośnie 1.4^n bez sufitu (P3)

Build 20 = 162 × Legendary pickup + 122 × Legendary neck (policzone). Zamierzony „sink", ale UI
nigdzie nie mówi, że powyżej 9 nie ma już awansów *i* że koszt eksploduje — `BuildLadder`
pokazuje tylko 9 szczebli, a notka o tym pojawia się dopiero **po** osiągnięciu build 9.

---

## 5. UX — przepływ gracza

### W-21 · Portfel części nie jest widoczny w zakładce Workshop (P1)

`PartsWallet` renderuje się tylko w Collection (`ArsenalView.tsx:167`), a komentarz
w `WorkshopTab.tsx:48-49` uzasadnia to tym, że każdy job wypisuje swoje części. Tyle że
planowanie („czy mam w ogóle z czego zrobić cokolwiek?") wymaga wtedy przełączania zakładek
i zapamiętywania liczb.

**Propozycja:** wąski, przyklejony pasek nad ławą — sumy per tier (`getWalletTierTotals` już to
liczy) + rozwijalny pełny portfel (`PartsWallet` da się użyć bez zmian).

### W-22 · Brak filtra „co mogę zrobić teraz" (P1)

`WorkshopRack` ma filtr typu (All/Guitars/Pedals) i wyszukiwarkę, ale **nie pokazuje, czy dla
danego przedmiotu jakikolwiek job jest wykonalny**. Przy 50+ przedmiotach jedyna metoda to
klikanie po kolei. To najdroższa brakująca funkcja w całym module — cała pętla brzmi „na co mnie
dziś stać".

**Propozycja:** policzyć w `getWorkshopEntries` trzy flagi (`canBuild` / `canRepair` / `canFit` —
funkcje już istnieją i są tanie), pokazać je jako trzy kropki w wierszu racka, dodać filtr
„Ready" i sortowanie („Ready first" / „Highest level" / „Closest to promotion").

### W-23 · Ślepy zaułek „brakuje 3 × Legendary neck" (P1)

Gdy czegoś brakuje, gracz zostaje z nazwą części i niczym więcej. W grze istnieją **dwa**
źródła: teardown własnego sprzętu i Trader (który sprzedaje Legendary za 450 Fame, 2/dzień —
`traderShop.ts`). Warsztat nie linkuje do żadnego z nich.

**Propozycja:** przy brakującej linii dwa skróty:
- **„Znajdź dawców"** → Collection przefiltrowana do przedmiotów, których `getScrapYield`
  zawiera tę część/tier (dane są deterministyczne, więc lista jest dokładna);
- **„Kup u Tradera"** → Market, gdy oferta dnia zawiera tę część.

### W-24 · Brak masowego scrapa (P1)

Są `useSellGuitarsBulk` / `useSellEffectsBulk` + `BulkSellConfirmDialog`, ale **scrap idzie
sztuka po sztuce**, każdy z osobnym dialogiem. Tymczasem warsztat konsumuje dziesiątki
teardownów (patrz W-09: ~25 teardownów na jedną renowację). To najbardziej męcząca czynność
w całej pętli.

**Propozycja:** tryb multi-select w Collection ze zsumowanym łupem (`mergeScrapParts` robi to
w jednej linijce) + jeden endpoint `scrap-bulk` w transakcji. Bonus: preset „scrapuj duplikaty
poniżej Rare, których nie mam w Rigu".

### W-25 · Brak „shopping listy" pod cel (P2)

Gracz nie ma jak odpowiedzieć na pytanie „ile jeszcze do awansu na Legendary?".
`BuildLadder` pokazuje szczeble osobno, ale nie sumuje braków do najbliższego awansu.

**Propozycja:** nad drabinką jeden wiersz: „Do awansu (build 6): brakuje 4 × Legendary pickup,
2 × Unique bridge · masz 12/18 części".

### W-26 · Job modal nie ma „co dalej" (P2)

Po wykonaniu jobu `WorkshopResultView` pokazuje kartę i deltę, a jedyny przycisk to „Done".
Naturalny następny ruch (kolejny build, kolejna renowacja tego samego przedmiotu) wymaga
przeklikania od nowa.

**Propozycja:** obok „Done" — „Next build" / „Restore further", aktywne, gdy kolejny job jest
wykonalny (kosztorys i tak jest już przeliczony po `invalidateQueries`).

### W-27 · Trzy karty jobów bez hierarchii (P2)

Restore / Build / Mod są renderowane zawsze w tej samej kolejności i z tą samą wagą wizualną,
mimo że w danym momencie sensowny jest zwykle jeden (np. build 7 zablokowany kondycją ⇒
priorytetem jest Restore). Kolejność nie zmienia się nawet, gdy job jest `disabled`.

**Propozycja:** sortować karty po „gotowości/ważności" (warunek blokujący na górę) albo dodać
jednozdaniowy „next best action" nad kartami.

### W-28 · Scrap ostrzega o Rigu, ale nie o warsztacie (P2)

`GuitarCard.tsx:429` blokuje scrap przedmiotu założonego/wpiętego w Rig — bardzo dobrze.
Ale nie ostrzega przy przedmiocie z wysokim `buildLevel`/modami (patrz W-11), a to znacznie
kosztowniejsza pomyłka.

### W-29 · Bramka kondycji nieczytelna z poziomu racka (P3)

`ConditionMeter` pokazuje kondycję, ale nie to, **czy wystarcza na następny build**. Gracz
dowiaduje się o blokadzie dopiero na ławie.

### W-30 · Nazewnictwo builda myli się z modami (P2)

Przycisk builda mówi *„Fit mod — build 4"* (`WorkshopJobModal.tsx:298`), toast:
*„Hand-wound pickups fitted — Build 4"* (`useWorkshopBuild.ts:16-18`) — a obok jest osobny
job **„Fit a mod"**. Dwa różne działania, jeden czasownik.

**Propozycja:** build = *„Build 4"* / *„Promote to Legendary"*; „fit" zarezerwować dla modów.

### W-31 · Renowacja tylko o jeden stopień naraz (P3)

Relic → Museum to cztery osobne joby, cztery dialogi, cztery potwierdzenia — mimo że recepty
są znane z góry. Przydałaby się opcja „Restore to Museum" ze zbiorczym rachunkiem.

---

## 6. UI i zgodność ze STYLEGUIDE

### W-32 · Ręcznie pisane modale zamiast `Dialog` z `assets/components/ui` (P1)

`WorkshopJobModal.tsx:148-305` i `ScrapConfirmDialog.tsx:30-62` to `fixed inset-0` + `div`.
Konsekwencje: brak zamykania **Escape** (por. #777, gdzie dokładnie to poprawiano), brak
focus-trapa, brak `role="dialog"` / `aria-modal`, brak blokady scrolla tła, brak powrotu focusu
na element wyzwalający. Kliknięcie w tło zamyka modal również **w trakcie mutacji**.

**Propozycja:** przepisać na istniejący `ui/dialog` (Radix — dostaje to wszystko za darmo),
a `ScrapConfirmDialog` na `ui/alert-dialog` (operacja destrukcyjna). Na mobile rozważyć
`ui/drawer` zamiast pełnoekranowego modala.

### W-33 · Na mobile nie widać, dlaczego job jest zablokowany (P1)

`JobCard.tsx:100` i `:107` — zarówno `readyNote`, jak i `blockedNote` mają `hidden sm:block`.
Na telefonie karta pokazuje więc wyłącznie tytuł i podsumowanie: gracz widzi wyszarzony
przycisk bez żadnego powodu. To najważniejsza informacja na tej karcie.

**Propozycja:** na mobile przenieść notkę do drugiej linii pod `summary`, nie ukrywać.

### W-34 · Układ mobilny: rack przed ławą (P2)

`WorkshopTab.tsx:50` — `grid-cols-1` aż do `lg`, więc na telefonie najpierw idzie rack
(`max-h-[600px]`, przewijalny), a ława jest pod nim. Każde wejście do warsztatu = przescrollowanie
całej listy. Do tego zagnieżdżony scroll (lista w stronie) jest na dotyku nieprzyjemny.

**Propozycja:** na `<lg` rack jako poziomy pasek kafelków albo `ui/sheet` („Zmień instrument"),
ława od razu na wierzchu.

### W-35 · `title=` jako jedyny nośnik informacji (P1, a11y)

`ConditionPath`, `RarityPath`, `SlotPips`, `PartTally`, `PartsBill` i przycisk re-rolla
przekazują istotne treści wyłącznie przez `title` — niedostępne na dotyku, niedostępne
z klawiatury, nieczytane spójnie przez czytniki ekranu.

**Propozycja:** `ui/tooltip` (jest w repo, Radix, obsługuje focus) + `aria-label` na elementach
interaktywnych.

### W-36 · Znaczenie niesione samym kolorem (P2, a11y)

Tier części (`PART_TIER_COLORS`), rzadkość (`RARITY_STYLES`) i braki (amber vs zinc) rozróżniane
są kolorem. Etykieta tekstowa tieru istnieje, ale w rozmiarach `text-[9px]` / `text-[10px]`
(`PartsWallet`, `ScrapYieldList`) — poniżej progu czytelności i kontrastu.

### W-37 · Bordery wbrew STYLEGUIDE (P3)

- `WorkshopRack.tsx:108` — `ring-1 ring-cyan-500/40` na wybranym wierszu (hierarchię buduje się
  tłem, nie obwódką — wystarczy mocniejsze `bg-zinc-800/70`);
- `SlotPips.tsx` — `border border-dashed border-zinc-700` na ghost-slotach;
- `BuildLadder.tsx:87` — `ring-1 ring-cyan-500/30`;
- `ArsenalView.tsx:80,85` — `border-amber-500/20`, `border-cyan-500/20` na chipach w hero;
- `WorkshopRack.tsx:86` — `border-0` na `Input` (obejście zamiast wariantu komponentu).

### W-38 · Niespójny promień i skala typografii (P3)

`PartsWallet` używa `rounded-xl`, cały Workshop `rounded-lg`. Nagłówki sekcji: `text-base
font-black` (rack) vs `text-xs font-bold tracking-[0.2em]` (sekcje ławy) vs `text-sm font-black`
(`CostList`) — trzy style dla tej samej roli.

### W-39 · Duplikacja komponentów wierszy części (P2)

`CostList/CostRow` i `PartTally` renderują to samo pojęcie (ikona + nazwa + tier + have/need +
ptaszek) w dwóch niezależnych implementacjach, z różną typografią i różną logiką „short".
`ScrapYieldList` to trzeci wariant tego samego wiersza.

**Propozycja:** jeden `PartRow` z wariantami CVA (`full` / `compact` / `yield`) — mniej kodu,
spójny wygląd, jedno miejsce na poprawki a11y.

### W-40 · Martwy/mylący komentarz (P3)

`ModPicker.tsx:11` odwołuje się do `RecipeList` — komponentu, którego nie ma (dziś `CostList`).

### W-41 · Cały moduł jest po angielsku, bez i18n (P2)

W `src/feature/arsenal` **nie ma ani jednego `useTranslation`**, cała treść jest wpisana na
sztywno po angielsku, podczas gdy aplikacja ma warstwę tłumaczeń i polskojęzycznych graczy.
Do tego angielski jest mocno „autorski" („scrap-drawer work", „the wallet starts to hurt") —
trudny dla nienatywnych.

**Propozycja:** wydzielić stringi Workshopu do przestrzeni `arsenal` / `workshop` w locales
(nawet jeśli PL powstanie później) — teraz koszt jest najniższy, bo moduł jest świeży.

### W-42 · Formatowanie: 80 plików nie przechodzi Prettiera (P3)

`npx prettier --check "src/feature/arsenal/**"` zgłasza m.in. `utils/scrap.ts`,
`components/Parts/*` i wszystkie `pages/api/arsenal/*` (podwójne cudzysłowy w JSX, długość linii).
Nowsze pliki Workshopu są sformatowane, starsze nie — miks w jednym module.

**Propozycja:** jednorazowe `npm run format` na `src/feature/arsenal` + `src/pages/api/arsenal`
w **osobnym**, czysto formatującym PR-ze (żeby nie zaszumiać diffów merytorycznych).

---

## 7. Wydajność

### W-43 · Pełne `invalidateQueries` mimo kompletnej odpowiedzi z API (P2)

Wszystkie trzy route'y zwracają `item`, `newParts`, `rigLevel` (i `newFame`) — właśnie po to,
żeby nie mrugać starymi danymi (komentarz w `build.ts:142`). Hooki i tak robią
`invalidateQueries(ARSENAL_QUERY_KEY)`, czyli pełny refetch całego arsenału po każdym kliknięciu.

**Propozycja:** `queryClient.setQueryData` z payloadu + ewentualny cichy refetch w tle.

### W-44 · Rack bez wirtualizacji (P3)

`max-h-[600px]` + `overflow-y-auto`, każdy wiersz z `<img>` i `ConditionMeter`. Przy setkach
przedmiotów (a to cel gry) render zaczyna kosztować. `ui/scroll-area` + wirtualizacja
powyżej ~100 pozycji.

### W-45 · `getWorkshopEntries` liczy wszystko dla wszystkich (P3)

Dla każdego przedmiotu buduje pełny `WorkshopSubject` (BOM, kondycja, poziom) — także dla tych
odfiltrowanych przez wyszukiwarkę. Do racka wystarczy podzbiór; `subject` może być liczony
leniwie dla wybranego przedmiotu.

---

## 8. Telemetria, dokumentacja, testy

### W-46 · Zero analityki w całym module (P1)

Brak jakiegokolwiek zdarzenia PostHog w `src/feature/arsenal`. Nie da się odpowiedzieć na
podstawowe pytania: ilu graczy w ogóle otworzyło Workshop, ilu wykonało pierwszy job, gdzie
lejek się urywa (brak części? kondycja? Unique?), ile re-rolli wypada na gorsze.

**Propozycja:** zdarzenia `workshop_opened`, `workshop_job_started` / `_completed`
(`kind`, `level`, `rarity`, `blocked_by`), `scrap_confirmed` (`parts_total`, `rarity`),
`mod_rerolled` (`points_before`, `points_after`). Bez tego każdy rebalans z sekcji 3 to zgadywanie.

### W-47 · Wiki rozjechało się z kodem (P1)

`src/content/wiki/arsenal-and-gear.md`:
- *„There are two jobs on the bench"* — są **trzy** (mody nie są opisane w ogóle);
- *„they want more different kinds of parts, they refuse anything below a minimum rarity"* —
  nieaktualne, recepty są dziś stałe i nazwane;
- `StatRow`: „6 parts:Build 1 | 90:Build 10 | 401:Build 15 | 1797:Build 20" — realne wartości to
  **8 / 11 / 54 / 284**;
- *„parts poured into a Mythic go a lot further than the same parts spent on a Common"* —
  sprzeczne z policzoną tabelą z W-07 (marginalnie Epic > Mythic).

Dla gracza to gorsze niż brak dokumentacji: liczby są konkretne i błędne.

### W-48 · Brak testów UI i API (P2)

`data/workshop.test.ts` jest bardzo dobre, ale nie ma **żadnego** testu komponentów Workshopu
ani route'ów. Nietestowane są dokładnie te rzeczy, które w tym audycie okazały się zepsute:
pusty stan przy ładowaniu (W-04), nieodświeżony fame (W-03), notki blokad na mobile (W-33).

**Propozycja (minimum):**
- `WorkshopTab` — renderuje rack, a nie pusty stan, gdy dane się jeszcze ładują;
- `WorkshopBench` — blokady widoczne na każdym breakpoincie;
- test na `getFittableMods` per archetyp (W-14) i na monotoniczność zwrotu z builda (W-07).

### W-49 · Brak obsługi kolizji scrap ↔ warsztat (P3)

Nic nie zapobiega scrapowaniu przedmiotu, który w innej karcie jest właśnie „na ławie".
Po W-02 (transakcje) skończy się to czystym błędem 404 zamiast niespójnego stanu — warto wtedy
złapać go w UI i pokazać sensowny komunikat zamiast surowego toasta.

---

## 9. Kolejność, którą proponuję

| # | Znalezisko | Dlaczego tak wcześnie | Koszt |
|---|---|---|---|
| 1 | **W-04** fałszywy pusty stan | jednolinijkowa naprawa, dotyka każdego gracza | XS |
| 2 | **W-03** nieaktualny fame w Redux | psuje pierwszy build, naprawa = 3 linie | XS |
| 3 | **W-02** transakcje w scrap/sell | realna utrata danych gracza | S |
| 4 | **W-33** blokady niewidoczne na mobile | ślepy interfejs na telefonie | XS |
| 5 | **W-32** modale → `ui/dialog` | a11y + Escape + spójność z resztą apki | S |
| 6 | **W-01** reguły Firestore | bez tego ranking gearowy jest fikcją | L, decyzja właściciela |
| 7 | **W-22 + W-21** filtr „Ready" i portfel w Workshopie | największy zwrot dla codziennej pętli | M |
| 8 | **W-14** BOM jako bramka modów | 19 z 59 gitar ma wyciętą połowę zawartości | M |
| 9 | **W-15** „Mods fitted" pokazuje dziennik | gracz nie widzi tego, po co przyszedł | S |
| 10 | **W-07 / W-08 / W-09** rebalans | najpierw telemetria (W-46), potem liczby | L |

Sekcje 3 (ekonomia) i 5 (UX) najlepiej robić po W-46 — inaczej rebalansujemy w ciemno.

---

## 10. Uwagi końcowe

- **Nic tu nie zostało zmienione w kodzie** — zgodnie z treścią issue #779.
- Dwa znaleziska wymagają świadomej decyzji właściciela, bo wychodzą poza moduł:
  **W-01** (`firestore.rules` — bezpieczeństwo) i **W-03** (docelowo: fame poza Reduxem).
- Liczby w sekcji 3 pochodzą z produkcyjnych tabel na dzień 2026-08-11; po każdym rebalansie
  warto je przeliczyć — najlepiej zamieniając ten jednorazowy skrypt w stały test „snapshot
  ekonomii", żeby zmiana `BUILD_LADDER` od razu pokazywała wpływ na krzywą kosztu i zysku.
