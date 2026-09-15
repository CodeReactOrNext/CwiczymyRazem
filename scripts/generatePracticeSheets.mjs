/**
 * Builds the two printable practice handouts linked from the SEO landing pages:
 *
 *   public/downloads/guitar-scale-practice-routine.pdf   (/guitar-scale-practice-routine)
 *   public/downloads/beginner-guitar-practice-sheet.pdf  (/beginner-guitar-exercises)
 *
 * Both are two A4 pages, laid out in plain black-on-white so they stay legible
 * printed in grayscale, and both are checked into public/ so the download works
 * for logged-out readers without a build step.
 *
 * Every tab below is generated from a note array rather than hand-typed ASCII,
 * so the fret numbers can't drift out of column. The shapes are the ones the
 * matching in-app exercises actually use (see the `source` comments).
 *
 * Run with: node scripts/generatePracticeSheets.mjs
 * It prints the exported file size — that number is what the page's download
 * block shows, so update the config when you regenerate.
 */
import { mkdir, stat, writeFile } from "fs/promises";
import path from "path";
import { chromium } from "playwright";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "public", "downloads");

const STRING_LABELS = ["e", "B", "G", "D", "A", "E"];

/**
 * Renders a six-line tab from `[stringNumber, fret]` pairs, where string 1 is
 * the high e and string 6 the low E — the same numbering the exercise data uses.
 */
const renderTab = (notes) => {
  const width = Math.max(...notes.map(([, fret]) => String(fret).length));
  const lines = STRING_LABELS.map((label, index) => {
    const stringNumber = index + 1;
    const cells = notes.map(([noteString, fret]) =>
      noteString === stringNumber
        ? String(fret).padStart(width, "-")
        : "-".repeat(width),
    );
    return `${label}|-${cells.join("--")}--|`;
  });
  return lines.join("\n");
};

/** A minor pentatonic box 1, 5th position — source: pentatonic_box1_up_down. */
const BOX1_ASCENDING = [
  [6, 5],
  [6, 8],
  [5, 5],
  [5, 7],
  [4, 5],
  [4, 7],
  [3, 5],
  [3, 7],
  [2, 5],
  [2, 8],
  [1, 5],
  [1, 8],
];
const BOX1_DESCENDING = [...BOX1_ASCENDING].reverse();

/** Strings 4–2 of the same box — source: pentatonic_string_crossing_3. */
const CROSSING_D_TO_G = [
  [4, 5],
  [4, 7],
  [3, 5],
  [3, 7],
  [4, 5],
  [4, 7],
  [3, 5],
  [3, 7],
];
const CROSSING_G_TO_B = [
  [3, 5],
  [3, 7],
  [2, 5],
  [2, 8],
  [3, 5],
  [3, 7],
  [2, 5],
  [2, 8],
];

/** An original four-note phrase inside the same box — not a transcription. */
const EXAMPLE_PHRASE = [
  [3, 7],
  [2, 5],
  [2, 8],
  [1, 5],
];

const BASE_CSS = `
  @page { size: A4; margin: 11mm 12mm 10mm; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    color: #000;
    background: #fff;
    font-family: "DejaVu Sans", Arial, Helvetica, sans-serif;
    font-size: 9.5pt;
    line-height: 1.35;
  }
  .page { page-break-after: always; }
  .page:last-child { page-break-after: auto; }
  h1 { font-size: 17pt; margin: 0 0 1.5mm; letter-spacing: -0.01em; }
  h2 { font-size: 11pt; margin: 5mm 0 1.5mm; }
  .lede { margin: 0 0 3mm; font-size: 9.5pt; }
  .meta { font-size: 8.5pt; margin: 0 0 3mm; }
  .rule { border-top: 1.5pt solid #000; margin: 0 0 3.5mm; }
  .block { border: 0.8pt solid #000; padding: 3mm 4mm; margin-bottom: 3mm; }
  .block-head {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 6mm;
    margin-bottom: 1.5mm;
  }
  .block-title { font-size: 10.5pt; font-weight: bold; margin: 0; }
  .block-time { font-size: 10.5pt; font-weight: bold; white-space: nowrap; }
  .block p { margin: 0 0 1mm; }
  .label { font-weight: bold; }
  pre {
    font-family: "DejaVu Sans Mono", "Courier New", monospace;
    font-size: 7.5pt;
    line-height: 1.22;
    margin: 1.5mm 0;
    white-space: pre;
  }
  .tabs { display: flex; gap: 8mm; }
  .notes-line {
    border-bottom: 0.6pt solid #000;
    height: 5mm;
    margin-top: 2mm;
  }
  .notes-hint { font-size: 8pt; margin: 0.5mm 0 0; }
  table { width: 100%; border-collapse: collapse; }
  th, td { border: 0.8pt solid #000; padding: 2mm; text-align: left; vertical-align: top; }
  th { font-size: 9pt; }
  td { height: 12mm; font-size: 9pt; }
  td.narrow, th.narrow { width: 17mm; }
  td.medium, th.medium { width: 26mm; }
  .footer { margin-top: 4mm; font-size: 8pt; border-top: 0.8pt solid #000; padding-top: 2.5mm; }
  .footer p { margin: 0 0 1mm; }
  ul { margin: 1.5mm 0; padding-left: 5mm; }
  li { margin-bottom: 1mm; }
`;

const scaleRoutineHtml = () => `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><style>${BASE_CSS}</style></head>
<body>
  <section class="page">
    <h1>Guitar Scale Practice Routine</h1>
    <p class="lede">A 15-minute daily routine on A minor pentatonic box 1, 5th position. Standard tuning (E A D G B e), no capo.</p>
    <p class="meta"><span class="label">The box:</span> string 6 frets 5 and 8 &middot; strings 5, 4 and 3 frets 5 and 7 &middot; strings 2 and 1 frets 5 and 8. Index finger on fret 5, ring finger on fret 7, little finger on fret 8 &mdash; the same fingering every time.</p>
    <div class="rule"></div>

    <div class="block">
      <div class="block-head">
        <p class="block-title">Block A &mdash; the position, slowly</p>
        <span class="block-time">5 min</span>
      </div>
      <p>Ascend and descend the whole box at one comfortable, clean tempo. Pick a speed at which every note rings; do not raise it inside this block.</p>
      <div class="tabs">
        <pre>${renderTab(BOX1_ASCENDING)}</pre>
        <pre>${renderTab(BOX1_DESCENDING)}</pre>
      </div>
      <p><span class="label">Watch:</span> the fingering never changes, even when you get tired. If a finger substitutes itself, slow down.</p>
      <div class="notes-line"></div>
      <p class="notes-hint">What needed attention:</p>
    </div>

    <div class="block">
      <div class="block-head">
        <p class="block-title">Block B &mdash; string crossings, same position</p>
        <span class="block-time">5 min</span>
      </div>
      <p>Loop the two crossings on their own, strings 4&ndash;3 then 3&ndash;2, with strict alternate picking (down on the first note of each string, up on the second).</p>
      <div class="tabs">
        <pre>${renderTab(CROSSING_D_TO_G)}</pre>
        <pre>${renderTab(CROSSING_G_TO_B)}</pre>
      </div>
      <p><span class="label">Watch:</span> keep the pick close to the strings through the change. A hiccup in a pentatonic run is almost always a crossing, not a finger.</p>
      <div class="notes-line"></div>
      <p class="notes-hint">What needed attention:</p>
    </div>

    <div class="block">
      <div class="block-head">
        <p class="block-title">Block C &mdash; short phrases, with pauses</p>
        <span class="block-time">5 min</span>
      </div>
      <p>Same notes, used as music. Play a phrase of three to five notes, stop, listen, then answer it. Over an A minor drone or backing track if you have one; unaccompanied is fine, and the silence counts as part of the phrase.</p>
      <pre>${renderTab(EXAMPLE_PHRASE)}</pre>
      <p>That is one example, not the exercise &mdash; write your own and end them on different notes of the box.</p>
      <div class="notes-line"></div>
      <p class="notes-hint">What needed attention:</p>
    </div>

    <div class="footer">
      <p><span class="label">Blocks A + B + C = 15 minutes.</span> You choose the tempo; there is no pass mark on this sheet.</p>
      <p>From <span class="label">Riff Quest</span> &mdash; https://riff.quest/guitar-scale-practice-routine</p>
      <p>Play these three drills with an interactive tab:<br>
        Block A &mdash; https://riff.quest/guitar-scale-practice-routine#pentatonic-box1-up-down<br>
        Block B &mdash; https://riff.quest/guitar-scale-practice-routine#pentatonic-string-crossing-3<br>
        Any other scale or position &mdash; https://riff.quest/guitar-scale-practice-routine#scale-practice-configurable</p>
    </div>
  </section>

  <section class="page">
    <h1>Practice log &mdash; seven sessions</h1>
    <p class="lede">Fill this in by hand after each session. Nothing here is measured for you: the minutes and the tempo are whatever you decide they were.</p>
    <table>
      <thead>
        <tr>
          <th class="medium">Date</th>
          <th>Exercise / block</th>
          <th class="narrow">Minutes</th>
          <th class="narrow">Tempo</th>
          <th>What I noticed</th>
        </tr>
      </thead>
      <tbody>
        ${Array.from({ length: 7 })
          .map(
            () =>
              '<tr><td class="medium"></td><td></td><td class="narrow"></td><td class="narrow"></td><td></td></tr>',
          )
          .join("\n        ")}
      </tbody>
    </table>
    <h2>After seven sessions</h2>
    <ul>
      <li>Which block do you avoid? That is usually the one paying the most.</li>
      <li>Did the same note buzz on more than three days? Fix the hand position, not the tempo.</li>
      <li>If every session read "fine", the tempo has been too safe.</li>
    </ul>
    <div class="footer">
      <p>From <span class="label">Riff Quest</span> &mdash; https://riff.quest/guitar-scale-practice-routine</p>
      <p>Prefer to keep the log digitally? With a free Riff Quest account you log a session at https://riff.quest/report and read the history at https://riff.quest/practice-log. Nothing on this sheet is imported for you.</p>
    </div>
  </section>
</body></html>`;

const beginnerSheetHtml = () => `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><style>${BASE_CSS}</style></head>
<body>
  <section class="page">
    <h1>Beginner guitar practice sheet</h1>
    <p class="lede">One worked 15-minute session. Standard tuning (E A D G B e). Start every block slower than feels necessary.</p>
    <div class="rule"></div>

    <div class="block">
      <div class="block-head">
        <p class="block-title">1. One string, four fingers</p>
        <span class="block-time">3 min</span>
      </div>
      <p><span class="label">Play:</span> frets 1&ndash;2&ndash;3&ndash;4 on the low E string, one finger per fret, then back down. Riff Quest exercise: <span class="label">Spider &mdash; One String</span>.</p>
      <p><span class="label">Goal:</span> every note rings clean, including the little finger.</p>
      <p><span class="label">Start by:</span> setting a slow click and playing one note per beat.</p>
      <div class="notes-line"></div>
      <p class="notes-hint">Needs attention:</p>
    </div>

    <div class="block">
      <div class="block-head">
        <p class="block-title">2. One chord change: Em to Am</p>
        <span class="block-time">4 min</span>
      </div>
      <p><span class="label">Play:</span> four slow strums of Em, four of Am, and repeat. <span class="label">Own drill &mdash; not an app exercise:</span> do this away from the screen, with a clock.</p>
      <p><span class="label">Goal:</span> the change happens without the strumming hand stopping.</p>
      <p><span class="label">Start by:</span> making the shape in the air three times before you play anything.</p>
      <div class="notes-line"></div>
      <p class="notes-hint">Needs attention:</p>
    </div>

    <div class="block">
      <div class="block-head">
        <p class="block-title">3. Steady rhythm: down-up strumming</p>
        <span class="block-time">4 min</span>
      </div>
      <p><span class="label">Play:</span> down on the beat, up on the "and", on one chord. Riff Quest exercise: <span class="label">Strumming &mdash; Down-Up</span>.</p>
      <p><span class="label">Goal:</span> the hand keeps swinging even through a missed strum.</p>
      <p><span class="label">Start by:</span> strumming with no chord at all, just muted strings, until the pendulum is even.</p>
      <div class="notes-line"></div>
      <p class="notes-hint">Needs attention:</p>
    </div>

    <div class="block">
      <div class="block-head">
        <p class="block-title">4. Put it together</p>
        <span class="block-time">4 min</span>
      </div>
      <p><span class="label">Play:</span> Em &ndash; Em &ndash; Am &ndash; Am, one bar each, with the down-up pattern from block 3, round and round. <span class="label">Own drill &mdash; not an app exercise.</span></p>
      <p><span class="label">Goal:</span> four times round without stopping, at any tempo.</p>
      <p><span class="label">Start by:</span> playing it at half the speed you think you can manage.</p>
      <div class="notes-line"></div>
      <p class="notes-hint">Needs attention:</p>
    </div>

    <div class="footer">
      <p><span class="label">3 + 4 + 4 + 4 = 15 minutes.</span></p>
      <p>From <span class="label">Riff Quest</span> &mdash; https://riff.quest/beginner-guitar-exercises</p>
      <p>Interactive tabs for blocks 1 and 3:<br>
        https://riff.quest/beginner-guitar-exercises#spider-one-string<br>
        https://riff.quest/beginner-guitar-exercises#strumming-down-up</p>
    </div>
  </section>

  <section class="page">
    <h1>Weekly practice sheet</h1>
    <p class="lede">Blank and reusable. Print one a week. Minutes and tempo are yours to write in &mdash; nothing on paper counts anything for you.</p>
    <table>
      <thead>
        <tr>
          <th class="medium">Date</th>
          <th>Exercise</th>
          <th class="narrow">Minutes</th>
          <th class="narrow">Tempo</th>
          <th>Notes</th>
        </tr>
      </thead>
      <tbody>
        ${Array.from({ length: 10 })
          .map(
            () =>
              '<tr><td class="medium"></td><td></td><td class="narrow"></td><td class="narrow"></td><td></td></tr>',
          )
          .join("\n        ")}
      </tbody>
    </table>
    <h2>Week in one line</h2>
    <div class="notes-line"></div>
    <div class="notes-line"></div>
    <div class="footer">
      <p>From <span class="label">Riff Quest</span> &mdash; https://riff.quest/beginner-guitar-exercises</p>
      <p>To keep the same record digitally, a free Riff Quest account logs a session at https://riff.quest/report and reads it back at https://riff.quest/practice-log. Nothing on this sheet is imported for you.</p>
    </div>
  </section>
</body></html>`;

const SHEETS = [
  { file: "guitar-scale-practice-routine.pdf", html: scaleRoutineHtml() },
  { file: "beginner-guitar-practice-sheet.pdf", html: beginnerSheetHtml() },
];

const main = async () => {
  await mkdir(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage();

  for (const sheet of SHEETS) {
    await page.setContent(sheet.html, { waitUntil: "load" });
    const buffer = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
    });
    const target = path.join(OUT_DIR, sheet.file);
    await writeFile(target, buffer);
    const { size } = await stat(target);
    console.log(
      `[practice-sheets] ${sheet.file} — ${(size / 1024).toFixed(0)} KB`,
    );
  }

  await browser.close();
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
