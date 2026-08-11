# Wiki (`/wiki`)

Wiki to instrukcja obsługi aplikacji **dla gracza**, nie dla programisty. Treść leży
w `src/content/wiki/*.md`, renderuje ją `src/pages/wiki/[slug].tsx` (markdown +
komponenty, kompilowany po stronie serwera).

## Zasada nadrzędna: pisz do końcowego użytkownika

- Żadnych ścieżek URL w treści (`/timer/auto`), nazw pól z bazy, cache'y, wzorów.
  Zamiast tego nazwy z UI i komponent `<ClickPath />`.
- Nazywaj rzeczy dokładnie tak, jak są podpisane w aplikacji
  (`Practice → Auto Plan`, `Rankings`, `My Stuff`).
- Każdy artykuł kończy się `<FaqList />` (sekcja „Questions people ask") i
  `<ReadNext />` z linkami do sąsiednich artykułów.

## Dodanie nowej strony

Nowy plik `src/content/wiki/moja-strona.md` z frontmatterem:

```md
---
title: "Tytuł w menu"
description: "Jedno zdanie — widoczne na liście i pod tytułem."
slug: "moja-strona"          # musi być równy nazwie pliku
section: "Practice"          # kolejność sekcji: SECTION_ORDER w src/lib/wiki.ts
order: 2                     # kolejność w obrębie sekcji
---
```

Test `src/lib/wiki.test.tsx` renderuje **każdy** artykuł i sprawdza, czy wszystkie
linki `/wiki/...` prowadzą do istniejących stron — literówka w nazwie komponentu
albo w linku wywali się w `npm test`, a nie dopiero na produkcji.

## Komponenty do wizualizacji

Zamiast zrzutów ekranu artykuły używają komponentów z `src/components/Wiki`
(rejestrowane w `src/pages/wiki/[slug].tsx`). Markdown kompiluje się bez scope'u,
więc **wszystkie propsy są stringami** — listy rozdzielane `|`, para tytuł/opis
przez `::`.

| Komponent | Do czego | Przykład |
|---|---|---|
| `ClickPath` | „gdzie kliknąć" zamiast URL-a | `<ClickPath steps="Practice\|Auto Plan" caption="..." />` |
| `AppScreen` | ramka udająca okno aplikacji (baza pozostałych podglądów) | `<AppScreen title="Daily Quests">...</AppScreen>` |
| `QuestPreview` | makieta karty daily questów | `<QuestPreview tasks="Rate a Song::0 / 1" reward="+10 points, +40 Fame" />` |
| `SessionLogPreview` | makieta formularza logowania sesji | `<SessionLogPreview categories="Technique::20 min" habits="*Warm-up\|Recording" total="+19 points" />` |
| `BoardPreview` | tablica w kolumnach (np. Songs → Board) | `<BoardPreview title="Songs → Board" columns="Want to Learn::A, B" />` |
| `ProgressLadder` | drabinka „coraz lepiej" (streak, milestones, gwiazdki) | `<ProgressLadder items="Day 1::brak bonusu" highlight="Day 5" />` |
| `TierScale` | skala tierów/rzadkości z rampą kolorów | `<TierScale items="Common\|Rare\|Epic" />` |
| `PlanComparison` | porównanie Free / Pro / Master (dane z `feature/premium/data/plans`) | `<PlanComparison />` |
| `FaqList` | krótkie pytania i odpowiedzi | `<FaqList items="Pytanie?::Odpowiedź" />` |
| `ReadNext` | linki na koniec artykułu | `<ReadNext links="Tytuł::/wiki/slug" />` |

Plus komponenty blogowe: `StepList`, `Checklist`, `StatRow`, `BlogAlert`
(`type="info\|tip\|warning\|important\|takeaway"`).

## Zrzuty ekranu

Jeśli kiedyś dojdą prawdziwe screeny: wrzuć plik do `public/images/wiki/` i wstaw
zwykłym markdownem `![opis](/images/wiki/plik.png)`. Podglądy komponentowe warto
wtedy zostawić tam, gdzie pokazują mechanikę (np. wyliczenie punktów), a zastąpić
tam, gdzie chodzi tylko o „jak to wygląda".
