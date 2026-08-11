# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- Four new listening exercises you answer on screen, no mic needed: name the chord quality (major, minor, 7, maj7, m7, dim, sus4), rebuild a chord progression from Roman-numeral tiles, tune a note by ear with a slider until the beating stops, and name the scale or mode played over its own drone. They come as eight exercises across two difficulty levels, plus an "Ear Training Lab" plan that runs through all four.
- Marketplace purchases now show up in the activity feed — the item, its seller and the price paid are visible to everyone, and other players can motivate the buyer for it just like any other activity.
- You can now heart your favorite plans and exercises — hearted items get pinned to the top of their lists, and a new Favorites page gathers all of them in one place for quick access.

### Fixed
- Naprawiono problem z Google Translatorem powodujący błędy
- Błędy z przeglądarki znowu trafiają do Sentry — po przejściu na Next 16 (Turbopack) klient Sentry w ogóle się nie uruchamiał, więc awarie po stronie użytkownika nigdzie nie były zgłaszane. Dodatkowo `console.warn`/`console.error` lądują teraz w logach Sentry, a błędy z preview deploymentów nie mieszają się z produkcyjnymi.

