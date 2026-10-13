---
title: "Wykrywanie nut i ustawienie mikrofonu"
description: "Jak aplikacja słucha twojej gitary, które ćwiczenia z niego korzystają, kalibracja, dzięki której jest dokładne, i co robić, gdy nic nie słyszy."
slug: "note-detection"
section: "Practice"
order: 4
---

Niektóre ćwiczenia nie tylko pokazują, co grać, ale to sprawdzają. Włącz **Wykrywanie**, a aplikacja słucha twojej gitary przez mikrofon lub interfejs audio, ustala, jaka nuta wybrzmiała, i porównuje ją z tym, co było na ekranie. To różnica między ćwiczeniem, które odhaczasz, a ćwiczeniem, które się z tobą spiera.

<ClickPath steps="Ćwiczenia|dowolne ćwiczenie|Wykrywanie" caption="Przycisk leży obok elementów sterowania odtwarzaniem i robi się zielony, gdy aplikacja słucha." />

<BlogAlert type="info">
Nic z tego nie jest wymagane. Każde ćwiczenie można ćwiczyć z wyłączonym wykrywaniem, a twoje punkty pochodzą z czasu, który zapisujesz, a nie z tego, jak dokładnie grałeś. Wykrywanie zmienia ćwiczenie, nie nagrodę.
</BlogAlert>

## Co naprawdę potrafi usłyszeć

<Checklist items="Ćwiczenia z tabulaturą::Każda zagrana nuta jest porównywana z tą, która była należna, i zapala się jako trafienie lub pudło, gdy kursor ją mija|Wzory strummingu::Nasłuchuje ataku, a nie wysokości, więc uderzenia w dół, w górę i wyciszone trafiają w odpowiedni slot|Polowanie na nuty::Dostajesz nazwę nuty i musisz znaleźć każdą jej oktawę na gryfie. Zagranie jednej oznacza ją jako znalezioną|Polowanie na akordy::Ten sam pomysł z akordem: graj jego dźwięki gdziekolwiek na gryfie, aż wszystkie będą odhaczone|Trening słuchu::Aplikacja gra frazę, a ty powtarzasz ją na gitarze zamiast klikać odpowiedź" />

Dwóch rzeczy celowo nie słucha. Ćwiczenia gryfu, w których masz **kliknąć** nutę na ekranie, działają myszą lub palcem, celowo, żeby można było z nich korzystać w pociągu. A każde polowanie ma ręczne wyjście awaryjne: możesz sam odhaczyć oktawę lub dźwięk akordu i przejść do następnego celu, gdy go znajdziesz, tak działają polowania z wyłączonym mikrofonem.

## To nie on jest sędzią. Twoje uszy są.

Warto być tu szczerym, bo zielone ptaszki przekonują, a nie powinny.

Aplikacja tylko mierzy wysokość. Nie ma zdania, czy brzmiałeś dobrze. Nuta zagrana martwym, zduszonym dźwiękiem, spóźniona o pół uderzenia, z trzema innymi strunami brzęczącymi pod spodem, jest **trafieniem** z punktu widzenia wykrywania — usłyszało właściwą częstotliwość. To nie to samo co zagranie jej dobrze.

Daje się też oszukać w obie strony:

<Checklist items="Daje ci nuty, których nie zagrałeś::Dźwięcząca pusta struna, flażolet lub ogon poprzedniej nuty mogą trafić w wysokość, na którą czekało, i odhaczyć pole za ciebie|Pomija nuty, które zagrałeś czysto::Szybkie przebiegi, mocna dystorsja, mikrofon pokojowy, niskie B — wszystko naprawdę trudne do odczytania i nic z tego nie jest twoją winą|Nie słyszy większości tego, co się liczy::Mierzy czas twoich ataków, a w ćwiczeniach z podciąganiem sprawdza, jak blisko wysokości dochodzi każde podciągnięcie. Dynamika, brzmienie i to, czy fraza oddychała, w ogóle nie są mierzone, więc nic z tego nie pokazuje się w wyniku" />

Traktuj więc wynik tak, jak traktowałbyś metronom: użyteczna druga opinia w jednym wąskim pytaniu, a nie wyrok o twoim graniu. Jeśli twoje ucho mówi, że bieg był niedbały, a ekran mówi 98%, **twoje ucho ma rację**. Jeśli ekran mówi, że pominąłeś nutę, o której wiesz, że ją trafiłeś, zagraj jeszcze raz i posłuchaj — jeśli brzmiała dobrze, była dobra, a oprogramowanie się myliło.

<BlogAlert type="important">
Wykrywanie to narzędzie do łapania błędnych nut, gdy uczysz się czegoś nowego i jeszcze nie słyszysz własnych błędów. Nie zastępuje nauki ich słyszenia. Celem jest potrzebować go z czasem coraz mniej, a nie gonić za wyższym procentem.
</BlogAlert>

## Co ocenia wynik ćwiczenia

Każda nuta, którą aplikacja usłyszy, jest trafieniem. Ile warte jest trafienie, zależy od tego, o czym jest ćwiczenie.

**W większości ćwiczeń timing.** Nuta w uderzeniu zachowuje wszystkie punkty, nieco poza — dwie trzecie, a wyraźnie poza uderzeniem — jedną trzecią. Mała strzałka pod nutą pokazuje, w którą stronę ją chybiłeś: w lewo, jeśli byłeś za wcześnie, w prawo, jeśli za późno. Podsumowanie po przebiegu mówi, w którą stronę ogólnie się przechylasz.

**W ćwiczeniach z podciąganiem wysokość.** Każda nuta jest oceniana według tego, jak jest w stroju. Podciągnięcie lub puszczenie liczy się według tego, jak blisko dochodzi do nuty, w którą celuje, a nuta trzymana według tego, gdzie leży, gdy dzwoni, więc zbyt mocny nacisk i pójście w górę jest widoczne. Dokładnie w wysokość zachowuje wszystko, trochę obok dwie trzecie, a dalej jedną trzecią. Timing tam nic nie kosztuje. Strzałki pod nutami nadal go pokazują, ale podsumowanie po przebiegu dotyczy wysokości i mówi, czy twoje nuty zwykle lądują za nisko, czy za wysoko.

Gdy nuta dzwoni, mały stroik nad nią pokazuje, gdzie jest struna: kropka leży w zielonym paśmie, gdy jesteś w stroju, a sama nuta wypełnia się zielenią, bursztynem lub pomarańczem odpowiednio. Nuta, która wylądowała obok, zachowuje swój odczyt, na przykład +28¢ ze strzałką w górę dla za wysoko. Gdy podciągasz, krzywa obok nuty wypełnia się, gdy struna rośnie, i robi się zielona, gdy dojdziesz do wysokości.

Wykres pod podsumowaniem pokazuje każdą nutę przebiegu po kolei: jak daleko od uderzenia wylądowała każda, a w ćwiczeniach z podciąganiem od swojej wysokości, z zielonym pasmem zaznaczającym najwyższą ocenę. Przebieg, który zaczyna się ciasno, a dryfuje w miarę męczenia się ręki, widać tam od razu.

Jeśli każda nuta przechyla się w tę samą stronę o mniej więcej tyle samo, to zwykle jest to opóźnienie audio, a nie twoje ręce. Z włączonym mikrofonem naciśnij **Kalibracja timingu** obok wyniku nad tabulaturą i zagraj razem z kilkoma klikami. Aplikacja zmierzy opóźnienie twoich głośników lub interfejsu i od tej pory będzie oceniać względem niego.

## Konfiguracja

Przy pierwszym razie, gdy ćwiczenie tego potrzebuje, dostajesz monit **Śledzenie mikrofonem** z **Włącz mikrofon** i **Pomiń**. Wybranie włączenia uruchamia **Kalibrację gitary**, krótki kreator, który trzeba zrobić tylko raz na konfigurację.

<StepList steps="Jak jest podłączona gitara?::Interfejs audio, jeśli jest wpięta w skrzynkę USB lub Thunderbolt, Mikrofon, jeśli grasz akustycznie do laptopa lub mikrofonu USB|Przyznaj dostęp::Przeglądarka pyta raz. Powiedz tak, bo inaczej nic dalej nie działa|Ustaw poziom::Miernik Poziom sygnału robi się zielony, gdy jesteś wystarczająco głośno. Przeciągnij wzmocnienie albo pozwól ustawieniu automatycznemu posłuchać twojego grania i wybrać|Zagraj każdą strunę::Jesteś proszony o wszystkie sześć, po jednej, żeby aplikacja nauczyła się, jak daleko twoja gitara jest od stroju koncertowego, i przestała nazywać lekko niskie G fisem|Potwierdź::Podsumowanie pokazuje zmierzone przesunięcie na strunę. To wszystko, zapisane" />

<BlogAlert type="tip">
Kalibruj w pokoju i na sprzęcie, na którym naprawdę ćwiczysz. Kalibracja zrobiona na słuchawkach w cichym mieszkaniu to nie ta kalibracja, której chcesz przy głośnym wzmacniaczu.
</BlogAlert>

## Narzędzia mikrofonu

Obok przycisku Wykrywanie jest mała strzałka z rzeczami, których potrzebujesz od czasu do czasu, a nie codziennie.

<Screenshot src="/images/wiki/pitch-detect-tools.webp" alt="Pasek narzędzi sesji: przycisk strojenia z napisem Half Step Down, zielony przycisk Wykrywanie i otwarte menu z pozycjami Skalibruj ponownie, Stroik i „Mikrofon nie działa?”" caption="Wykrywanie robi się zielone, gdy aplikacja słucha. Przycisk strojenia leży po jego lewej, pokazując strój, w którym jesteś." maxWidth="520px" />

<Checklist items="Skalibruj ponownie::Ponownie uruchamia kreatora. To naprawa niemal każdej skargi „słyszy złą nutę” po zmianie gitary, pokoju lub interfejsu|Stroik::Prawdziwy stroik, bez opuszczania ćwiczenia|Mikrofon nie działa?::Lista rozwiązywania problemów plus przycisk, który czyści zapisaną konfigurację mikrofonu, żebyś mógł zacząć od zera" />

## Strojenie ma większe znaczenie, niż myślisz

Wykrywanie porównuje to, co słyszy, z tym, czego oczekuje, więc musi wiedzieć, jak twoja gitara jest nastrojona. Przycisk strojenia w tym samym rzędzie obejmuje **Standard**, **Drop D**, **Half Step Down**, **Whole Step Down**, **Drop C#/Db**, **Drop C**, **Open D**, **Open G** i **DADGAD**, a cele przesuwają się odpowiednio, więc granie tam, gdzie naturalnie byś grał, nadal się liczy.

<BlogAlert type="warning">
Niektóre ćwiczenia blokują strojenie, bo ćwiczenie ma sens tylko w stroju, dla którego zostało napisane. Gdy jest zablokowane, przycisk mówi o tym zamiast się otwierać.
</BlogAlert>

## Gdy to nie jest opcjonalne

Egzaminy Ścieżki nauki, które oceniają twoje granie, wymagają wykrywania i nie pozwolą pominąć monitu: moduł nie może cię ocenić z czegoś, czego nie słyszy. Wszędzie indziej pomijanie jest normalnym, wspieranym sposobem korzystania z aplikacji.

## Gdy nic nie słyszy

<Checklist items="Ktoś inny ma mikrofon::Zoom, Discord, OBS, druga karta przeglądarki. Tylko jedna aplikacja naraz dostaje wejście o niskim opóźnieniu, więc zamknij inne|Wybrane jest złe wejście::Ustaw właściwe urządzenie jako domyślne w systemie, potem odśwież|System to blokuje::Windows i macOS mają ekran prywatności dla dostępu do mikrofonu, a twoja przeglądarka musi tam mieć zgodę, tak samo jak na stronie|Za cicho lub za mocno::Szept i ściana dystorsji są równie trudne do odczytania. Celuj w zielone pasmo na mierniku poziomu|Rozstrojona::Wykrywanie to porównanie wysokości. Najpierw uruchom Stroik, potem Skalibruj ponownie" />

<BlogAlert type="takeaway">
Jeśli wykrywanie walczy z tobą dłużej niż kilka minut, wyłącz je i graj dalej. Zapisana sesja z wyłączonym mikrofonem jest warta dokładnie tyle samo, co z włączonym.
</BlogAlert>

## Pytania, które ludzie zadają

<FaqList items="Czy potrzebuję interfejsu audio?::Nie. Mikrofon laptopa działa przy większości ćwiczeń. Interfejs jest czystszy, cichszy i szybszy, a aplikacja na komputer czyni go jeszcze szybszym|Czy wykrywanie zmienia moje punkty?::Nie. Punkty pochodzą z czasu, który zapisujesz, i twoich zdrowych nawyków. Dokładność wpływa na własny wynik ćwiczenia i jego gwiazdki, nie na twój poziom|Dlaczego pomija nuty, które na pewno zagrałem?::Zwykle to kalibracja lub strój. Nastrój, potem Skalibruj ponownie. Szybkie przebiegi na przesterowanym brzmieniu przez mikrofon pokojowy też są naprawdę trudne do odczytania|Czy mogę używać go na telefonie?::Tak, ścieżka mikrofonu w przeglądarce działa na urządzeniach mobilnych, choć telefon w głośnym pokoju to najtrudniejszy przypadek|Słyszy też mój wzmacniacz lub podkład::Będzie. Graj przez słuchawki, gdzie możesz, i utrzymuj ciszę w pokoju podczas polowań|Czy mogę ćwiczyć ćwiczenie z mikrofonem bez mikrofonu?::Tak. Polowania pozwalają odhaczyć ręcznie to, co znalazłeś, i iść dalej, a ćwiczenia z tabulaturą po prostu przechodzą bez oceny" />

<ReadNext links="Sposoby ćwiczenia::/wiki/practice-modes-overview|Aplikacja na komputer::/wiki/desktop-app|Rutyny ćwiczeń i plan automatyczny::/wiki/exercise-plans-and-auto-plan|Ścieżka nauki i Mapa skal::/wiki/journey-and-scale-tree" />
