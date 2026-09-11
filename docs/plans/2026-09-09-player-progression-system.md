# Player Progression System — research i plan wdrożenia

**Data:** 2026-09-09
**Tier:** `t153` w [`roadmap.data.ts`](../../src/feature/roadmap/data/roadmap.data.ts) — **ufundowany, jeszcze nie oznaczony `done`**
**Opis z roadmapy:** _"Level up from playing. Unlocks milestones, profile layouts, and which gear rarity you can equip."_
**Intencja z [poprzedniego planu](2026-07-29-public-roadmap-v2.md):** _"the umbrella system that gates content"_ — progresja jest warstwą, na której stoi później `t201` (Configurable Guitarist Profile).

---

## Decyzje właściciela (2026-09-09) i stan wdrożenia

| Decyzja | Wybór |
| --- | --- |
| Wariant capa | **W1 — pełna drabina**: Rare 3, Epic 6, Legendary 10, Mythic 15, Custom Shop 20 |
| Layouty profilu | **poza zakresem `t153`** — przechodzą do `t201` |
| Waluta nagród | **bez Fame.** Poziom płaci częściami, darmowymi skrzynkami i modami |
| Drabina | ma pokazywać nagrodę przy każdym poziomie |

**Zbudowane na gałęzi `feat/player-progression-system`:**

- `src/feature/progression/` — `rarityCap.ts`, `levelMilestones.ts`, `utils/levelRewards.ts`, `utils/equipGuard.ts` (+ 38 testów)
- Cap egzekwowany serwerowo w `equip-guitar`, `update-rig`, `update-pedalboard`, z grandfatheringiem i wyjątkiem dla `role === "admin"`
- `rewards.claimedLevels` w ledgerze, trasa `POST /api/rewards/claim-level`, `useClaimLevelReward`
- `MilestoneLadder` na `/profile/activity`

**Świadomie nie zrobione:** karta „co odblokowałeś" w pop-upie po raporcie, wyprzedzająca kłódka na kafelkach stashu (dziś odmowę pokazuje toast z serwera), bramkowanie kolejnych stron poziomem.

`firestore.rules` **nie wymagały zmiany** — cała mapa `rewards` jest już zablokowana przed zapisem z klienta (linia 26), więc `claimedLevels` jest pokryty tą samą regułą.

### Decyzja właściciela (2026-09-11, [#820](https://github.com/CodeReactOrNext/CwiczymyRazem/issues/820)) — nagrody tylko na bieżąco

Pierwotnie drabina wypłacała **wstecz**: konto na poziomie 30 w dniu wdrożenia dostawało wszystkie minięte progi naraz. To odpada. Poziomy zdobyte, zanim system nagród istniał, nie są płatne — liczy się tylko to, co gracz wejdzie od teraz.

Realizacja: `rewards.levelBaseline` (numer, pole serwerowe w tym samym ledgerze, więc `firestore.rules` znów bez zmian). Pieczętowane **raz**, przy pierwszym zetknięciu konta z systemem nagród:

- `POST /api/user/report` — na poziomie **sprzed** raportowanej sesji, więc poziom zdobyty tą sesją jeszcze się liczy,
- `POST /api/rewards/claim-levels` — awaryjnie, na aktualnym poziomie, dla kont, które nie raportują.

`getClaimableLevels(lvl, claimed, baseline)` pomija wszystko `<= baseline`. Konta, które zdążyły odebrać wypłatę wstecz przed tą zmianą, zatrzymują ją — `claimedLevels` i tak nie pozwoli zapłacić drugi raz.

---

## 1. Co już mamy w kodzie

Dobra wiadomość: około **60% tego tieru już istnieje**, tylko rozrzucone i nienazwane "progresją".

| Element | Gdzie | Stan |
| --- | --- | --- |
| Poziom z punktów | `statistics.lvl`, [`levelUpUser.ts`](../../src/utils/gameLogic/levelUpUser.ts), [`getPointsToLvlUp.ts`](../../src/utils/gameLogic/getPointsToLvlUp.ts) | działa, `(BASE_EXP + lvl) * lvl`, `BASE_EXP = 35` |
| Bramkowanie stron poziomem | [`feature/levelGate`](../../src/feature/levelGate) — `FEATURE_UNLOCKS`, `LevelGate`, `FeatureLockedView`, `buildLevelTrack` | działa; 2 wpisy: Milestones (`/summary`, lvl 3), Guilds (lvl 5) |
| Kosmetyka za poziom | odznaki rang 1–28, `IMG_RANKS_NUMBER`, `getRankBadgeSrc` | działa, ale nigdzie nie jest sprzedane jako "unlock" |
| Silnik nagród | [`lib/rewards/rewardPayout.ts`](../../src/lib/rewards/rewardPayout.ts) (fame / caseTokens / parts, deterministyczne losowanie z seeda), [`rewardLedger.ts`](../../src/lib/rewards/rewardLedger.ts), `/api/rewards/claim-*` | gotowy do podpięcia nowego źródła |
| Drabina rzadkości | `GuitarRarity` = Common → Uncommon → Rare → Epic → Legendary → Mythic → Custom Shop | jest |
| Efektywna rzadkość przedmiotu | [`getEquippedRarity`](../../src/feature/arsenal/data/equippedGuitar.ts) (uwzględnia promocje z warsztatu) | jest — **to jest właściwe źródło prawdy dla capa**, nie `def.rarity` |
| Ścieżki zakładania sprzętu (serwer, Admin SDK) | `/api/arsenal/equip-guitar`, `/api/arsenal/update-rig`, `/api/arsenal/update-pedalboard` | **żadna nie waliduje niczego poza posiadaniem** |
| Moment level-upu | [`useRatingPopUp.ts`](../../src/layouts/RatingPopUpLayout/hooks/useRatingPopUp.ts) — animuje przejście poziomu po raporcie | jest animacja, brak treści "co odblokowałeś" |

### Czego nie ma w ogóle

1. **Capa rzadkości** — nic w kodzie nie wie, że poziom miałby ograniczać sprzęt.
2. **Nagród za poziom** — poziom nie płaci nic: ani Fame, ani case tokena, ani części.
3. **Layoutów profilu** — [`ProfileLayout.tsx`](../../src/feature/profile/ProfileLayout.tsx) to jeden zahardkodowany JSX; nie ma pojęcia "layout", nie ma pola w bazie.
4. **Jednego miejsca, gdzie widać drabinę** — gracz nie ma ekranu, na którym widzi, co go czeka na kolejnych poziomach.

---

## 2. Krzywa poziomów — realne liczby

Próg wejścia na poziom `N` to `(34 + N) * (N - 1)` punktów. Praktyka płaci **22 pkt/h** (+ do 50% z serii dni).

| Poziom | Punkty | Godziny bez serii | Godziny przy serii +50% |
| --- | --- | --- | --- |
| 3 | 74 | 3,4 h | 2,2 h |
| 5 | 156 | 7,1 h | 4,7 h |
| 6 | 200 | 9,1 h | 6,1 h |
| 10 | 396 | 18 h | 12 h |
| 15 | 686 | 31 h | 21 h |
| 20 | 1026 | 47 h | 31 h |
| 28 | 1674 | 76 h | 51 h |
| 50 | 4116 | 187 h | 125 h |
| 100 | 13266 | 603 h | 402 h |

**Wniosek do projektowania progów:** realny endgame to okolice **lvl 25–30** (nieprzypadkowo tam kończą się odznaki rang, `IMG_RANKS_NUMBER = 28`). Wszystko, co ma być osiągalne dla normalnego gracza, musi zmieścić się poniżej lvl 30. Poziom 100 to achievement-żart, nie miejsce na treść.

> ⚠️ **Do zweryfikowania danymi:** próbka rozkładu `statistics.lvl` po kolekcji `users` (i ilu graczy poniżej danego progu trzyma już Legendary/Mythic). Skrypt sondujący napisany, ale zablokowany przez uprawnienia — patrz sekcja 7.

---

## 3. Projekt

Jedna nowa domena: `src/feature/progression/`. Jedno źródło prawdy — tabela poziomów. Wszystko inne z niej czyta.

```
src/feature/progression/
  data/levelMilestones.ts    ← tabela: poziom → co daje
  data/rarityCap.ts          ← poziom → najwyższa zakładalna rzadkość
  data/profileLayouts.ts     ← definicje layoutów profilu
  utils/progression.utils.ts ← canEquipRarity, milestonesUpTo, nextMilestone
  components/                ← MilestoneLadder, LevelUpUnlockCard
  view/ProgressionView.tsx
```

### Filar A — cap rzadkości sprzętu

Reguła: **poziom decyduje, jak wysoką rzadkość można *założyć*** — nie co można posiadać, otwierać, ulepszać ani sprzedawać. Skrzynka dalej wypada, gitara ląduje w stashu i czeka.

Proponowana drabina (dopasowana do tabeli z sekcji 2):

| Poziom | Odblokowuje | ~czas |
| --- | --- | --- |
| 1 | Common, Uncommon | — |
| 3 | Rare | 3 h |
| 6 | Epic | 9 h |
| 10 | Legendary | 18 h |
| 15 | Mythic | 31 h |
| 20 | Custom Shop | 47 h |

Legendary wypada ~1 raz na 40 pulli ze standardowej skrzynki, Mythic ~1 na 200 — statystycznie gracz i tak dobija do tych rzadkości później niż do odpowiadającego poziomu, więc cap **nie powinien nikogo realnie zablokować**. To jest cel: cap ma nadawać poziomom znaczenie, nie odbierać zabawki.

**Egzekwowanie:** po stronie serwera we wszystkich trzech trasach (`equip-guitar`, `update-rig`, `update-pedalboard`) — czytają `statistics.lvl` z tego samego dokumentu, który już pobierają, więc to zero dodatkowych odczytów. Rzadkość liczyć przez `getEffectiveRarity`/`getEquippedRarity`, nie z katalogu.

**Grandfathering (obowiązkowo):** walidacja odrzuca tylko *dodanie* przedmiotu ponad cap. Co już stoi w slocie/na pedalboardzie, zostaje — nikt nie traci rana po deployu za sprzęt zdobyty legalnie. Warstwa kliencka blokuje przycisk i tłumaczy dlaczego (reuse `RARITY_STYLES` + tooltip), zamiast pozwalać na strzał, który wróci błędem.

### Filar B — milestones (drabina odblokowań)

Rozszerzenie `FEATURE_UNLOCKS` do pełnej tabeli, plus **nagroda za każdy próg** przez istniejący ledger.

```ts
export interface LevelMilestone {
  lvl: number;
  /** Co się otwiera: strona, cap rzadkości, layout profilu, slot. */
  unlocks: MilestoneUnlock[];
  /** Wypłata przez lib/rewards. Nie każdy próg musi płacić. */
  payout?: { fame: number; caseTokens: number; parts: PartSlot[] };
}
```

Wdrożona tabela (`LEVEL_PAYOUTS` w `levelMilestones.ts`):

| Lvl | Odblokowanie | Nagroda |
| --- | --- | --- |
| 3 | Rare + Milestones (`/summary`) | 2× część Standard |
| 5 | Guilds | 1 darmowa skrzynka |
| 6 | Epic | 2× część Epic |
| 8 | — | 1 mod |
| 10 | Legendary | 1 skrzynka + 3× część Epic |
| 12 | — | 1 mod |
| 15 | Mythic | 1 skrzynka + 2× część Legendary |
| 18 | — | 1 mod |
| 20 | Custom Shop | 1 skrzynka + 3× część Legendary |
| 25 | — | 2 skrzynki + 1 mod |
| 28 | — | 1 skrzynka + 4× część Legendary + 1 mod |

Łącznie przez całą drabinę (~80 h grania): 7 skrzynek, 5 modów, 16 części. Dla porównania dzienna skrzynka daje jedno darmowe otwarcie **codziennie** — drabina ma znaczyć przebytą drogę, a nie stać się głównym źródłem sprzętu.

**Ważne, żeby nie zepsuć ekonomii:** żadna wypłata nie rusza Fame ani punktów. Punkty rankują tabelę (nagroda w punktach kupowałaby kolejny poziom), a Fame to portfel — części i mody nie mają kursu wymiany z powrotem na cokolwiek, więc da się ich użyć wyłącznie do tego, do czego są. Dlatego `LevelPayout` celowo **nie** jest `RewardPayout`.

Mody i części są ciągnięte deterministycznie z seeda `level_<n>`, tak samo jak trofeum journeya. Dzięki temu drabina drukuje konkretny mod z wyprzedzeniem, a trasa claim wyprowadza go tą samą czystą funkcją — klient nigdy nie mówi serwerowi, co mu się należy.

`FEATURE_UNLOCKS` zostaje jako widok pochodny nad nową tabelą, żeby `LevelGate` i `FeatureLockedView` działały bez przepisywania.

**Claim:** `rewards.claimedLevels: string[]` w ledgerze (id `level_10`), nowa trasa `/api/rewards/claim-level`, która sama przelicza próg z `statistics.lvl` — klient nigdy nie podaje kwoty. Wzór 1:1 z `claim-journey.ts`.

### Filar C — layouty profilu — PRZENIESIONE DO `t201`

> Decyzja z 2026-09-09: layouty nie wchodzą do `t153`. Poniższe zostaje jako gotowy szkic pod tier 201, który i tak mówi „using layouts unlocked through progression".

Najmniejsza wersja, która realnie domyka opis tieru i nie wchodzi w zakres `t201`:

1. `ProfileLayout.tsx` przestaje być jednym JSX-em — sekcje (`PracticeInsights`, `ActivityLogView`, `StatsSection`, `SongSkillShowcase`, `SkillTreeCards`, `ProfileArsenal`, `SeasonalAchievements`, `EarnedAchievementsList`) trafiają do rejestru `PROFILE_SECTIONS`, a layout to **kolejność + wariant banera**.
2. `data/profileLayouts.ts` — 4 layouty: `practice-log` (dzisiejszy, domyślny, lvl 1), `collector` (Arsenal i osiągnięcia na górze, lvl 8), `performer` (nagrania, utwory, umiejętności, lvl 12), `stat-sheet` (gęsty, liczby na wierzchu, lvl 20).
3. `profile.layoutId` na dokumencie użytkownika + prosty przełącznik w ustawieniach profilu. **Bez** drag & drop i konfiguratora — to jest `t201`.

To jest jedyna część o realnym ryzyku regresji wizualnej, bo dotyka istniejącego profilu. Refactor na rejestr sekcji powinien być osobnym, czysto mechanicznym krokiem, przed dodaniem layoutów.

### Filar D — moment i widoczność

Bez tego cała reszta jest niewidzialna:

- **Po raporcie:** `RatingPopUpLayout` już animuje przeskok poziomu — dołożyć kartę "Level 10 — Legendary gear unlocked" z przyciskiem Claim.
- **Ekran drabiny:** `/progression` (albo zakładka na profilu) — cała tabela, przebyte na zielono, następny próg z paskiem punktów. `buildLevelTrack` i styl `FeatureLockedView` są gotowe do reużycia.
- **Powiadomienie** przez istniejący `feature/notifications`, gdy próg czeka na odbiór.

---

## 4. Plan wdrożenia — 5 PR-ów (historyczny)

> Zrealizowany zakres jest w bloku „Decyzje właściciela" na górze. Poniższe to pierwotna propozycja.

Każdy osobno mergowalny, każdy sam w sobie ma sens.

**PR 1 — rdzeń progresji (bez zmian widocznych dla gracza)**
`feature/progression/data/levelMilestones.ts` + `rarityCap.ts` + utils + testy. `FEATURE_UNLOCKS` przepięte na tabelę (zachowując `LockedFeatureId`, `requiredLvl`, `reason`, `perks`, żeby `FeatureLockedView` się nie ruszył). Nic jeszcze nie egzekwuje capa.

**PR 2 — cap rzadkości**
Walidacja w trzech trasach API + blokada z wyjaśnieniem w `EquipTargetDialog`, `StashTile`, `CollectionTab`, `EffectCollection`. Testy: przedmiot ponad cap odrzucony, przedmiot już założony przechodzi (grandfathering), admin/`role` bez ograniczeń jak w `LevelGate`.

**PR 3 — nagrody za poziom**
`claimedLevels` w `rewardLedger.ts`, trasa `/api/rewards/claim-level`, `state.ts` zwraca odebrane progi, karta Claim w pop-upie po raporcie. Testy trasy wzorowane na `claim-journey`.

**PR 4 — ekran drabiny**
`/progression`, `MilestoneLadder`, wejście z profilu i z sidebara. Sam UI, zero nowej logiki.

**PR 5 — layouty profilu**
Krok 5a: refactor `ProfileLayout` na rejestr sekcji, bez zmiany wyglądu. Krok 5b: 4 layouty + `profile.layoutId` + przełącznik.

**Domknięcie tieru (może jechać z PR 5):**
- `t153` → `done: true` w `roadmap.data.ts`
- wpis w Changelogu
- wiki: `how-scoring-works.md` (poziomy zaczynają coś dawać), `arsenal-and-gear.md` FAQ, `fame.md`
- `firestore.rules`

---

## 5. Konflikty z obecnym wiki — do świadomej decyzji

Wiki mówi dziś wprost coś, co ten tier zmienia:

- `arsenal-and-gear.md`, FAQ: _"Does gear affect my points or level? **Not at all. It's a separate game with its own board**"_
- `fame.md`: _"It isn't required. You can practise, log, learn songs, keep a streak and climb the rankings without ever opening the Arsenal"_

Zdanie o Fame zostaje prawdziwe. Zdanie o rozdzieleniu — **przestaje**, w jedną stronę: sprzęt nadal nie rusza poziomu, ale poziom zaczyna rządzić sprzętem. To jest dobra asymetria (gra o granie karmi grę o zbieractwo, nigdy odwrotnie), tylko trzeba ją napisać w wiki wprost, bo inaczej wygląda jak zabranie czegoś po cichu.

## 6. Ryzyka

- **Retro-blokada.** Największe ryzyko produktowe. Grandfathering nie jest opcją — bez niego gracz z Mythikiem na lvl 8 dostaje karę za to, że grał dłużej, niż mu się liczyło.
- **Reguły Firestore.** Ledger jest polem serwerowym i tak musi zostać (`rewards.claimedLevels` na liście blokowanej), `profile.layoutId` klient może pisać. ⚠️ Zgodnie z `CLAUDE.md` zmianę `firestore.rules` trzeba **zgłosić komentarzem na GitHubie**. Dodatkowo: wdrożone reguły w prodzie różnią się od repo, więc walidację `layoutId` weryfikować wobec żywych reguł, nie wobec pliku.
- **Zakres pełznie w stronę `t201`.** Layouty w `t153` to *odblokowanie i wybór z listy*. Konfigurator to osobny, później opłacony tier.
- **Regresja profilu** przy refactorze na rejestr sekcji — dlatego osobny krok bez zmian wizualnych.

## 7. Czego nie udało się zweryfikować

Sonda do Firestore (rozkład `statistics.lvl`, ilu graczy poniżej progów trzyma Legendary/Mythic) została zablokowana przez klasyfikator uprawnień. Bez niej progi z sekcji 3 są policzone z krzywej punktów, a nie z realnego rozkładu graczy. **Przed PR 2 warto ją puścić** — jeśli okaże się, że np. 30% posiadaczy Mythica siedzi poniżej lvl 15, ladder trzeba spłaszczyć albo cap postawić wyżej.

## 8. Decyzje dla właściciela — ROZSTRZYGNIĘTE

> Odpowiedzi w bloku na górze dokumentu. Punkt 1: oba — `/summary` jest jednym z odblokowań na nowej drabinie. Punkt 2: bez Fame, tylko przedmioty. Punkt 3: tak, cap obejmuje też pedalboard. Punkt 4: wybrano pełną drabinę (W1).

1. **"Milestones" w opisie tieru** = istniejąca strona `/summary` (już bramkowana lvl 3), czy nowa drabina progów poziomowych? Plan zakłada **oba**: strona zostaje jednym z odblokowań w nowej tabeli.
2. **Czy poziom ma płacić Fame?** Plan mówi tak (Fame / tokeny / części, nigdy punkty). Alternatywa: progi dają wyłącznie odblokowania, bez waluty.
3. **Czy cap dotyczy też efektów i pedalboardu**, czy tylko gitar? Plan zakłada oba — inaczej gracz obchodzi cap, ubierając rig w Mythic-pedale.
4. **Kształt drabiny rzadkości** — czy 3/6/10/15/20 to właściwe tempo.
