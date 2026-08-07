import { NOTES } from "utils/audio/noteUtils";

import type { FretDiagramData, FretDiagramString, JourneyModule } from "../types/journey.types";

// Pitch class (0=C..11=B) of each open string, 1 = high e .. 6 = low E — mirrors
// feature/exercisePlan/scales/fretboardMapper's STANDARD_TUNING, so every note
// name below is computed, not hand-typed.
const OPEN_PITCH_CLASS: Record<number, number> = { 1: 4, 2: 11, 3: 7, 4: 2, 5: 9, 6: 4 };

function notesForString(stringNum: number, startFret: number, endFret: number): string[] {
  const open = OPEN_PITCH_CLASS[stringNum];
  const notes: string[] = [];
  for (let fret = startFret; fret <= endFret; fret++) notes.push(NOTES[(open + fret) % 12]);
  return notes;
}

/** All 6 strings shown bright, no note labels — a plain neck overview. */
function emptyNeck(startFret: number, endFret: number): FretDiagramData {
  return { startFret, endFret, strings: [1, 2, 3, 4, 5, 6].map((s) => ({ string: s, active: true })) };
}

/**
 * Highlights only the note pairs needed to show an "octave shape": the open note on
 * `lowString`, and that same note one octave higher at `jumpFret` on `highString`. Every
 * other cell stays blank — a focused schema instead of a full note list.
 */
function octaveShapeDiagram(pairs: { lowString: number; highString: number; jumpFret: number }[]): FretDiagramData {
  const endFret = Math.max(...pairs.map((p) => p.jumpFret));
  const blankRow = (): string[] => Array.from({ length: endFret + 1 }, () => "");
  const strings: FretDiagramString[] = [1, 2, 3, 4, 5, 6].map((s) => {
    const pair = pairs.find((p) => p.lowString === s || p.highString === s);
    if (!pair) return { string: s, active: false };
    const notes = blankRow();
    if (pair.lowString === s) notes[0] = notesForString(s, 0, 0)[0];
    else notes[pair.jumpFret] = notesForString(s, pair.jumpFret, pair.jumpFret)[0];
    return { string: s, active: true, notes };
  });
  return { startFret: 0, endFret, strings };
}

/** Builds a 6-string fretboard diagram; `activeStrings` get computed note labels, the rest render dimmed. */
function diagram(startFret: number, endFret: number, activeStrings: number[]): FretDiagramData {
  const strings: FretDiagramString[] = [];
  for (let s = 1; s <= 6; s++) {
    strings.push(
      activeStrings.includes(s)
        ? { string: s, active: true, notes: notesForString(s, startFret, endFret) }
        : { string: s, active: false },
    );
  }
  return { startFret, endFret, strings };
}

export const fretboardMasteryModule: JourneyModule = {
  id: "fretboard",
  title: "Fretboard Mastery",
  subtitle: "Know every note, everywhere on the neck",
  locked: false,
  icon: "Grid3x3",
  stages: [
    {
      id: "stage_1",
      order: 1,
      label: "Fundamentals",
      steps: [
        {
          id: "step_fretboard_intro",
          order: 1,
          stageId: "stage_1",
          modalOnly: true,
          title: "Before You Begin",
          shortDescription: "A quick map of the neck before you start clicking.",
          fullDescription: "",
          tips: [],
          commonMistakes: [],
          examGoal: "Tick all the boxes below to confirm you're ready to begin.",
          suggestedExerciseId: "",
          stepIcon: "BookOpen",
          contentBlocks: [
            {
              type: "text",
              body: "Heads up, this path works differently than Guitar Fundamentals: you're not going to play anything. A note name pops up, you click where it lives on the fretboard, and you find out right away if you got it. No mic, no guitar plugged in. Just you and the map you're about to build in your head, before you ever pick up the instrument.",
            },
            {
              type: "callout",
              icon: "Lightbulb",
              label: "Why bother memorizing this",
              body: "Right now you probably find notes by shape, not by name: the pentatonic box, the A-shape barre chord. Nothing wrong with that, but it only gets you as far as the shapes you've already learned. Once you actually know the fretboard, you can play a melody straight out of your head anywhere on the neck, read a chord chart with no diagram, and just tell your bandmate 'hit the C on the A string' instead of pointing at your guitar.",
            },
            {
              type: "callout",
              icon: "Guitar",
              label: "String names, thick to thin",
              body: "Standard tuning, thickest string to thinnest: E - A - D - G - B - e. That last one's lowercase on purpose: it's a high E, an octave above the fat low E up top.",
            },
            {
              type: "fretDiagram",
              diagram: emptyNeck(0, 12),
            },
            {
              type: "callout",
              icon: "Dot",
              label: "The inlay dots are landmarks",
              body: "Frets 3, 5, 7 and 9 get a single dot; fret 12 gets two. They're not there to look nice. They're the fastest way to know where you are without counting from zero every single time, and you'll lean on them constantly in this path.",
            },
            {
              type: "callout",
              icon: "Repeat",
              label: "What 'the same note' means here",
              body: "Every note name (C, C#, D...) shows up over and over across the neck: same letter, different string, different pitch. We'll loosely call any of those repeats 'an octave' of the note, same as the rest of the app does. So when an exercise asks for a note, your job is to find every spot it lives in the highlighted zone, not just the first one you spot.",
            },
          ],
          checklist: [
            { text: "I know the 6 open string names (low to high): E A D G B e", icon: "Guitar" },
            { text: "I know what a fret is and how frets are numbered", icon: "Hash" },
            { text: "I can see the inlay dots on my own guitar (or the diagram above)", icon: "Dot" },
            { text: "I understand I'll be clicking a diagram, not playing my guitar, in this path", icon: "MousePointerClick" },
          ],
        },
        {
          id: "step_fret_low_e_open",
          order: 2,
          stageId: "stage_1",
          title: "Low E String: Open Position",
          shortDescription: "Learn every note on the thickest string, frets 0 to 6.",
          fullDescription: "",
          tips: [],
          commonMistakes: [],
          examGoal: "Click the correct fret on the low E string for at least 90% of the notes that come up.",
          suggestedExerciseId: "fret_click_low_e_open",
          stepIcon: "Guitar",
          contentBlocks: [
            {
              type: "text",
              body: "The low E string is the anchor for the whole guitar. Root notes for barre chords and scale shapes get measured from here, and honestly, most rock and metal riffs never even leave this string. Let's start at the bottom, frets 0 through 6:",
            },
            { type: "fretDiagram", diagram: diagram(0, 6, [6]) },
            {
              type: "callout",
              icon: "Info",
              label: "Only one gap with no sharp",
              body: "One thing worth noticing early: E to F (fret 0 to fret 1) is a half-step, no note squeezed in between. Same deal with B to C, wherever you find it on the neck. Everywhere else, there's a sharp or flat sitting between two neighboring letters.",
            },
          ],
        },
        {
          id: "step_fret_low_e_high",
          order: 3,
          stageId: "stage_1",
          title: "Low E String: Upper Position",
          shortDescription: "Extend your low E knowledge from fret 6 to fret 12.",
          fullDescription: "",
          tips: [],
          commonMistakes: [],
          examGoal: "Click the correct fret on the low E string for at least 90% of the notes that come up.",
          suggestedExerciseId: "fret_click_low_e_high",
          stepIcon: "Guitar",
          contentBlocks: [
            {
              type: "text",
              body: "Same string, second half. Fret 12 just repeats the open string an octave higher, so think of it as the ceiling, and a handy way to double-check yourself.",
            },
            { type: "fretDiagram", diagram: diagram(6, 12, [6]) },
            {
              type: "callout",
              icon: "Dot",
              label: "Use the dots",
              body: "Frets 7 and 9 have inlay dots (B and C# here). Use them. Don't count all the way up from fret 6 every single time, that's exactly what the dots are for.",
            },
          ],
        },
        {
          id: "step_fret_a_open",
          order: 4,
          stageId: "stage_1",
          title: "A String: Open Position",
          shortDescription: "Learn every note on the A string, frets 0 to 6.",
          fullDescription: "",
          tips: [],
          commonMistakes: [],
          examGoal: "Click the correct fret on the A string for at least 90% of the notes that come up.",
          suggestedExerciseId: "fret_click_a_open",
          stepIcon: "Guitar",
          contentBlocks: [
            {
              type: "text",
              body: "The A string is your second-favorite root, right behind low E, and it's what A-shape barre chords are built off. Frets 0 through 6:",
            },
            { type: "fretDiagram", diagram: diagram(0, 6, [5]) },
            {
              type: "callout",
              icon: "Ear",
              label: "The tuning-by-ear trick",
              body: "Fret 5 on the A string is D, same exact pitch as the open D string. That's the old tuning-by-ear trick: fret 5 on one string should match the open string right above it. Every guitarist's used this at least once.",
            },
          ],
        },
        {
          id: "step_fret_a_high",
          order: 5,
          stageId: "stage_1",
          title: "A String: Upper Position",
          shortDescription: "Extend your A string knowledge from fret 6 to fret 12.",
          fullDescription: "",
          tips: [],
          commonMistakes: [],
          examGoal: "Click the correct fret on the A string for at least 90% of the notes that come up.",
          suggestedExerciseId: "fret_click_a_high",
          stepIcon: "Guitar",
          contentBlocks: [
            {
              type: "text",
              body: "Now let's close the gap on the A string, from open position up to that 12th-fret octave.",
            },
            { type: "fretDiagram", diagram: diagram(6, 12, [5]) },
          ],
        },
        {
          id: "step_fret5_all",
          order: 6,
          stageId: "stage_1",
          title: "Fret 5: All Strings",
          shortDescription: "Scan a single fret across every string on the neck.",
          fullDescription: "",
          tips: [],
          commonMistakes: [],
          examGoal: "Click every correct string at fret 5 for at least 90% of the notes that come up.",
          suggestedExerciseId: "fret_click_fret5_all",
          stepIcon: "Target",
          contentBlocks: [
            {
              type: "text",
              body: "So far you've been scanning single strings. Time to flip it around: keep the fret fixed and scan across all 6 strings instead. Fret 5, every string:",
            },
            { type: "fretDiagram", diagram: diagram(5, 5, [1, 2, 3, 4, 5, 6]) },
            {
              type: "callout",
              icon: "Compass",
              label: "Why these frets specifically",
              body: "Frets 5, 7 and 9 aren't random. They're the three you'll keep coming back to for the rest of this path. Once you've got them down, they work like signposts on a map: no more counting up from the open string, just glance at the nearest one and read off from there. Bonus, fret 5 is also the root of a D barre chord built off the A-shape, if you already play that one.",
            },
            {
              type: "callout",
              icon: "Ear",
              label: "Why this fret is special",
              body: "On the E, A and D strings, fret 5 sounds exactly like the open string above it (E→A, A→D, D→G). The G string breaks the pattern though: to reach the open B string above it, you only need fret 4, not 5. Blame the guitar's one irregular tuning gap.",
            },
          ],
        },
        {
          id: "step_fret7_all",
          order: 7,
          stageId: "stage_1",
          title: "Fret 7: All Strings",
          shortDescription: "A second full-neck landmark: fret 7, all six strings.",
          fullDescription: "",
          tips: [],
          commonMistakes: [],
          examGoal: "Click every correct string at fret 7 for at least 90% of the notes that come up.",
          suggestedExerciseId: "fret_click_fret7_all",
          stepIcon: "Target",
          contentBlocks: [
            {
              type: "text",
              body: "Landmark number two. Fret 7 gets a single inlay dot on pretty much every guitar out there, and it's also where the classic E-shape barre chord turns into B major. Fret 7, every string:",
            },
            { type: "fretDiagram", diagram: diagram(7, 7, [1, 2, 3, 4, 5, 6]) },
            {
              type: "callout",
              icon: "Info",
              label: "A rule that never breaks",
              body: "Fret 7 is always a perfect fifth above whatever that string's open note is. Every string, no exceptions, unlike fret 5 and its G-string weirdness. It's genuinely the one reference point on the neck you can trust completely.",
            },
          ],
        },
        {
          id: "step_fret9_all",
          order: 8,
          stageId: "stage_1",
          title: "Fret 9: All Strings",
          shortDescription: "The third landmark fret, completing your reference triangle.",
          fullDescription: "",
          tips: [],
          commonMistakes: [],
          examGoal: "Click every correct string at fret 9 for at least 90% of the notes that come up.",
          suggestedExerciseId: "fret_click_fret9_all",
          stepIcon: "Target",
          contentBlocks: [
            {
              type: "text",
              body: "Last landmark. Fret 9 sits right before the double-dot at fret 12, and it's the root of a C# major barre chord built off the E-shape. Fret 9, every string:",
            },
            { type: "fretDiagram", diagram: diagram(9, 9, [1, 2, 3, 4, 5, 6]) },
            {
              type: "callout",
              icon: "Milestone",
              label: "Three landmarks, one neck",
              body: "You've now got frets 5, 7 and 9 mapped across every string, a whole triangle of checkpoints packed into the first octave. From here on, don't count from the open string. Just find the nearest landmark and work from there.",
            },
          ],
        },
      ],
    },
    {
      id: "stage_2",
      order: 2,
      label: "Octaves",
      steps: [
        {
          id: "step_octaves_dg_open",
          order: 9,
          stageId: "stage_2",
          title: "D & G Strings: Open Position",
          shortDescription: "Scan two neighboring strings at once for the first time.",
          fullDescription: "",
          tips: [],
          commonMistakes: [],
          examGoal: "Click every correct spot on the D & G strings (frets 0-6) for at least 90% of the notes that come up.",
          suggestedExerciseId: "fret_click_octaves_dg_open",
          stepIcon: "Copy",
          contentBlocks: [
            {
              type: "text",
              body: "From here on you're hunting for the same note name across two strings at once, a different skill than scanning one string alone. Frets 0 through 6:",
            },
            { type: "fretDiagram", diagram: diagram(0, 6, [4, 3]) },
            {
              type: "callout",
              icon: "Copy",
              label: "Where 'the same note' shows up twice",
              body: "Look closely at this one: G shows up on the D string at fret 5, and again on the open G string at fret 0. G# does the same thing, D string fret 6, G string fret 1. Every other note in this window only lives on one of the two strings.",
            },
            {
              type: "text",
              body: "There's also an old shortcut guitarists use for finding real octaves, not just the same note name, the actual same note, one octave up. Take any note on the low E string, hop two strings up (skip the A string) and two frets over, and you land on that exact note an octave higher, on the D string. Same shape works going from the A string to the G string. People use this constantly, doubling a melody an octave up, or hunting down a bass note fast mid-solo:",
            },
            { type: "fretDiagram", diagram: octaveShapeDiagram([{ lowString: 6, highString: 4, jumpFret: 2 }, { lowString: 5, highString: 3, jumpFret: 2 }]) },
            {
              type: "callout",
              icon: "Copy",
              label: "How to read the shape",
              body: "Open low E, fret 0, is E. Hop two strings up and two frets over: D string, fret 2, also E, just an octave higher. Same deal on the A string: open A is A, hop two strings up and two frets over, and you land on the G string at fret 2, also A, an octave up.",
            },
            {
              type: "callout",
              icon: "AlertCircle",
              label: "Useful to verify, not to rely on",
              body: "Use this shape to double-check yourself, not to actually find notes while you're playing. If you catch yourself thinking 'two strings up, two frets over' mid-exercise, that's your cue to slow down and just read the note directly. And heads up, it's not universal: it only works for E→D and A→G. Cross the B string's irregular tuning gap (D→B, G→e) and you need three frets, not two, more on that in a couple of steps.",
            },
          ],
        },
        {
          id: "step_octaves_dg_high",
          order: 10,
          stageId: "stage_2",
          title: "D & G Strings: Upper Position",
          shortDescription: "Extend the D & G search into the upper neck.",
          fullDescription: "",
          tips: [],
          commonMistakes: [],
          examGoal: "Click every correct spot on the D & G strings (frets 6-12) for at least 90% of the notes that come up.",
          suggestedExerciseId: "fret_click_octaves_dg_high",
          stepIcon: "Copy",
          contentBlocks: [
            {
              type: "text",
              body: "Same two strings, just an octave higher. Frets 6 through 12:",
            },
            { type: "fretDiagram", diagram: diagram(6, 12, [4, 3]) },
            {
              type: "callout",
              icon: "Copy",
              label: "The double-up here",
              body: "C# shows up on the D string at fret 11, and again on the G string at fret 6. D lands on the D string at fret 12, and on the G string at fret 7. Same pattern as open position, just shifted up.",
            },
          ],
        },
        {
          id: "step_octaves_be_open",
          order: 11,
          stageId: "stage_2",
          title: "B & High e Strings: Open Position",
          shortDescription: "The top two strings: back to a normal perfect-fourth gap.",
          fullDescription: "",
          tips: [],
          commonMistakes: [],
          examGoal: "Click every correct spot on the B & high e strings (frets 0-6) for at least 90% of the notes that come up.",
          suggestedExerciseId: "fret_click_octaves_be_open",
          stepIcon: "Copy",
          contentBlocks: [
            {
              type: "text",
              body: "Now the top two strings, B and high e. Good news: the gap between them is a normal perfect fourth, same as most of the neck. That irregular tuning gap from Fundamentals lives between G and B, not here. Frets 0 through 6:",
            },
            { type: "fretDiagram", diagram: diagram(0, 6, [2, 1]) },
            {
              type: "callout",
              icon: "Copy",
              label: "Where the strings meet",
              body: "E shows up on the B string at fret 5, and again on the open high e string at fret 0. F does the same, B string fret 6, e string fret 1. Same exact spacing as the D & G pair, which makes sense since both are tuned a perfect fourth apart.",
            },
            {
              type: "text",
              body: "Remember that loose end from a couple of steps back? Here's where it ties up. The octave shape still works going from D to B, and from G to high e, just with three frets instead of two:",
            },
            { type: "fretDiagram", diagram: octaveShapeDiagram([{ lowString: 4, highString: 2, jumpFret: 3 }, { lowString: 3, highString: 1, jumpFret: 3 }]) },
            {
              type: "callout",
              icon: "Compass",
              label: "Why one fret different",
              body: "It's that same tuning quirk from Fundamentals showing up again. G to B is a major third, not a perfect fourth, so any octave shape crossing that gap needs one extra fret to make it across. E→D and A→G never cross it, so they get away with just two.",
            },
          ],
        },
        {
          id: "step_octaves_be_high",
          order: 12,
          stageId: "stage_2",
          title: "B & High e Strings: Upper Position",
          shortDescription: "Complete the top two strings across the full first octave.",
          fullDescription: "",
          tips: [],
          commonMistakes: [],
          examGoal: "Click every correct spot on the B & high e strings (frets 6-12) for at least 90% of the notes that come up.",
          suggestedExerciseId: "fret_click_octaves_be_high",
          stepIcon: "Copy",
          contentBlocks: [
            {
              type: "text",
              body: "The highest register on the whole neck, and the last piece of the octave puzzle. Frets 6 through 12:",
            },
            { type: "fretDiagram", diagram: diagram(6, 12, [2, 1]) },
            {
              type: "callout",
              icon: "Copy",
              label: "The double-up here",
              body: "A# lands on the B string at fret 11, and on the e string at fret 6. B lands on the B string at fret 12, and on the e string at fret 7. That's it, both top strings, start to finish.",
            },
          ],
        },
      ],
    },
    {
      id: "stage_3",
      order: 3,
      label: "Boxes",
      steps: [
        {
          id: "step_box_0_4",
          order: 13,
          stageId: "stage_3",
          title: "Fretboard Box: Frets 0-4",
          shortDescription: "Scan all 6 strings at once for the first time.",
          fullDescription: "",
          tips: [],
          commonMistakes: [],
          examGoal: "Click every correct spot in this box (frets 0-4, all strings) for at least 90% of the notes that come up.",
          suggestedExerciseId: "fret_click_box_0_4",
          stepIcon: "LayoutGrid",
          contentBlocks: [
            {
              type: "text",
              body: "First exercise that covers the full width of the neck, all 6 strings, instead of just one or two. It roughly matches up with the open chord shapes you probably already know: C, A, G, E, D. Frets 0 through 4:",
            },
            { type: "fretDiagram", diagram: diagram(0, 4, [1, 2, 3, 4, 5, 6]) },
          ],
        },
        {
          id: "step_box_4_8",
          order: 14,
          stageId: "stage_3",
          title: "Fretboard Box: Frets 4-8",
          shortDescription: "The middle of the neck, no open string to lean on nearby.",
          fullDescription: "",
          tips: [],
          commonMistakes: [],
          examGoal: "Click every correct spot in this box (frets 4-8, all strings) for at least 90% of the notes that come up.",
          suggestedExerciseId: "fret_click_box_4_8",
          stepIcon: "LayoutGrid",
          contentBlocks: [
            {
              type: "text",
              body: "This box has both the fret-5 and fret-7 landmarks from Fundamentals sitting right inside it, so use them to get your bearings fast. It also roughly matches the A minor pentatonic 'box 1', if you've already learned that shape. Frets 4 through 8:",
            },
            { type: "fretDiagram", diagram: diagram(4, 8, [1, 2, 3, 4, 5, 6]) },
          ],
        },
        {
          id: "step_box_8_12",
          order: 15,
          stageId: "stage_3",
          title: "Fretboard Box: Frets 8-12",
          shortDescription: "The final box, up to the 12th-fret octave marker.",
          fullDescription: "",
          tips: [],
          commonMistakes: [],
          examGoal: "Click every correct spot in this box (frets 8-12, all strings) for at least 90% of the notes that come up.",
          suggestedExerciseId: "fret_click_box_8_12",
          stepIcon: "LayoutGrid",
          contentBlocks: [
            {
              type: "text",
              body: "Last box, and it wraps up the first 12 frets: every string, three overlapping 5-fret chunks. It also overlaps with the upper pentatonic positions a lot of players reach for when they solo. And remember, at fret 12 every string just repeats its own open note an octave higher, so you can always check yourself against that very first diagram from the start of this path. Frets 8 through 12:",
            },
            { type: "fretDiagram", diagram: diagram(8, 12, [1, 2, 3, 4, 5, 6]) },
          ],
        },
      ],
    },
    {
      id: "stage_4",
      order: 4,
      label: "Whole Neck",
      steps: [
        {
          id: "step_whole_natural",
          order: 16,
          stageId: "stage_4",
          title: "Whole Neck: Natural Notes",
          shortDescription: "Search the entire first 12 frets at once, naturals only for now.",
          fullDescription: "",
          tips: [],
          commonMistakes: [],
          examGoal: "Click every correct spot on the whole neck (frets 0-12) for at least 90% of the natural notes that come up.",
          suggestedExerciseId: "fret_click_whole_natural",
          stepIcon: "Globe",
          contentBlocks: [
            {
              type: "text",
              body: "You've already covered this whole range, just split into three boxes (0-4, 4-8, 8-12). Now you search it as one continuous zone instead of three separate chunks. We're sticking to naturals only for now (C D E F G A B, no sharps or flats), which keeps things manageable while you adjust, and it's also exactly the note pool you'd read off a basic chord chart or lead sheet.",
            },
            { type: "fretDiagram", diagram: diagram(0, 12, [1, 2, 3, 4, 5, 6]) },
            {
              type: "callout",
              icon: "Lightbulb",
              label: "How to search fast",
              body: "Don't try to scan the whole neck as one big blur. Split it back into the three boxes you already trained in your head, check each one, then piece the results together.",
            },
            {
              type: "callout",
              icon: "Info",
              label: "The two half-steps to remember",
              body: "Only two neighboring naturals have nothing between them: E→F and B→C. Everywhere else, two adjacent natural letters sit a whole step (2 frets) apart, with a sharp or flat squeezed in the middle.",
            },
          ],
        },
        {
          id: "step_whole_chromatic",
          order: 17,
          stageId: "stage_4",
          title: "Whole Neck: Every Note",
          shortDescription: "Full mastery: any note, any string, frets 0 to 12.",
          fullDescription: "",
          tips: [],
          commonMistakes: [],
          examGoal: "Click every correct spot on the whole neck (frets 0-12) for at least 90% of the notes that come up, sharps and flats included.",
          suggestedExerciseId: "fret_click_whole_chromatic",
          stepIcon: "Sparkles",
          contentBlocks: [
            {
              type: "text",
              body: "Same zone as last step, but now all 12 chromatic notes are in play, sharps and flats included. This is your last checkpoint before the live playing exam. If you can consistently spot any note anywhere in the first 12 frets on sight, you actually know the fretboard now.",
            },
            { type: "fretDiagram", diagram: diagram(0, 12, [1, 2, 3, 4, 5, 6]) },
            {
              type: "callout",
              icon: "Lightbulb",
              label: "Fall back on what you know",
              body: "A sharp always sits exactly one fret above its natural neighbor. Stuck? Find the natural note first, you already know every one of those, then just step one fret higher.",
            },
          ],
        },
      ],
    },
    {
      id: "stage_5",
      order: 5,
      label: "Play!",
      steps: [
        {
          id: "step_play_low_e",
          order: 18,
          stageId: "stage_5",
          title: "Play: Low E String",
          shortDescription: "Beat the clock: play all 12 notes on the low E string in 90 seconds.",
          fullDescription: "",
          tips: [],
          commonMistakes: [],
          examGoal: "At a locked 60 BPM, play every one of the 12 chromatic notes on the low E string before the 90-second clock runs out. The exam ends automatically at 0:00 and scores whatever you completed.",
          examBpm: 60,
          suggestedExerciseId: "string_sweep_low_e",
          stepIcon: "Trophy",
          contentBlocks: [
            {
              type: "text",
              body: "Everything up to now had you pointing at a diagram. This one puts the guitar back in your hands. A note name pops up, and you find it and play it, live, on this string, while the mic listens. It's the first of six real playing exams: five single-string hunts, then a whole-neck finale, each one a hard 90-second countdown.",
            },
            { type: "fretDiagram", diagram: diagram(0, 11, [6]) },
            {
              type: "callout",
              icon: "Trophy",
              label: "From knowing to playing",
              body: "Clicking a diagram and actually finding a note under your fingers in real time are two different skills. If this feels a lot harder than the click exercises, good, that's expected. It's testing whether the knowledge transfers, not just whether you memorized it.",
            },
          ],
        },
        {
          id: "step_play_a",
          order: 19,
          stageId: "stage_5",
          title: "Play: A String",
          shortDescription: "Beat the clock: play all 12 notes on the A string in 90 seconds.",
          fullDescription: "",
          tips: [],
          commonMistakes: [],
          examGoal: "At a locked 60 BPM, play every one of the 12 chromatic notes on the A string before the 90-second clock runs out. The exam ends automatically at 0:00 and scores whatever you completed.",
          examBpm: 60,
          suggestedExerciseId: "string_sweep_a",
          stepIcon: "Trophy",
          contentBlocks: [
            {
              type: "text",
              body: "Same drill, next string. Find and play every chromatic note on the A string, live, before the clock hits zero.",
            },
            { type: "fretDiagram", diagram: diagram(0, 11, [5]) },
            {
              type: "callout",
              icon: "Compass",
              label: "Under time pressure",
              body: "Blank on a note mid-exam? Don't panic and count up from the open string. Jump straight to the nearest fret-5, fret-7 or fret-9 landmark and count from there. That's literally why you drilled those first.",
            },
          ],
        },
        {
          id: "step_play_d",
          order: 20,
          stageId: "stage_5",
          title: "Play: D String",
          shortDescription: "Beat the clock: play all 12 notes on the D string in 90 seconds.",
          fullDescription: "",
          tips: [],
          commonMistakes: [],
          examGoal: "At a locked 60 BPM, play every one of the 12 chromatic notes on the D string before the 90-second clock runs out. The exam ends automatically at 0:00 and scores whatever you completed.",
          examBpm: 60,
          suggestedExerciseId: "string_sweep_d",
          stepIcon: "Trophy",
          contentBlocks: [
            {
              type: "text",
              body: "Halfway there. Find and play every chromatic note on the D string, live, before time runs out.",
            },
            { type: "fretDiagram", diagram: diagram(0, 11, [4]) },
            {
              type: "callout",
              icon: "Copy",
              label: "D remembers the E string",
              body: "Little reminder: the D string is one half of that octave shortcut from the Octaves stage. Any note you already know on the low E string has its octave sitting two frets over, right here.",
            },
          ],
        },
        {
          id: "step_play_g",
          order: 21,
          stageId: "stage_5",
          title: "Play: G String",
          shortDescription: "Beat the clock: play all 12 notes on the G string in 90 seconds.",
          fullDescription: "",
          tips: [],
          commonMistakes: [],
          examGoal: "At a locked 60 BPM, play every one of the 12 chromatic notes on the G string before the 90-second clock runs out. The exam ends automatically at 0:00 and scores whatever you completed.",
          examBpm: 60,
          suggestedExerciseId: "string_sweep_g",
          stepIcon: "Trophy",
          contentBlocks: [
            {
              type: "text",
              body: "Find and play every chromatic note on the G string, live, before time runs out. And remember its little quirk from Fundamentals: fret 5 won't get you to the open B string here like it does everywhere else, you need fret 4 for that.",
            },
            { type: "fretDiagram", diagram: diagram(0, 11, [3]) },
          ],
        },
        {
          id: "step_play_b",
          order: 22,
          stageId: "stage_5",
          title: "Play: B String",
          shortDescription: "Beat the clock: play all 12 notes on the B string in 90 seconds.",
          fullDescription: "",
          tips: [],
          commonMistakes: [],
          examGoal: "At a locked 60 BPM, play every one of the 12 chromatic notes on the B string before the 90-second clock runs out. The exam ends automatically at 0:00 and scores whatever you completed.",
          examBpm: 60,
          suggestedExerciseId: "string_sweep_b",
          stepIcon: "Trophy",
          contentBlocks: [
            {
              type: "text",
              body: "Find and play every chromatic note on the B string, live, before time runs out.",
            },
            { type: "fretDiagram", diagram: diagram(0, 11, [2]) },
            {
              type: "callout",
              icon: "Compass",
              label: "The odd string out",
              body: "B is sitting right on the irregular side of that tuning gap from the G string. Everything you figured out there still applies here, just mirrored.",
            },
          ],
        },
        {
          id: "step_play_whole_neck",
          order: 23,
          stageId: "stage_5",
          title: "Play: Whole Neck",
          shortDescription: "The final exam: play all 12 notes anywhere on the neck, no string or region to lean on.",
          fullDescription: "",
          tips: [],
          commonMistakes: [],
          examGoal: "At a locked 60 BPM, play every one of the 12 chromatic notes anywhere on the neck, any string, any octave, before the 90-second clock runs out. The exam ends automatically at 0:00 and scores whatever you completed.",
          examBpm: 60,
          suggestedExerciseId: "whole_neck_sweep",
          stepIcon: "Crown",
          contentBlocks: [
            {
              type: "text",
              body: "No single string this time. No diagram, no highlighted region. The entire fretboard is fair game. Find and play each of the 12 chromatic notes wherever you can reach them fastest.",
            },
            { type: "fretDiagram", diagram: emptyNeck(0, 12) },
            {
              type: "callout",
              icon: "Trophy",
              label: "You've mapped the whole neck",
              body: "Five single-string exams down, and now the whole neck at once, all under a hard clock. This is it, the end of Fretboard Mastery. You went from clicking a diagram to actually playing it, anywhere on the neck, for real.",
            },
          ],
        },
      ],
    },
  ],
};
