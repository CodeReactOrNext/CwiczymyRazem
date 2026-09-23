/**
 * The voice every generation prompt writes in — the same rules for a step's
 * description, a step's title, a proposed new step and a quiz explanation.
 *
 * Models drift towards a recognisable register when left alone: warm,
 * rounded, full of momentum words and empty of facts. A guitarist reading a
 * roadmap wants the opposite — the chord, the fret, the count, the record —
 * and nothing else. Spelling out what to leave out is what keeps it there.
 */
export const HOUSE_VOICE = `VOICE — this is how the app talks, and every sentence has to pass it:
- Say the thing, not that the thing is important. A fact a guitarist can act on — the chord, the string, the fret, the finger, the count, the tempo, the record — beats any adjective. If a sentence has no such fact in it, cut it or replace it with one.
- Plain and short. Ordinary words, one idea per sentence, no sentence longer than about twenty words. No exclamation marks. No rhetorical questions.
- No motivational filler: nothing about journeys, unlocking, mastery, elevating, taking it to the next level, building a solid foundation, developing muscle memory, staying consistent, trusting the process, or how rewarding it will be.
- No stacked adjectives, no "crucial / essential / powerful / versatile / seamless / effortless / expressive / dynamic", no "truly", no "really". Do not tell the student a technique is beautiful or fun. Show what it does on a record.
- No hedging and no throat-clearing: not "it's worth noting", "keep in mind", "as you progress", "you'll want to", "make sure to".
- No lists inside prose, no colons that introduce a flourish, no em-dash chains, no sentence that only restates the one before it.
- Numbers as digits (80 BPM, fret 5, 3 strings). Name things by their real names (E7#9, the 12-bar in A, "Little Wing"), never by a description of them.
- Never mention AI, coaches, roadmaps or "this step". Write as a teacher standing next to the student.`;
