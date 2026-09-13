import { exercisesAgregat } from "feature/exercisePlan/data/exercisesAgregat";
import { describe, expect, it } from "vitest";

import roadmaps from "./index";

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

const exerciseIds = new Set(exercisesAgregat.map((exercise) => exercise.id));

const allSteps = roadmaps.flatMap((roadmap) =>
  roadmap.phases.flatMap((phase) =>
    phase.steps.map((step) => ({ roadmap, phase, step })),
  ),
);

/**
 * The curated roadmaps ship as JSON, so nothing type-checks their contents.
 * Progress is stored per step id and the practice kit resolves the exercise
 * by id, so a typo in either silently loses a player's progress or shows an
 * empty kit.
 */
describe("curated roadmaps", () => {
  it("have unique roadmap, phase and step ids in UUID form", () => {
    const ids = [
      ...roadmaps.map((roadmap) => roadmap.id),
      ...roadmaps.flatMap((roadmap) => roadmap.phases.map((phase) => phase.id)),
      ...allSteps.map(({ step }) => step.id),
    ];
    expect(new Set(ids).size).toBe(ids.length);
    ids.forEach((id) => expect(id, id).toMatch(UUID));
  });

  it("number phases and steps consecutively from zero", () => {
    roadmaps.forEach((roadmap) => {
      expect(roadmap.phases.map((phase) => phase.order)).toEqual(
        roadmap.phases.map((_, index) => index),
      );
      roadmap.phases.forEach((phase) => {
        expect(
          phase.steps.map((step) => step.order),
          phase.title,
        ).toEqual(phase.steps.map((_, index) => index));
      });
    });
  });

  it("give every step a title, a description, success criteria and a session target", () => {
    allSteps.forEach(({ step }) => {
      expect(step.title.trim(), step.id).not.toBe("");
      expect(step.description.trim(), step.title).not.toBe("");
      expect(step.successCriteria.trim(), step.title).not.toBe("");
      expect(step.sessionsRequired, step.title).toBeGreaterThan(0);
    });
  });

  it("only point at exercises that exist in the library", () => {
    allSteps.forEach(({ step }) => {
      if (!step.suggestedExerciseId) return;
      expect(
        exerciseIds.has(step.suggestedExerciseId),
        `${step.title} → ${step.suggestedExerciseId}`,
      ).toBe(true);
    });
  });

  it("author inline lessons with a video id, a title and a channel, and never twice in one step", () => {
    allSteps.forEach(({ step }) => {
      const lessons = step.lessons ?? [];
      const videoIds = lessons.map((lesson) => lesson.videoId);
      expect(new Set(videoIds).size, step.title).toBe(videoIds.length);
      lessons.forEach((lesson) => {
        expect(lesson.videoId, step.title).toMatch(/^[\w-]{11}$/);
        expect(lesson.title.trim(), lesson.videoId).not.toBe("");
        expect(lesson.channelName.trim(), lesson.videoId).not.toBe("");
      });
    });
  });
});

/** Ids from the committed Rhythm Guitar Basics roadmap (commit 23431984). */
const RHYTHM_CARRIED_OVER = [
  "bc6cd6aa-0ac7-42f3-8a9c-110379119758", // Metronome consistency
  "230315dd-5e65-4578-981b-5ba76d782ae1", // Downstroke consistency
  "366063d7-2aeb-4937-b006-4d3aa100daec", // Quarter-note pulse
  "bceb8c51-4e24-44fd-9d40-32e0e7bd6749", // Counting rests
  "405c2914-5d10-4b60-888f-a274ee96a09b", // Common open chords
  "20707cb0-811d-4a69-a38f-dcbaf2c4790e", // Smooth chord changes
  "dba12ae1-2213-49f4-9699-0246fe385b71", // Chord fingering economy
  "8655027a-0cc8-4871-b5b0-81f99c3a6f14", // Bass note awareness
  "adcd0c46-b63f-460a-8f7d-6acc55b19dec", // Eighth-note feel
  "4f3a4302-fcde-4bcb-a7ed-ad79e7976dd5", // Accent placement
  "8abd83dd-9db8-4a78-a06e-bfe95864086c", // Palm muting basics
  "2f6bb587-8c77-45cc-b36f-d7508f079276", // Muted strumming
  "0fdbe4a9-5b05-4d1c-95ac-e067c2e8e233", // Chord ringing control
  "b0ef5708-51e7-4661-95af-47fbfeedf528", // Strum dynamics
  "f545ba6e-884a-4c4e-aa02-0a54d6c5a0d2", // Syncopation basics
  "22a32c44-138a-4a1d-ade7-e2e6fe0bc650", // Upstroke control
  "8388ea63-3ce4-4e59-88dc-ba03c514d3ed", // Triplet subdivision
  "c3109628-83d9-4e9f-8259-1e41edfa57b5", // Groove locking
  "4393943b-0524-428d-90a4-cff362ca89db", // Chord progression mapping
  "530fbaf4-31c2-4289-967e-de7a669001fa", // Song strumming adaptation
  "5de72359-43f3-4137-b72a-7c32a79262c2", // Suspended chords
  "d2ec11ca-1ec6-4130-89a8-0b09e0dfa857", // Section transitions
  "efe35f21-f5ba-4e37-93ab-52efb84796df", // Learning by ear
  "fe642bd4-df42-4fd9-b46d-791f48440cbe", // Tempo change control
  "c588cbd0-3b8a-4c48-8692-39f3c5fe8e9d", // Recording self-review
  "3e7c8d65-be37-4e8a-9cd6-11d9285663aa", // Playing with others
  "5b34ad4a-cf08-4c11-b0d8-8915d62a685d", // Dynamic arrangement
];

/**
 * Ids from the committed John Mayer roadmap (commit 23431984).
 * Three steps were retired in the 2026-09 trim and are deliberately absent:
 * Why Georgia (f5ef7e93), chromatic colour (502b7b65) and the clean-tone test
 * (32089317). Their material lives on inside other steps, but progress stored
 * against those three ids no longer counts towards anything.
 */
const MAYER_CARRIED_OVER = [
  "fe6e2c76-7c19-49f1-a8ba-940d329f1ff7", // Minor pentatonic flexibility
  "fe383941-e639-47c8-a293-286a51a56a2a", // Controlled string bending
  "eaf164d9-4a78-4d94-8a07-9d5c611c8897", // Wide expressive vibrato
  "2d160bfc-147f-474a-9b47-c6f8ab2095d8", // Legato articulation
  "202b0e8f-d502-4ef8-a624-9eadaaea98db", // Thumb-over fretting
  "7a4e4dde-ecda-45b4-8570-1bd1d8695044", // Major7 and add9 shapes
  "21133515-4449-46da-bc4c-f1c1ae2cddbc", // Voice-leading between chords
  "74674b48-d324-4848-9d63-7854a6b3e011", // Triad voicings across neck
  "68ded16b-b6bd-49d5-aae8-a6add693b2c9", // Double-stop precision
  "0632d2e7-41f8-4f26-a524-5a87d9ae2a5c", // Percussive muting grooves
  "1650ca8f-0a11-45eb-bf8d-9b0158ca79fe", // Fingerstyle control
  "4b0725f4-90b6-4ead-8f2d-4c37ac1e8a9e", // Thumb bass independence
  "4375be0c-e87c-46ac-93d9-b1cb27046a85", // Stop This Train fingerstyle
  "55bb7d01-bcec-4650-ad0d-e96a35d4fc1d", // Neon chordal technique
  "e14d6f6d-55f1-49da-9ce2-a02a92089f38", // Major pentatonic phrasing
  "02b656b2-7ecc-4b42-ab8a-e5a3c49a3d64", // Major pentatonic harmony
  "7a3e07ee-d4c3-4184-837c-377387509a09", // Target-note phrasing
  "596a4400-7fd3-40ce-addc-3d9ab5d496f4", // Use of space
  "84bb23ce-1d62-4a1d-8268-4107beea3f3e", // Call-and-response phrasing
  "ab93cd23-56cd-4b5d-83fc-55937de6c927", // Melodic motif development
  "c70aef25-edf8-479f-a04f-d715c1b596aa", // Hybrid picking coordination
  "c6d37792-504f-4ced-860f-16ad3c0721ef", // Pick attack variety
  "d841f353-de6b-43de-971e-aed42ef86944", // Dynamic volume shaping
  "6ffb0287-7e5c-475d-82c8-0bb143beb462", // Continuum-era tone craft
  "38147dd3-01b9-4a93-9333-14b40fdb3224", // Gravity solo interpretation
  "0eb738a7-ed09-483f-b2c0-f26ef7d73d88", // Slow Dancing phrasing
  "51d7fa83-ba08-48b1-a763-4027fb3f4fd6", // Chord melody integration
  "a0c19f6a-7db6-4847-9570-27ed57c23a18", // Pocket timing control
];

/** Ids from the committed Adam Jones roadmap (commit 23431984). */
const JONES_CARRIED_OVER = [
  "39794991-1a0a-496b-8847-e44956b6adbd", // Power chord variations
  "3d8939f9-695c-4f83-80e3-54bc451fabaf", // Palm muting precision
  "f1b9932d-59bb-4841-a650-7f0582465a0e", // Legato phrasing fluency
  "a8983bec-01ba-4cb7-998f-e6d38637151f", // Partial chord shapes
  "0579f3c5-fbb7-4527-a9b8-6898a4eb6ef2", // Picking dynamics control
  "39e3d509-1952-4d6a-b75a-22862d4b7185", // Odd-meter grooves
  "944a7bd5-dbb4-4032-a85b-9780b567fc18", // Syncopated riffing
  "638f9f14-cdea-4c3b-9c2b-fad21fce5fe5", // Polyrhythmic feel
  "d3584968-dc36-4d4c-a85e-801174a1e28c", // Use of space
  "558145b0-16a6-4e8c-ab1c-cd71a92c80eb", // Phrygian coloration use
  "beaa6163-94e1-485b-b8ad-efb76a822b67", // Intervallic leaps
  "bc8c777a-6684-4808-a771-d4474a927f9a", // Dissonant dyad usage
  "f9b58e50-4d91-42e0-b4df-ff2ec5c817f3", // Triad cluster voicings
  "c87b25d9-b79a-44c4-b4ca-922cf3bd9159", // Arpeggio fragment usage
  "64f43faf-4085-4c0c-afe3-7976e45f0ab9", // Wide vibrato control
  "527b02d7-94fb-4a25-8346-32e3a4a12bb5", // Sustain and feedback
  "b258b45a-47c5-488c-a04b-ceca15e1f2ce", // Percussive string scratches
  "c306f798-f6ee-4276-bf27-64e1b00f18c2", // Minor pentatonic variants
  "b633e189-cf5a-43fe-a115-fe28f9f8ab5b", // Amp voicing control
  "91a9338d-fc55-41ff-a235-f803a48e95cb", // EQ and pickup selection
  "2785afe2-4d09-4306-963d-88133fca5efc", // Delay-based phrasing
  "086e1c13-e5ac-4d65-80ac-d7c036b52e53", // Flange and chorus textures
  "bf4d76ba-00a4-40e6-955a-15a0a2be2d17", // Noise and feedback control
  "e8deec2f-7836-4ae4-bde5-56a16cf004d5", // Stinkfist riff articulation
  "df53dcb4-f586-49f4-9625-9f3a3cf3c9ca", // Schism groove replication
  "4247bc19-5a8b-418f-940c-e87a0230d2fe", // Forty Six And Two leads
  "740d903a-78f8-41be-9062-ff90bbea96c2", // Lateralus modal phrasing
  "6ae142ca-fb9b-48bf-b1ae-f308af2122a0", // Parabola dynamics execution
  "b9415147-0b7f-4a8b-ac5f-6350caabf620", // Vicarious delay textures
  "6e9e84c5-1160-477a-8874-140f913b7c8c", // Riff development
  "1f6ccd85-19d9-4ad2-b04e-576c94f11097", // Writing in odd meters
  "b8c94a27-d34d-4dc3-b2c6-de4d9697cb1d", // Dynamics-driven arrangement
  "3c18bbed-b657-4166-9910-6d898e5e037d", // Layering and counterpoint
  "967ce537-4a74-472d-96c7-e60d0f830f7a", // Lead-rhythm interplay
];

/** Ids from the committed Jimi Hendrix roadmap (commit 23431984). */
const HENDRIX_CARRIED_OVER = [
  "2036bb36-1878-4c63-bb44-e70ec35c0d6a", // Thumb-over bass fretting
  "d3901b99-d25f-4407-bdca-d1730b2447b2", // Partial chord inversions
  "413735c0-5575-4daa-8b0b-80541dfa06ee", // Parallel thirds and sixths
  "c973676e-06bf-4155-9894-6748236bec84", // Left-hand muting rhythms
  "64df90f8-2b99-47bc-b875-e772eaf4bd89", // Groove-driven comping
  "a70f2a59-76fc-44f3-9237-2b9bedd4ebdd", // Legato hammer-ons pull-offs
  "b7dd6519-7680-4b4d-908b-f9fabd9b3654", // Suspended chord textures
  "6ef8184c-a590-4fad-8946-7cd64c06c285", // Double-stop hammer-ons
  "b2b2e41f-34e1-499c-ab57-92df31570be5", // Movable bass lines
  "a1d64802-b5e2-4406-b1a5-736d8ddd9857", // Sliding chord voicings
  "eee8afde-afbf-4eac-9fcc-c4de238228d1", // Sharp nine voicings
  "de5cd021-0ca1-47ab-a4a6-7ca0d6c351c7", // Dominant seventh voicings
  "b4ec14fa-1672-42fd-a1fa-584ace39345c", // Chordal stab dynamics
  "b0d3d64e-9173-4374-8594-7a6409d6d73d", // Syncopated strumming patterns
  "0dce7088-27c4-4685-b11d-e51b78cb4347", // Triplet subdivision feel
  "01bc1322-ad3f-4331-a721-55b9927296ff", // Whole and half bends
  "02549b77-e52e-49a9-9148-b97810c70c3f", // Vibrato depth control
  "bf4a9810-3b34-4b02-b79c-5af16209cf2f", // Double-stop bends
  "c1c2c64a-8a0f-48a4-b7a3-39ba06253ec1", // Octave melody control
  "e5bb1b68-4a05-4175-b3d8-aa054f4dee37", // Minor pentatonic fluency
  "a4aff63b-294d-4860-be9f-47559d26055e", // Blues scale phrasing
  "60c84b65-75a8-4e33-9005-a345e38ae0b2", // Tone knob sculpting
  "7828bcf2-3174-49b8-afe1-b2d747ccb048", // Fuzz and overdrive feel
  "45375b0e-b3ca-4b12-826b-915c2af55190", // Wah pedal articulation
  "97950630-bdd7-4710-8d50-bd5e55c3c85a", // Univibe and modulation
  "307415e8-784c-477f-ac87-720045e3c3de", // Controlled amp feedback
  "c40fbf8c-2eb7-4047-9ec7-7e10ffc4ad39", // Purple Haze chord riffing
  "e6f269f2-0a18-40d0-93b2-934f3ba40ed9", // Little Wing chord-melody
  "311fb033-1875-4f46-8632-bbd5c81cb73c", // Castles slide phrasing
  "53a35a34-e0c2-48cb-802a-dfc22fc3b085", // Axis dynamics and tone
  "df5be3e7-ae7c-40f0-ba18-037950a32e10", // Voodoo wah soloing
  "06b6c7e4-4ca5-417d-a1ee-6514dbe67c48", // Electric Lady improvisation
  "b1da55cb-08f1-4adc-8db0-b1c7133caae2", // Cross-string phrasing
  "18167cc9-97a1-4a9d-9bd3-b686051be4b5", // Intervallic voice leading
  "78793337-49b8-422f-afc1-d53047885bca", // Dynamic accent control
];

/**
 * The roadmaps rebuilt from scratch, each with the step ids of the version it
 * replaced whose steps map onto a step of the new programme. Progress is stored
 * per step id (`userRoadmapProgress.stepProgress`), so reusing an id is what
 * carries a players logged sessions over; a new id silently resets them.
 */
const REBUILT: { title: string; carriedOver: string[] }[] = [
  { title: "Rhythm Guitar Basics", carriedOver: RHYTHM_CARRIED_OVER },
  {
    title: "I want to play in the style of John Mayer",
    carriedOver: MAYER_CARRIED_OVER,
  },
  { title: "I want to play like Adam Jones", carriedOver: JONES_CARRIED_OVER },
  {
    title: "Play in the style of Jimi Hendrix",
    carriedOver: HENDRIX_CARRIED_OVER,
  },
];

describe.each(REBUILT)("$title", ({ title, carriedOver }) => {
  const roadmap = roadmaps.find((entry) => entry.title === title)!;
  const steps = roadmap.phases.flatMap((phase) => phase.steps);

  it("either recommends an exercise or is marked as having none", () => {
    steps.forEach((step) => {
      expect(
        !!step.suggestedExerciseId || step.noExercise === true,
        step.title,
      ).toBe(true);
    });
  });

  it("explains every step in the sections the drawer renders", () => {
    steps.forEach((step) => {
      const headings = step.description
        .split("\n")
        .map((line) => line.trim().match(/^\[(.+)\]$/)?.[1])
        .filter((heading): heading is string => !!heading);
      expect(headings, step.title).toEqual(
        expect.arrayContaining([
          "What it is",
          "Why it matters",
          "How to practice",
        ]),
      );
    });
  });

  it("keeps bibliography out of the player-facing text", () => {
    steps.forEach((step) => {
      expect(step.description, step.title).not.toContain("[Sources]");
    });
  });

  it("spreads the practice cost instead of giving every step the same weight", () => {
    const sessions = steps.map((step) => step.sessionsRequired);
    sessions.forEach((count, i) =>
      expect(count, steps[i].title).toBeGreaterThan(0),
    );
    // A listening step and a whole song must not cost the same: keep a real spread.
    expect(Math.max(...sessions) - Math.min(...sessions)).toBeGreaterThanOrEqual(
      6,
    );
  });

  it("does not attach the same lesson video twice inside one step", () => {
    steps.forEach((step) => {
      const ids = (step.lessons ?? []).map((lesson) => lesson.videoId);
      expect(new Set(ids).size, step.title).toBe(ids.length);
    });
  });

  it("keeps the step ids of the previous version wherever a step survived, so stored progress still counts", () => {
    const ids = new Set(steps.map((step) => step.id));
    carriedOver.forEach((id) => expect(ids.has(id), id).toBe(true));
  });
});
