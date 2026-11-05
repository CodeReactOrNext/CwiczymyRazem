---
title: "Podłącz Claude'a albo innego asystenta AI"
description: "Połącz Claude'a, ChatGPT albo Cursora ze swoim kontem riff.quest, żeby czytał twoje ćwiczenie, planował następną sesję i pisał dla ciebie ćwiczenia z tabami."
slug: "ai-assistants"
section: "Practice"
order: 6
---

riff.quest potrafi rozmawiać z asystentem AI, którego już używasz. Podłącz Claude'a (albo inną aplikację obsługującą konektory) do swojego konta i pytaj na przykład „co zaniedbuję w tym miesiącu?” albo „napisz mi ćwiczenie legato w a-moll na 90 BPM”, a odpowie na podstawie twojej prawdziwej historii ćwiczeń, zamiast zgadywać. Może też zapisać to, na co się umówicie: plan ćwiczeń, cel tempa, utwór na liście, nowe ćwiczenie z tabem albo sesję zagraną poza aplikacją. riff.quest nie uruchamia przy tym żadnego AI. Całe myślenie dzieje się w twoim asystencie, a riff.quest tylko podaje mu twoje dane i zapisuje zmiany, na które się zgodzisz.

To perk dla supporterów: dowolna wpłata na riff.quest odblokowuje go na twoim koncie, a ćwiczenie i cała reszta zostają darmowe dla wszystkich. [Zostań supporterem](/supporter), a połączysz się od razu i odetniesz połączenie w każdej chwili.

## Podłączanie Claude'a

Konektor dodajesz raz, w Claudzie w przeglądarce albo w aplikacji Claude na komputer. Potem działa też w aplikacji mobilnej.

<StepList steps="Skopiuj adres serwera::W riff.quest otwórz Ustawienia i zakładkę AI assistants. Adres serwera na górze ma obok przycisk Kopiuj|Dodaj go jako konektor w Claudzie::W Claudzie otwórz Ustawienia, potem Konektory i wybierz dodanie własnego konektora. Nadaj mu nazwę, wklej adres i dodaj|Zaloguj się::Claude przeniesie cię na stronę riff.quest. Zaloguj się, jeśli jeszcze nie jesteś|Zdecyduj, co mu wolno::Strona pokazuje, która aplikacja prosi o dostęp i dokąd wrócisz. Odczyt twojego ćwiczenia jest zawsze w pakiecie; włącz Pozwól na zmiany, jeśli ma też zapisywać plany, cele, utwory, ćwiczenia i czas ćwiczeń. Naciśnij Zezwól|Pytaj::Wróć do Claude'a, zacznij nową rozmowę i zapytaj o swoje ćwiczenie. Domyślnie Claude pyta przed każdą zmianą, którą chce zapisać" />

<ClickPath steps="Ustawienia|AI assistants" caption="Tu jest adres serwera i tu wracasz później, żeby zobaczyć lub odłączyć swoje aplikacje." />

<BlogAlert type="info">
Adres to `https://riff.quest/api/mcp`, ten sam dla wszystkich. Twoje konto bierze się z logowania, nie z adresu, więc nie ma w nim nic tajnego.
</BlogAlert>

## Inne aplikacje AI

Każda aplikacja obsługująca zdalne konektory MCP, na przykład ChatGPT, Cursor albo Claude Code, przyjmie ten sam adres. Jeśli aplikacja proponuje logowanie, wybierz je: trafisz na tę samą stronę riff.quest co wyżej. Jeśli przyjmuje tylko stały klucz, utwórz go w **AI assistants → Nowy token**, nazwij go od aplikacji, zdecyduj, czy może wprowadzać zmiany, i od razu go skopiuj, bo pokazuje się tylko raz.

## Co potrafi

<Checklist items="Czyta twoje postępy::Profil, historię ćwiczeń, kalendarz, umiejętności, słabe punkty, cele tempa i ostatnie ocenione przebiegi|Przegląda bibliotekę::Ćwiczenia, utwory, ćwiczenie dnia, wyzwanie miesiąca i tę wiki|Planuje razem z tobą::Tworzy i edytuje plany ćwiczeń, dodaje utwory do twojej listy, ustawia i zmienia cele tempa|Zapisuje twoje ćwiczenie::Notuje sesję zagraną bez aplikacji, rozbitą na kategorie, umiejętności albo utwory. Daje punkty, Fame i podtrzymuje serię, tak jak raport wpisany ręcznie|Pisze ćwiczenia::Zamienia tab w twoje własne ćwiczenie, sprawdza je, pokazuje podgląd z odtwarzaniem i poprawia później" />

Nie dotknie niczego poza twoim kontem. Nie widzi danych innych graczy, nie może niczego publikować, nie zapisze cię też do rankingów, gildii ani pojedynków. Ćwiczenia, które tworzy, są prywatne.

<BlogAlert type="tip">
Na początek: „Podsumuj mój ostatni tydzień ćwiczeń”, „Zaplanuj 30-minutową sesję wokół mojej najsłabszej umiejętności”, „Ustaw cel 140 BPM na moim ćwiczeniu z kostkowania naprzemiennego”, „Zapisz 40 minut: 20 na kostkowanie naprzemienne i 20 na Back in Black” albo wklej riff i poproś „zrób z tego ćwiczenie, które mogę ćwiczyć”.
</BlogAlert>

## Limity

<StatRow stats="20:zmian dziennie|10:nowych ćwiczeń dziennie|60:zapytań na minutę" />

Odczyt nigdy nie liczy się do dziennego limitu. Każda zapisana zmiana mówi asystentowi, ile zostało na dziś, więc może cię uprzedzić, zanim limit się skończy.

## Co dzieje się z twoimi danymi

Asystent dostaje tylko to, o co poprosi riff.quest w twojej rozmowie, i tylko dopóki jest podłączony. To, co otrzyma, staje się częścią tej rozmowy, więc od tego momentu obowiązują zasady prywatności twojego dostawcy AI. riff.quest przechowuje samo połączenie (która aplikacja, kiedy ją podłączyłeś, co jej wolno), żeby móc ci je pokazać i odciąć. Szczegóły są w [polityce prywatności](/privacy-policy).

## Odłączanie

Otwórz **Ustawienia → AI assistants**. Aplikacje, do których się logowałeś, są pod **Połączone aplikacje**; **Odłącz** zatrzymuje je od razu. Klucze utworzone ręcznie są pod **Twoje tokeny**, gdzie **Unieważnij** robi to samo. Usunięcie konektora także w Claudzie porządkuje listę konektorów, ale to strona riff.quest naprawdę kończy dostęp.

## Pytania, które zadają gracze

<FaqList items="Czy muszę być supporterem?::Tak, odblokowuje to dowolna wpłata. Cała reszta riff.quest zostaje darmowa. Bez odznaki strona logowania riff.quest nie pozwoli się połączyć, a wcześniejsze połączenie przestaje działać, dopóki odznaka nie wróci|Czy to to samo co AI coach?::Nie. AI coach działa w riff.quest. Tu asystent, którego już używasz, czyta twoje konto, a riff.quest nie uruchamia przy tym żadnego AI|Czy zmieni coś bez pytania?::Domyślnie Claude pyta przed każdą zmianą, chyba że każesz mu zawsze na nią pozwalać. Jeśli nie włączyłeś Pozwól na zmiany, może tylko czytać|Czy widzi moje hasło albo e-mail?::Nie. Widzi dane o ćwiczeniu, nigdy hasło, i nie może zmieniać ustawień konta|Czy inni gracze zobaczą, co z nim zbuduję?::Nie. Ćwiczenia i plany, które zapisuje, są prywatne|Czy sesja zapisana przez asystenta liczy się do questów?::Liczy się do punktów, Fame, serii i czasu na umiejętności, ale postęp questów rośnie tylko przy sesjach zapisanych w samym riff.quest|Czy zapisze bardzo długą sesję?::Wszystko powyżej 6 godzin albo dłuższe niż czas od ostatniego wpisu musi najpierw z tobą potwierdzić, tak jak ostrzega aplikacja|Doszedłem do dziennego limitu::Zmiany odnawiają się następnego dnia. Odczyt działa w tym czasie dalej|Pisze, że połączenie jest nieprawidłowe::Usuń konektor w aplikacji AI i dodaj go jeszcze raz. Jeśli odłączyłeś go w riff.quest, i tak musisz zalogować się ponownie" />

<ReadNext links="Plany ćwiczeń i Auto Plan::/wiki/exercise-plans-and-auto-plan|Cele ćwiczeń::/wiki/exercise-goals|AI coach i cotygodniowe kamienie milowe::/wiki/ai-coach-and-weekly-milestones|Sposoby ćwiczenia::/wiki/practice-modes-overview" />
