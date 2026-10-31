/**
 * The MCP App behind `preview_tab`: a tab + notation view with playback that
 * Claude renders inside the conversation.
 *
 * It runs in the host's sandbox, not on riff.quest, so everything comes from
 * jsDelivr — the one origin the resource's CSP declares. AlphaTab renders
 * without web workers (a sandboxed iframe can't spawn them from another
 * origin); the alphaTex itself is built on the server, so the page holds no
 * tab logic of its own.
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
<style>
  :root { color-scheme: light dark; --bg: #fafafa; --fg: #18181b; --muted: #71717a; --panel: #f4f4f5; }
  @media (prefers-color-scheme: dark) {
    :root { --bg: #18181b; --fg: #f4f4f5; --muted: #a1a1aa; --panel: #27272a; }
  }
  * { box-sizing: border-box; }
  body { margin: 0; padding: 16px; font: 14px/1.4 system-ui, sans-serif; background: var(--bg); color: var(--fg); }
  header { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px; }
  h1 { font-size: 15px; margin: 0; }
  .meta { color: var(--muted); font-size: 12px; margin-top: 2px; }
  button { font: inherit; border: 0; border-radius: 8px; padding: 6px 14px; cursor: pointer; background: var(--panel); color: var(--fg); }
  button:disabled { opacity: .5; cursor: default; }
  /* Notation is drawn dark on light, like a printed sheet, in either theme. */
  #score { background: #fff; border-radius: 10px; padding: 8px; min-height: 120px; overflow-x: auto; }
  .issues { margin-top: 12px; padding: 10px 12px; border-radius: 8px; background: var(--panel); font-size: 13px; }
  .issues.error { color: #dc2626; }
  .issues ul { margin: 4px 0 0; padding-left: 18px; }
  #status { color: var(--muted); padding: 24px 0; text-align: center; }
</style>
</head>
<body>
  <header>
    <div>
      <h1 id="title">Tab preview</h1>
      <div class="meta" id="meta"></div>
    </div>
    <button id="play" disabled>Play</button>
  </header>
  <div id="status">Waiting for the tab…</div>
  <div id="score"></div>
  <div id="issues"></div>
<script type="module">
  import { App } from "${EXT_APPS}";

  const $ = (id) => document.getElementById(id);
  const app = new App({ name: "riff.quest tab preview", version: "1.0.0" });
  let api = null;

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

  const render = (data) => {
    $("title").textContent = data.title || "Tab preview";
    $("meta").textContent = [data.instrument === "bass" ? "Bass" : "Guitar", data.tempo ? data.tempo + " BPM" : null, data.measures ? data.measures + " measures" : null].filter(Boolean).join(" · ");
    showIssues(data);
    if (!data.tex) { $("status").textContent = "Nothing to draw."; return; }
    $("status").textContent = "";
    try {
      if (!api) {
        api = new alphaTab.AlphaTabApi($("score"), {
          core: { useWorkers: false, fontDirectory: "${ALPHATAB}/font/" },
          display: { layoutMode: alphaTab.LayoutMode.Page, scale: 0.9 },
          player: { enablePlayer: true, enableCursor: true, soundFont: "${ALPHATAB}/soundfont/sonivox.sf2" },
        });
        api.playerReady.on(() => { $("play").disabled = false; });
        api.playerStateChanged.on((e) => { $("play").textContent = e.state === 1 ? "Pause" : "Play"; });
        $("play").onclick = () => api.playPause();
      }
      api.tex(data.tex);
    } catch (error) {
      $("status").textContent = "Couldn't draw the tab here.";
      console.error(error);
    }
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
