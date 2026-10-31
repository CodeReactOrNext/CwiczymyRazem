import { TAB_BOARD_JS } from "./generated/tabBoardBundle";

/**
 * The MCP App behind `riffquest_preview_tab`: the practice session's tab board,
 * with notation one tab away and playback for both, rendered by Claude inside
 * the conversation.
 *
 * It runs in the host's sandbox, not on riff.quest, so everything comes from
 * jsDelivr — the one origin the resource's CSP declares — or is inlined: the
 * board is the session's own renderer, bundled (scripts/buildMcpTabBoard.mjs).
 * AlphaTab draws the notation and plays the sound in both views; the board's
 * cursor follows its player. Neither uses web workers (a sandboxed iframe can't
 * spawn them from another origin). The alphaTex and the board's data are built
 * on the server, so the page holds no tab logic of its own.
 */
export const ALPHATAB_VERSION = "1.8.1";
export const EXT_APPS_VERSION = "1.7.5";
export const CDN = "https://cdn.jsdelivr.net";

const ALPHATAB = `${CDN}/npm/@coderline/alphatab@${ALPHATAB_VERSION}/dist`;
const EXT_APPS = `${CDN}/npm/@modelcontextprotocol/ext-apps@${EXT_APPS_VERSION}/dist/src/app-with-deps.js`;

export const TAB_PREVIEW_HTML = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<script src="${ALPHATAB}/alphaTab.min.js"></script>
<script>window.RIFF_TAB_BRAVURA_URL = "${ALPHATAB}/font/Bravura.woff2";</script>
<script>${TAB_BOARD_JS}</script>
<style>
  :root { color-scheme: light dark; --bg: #fafafa; --fg: #18181b; --muted: #71717a; --panel: #f4f4f5; --active: #e4e4e7; }
  @media (prefers-color-scheme: dark) {
    :root { --bg: #18181b; --fg: #f4f4f5; --muted: #a1a1aa; --panel: #27272a; --active: #3f3f46; }
  }
  * { box-sizing: border-box; }
  body { margin: 0; padding: 16px; font: 14px/1.4 system-ui, sans-serif; background: var(--bg); color: var(--fg); }
  header { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px; flex-wrap: wrap; }
  h1 { font-size: 15px; margin: 0; }
  .meta { color: var(--muted); font-size: 12px; margin-top: 2px; }
  .controls { display: flex; align-items: center; gap: 8px; }
  button { font: inherit; border: 0; border-radius: 8px; padding: 6px 14px; cursor: pointer; background: var(--panel); color: var(--fg); }
  button:disabled { opacity: .5; cursor: default; }
  .views { display: flex; gap: 2px; padding: 2px; border-radius: 10px; background: var(--panel); }
  .views button { padding: 4px 12px; background: transparent; color: var(--muted); }
  .views button[aria-pressed="true"] { background: var(--active); color: var(--fg); }
  .views[hidden] { display: none; }
  /* The session's board: its own colour in either theme, like in the app. */
  #board { height: 260px; border-radius: 10px; overflow: hidden; cursor: grab; }
  #board:active { cursor: grabbing; }
  #board[hidden] { display: none; }
  @media (max-width: 480px) { #board { height: 220px; } }
  /* Notation is drawn dark on light, like a printed sheet, in either theme. */
  #score { background: #fff; border-radius: 10px; padding: 8px; min-height: 120px; overflow-x: auto; }
  #score[hidden] { display: none; }
  .issues { margin-top: 12px; padding: 10px 12px; border-radius: 8px; background: var(--panel); font-size: 13px; }
  .issues.error { color: #dc2626; }
  .issues ul { margin: 4px 0 0; padding-left: 18px; }
  #status { color: var(--muted); padding: 24px 0; text-align: center; }
  #status:empty { display: none; }
</style>
</head>
<body>
  <header>
    <div>
      <h1 id="title">Tab preview</h1>
      <div class="meta" id="meta"></div>
    </div>
    <div class="controls">
      <div class="views" id="views" hidden>
        <button id="view-tab" aria-pressed="true">Tab</button>
        <button id="view-notation" aria-pressed="false">Notation</button>
      </div>
      <button id="play" disabled>Play</button>
    </div>
  </header>
  <div id="status">Waiting for the tab…</div>
  <div id="board" hidden></div>
  <div id="score" hidden></div>
  <div id="issues"></div>
<script type="module">
  import { App } from "${EXT_APPS}";

  const $ = (id) => document.getElementById(id);
  const app = new App({ name: "riff.quest tab preview", version: "1.0.0" });
  // AlphaTab's MIDI resolution — the board counts in quarter notes.
  const TICKS_PER_QUARTER = 960;
  let api = null;
  let board = null;
  let playing = false;
  let ended = false;
  let notationDrawn = false;

  const showIssues = (data) => {
    const box = $("issues");
    box.innerHTML = "";
    const list = (data.errors && data.errors.length) ? data.errors : (data.warnings || []);
    if (!list.length) return;
    const div = document.createElement("div");
    div.className = "issues" + (data.errors && data.errors.length ? " error" : "");
    div.textContent = data.errors && data.errors.length ? "This tab won't save yet:" : "Notes:";
    const ul = document.createElement("ul");
    for (const line of list.slice(0, 12)) {
      const li = document.createElement("li");
      li.textContent = line;
      ul.appendChild(li);
    }
    div.appendChild(ul);
    box.appendChild(div);
  };

  const showView = (view) => {
    const tab = view === "tab" && !!board;
    $("board").hidden = !tab;
    $("score").hidden = tab;
    $("view-tab").setAttribute("aria-pressed", String(tab));
    $("view-notation").setAttribute("aria-pressed", String(!tab));
    if (board) board.setVisible(tab);
    // Loaded while hidden, alphaTab skips the drawing and doesn't come back to it
    // on its own once shown; render() measures the now visible container.
    if (!tab && api && !notationDrawn) api.render();
  };
  $("view-tab").onclick = () => showView("tab");
  $("view-notation").onclick = () => showView("notation");

  const mountBoard = (data) => {
    if (!data.board || !window.RiffTabBoard) return;
    try {
      $("board").hidden = false;
      board = window.RiffTabBoard.mount($("board"), data.board, (beat) => {
        if (api) api.tickPosition = Math.round(beat * TICKS_PER_QUARTER);
      });
    } catch (error) {
      board = null;
      console.error(error);
    }
  };

  const mountPlayer = (tex) => {
    api = new alphaTab.AlphaTabApi($("score"), {
      core: { useWorkers: false, fontDirectory: "${ALPHATAB}/font/" },
      display: { layoutMode: alphaTab.LayoutMode.Page, scale: 0.9 },
      player: { enablePlayer: true, enableCursor: true, soundFont: "${ALPHATAB}/soundfont/sonivox.sf2" },
    });
    api.playerReady.on(() => { $("play").disabled = false; });
    api.renderFinished.on(() => { notationDrawn = true; });
    api.playerStateChanged.on((e) => {
      playing = e.state === 1;
      $("play").textContent = playing ? "Pause" : "Play";
      if (!board) return;
      if (playing) board.play(api.timePosition);
      else board.pause(ended ? 0 : api.tickPosition / TICKS_PER_QUARTER);
      ended = false;
    });
    // The board's cursor runs on its own clock between these, and only moves
    // over when the two have really drifted apart.
    api.playerPositionChanged.on((e) => { if (playing && board) board.play(e.currentTime); });
    api.playerFinished.on(() => { ended = true; if (board) board.pause(0); });
    $("play").onclick = () => api.playPause();
    api.tex(tex);
  };

  const render = (data) => {
    $("title").textContent = data.title || "Tab preview";
    $("meta").textContent = [data.instrument === "bass" ? "Bass" : "Guitar", data.tempo ? data.tempo + " BPM" : null, data.measures ? data.measures + " measures" : null].filter(Boolean).join(" · ");
    showIssues(data);
    if (!data.tex && !data.board) { $("status").textContent = "Nothing to draw."; return; }
    $("status").textContent = "";
    if (board || api) return;
    mountBoard(data);
    try {
      if (data.tex) mountPlayer(data.tex);
    } catch (error) {
      console.error(error);
      if (!board) { $("status").textContent = "Couldn't draw the tab here."; return; }
    }
    // Both views exist only when there's a board and notation to switch to.
    $("views").hidden = !(board && api);
    showView(board ? "tab" : "notation");
  };

  app.ontoolresult = (result) => {
    const data = result.structuredContent;
    if (data) render(data);
    else $("status").textContent = "No tab in the result.";
  };

  await app.connect();
</script>
</body>
</html>
`;
