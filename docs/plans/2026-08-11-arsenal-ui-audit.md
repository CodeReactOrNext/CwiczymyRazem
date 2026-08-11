# Audyt UI/UX modułu Guitar Arsenal + propozycja reorganizacji

**Data:** 2026-08-11
**Zakres:** `src/feature/arsenal/*` (zakładki Cases, Collection, Workshop, Dex, Rig, Market)
**Issue:** #783
**Status:** faza 1 wdrożona w tym PR-ze, fazy 2–3 to propozycja do decyzji właściciela.

---

## 1. Skrót — co jest nie tak

Arsenal to dziś **sześć osobnych ekranów pod jednym tytułem**, a nie jeden moduł. Każdy z nich
działa poprawnie w izolacji, ale razem nie budują jednej pętli gry. Trzy najdroższe problemy:

1. **Nawigacja nie odpowiada pętli rozgrywki.** Kolejność zakładek (Cases → Collection → Workshop →
   Dex → Rig → Market) miesza czynności robione codziennie (otwórz skrzynkę → wyposaż) z tymi
   robionymi raz na tydzień (Dex, Market). Zakładka Dex i Collection pokazują *ten sam obiekt
   mentalny* ("moje gitary / wszystkie gitary") w dwóch różnych miejscach.
2. **Collection tonie we własnej treści.** Nad kolekcją stoi pełna ściana `PartsWallet`
   (10 kafli, ~400 px), więc pierwszy ekran zakładki "Collection" nie pokazuje ani jednej gitary.
   Dalej jest jedna nieskończona siatka bez wyszukiwarki, filtra i sortowania — przy 32
   przedmiotach to jeszcze działa, przy 100+ przestaje.
3. **Karta przedmiotu jest jednocześnie plakatem i panelem sterowania.** Ma ~600 px wysokości,
   zmienną wysokość zależną od liczby modów (siatka jest poszarpana) i stopkę z 4 mikro-przyciskami
   (10 px tekst, ikony 10 px) — na mobile to poniżej progu wygodnego dotyku.

---

## 2. Audyt szczegółowy

### 2.1 Nagłówek i nawigacja (`ArsenalView.tsx`)

| # | Obserwacja | Skutek |
|---|---|---|
| A1 | Fame Points są widoczne **dwa razy** na tym samym ekranie: chip w górnym pasku aplikacji (`FameBox`) i duży chip w hero. | Duplikacja informacji, hero zjada ~220 px na dane, które już są nad nim. |
| A2 | Podtytuł hero brzmi "Spend your Fame Points to unlock rare guitars" — opisuje **wyłącznie zakładkę Cases**. | Na Rigu/Workshopie/Markecie nagłówek kłamie o tym, gdzie jesteś. |
| A3 | Hero ma `min-h-[220px]` i jest w ~70% pusty (prawa strona to gradient). | Zakładki startują dopiero ok. 300 px od góry — na laptopie 768 px to 40% ekranu na branding. |
| A4 | Sześć zakładek, a `Market` zawiera **drugi poziom** zakładek (Trader / Player listings). | Dwa poziomy nawigacji o identycznym wyglądzie (ten sam `TRIGGER_CLASS`) — nie widać, który poziom się właśnie przełącza. |
| A5 | Klasy triggera zakładki są skopiowane 6× inline (~180 znaków każda) i **jeszcze raz** w `MarketTab`. | Każda zmiana stylu nawigacji to 7 edycji; realne ryzyko rozjazdu. |
| A6 | "Rig Level" to jedyne miejsce, gdzie widać wynik całego modułu, ale stoi jako pasywny chip w hero — nie klika się, nie tłumaczy, z czego wynika. | Główna metryka progresji jest dekoracją. |

### 2.2 Collection

| # | Obserwacja | Skutek |
|---|---|---|
| B1 | `PartsWallet` (pełna siatka 10 kafli) otwiera zakładkę, mimo że części są zasobem **Workshopu**, nie kolekcji. | Kolekcja zaczyna się poniżej pierwszego ekranu. Workshop ma już na to zwinięty `WalletStrip` — istniał komponent, ale nie był tu użyty. |
| B2 | Brak wyszukiwania, filtrowania i sortowania. Jedyne dostępne sortowanie jest zaszyte na stałe (rarity → id → level). | Przy większej kolekcji nie da się znaleźć konkretnego przedmiotu. Workshop **ma** wyszukiwarkę i filtry (All/Guitars/Pedals) — ta sama treść, dwa różne poziomy obsługi. |
| B3 | Gitary i pedały to dwie niezależne sekcje z osobnymi licznikami i osobnym przyciskiem "Sell duplicates". | Dwa przyciski o tej samej nazwie na jednym ekranie, oddalone o kilka ekranów przewijania. |
| B4 | Wysokość karty zależy od liczby modów (0–11 wierszy) → siatka jest poszarpana, wiersze mają różną wysokość. | Wizualny szum; oko nie ma linii, o którą może zaczepić. |
| B5 | Stopka karty: 4 przyciski (`Equip / Market / Scrap / Sell`), tekst 10 px, ikony 10 px, `text-zinc-600`. | Kontrast poniżej AA (punkt 5 STYLEGUIDE) i cel dotykowy < 44 px na mobile. Akcja destrukcyjna (Sell) ma tę samą wagę wizualną co Equip. |
| B6 | Karty i sekcje używają `border-t` / `border` do rozdzielania (stopka, sekcja modów, ramka karty). | Sprzeczne z zasadami 3 i 4 STYLEGUIDE (separacja tłem i odstępem, nie linią). |
| B7 | `clearNewFlags()` jest wołane **dwa razy** przy wejściu w zakładkę — raz z `GuitarInventory`, raz z `EffectCollection`. | Dwa zapisy + dwie inwalidacje zapytania na każde wejście. |

### 2.3 Cases

| # | Obserwacja | Skutek |
|---|---|---|
| C1 | Sześć skrzynek na raz + "Featured Case" z 10 kaflami puli. Ceny (150/300/400) i różnica "Premium vs Elite" nie są niczym uzasadnione na ekranie. | Gracz nie ma jak porównać ofert — brak wspólnej osi (np. szansy na Legendary). |
| C2 | "Drop Rates" to mały, szary link przy każdej karcie, powtórzony 6×. | Najważniejsza informacja zakupowa jest najmniej widoczna. |
| C3 | Gdy nie stać gracza na skrzynkę, przycisk jest wyszarzony bez podania brakującej kwoty. | Brak podpowiedzi "brakuje ci X Fame" = ślepy zaułek. |

### 2.4 Workshop

Najlepiej zaprojektowana zakładka modułu (rack + bench + zwinięty pasek części, sheet na mobile) —
i dlatego jest **wzorcem dla reszty**, a nie kandydatem do przebudowy.

| # | Obserwacja | Skutek |
|---|---|---|
| D1 | Lista modów na benchu potrafi mieć 11+ wierszy z powtórzonym przyciskiem "Re-roll" w każdym. | Powtarzalny szum; przy dłuższej liście przewijanie do "Fit a mod" jest długie. |
| D2 | Rack pokazuje tylko 8 pozycji przy 32 posiadanych — reszta wymaga przewijania listy w kolumnie. | OK, ale bez sortowania po "co mogę dziś ulepszyć" gracz szuka na oślep. |

### 2.5 Dex

| # | Obserwacja | Skutek |
|---|---|---|
| E1 | Dex to ~84 kafle, w większości `???`. Przy 27% odkrycia ekran to głównie szare sylwetki. | Zakładka pokazuje przede wszystkim to, czego gracz **nie** ma. |
| E2 | Dex i Collection odpowiadają na to samo pytanie ("co mam / czego mi brakuje") w dwóch zakładkach. | Rozdzielenie zmusza do przełączania tam i z powrotem przy każdym porównaniu. |

### 2.6 Rig

| # | Obserwacja | Skutek |
|---|---|---|
| F1 | Rig to jedyne miejsce, gdzie **wybór ma konsekwencje** (Rig Level), ale nie pokazuje żadnej liczby — ani obecnego poziomu, ani wpływu slotu. | Gracz nie wie, czy zamiana gitary coś dała. |
| F2 | Pusty slot ("Add Guitar") wygląda identycznie jak slot zajęty, tyle że bez obrazka. | Brak zachęty do uzupełnienia rigu. |

### 2.7 Market

| # | Obserwacja | Skutek |
|---|---|---|
| G1 | Zagnieżdżone zakładki (2.1/A4). | Podwójna nawigacja. |
| G2 | Karty części Tradera mają stepper +/- i pomarańczowy przycisk "Buy for N" na pełną szerokość — to **jedyne** pełnowymiarowe, kolorowe CTA w całym module. | Kupowanie części wygląda na ważniejsze niż otwarcie skrzynki czy założenie gitary. |
| G3 | "Featured Gear" używa tej samej karty co Collection, ze stopką ceny — więc karta ma 4 różne warianty stopki w module. | Trudno przewidzieć, co karta zrobi po kliknięciu. |

### 2.8 Przekrojowo

- **Waluta i wartości**: Fame jest jednocześnie ceną skrzynki, ceną części, nagrodą za sprzedaż i
  ceną na markecie — ale nigdzie nie widać bilansu ("ile zarobiłem/wydałem dziś").
- **Puste stany**: Collection ma sensowny pusty stan, Workshop ma, Dex i Rig nie mają.
- **Spójność ze STYLEGUIDE**: moduł mocno stoi na `border-*` i `shadow-*` (karta przedmiotu ma
  `boxShadow: 0 4px 20px`, `border: 1px solid`, dwa `border-t` w stopce), czyli dokładnie to,
  czego zabraniają zasady 2–4. Karty gear-owe (plakaty) to świadomy wyjątek — ale panele wokół
  nich (wallet, toolbary, sekcje) powinny wrócić do separacji tłem/odstępem.

---

## 3. Propozycja reorganizacji

### 3.1 Zasada porządkująca

Moduł ma jedną pętlę: **zdobądź → wybierz → ulepsz → spieniędź**. Nawigacja powinna być tą pętlą,
a nie listą ekranów. Stąd docelowo **cztery** zakładki zamiast sześciu (+ jedna zagnieżdżona):

| Docelowa zakładka | Co wchłania | Pytanie gracza |
|---|---|---|
| **Cases** | Cases | "Co mogę dziś zdobyć?" |
| **Collection** | Collection + **Dex** (przełącznik „Owned / All") | "Co mam i czego mi brakuje?" |
| **Rig** | Rig | "Czym gram?" |
| **Workshop** | Workshop (+ pasek części) | "Co mogę ulepszyć?" |
| **Market** | Trader + listingi graczy (bez drugiego poziomu zakładek — jedna strona, dwie sekcje) | "Co sprzedać / dokupić?" |

Dex jako przełącznik w Collection jest kluczowy: to ten sam zbiór danych (`GUITAR_DEFINITIONS`),
raz filtrowany do posiadanych, raz pełny. Trzymanie go w osobnej zakładce to podział techniczny,
nie mentalny.

### 3.2 Fazy

**Faza 1 — wdrożona w tym PR-ze (bez zmian w danych i API):**

1. `WalletStrip` zamiast pełnego `PartsWallet` w Collection — części schodzą do jednego zwijanego
   paska (ten sam komponent, którego używa Workshop). Kolekcja startuje nad zgięciem.
2. **Toolbar kolekcji**: zakres `All / Guitars / Pedals`, wyszukiwarka po marce/nazwie i sortowanie
   (Rarity / Level / Newest). Jeden wspólny pasek nad obiema siatkami — ta sama gramatyka co rack
   Workshopu. Logika w `utils/collectionFilter.ts` + testy.
3. **Wyrównanie kart**: lista modów na karcie skrócona do 3 wierszy + „+N more" (signature zawsze
   widoczny). Siatka przestaje być poszarpana, karta ma przewidywalną wysokość.
4. **Kolejność zakładek zgodna z pętlą**: Cases → Collection → Rig → Workshop → Market → Dex;
   klasy triggera wyciągnięte do jednej stałej (koniec z 6 kopiami), a podzakładki Marketu
   dostały cichszy wariant, żeby dwa poziomy nawigacji dało się od siebie odróżnić.
5. **Podtytuł hero** przestaje opisywać jedną zakładkę.
6. `clearNewFlags()` wołane raz, z poziomu zakładki, zamiast z dwóch komponentów
   (kropka „nowe" na zakładce uwzględnia teraz także pedały, nie tylko gitary).
7. **Kontrast akcji na karcie**: `text-zinc-600` → `text-zinc-400` (Equip: `zinc-300`),
   etykiety 10 → 11 px — zasada 5 STYLEGUIDE. Sekcja modów rozdzielona tłem zamiast `border-t`.
8. **Puste stany**: jeden komunikat dla pustej kolekcji (zamiast „Your collection is empty"
   pokazywanego przy posiadanych pedałach) i osobny dla filtra, który nic nie znalazł.

**Faza 2 — proponowana (wymaga decyzji, większy zasięg):**

7. Wchłonięcie Dex do Collection jako przełącznik „Owned / All" (z zachowaniem `?tab=dex` jako
   aliasu). Zakładek robi się 5.
8. Market bez zagnieżdżonych zakładek: Trader jako sekcja „Today at the counter" na górze,
   listingi graczy pod nią, jeden filtr wspólny.
9. Karta przedmiotu: rozdzielenie „plakatu" (obraz + rzadkość + poziom) od „panelu akcji".
   Akcje destrukcyjne (Sell/Scrap) chowają się pod menu `⋯`, a `Equip` zostaje jedyną akcją
   pierwszego rzutu. Cele dotykowe ≥ 40 px, kontrast tekstu ≥ `zinc-400`.
10. Rig pokazuje wpływ na Rig Level przy każdym slocie (`+12` przy podmianie) i ma pusty stan.

**Faza 3 — proponowana (produktowo, do przedyskutowania):**

11. Cases: jedna oś porównania (szansa na Legendary+) na wszystkich kartach skrzynek zamiast
    6 osobnych linków „Drop Rates"; przy braku Fame — ile brakuje.
12. „Bilans dnia" w hero (zarobione / wydane Fame) zamiast statycznego chipa z saldem, które
    i tak jest w górnym pasku.
13. Workshop: sortowanie racka po „co da się dziś zrobić z posiadanych części".

---

## 4. Czego ten PR świadomie **nie** rusza

- Ekonomii (ceny, dropy, koszty części) — audyt jest o UI/UX, nie o balansie.
- Kart `GuitarCard`/`EffectCard` jako „plakatów" (obraz, gradienty, holo) — to jest tożsamość
  wizualna modułu i działa.
- `firestore.rules`, modelu danych i API — brak zmian.
