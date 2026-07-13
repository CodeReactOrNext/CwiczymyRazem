# Propozycje: jak ożywić Community Exercises

**Data:** 2026-07-13
**Temat:** System dodawania własnych ćwiczeń (`src/feature/communityExercises`) — jak zachęcić do
publikowania dobrych ćwiczeń i wyjść z błędnego koła "nikt nie publikuje, bo nikt nie ogląda,
nikt nie ogląda, bo nikt nie publikuje".

## Punkt wyjścia

Źródło: dyskusja na Discordzie (patrz issue #675). Stan obecny (`communityExerciseService.ts`):

- Ćwiczenie ma `averageRating` / `ratingCount`, listę sortuje po ocenie (`getCommunityExercises`).
- Nie ma licznika odtworzeń/użyć — wiemy tylko, że ktoś ocenił, nie że ktoś ćwiczył.
- Nie ma żadnej nagrody za publikację poza samą oceną gwiazdkową.
- W aplikacji istnieje już system **fame points** (`SEASON_FAME_REWARDS` w
  `src/constants/seasonRewards.ts`) i sezonowy leaderboard (`src/feature/leadboard`) —
  to gotowa waluta i gotowy rytm (miesiąc = sezon), których można użyć zamiast wymyślać nowy system.

Wnioski z Discorda, które poniższe propozycje mają spełniać:
- prostota flow > rozbudowa (użytkownik ma rozumieć, co się dzieje),
- nagroda za **jakość i realne korzystanie**, nie za sam fakt publikacji (żeby nie farmić punktów crapem),
- **nie** codzienny quest (zachęca do zapychania systemu byle czym),
- nowe ćwiczenia potrzebują szansy, żeby nie zostały na zawsze przygniecione przez stare, dobrze
  ocenione pozycje.

Poniżej 10 niezależnych propozycji — każdą da się wdrożyć osobno i połączyć wg potrzeby.

---

## 1. Licznik "przećwiczono X razy"

Dodaj pole `playCount` na `CommunityExercise`, inkrementowane, gdy ktoś **inny niż autor**
uruchomi ćwiczenie (`onStartExercise` w `CommunityExercisesTab`). To najprostszy i najbardziej
fundamentalny brakujący sygnał — bez niego nie da się odróżnić "10 osób oceniło i ćwiczy"
od "10 znajomych kliknęło 5 gwiazdek z grzeczności".

- **Dane:** `playCount: number` w dokumencie ćwiczenia, inkrement przez `updateDoc`/transakcję
  przy starcie sesji z ćwiczeniem community.
- **UI:** mała ikonka + liczba obok ratingu w `ExerciseRow` (np. "🎸 128 razy").
- **Dlaczego proste:** żadnej nowej strony, jedno pole, jeden dopisany call.

## 2. Podziękowanie autorowi (fame points)

Przycisk "Podziękuj" przy rozwiniętym ćwiczeniu (obok gwiazdek), dający autorowi np. **+5 fame**.
Jeden użytkownik może podziękować danemu ćwiczeniu tylko raz (jak ocena — osobny dokument
`thanks/{userId}` w subkolekcji, analogicznie do istniejącego `ratings/{userId}`).

- **Dane:** subkolekcja `communityExercises/{id}/thanks/{userId}`, licznik `thanksCount`
  na dokumencie ćwiczenia; fame dopisywane do profilu autora (tam, gdzie dziś trafia
  `SEASON_FAME_REWARDS`).
- **Dlaczego angażujące:** to bezpośrednia, personalna forma uznania — "komuś ta rzecz pomogła",
  silniejsza emocjonalnie niż gwiazdka.
- **Antyspam:** fame idzie tylko od realnych innych userów, nie ma pętli "sam sobie dziękuję"
  (blokada po `authorId === userId`, jak przy ocenach).

## 3. Fame za realne użycie, nie za publikację

Zamiast nagradzać *sam fakt* dodania ćwiczenia, autor dostaje niewielki fame **za każde pierwsze
ukończenie jego ćwiczenia przez nowego użytkownika** (np. +1 fame, deduplikowane po
`(exerciseId, userId)` — do tego wystarczy subkolekcja z pkt. 1/2 jako źródło prawdy o "kto już
liczył się do statystyk").

- **Dlaczego to ważne z Discorda:** wprost adresuje obawę "ktoś będzie farmił punkty postując
  crap" — crap nie ma odtworzeń, więc nie generuje fame. Nagroda skaluje się z realną wartością
  dla community, nie z liczbą kliknięć "publikuj".
- **Nie codzienny quest:** to nie jest zadanie do odhaczenia, tylko efekt uboczny tego, że
  ćwiczenie jest dobre — nie da się tego "zrobić szybko", żeby zaliczyć dzień.

## 4. Sezonowa nagroda "Community Exercise of the Season"

Wykorzystaj istniejący rytm sezonów (`getCurrentSeason`, `seasons/{seasonId}`). Na koniec
sezonu wylicz ranking ćwiczeń community z danego sezonu (np. wg `playCount` + `averageRating`,
patrz pkt. 6) i przyznaj autorowi top 1–3 jednorazowy bonus fame (analogicznie do
`SEASON_FAME_REWARDS` dla top graczy) oraz odznakę widoczną przy ćwiczeniu ("🏆 Ćwiczenie sezonu
2026-07").

- **Dane:** dokument `seasons/{seasonId}` zyskuje pole typu `topCommunityExerciseIds: string[]`,
  liczone tym samym cronem/skryptem, który dziś rozlicza sezon graczy
  (`src/pages/api/cron/notifications.ts` już ma logikę sezonową do rozbudowy).
- **Dlaczego proste:** reużywa istniejący mechanizm sezonów i nagród, nie trzeba wymyślać
  nowego systemu punktowego ani kalendarza.

## 5. Sekcja "Community" na dashboardzie

Mały widget/karuzela na dashboardzie (obok np. `SkillDashboard`) pokazujący 3–5 pozycji:
"Nowe w tym tygodniu" + "Najwyżej oceniane w tym miesiącu". Link prowadzi wprost do zakładki
Community Exercises z danym ćwiczeniem rozwiniętym.

- **Dlaczego to rozbija błędne koło:** dziś trzeba świadomie wejść w zakładkę community, żeby
  cokolwiek zobaczyć. Widoczność na dashboardzie = darmowy ruch dla nowych ćwiczeń, bez
  potrzeby, żeby autor sam je gdziekolwiek reklamował.
- **Dane:** żadnych nowych — to tylko dwa dodatkowe zapytania (`orderBy("createdAt")`,
  `orderBy("averageRating")` z limitem), które już istnieją jako wzorzec w
  `communityExerciseService.ts`.

## 6. Sortowanie z "boostem świeżości", nie samym ratingiem

Zamień domyślne sortowanie w `getCommunityExercises` (dziś: czysty `averageRating desc`) na
prosty wynik ważony, liczony **po stronie klienta** (bez zmiany zapytania Firestore):

```
score = averageRating * log(1 + playCount) + freshnessBonus
```

gdzie `freshnessBonus` maleje liniowo do zera w ciągu np. 30 dni od `createdAt`. Nowe ćwiczenie
ma więc chwilowo szansę pokazać się wysoko nawet z 1–2 ocenami, ale nie zdominuje rankingu na
stałe kosztem jakości.

- **Dlaczego to odpowiedź na obawę z Discorda** ("dać nowym trochę pomocy, ale nie faworyzować
  ich w nieskończoność, jeśli stare już są w czyichś planach") — boost jest czasowy i zanika sam.
- **Prostota:** jedna funkcja sortująca, żadnej nowej infrastruktury.

## 7. Ranking twórców (osobny od rankingu graczy)

Prosta zakładka/sekcja "Top twórcy" pokazująca użytkowników wg sumy `playCount` lub fame
zdobytego z ich ćwiczeń community (agregacja po `authorId`). To nie jest kolejny leaderboard
punktów za granie, tylko uznanie za wkład w bibliotekę ćwiczeń — inny rodzaj osiągnięcia.

- **Dlaczego angażujące:** daje twórcom status widoczny publicznie (obok `UserTooltip`,
  profilu), więc "po co postować" ma teraz jasną odpowiedź: rozpoznawalność + fame.
- **Dane:** agregacja może być liczona okresowo (np. razem z rozliczeniem sezonu z pkt. 4),
  nie musi być live.

## 8. Oznaczenie "Nowość" i "Rosnąca popularność"

Dwie proste plakietki w `ExerciseRow`:
- **"Nowe"** — jeśli `createdAt` młodsze niż np. 14 dni (analogiczny wzorzec do
  `isExerciseNew.ts` już istniejącego w `feature/exercisePlan/utils`).
- **"🔥 Popularne"** — jeśli `playCount` w ostatnich 7 dniach rośnie szybciej niż mediana
  (albo prościej: top 10% wg `playCount` w ostatnich 7 dniach).

- **Dlaczego proste i tanie:** pierwsza plakietka to reużycie istniejącej logiki
  (`isExerciseNew`), druga wymaga tylko licznika z pkt. 1 rozbitego na okno czasowe
  (albo, dla MVP, samego rankingu wg `playCount` bez okna czasowego).

## 9. Minimalna bramka jakości zamiast twardej moderacji

Zamiast pełnej moderacji (kosztowna, spowalnia flow), dodaj lekkie wymagania przy publikacji
(`isPublic: true`) w formularzu tworzenia ćwiczenia: min. długość opisu, min. 1 instrukcja,
podpowiedź "dodaj przynajmniej 1 tip, żeby zwiększyć szansę na dobrą ocenę". To nie blokuje
publikacji, tylko nudge w UI (np. licznik znaków na czerwono/zielono, jak w wielu formularzach
w tym repo).

- **Dlaczego to pasuje do "prosty flow":** żadnej kolejki moderacyjnej, żadnego czekania na
  akceptację — tylko lepsza jakość na starcie, więc mniej crapu trafia do rankingu z pkt. 6.
- Uzupełnienie: przycisk "Zgłoś" przy ćwiczeniu (jak `report` w innych miejscach appki), który
  chowa ćwiczenie z publicznej listy po przekroczeniu progu zgłoszeń — bez ręcznej moderacji
  na starcie.

## 10. "Dodaj do mojego planu" jako mocniejszy sygnał niż samo odtworzenie

Osobny, mocniejszy licznik: `addedToPlanCount` — inkrementowany, gdy ktoś faktycznie doda
community exercise do swojego stałego planu ćwiczeń (`exercisePlan`), a nie tylko odpali go
raz z zakładki community. To rozróżnia "ciekawe, spróbowałem raz" od "na tyle dobre, że wchodzi
do mojej rutyny" — dokładnie to rozróżnienie, o które chodziło w dyskusji na Discordzie
("już włączone do osobistych rutyn").

- **Dane:** inkrement w miejscu, gdzie community exercise trafia do
  `feature/exercisePlan` (np. przy tworzeniu/edycji planu przez `SelectExercisesStep`), jeśli
  źródłowe ćwiczenie ma `id` pasujące do kolekcji `communityExercises`.
- **Użycie:** ten sygnał może zasilać ranking z pkt. 6 jako silniejsza waga niż zwykłe
  odtworzenie, i/lub odblokowywać sezonową nagrodę z pkt. 4.

---

## Sugerowany MVP (żeby nie robić wszystkiego naraz)

Najmniejszy zestaw, który realnie przerywa błędne koło, a nie dokłada tylko kosmetyki:

1. **#1 licznik odtworzeń** — fundament pod wszystko inne.
2. **#2 podziękowanie + fame** — najszybsza, najbardziej "ludzka" nagroda dla autora.
3. **#5 sekcja community na dashboardzie** — widoczność, bez której reszta nie ma odbiorców.
4. **#6 sortowanie z boostem świeżości** — jedna funkcja, rozwiązuje "stare zawsze na górze".

Reszta (#3, #4, #7–10) to naturalne rozszerzenia po tym, jak dane z #1 zaczną płynąć.
