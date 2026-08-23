# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- Song practice with a Guitar Pro tab can now play a backing track along with it, locked to the tab's own clock — so pausing, restarting, clicking a bar or looping a section takes the recording with it. On the desktop app the track is an audio file from your computer (imported into the app, so moving the original never breaks it); in the browser it can be a YouTube video. A YouTube backing video sits directly above the tablature, in the same column as the notation, with its controls beside it rather than behind a dialog — or, in cinema mode, fills the whole session behind the tab so practising feels like playing along to the music video — so the track can be shifted while you play — arrows or the [ and ] keys move it 20 ms at a time (100 ms with Shift) and you hear it immediately. A song can hold several files at once — backing, guitar, vocals — imported in one go and played as layers of the same recording, each with its own level, mute and solo. Lining them up has its own screen, laid out like an audio editor: a map of the whole recording along the top, a zoomable lane below it showing the waveform with the tab's numbered bars drawn over it, and the practice session still playing behind so every adjustment is heard at once. Drag the wave onto the bar lines, click the map to jump elsewhere in the track, or press "snap to first sound" to get most of the way in one click. A YouTube video keeps its audio to itself, so there it works by ear instead: play along and tap T on the beat, and the video slides into place. A sync offset slider lines the recording up with the first beat, and changing the session tempo speeds the track up or slows it down without touching its pitch. A file follows any tempo; YouTube only plays at its own fixed speeds, so at other tempos the video runs free and the panel offers the nearest tempos it can actually stay locked to.
- The Wiki is finished and rewritten for players rather than developers: new pages for getting started, the Home screen and daily quests, the Free/Pro/Master plans, every way of practising, monthly challenges and recordings — and the existing pages no longer talk in URLs, internal names or scoring formulas. Screens are illustrated with mock previews (the quest card, the log form, the song board, the plan comparison) built from real components, so the guides stay accurate without screenshots.
- Four new listening exercises you answer on screen, no mic needed: name the chord quality (major, minor, 7, maj7, m7, dim, sus4), rebuild a chord progression from Roman-numeral tiles, tune a note by ear with a slider until the beating stops, and name the scale or mode played over its own drone. They come as eight exercises across two difficulty levels, plus an "Ear Training Lab" plan that runs through all four.
- Marketplace purchases now show up in the activity feed — the item, its seller and the price paid are visible to everyone, and other players can motivate the buyer for it just like any other activity.
- You can now heart your favorite plans and exercises — hearted items get pinned to the top of their lists, and a new Favorites page gathers all of them in one place for quick access.

### Changed
- Sesja ćwiczeń na telefonie (pionowo) oddaje ekran ćwiczeniu: tempo, prędkość odtwarzania, strojenie, głośność, mikrofon i instrukcje schowały się pod jeden rząd ikon nad przyciskami sterowania, a szczegóły otwierają się w wysuwanym panelu dopiero na żądanie. Górny pasek jest niższy, ma pasek postępu planu i wbudowany timer, więc czas widać cały czas bez osobnego wiersza.

### Removed
- Widok "3D Highway" został wycofany z sesji ćwiczeń i z Ustawień → Tablatura. Zostają tabulatura i nuty. Jeśli miałeś 3D ustawione jako widok domyślny, sesja otworzy się na zwykłej tabulaturze — nic nie trzeba zmieniać ręcznie, reszta ustawień wyglądu tabulatury zostaje bez zmian.

### Fixed
- Naprawiono problem z Google Translatorem powodujący błędy
- Błędy z przeglądarki znowu trafiają do Sentry — po przejściu na Next 16 (Turbopack) klient Sentry w ogóle się nie uruchamiał, więc awarie po stronie użytkownika nigdzie nie były zgłaszane. Dodatkowo `console.warn`/`console.error` lądują teraz w logach Sentry, a błędy z preview deploymentów nie mieszają się z produkcyjnymi.

