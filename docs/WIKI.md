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
| `FaqList` | krótkie pytania i odpowiedzi | `<FaqList items="Pytanie?::Odpowiedź" />` |
| `ReadNext` | linki na koniec artykułu | `<ReadNext links="Tytuł::/wiki/slug" />` |
| `Screenshot` | prawdziwy zrzut ekranu (patrz niżej) | `<Screenshot src="/images/wiki/plik.png" alt="..." caption="..." />` |

Plus komponenty blogowe: `StepList`, `Checklist`, `StatRow`, `BlogAlert`
(`type="info\|tip\|warning\|important\|takeaway"`).

## Zrzuty ekranu

Plik ląduje w `public/images/wiki/`, a w artykule używamy `<Screenshot />`, nie
gołego `![](...)`:

```md
<Screenshot
  src="/images/wiki/log-time.png"
  alt="Ekran 'Enter exercise time' z czterema kategoriami"
  caption="Podpis pod obrazkiem."
  maxWidth="720px" />
```

Dlaczego nie zwykły markdown: `<img>` wewnątrz `prose` dostaje od Tailwind
Typography ~1,8em marginesu góra/dół i żadnej ramki. `Screenshot` renderuje
`<figure class="not-prose">` z tym samym „passe-partout" (`bg-zinc-900/40`) co
`AppScreen`, więc zrzut i makieta mogą stać obok siebie bez widocznego szwu.
`maxWidth` przydaje się przy wysokich, wąskich ekranach — bez tego rozciągają się
na całą kolumnę i spychają resztę artykułu poza ekran.

**Czego nie zastępować zrzutem.** Screeny się starzeją — UI się zmienia i nikt
ich nie robi od nowa. Makiety komponentowe zostawiaj tam, gdzie tłumaczą
**mechanikę** (`SessionLogPreview` z wyliczeniem punktów, `ProgressLadder`
ze streakiem), bo one aktualizują się razem z designem aplikacji. Zrzut dawaj
tam, gdzie chodzi naprawdę o „jak ten ekran wygląda".

**Co pokazywać na zrzucie.** Realistyczne dane. Sesja na 23 godziny albo pusty
formularz uczą złych rzeczy — ustaw wartości, które chcesz, żeby gracz uznał za
normalne.

Test `wiki.test.tsx` sprawdza, że każda ścieżka `/images/...` z artykułów
naprawdę istnieje w `public/` — brakujący plik wywala `npm test`, a nie dopiero
wzrok czytelnika.
