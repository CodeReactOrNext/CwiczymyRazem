---
title: "Aplikacja na komputer"
description: "Co aplikacja na Windows, macOS i Linux dodaje w porównaniu ze stroną: wejście gitary prosto z interfejsu, mniejsze opóźnienie i kilka rzeczy, których karta przeglądarki po prostu nie potrafi."
slug: "desktop-app"
section: "Practice"
order: 5
---

riff.quest działa świetnie w przeglądarce i nic z tego artykułu nie jest potrzebne, by ćwiczyć, zapisywać sesje czy wspinać się w rankingach. Aplikacja na komputer istnieje z jednego powodu: przeglądarka to kiepskie miejsce, żeby podłączyć do niej gitarę. Wszystko w audio staje się lepsze, gdy aplikacja rozmawia z twoim interfejsem bezpośrednio.

To to samo konto i te same dane. Zapisz sesję na komputerze, a sekundę później jest w przeglądarce na twoim telefonie.

## Jak ją zdobyć

Na dole lewego menu jest karta **Pobierz aplikację na komputer**. Jest na stronie i znika, gdy uruchomisz aplikację, co jest niezłym sposobem, żeby poznać, w której jesteś.

**Cały sens instalacji polega na tym, że audio brzmi i działa lepiej.** Przeglądarka przepuszcza twoją gitarę przez kilka warstw instalacji mikrofonowej, zanim riff.quest ją w ogóle zobaczy; aplikacja sama otwiera twój interfejs, przez sterownik. Zmieniają się dwie rzeczy i to one są powodem, żeby się fatygować:

- **Działa płynniej.** Mniej zerwań, mniej chwil, gdy wykrywanie staje w środku przebiegu i nie wiesz, czy to ty, czy oprogramowanie.
- **Opóźnienie spada.** Nie do zera — żaden komputer tego nie robi — ale na tyle, że przerwa między zagraniem nuty a reakcją aplikacji przestaje być czymś, co zauważasz podczas gry.

Wszystko inne na tej stronie to miły dodatek. To jest nagłówek.

### Który plik chcesz?

Pobrania są na stronie wydań: **[github.com/Michaljapko/riff-quest-releases/releases](https://github.com/Michaljapko/riff-quest-releases/releases)**. Weź najnowsze wydanie na górze, otwórz pod nim **Assets** i wybierz jeden plik pasujący do twojego komputera.

<Screenshot src="/images/wiki/desktop-release-assets.webp" alt="Lista Assets w wydaniu na GitHubie, zawierająca dwanaście pozycji: latest-linux.yml, latest-mac.yml, latest.yml, riff.quest-0.1.7-arm64-mac.zip, riff.quest-0.1.7-arm64.dmg, riff.quest-0.1.7.AppImage, riff.quest-Setup-0.1.7.exe, kilka plików .blockmap i archiwa kodu źródłowego" caption="Dłuższa, niż musi być. Wszystko kończące się na .yml lub .blockmap to maszyneria automatycznej aktualizacji, a Source code jest dla programistów — chcesz dokładnie jeden z czterech poniżej." />

<Checklist items="Windows::riff.quest-Setup-[wersja].exe — zwykły instalator, dwukrotne kliknięcie i gotowe|macOS, Apple Silicon::riff.quest-[wersja]-arm64.dmg — otwórz go i przeciągnij aplikację. Obok leżący -arm64-mac.zip zawiera dokładnie tę samą aplikację, na wypadek gdybyś nie chciał montować obrazu dysku|macOS, Intel::Nie ma. Maki z Intelem zostają przy stronie|Linux::riff.quest-[wersja].AppImage — oznacz jako wykonywalny i uruchom, bez instalacji" />

<BlogAlert type="info">
Zignoruj wszystko inne z tej listy. Pliki `.yml` i `.blockmap` służą aplikacji do sprawdzania i pobierania własnych aktualizacji później; pobieranie ich ręcznie nic nie daje. **Source code** to projekt, a nie program.
</BlogAlert>

<BlogAlert type="warning">
Buildy nie są podpisane płatnym certyfikatem, więc pierwsze uruchomienie zostaje zatrzymane: Windows pokazuje panel SmartScreen, gdzie **Więcej informacji → Uruchom mimo to** cię przeprowadzi, a macOS odmawia zwykłego dwukrotnego kliknięcia, gdzie **prawy przycisk → Otwórz** działa. To jednorazowe, na instalację.
</BlogAlert>

<BlogAlert type="tip">
Potem aktualizuje się sama. Gdy nowa wersja zostanie pobrana, dostajesz powiadomienie z przyciskiem do ponownego uruchomienia w niej, więc tę stronę odwiedzasz tylko raz. Bardzo stare instalacje w końcu przestają być akceptowane i poproszą o pobranie nowej, więc skorzystaj z restartu, gdy jest oferowany.
</BlogAlert>

## Co naprawdę dostajesz

<Checklist items="Bezpośrednie wejście gitary::Aplikacja sama otwiera twój interfejs audio, przez sterownik, zamiast przechodzić przez instalację mikrofonową przeglądarki. Mniejsze opóźnienie, bez tańca ze zgodami, i łapie prawdziwy kanał gitary|Wybierz wejście porządnie::Wybierz urządzenie, wybierz kanał, na którym masz wtyk, i ustaw rozmiar bufora. Mały bufor, mniejsze opóźnienie. Zbyt mały, trzaski|Twój ekran nie gaśnie::Czytanie tabulatur podczas grania oznacza długie okresy bez klawiatury i myszy. Aplikacja każe systemowi zostawić wyświetlacz w spokoju|Postęp sesji na pasku zadań::Ikona docka lub paska zadań wypełnia się, gdy trwa ćwiczenie|Szybkie akcje z zasobnika::Przeskocz prosto do Startu, Moich ćwiczeń lub Dziennika ćwiczeń bez szukania okna|Mała plakietka na avatarze::Inni gracze widzą małą ikonę monitora obok ciebie w pasku online. Wyłącznie na pokaz" />

## Czy warto dla ciebie?

<StepList steps="Grasz na elektryku przez interfejs::Tak, bez wątpienia. To zestaw, dla którego wszystko zbudowano, i tu płynniejsze wejście z mniejszym opóźnieniem naprawdę się pokazuje|Grasz na akustyku do mikrofonu laptopa::Niezbyt. Wykrywanie działa tak czy inaczej i zyskujesz bardzo mało|Ćwiczysz na telefonie lub służbowym laptopie::Zostań przy stronie. Niczego z twoich postępów tam nie brakuje|Trzymasz aplikację otwartą cały dzień::Warto dla zasobnika, szybkich akcji i ekranu, który nie przygasa w środku ćwiczenia" />

## Pytania, które ludzie zadają

<FaqList items="Czy potrzebuję jej do wykrywania nut?::Nie. Wykrywanie działa w przeglądarce przez mikrofon lub interfejs. Aplikacja na komputer sprawia tylko, że jest szybsze i bardziej niezawodne|Czy to płatna funkcja?::Nie, aplikacja przychodzi z kontem|Czy ćwiczenie w aplikacji liczy się tak samo?::Identycznie. Te same punkty, ta sama seria, te same umiejętności, te same rankingi|Czy mogę używać obu?::Tak, i większość ludzi tak robi: aplikacja na komputer przy gitarze, strona na telefonie, żeby sprawdzić rankingi|Który plik potrzebuję?::Po jednym na system: .exe na Windows, arm64 .dmg na Macu z Apple Silicon, .AppImage na Linuksie. Makow z Intelem nie budujemy|Mój komputer mówi, że aplikacja nie jest bezpieczna::To brak certyfikatu podpisującego, a nie problem z pobranym plikiem. Windows: Więcej informacji, potem Uruchom mimo to. macOS: kliknij aplikację prawym przyciskiem i wybierz Otwórz|Aplikacja mówi, że jest za stara, by działać::Twojej instalacji ominęły aktualizacje. Pobierz aktualną z linku na tym ekranie, a zachowasz wszystko" />

<ReadNext links="Wykrywanie nut i ustawienie mikrofonu::/wiki/note-detection|Sposoby ćwiczenia::/wiki/practice-modes-overview|Zapisywanie sesji ćwiczeniowej::/wiki/practice-sessions-and-logging|Pierwsze kroki::/wiki/getting-started" />
