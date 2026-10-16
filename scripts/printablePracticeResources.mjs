// Paper versions of the daily/intermediate guide schedules and journal.
const escapeHtml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll('"', "&quot;");
const table = (headers, rows, blankHeight = false) =>
  `<table><thead><tr>${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => `<tr${blankHeight ? ' class="writing-row"' : ""}>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
const lines = (count = 2) => '<div class="writing-line"></div>'.repeat(count);
const footer = (slug, page) =>
  `<footer>Riff Quest | riff.quest/${slug}<span>${page} / 2</span></footer>`;
const page = (title, subtitle, body, slug, number) =>
  `<section class="page"><header><p class="brand">Riff Quest / Practice resources</p><h1>${title}</h1><p>${subtitle}</p></header>${body}${footer(slug, number)}</section>`;
const document = (
  title,
  pages,
) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${title}</title><style>
@page { size:A4; margin:14mm; }
* { box-sizing:border-box; }
body { margin:0; color:#111; background:white; font:10pt Arial, sans-serif; line-height:1.4; }
.page { height:265mm; position:relative; display:flow-root; padding-bottom:15mm; break-after:page; }
.page:last-child { break-after:auto; }
header { margin-bottom:5mm; } .brand { font-size:9pt; letter-spacing:.06em; }
h1 { font-size:22pt; line-height:1.12; margin:2mm 0 3mm; } h2 { font-size:12pt; margin:4mm 0 2mm; }
p { margin:2mm 0; } table { width:100%; border-collapse:collapse; table-layout:fixed; margin:3mm 0; font-size:9pt; }
th { background:#eee; text-align:left; padding:1.5mm; } td { padding:1.5mm; border-bottom: .5pt solid #aaa; vertical-align:top; overflow-wrap:break-word; }
table:has(th:nth-child(3):last-child) th:first-child { width:15%; } table:has(th:nth-child(3):last-child) th:nth-child(2) { width:25%; } .writing-row { height:14mm; } .writing-line { height:7mm; border-bottom:.5pt solid #aaa; }
.fields { margin:5mm 0; line-height:2.4; } .note { font-size:9pt; } footer { position:absolute; bottom:0; left:0; right:0; font-size:8pt; color:#333; } footer span { float:right; }
</style></head><body>${pages.join("")}</body></html>`;

const weeklyLog = (slug, title = "Weekly practice log") =>
  page(
    title,
    "Record what happened, then choose one next step. Print a fresh copy each week.",
    `<p class="fields">Week beginning: __________________ &nbsp; Main priority: __________________</p>
  ${table(
    ["Date / routine", "Minutes", "Exercise / result", "Next step"],
    Array.from({ length: 7 }, () => ["", "", "", ""]),
    true,
  )}
  <h2>One improvement I can demonstrate</h2>${lines()}
  <h2>One recurring difficulty</h2>${lines()}
  <h2>Next week's priority and first exercise</h2>${lines()}
  <p class="note">Compare the same exercise, tempo subdivision and success criterion. Paper notes are not automatically imported into Riff Quest.</p>`,
    slug,
    2,
  );

export const journalHtml = () => {
  const slug = "guitar-practice-journal";
  return document("Guitar Practice Journal | Riff Quest", [
    page(
      "Guitar practice journal",
      "One session. One clear goal. One next step.",
      `<p class="fields">Date: __________________ &nbsp; Available minutes: __________________</p>
    <h2>Today's specific goal</h2>${lines(2)}
    <p class="note">Example: Am to C for eight bars without stopping. Use a target you can check.</p>
    <h2>What I actually practiced</h2>
    ${table(
      [
        "Exercise / song section",
        "Minutes",
        "BPM + subdivision",
        "Result / observation",
      ],
      Array.from({ length: 5 }, () => ["", "", "", ""]),
      true,
    )}
    <p class="note">BPM is optional. For ear training, bends or repertoire, record accuracy or a completed passage instead. Keep tempo and subdivision together, e.g. 60 BPM / eighth notes.</p>
    <h2>What improved or needs attention?</h2>${lines(3)}
    <h2>Start the next session with...</h2>${lines(2)}
    <p class="note">Fill this in before putting the guitar away. Print for handwriting or annotate in a PDF reader; this is not a fillable form.</p>`,
      slug,
      1,
    ),
    weeklyLog(slug),
  ]);
};

export const dailyRoutineHtml = () => {
  const slug = "daily-guitar-practice-plan";
  return document("Daily Guitar Practice Routine | Riff Quest", [
    page(
      "Daily guitar practice routine",
      "Choose 15, 30 or 60 minutes. The schedules match the online guide.",
      `<h2>15 minutes / the short session</h2>${table(
        ["Time", "Block", "What to play"],
        [
          [
            "0-3",
            "Warm-up",
            "Slow, comfortable finger movement; no tempo pressure.",
          ],
          [
            "3-10",
            "Main skill",
            "One beginner drill, scale position or synchronization exercise.",
          ],
          [
            "10-15",
            "Rhythm and fun",
            "Triplets with a click; finish with a minute of music you enjoy.",
          ],
        ],
      )}
    <h2>30 minutes / technique and music</h2>${table(
      ["Time", "Block", "What to play"],
      [
        ["0-5", "Warm-up", "Gentle movement, then slow synchronization."],
        [
          "5-15",
          "Technique",
          "One focus for the week, such as single-string muting; log clean BPM.",
        ],
        [
          "15-22",
          "Control",
          "Vibrato, bends or dynamics; listen for consistent sound.",
        ],
        [
          "22-30",
          "Repertoire",
          "One manageable song section, slowly enough to stay in control.",
        ],
      ],
    )}
    <h2>60 minutes / the full session</h2>${table(
      ["Time", "Block", "What to play"],
      [
        [
          "0-8",
          "Warm-up and sync",
          "Gentle movement and slow spider patterns.",
        ],
        ["8-23", "Technique", "One rotating technique focus with a metronome."],
        [
          "23-33",
          "Scales and fretboard",
          "One position, then find and name its notes.",
        ],
        ["33-41", "Ear training", "Recognize intervals; check each answer."],
        [
          "41-50",
          "Improvisation",
          "Use one constraint, such as three notes only.",
        ],
        ["50-60", "Repertoire", "Song work; finish with a short recording."],
      ],
    )}
    <p class="note">Choose the length you can sustain today. Use comfortable tempos, take breaks as needed and stop if playing hurts. Record one result on page two. For detailed drill instructions, visit the guide below.</p>`,
      slug,
      1,
    ),
    weeklyLog(slug),
  ]);
};

export const intermediateRoutineHtml = () => {
  const slug = "intermediate-guitar-practice-routine";
  return document("Intermediate Guitar Practice Routine | Riff Quest", [
    page(
      "Intermediate guitar practice",
      "A 45-minute session, a short-day option and a weekly rotation.",
      `<h2>The balanced 45-minute session</h2>${table(
        ["Time", "Block", "Drill / target"],
        [
          [
            "0-5",
            "Warm-up",
            "Slow spider or chromatic pattern; comfortable, clean notes.",
          ],
          [
            "5-15",
            "Rhythm and chords",
            "Funk 16ths: eight bars at 60 BPM with clear accents; or chord changes without gaps.",
          ],
          [
            "15-23",
            "Fretboard and ear",
            "Move a melody to three positions and name notes; or sing before playing.",
          ],
          [
            "23-35",
            "Technique focus",
            "One drill for the week; record a clean, repeatable tempo.",
          ],
          [
            "35-45",
            "Repertoire",
            "One song section; aim for two passes without restarting.",
          ],
        ],
      )}
    <h2>Your week / rotate the focus</h2>${table(
      ["Day", "Focus", "Adjustment"],
      [
        ["Monday", "Rhythm", "Emphasize funk accents and both-hands muting."],
        ["Tuesday", "Technique", "Use this week's drill and log clean BPM."],
        [
          "Wednesday",
          "Fretboard and ear",
          "Move a melody; use singing in place of technique.",
        ],
        [
          "Thursday",
          "Technique",
          "Repeat Tuesday; increase only if the same task was clean.",
        ],
        [
          "Friday",
          "Control",
          "Vibrato, bends, subdivisions, then improvisation.",
        ],
        [
          "Saturday",
          "Repertoire",
          "Replace drills with one song; record a complete pass.",
        ],
        [
          "Sunday",
          "Rest and review",
          "Review tempos and listen back for five minutes.",
        ],
      ],
    )}
    <h2>Only 20 minutes?</h2><p>3 minutes warm-up + 7 technique + 5 rhythm or fretboard + 5 repertoire.</p>
    <p class="note">These are sample drills, not required tempos. Swap in exercises that address your weak spots. Keep the same task and subdivision when comparing BPM. Take breaks as needed; stop if playing hurts. Detailed drills and pass marks are in the online guide.</p>`,
      slug,
      1,
    ),
    weeklyLog(slug),
  ]);
};
