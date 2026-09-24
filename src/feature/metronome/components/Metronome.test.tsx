// @vitest-environment jsdom
import { readFileSync } from "fs";
import { join } from "path";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { buildMetronome } from "../../../../scripts/buildMetronome.mjs";
import {
  METRONOME_CSS,
  METRONOME_MARKUP,
  mountMetronome,
} from "../generated/metronomeApp";
import { Metronome } from "./Metronome";

const featureDir = join(__dirname, "..");

const mount = () => {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const shadow = host.attachShadow({ mode: "open" });
  shadow.innerHTML = `<style>${METRONOME_CSS}</style>${METRONOME_MARKUP}`;
  const root = shadow.querySelector<HTMLElement>(".rq-root")!;
  const teardown = mountMetronome(shadow, root);
  return { host, shadow, root, teardown };
};

const pressSpace = () =>
  document.dispatchEvent(
    new KeyboardEvent("keydown", { code: "Space", key: " ", bubbles: true }),
  );

describe("metronome", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  it("is generated from the vendored file", () => {
    const html = readFileSync(
      join(featureDir, "vendor/metronome.html"),
      "utf8",
    );
    const generated = readFileSync(
      join(featureDir, "generated/metronomeApp.ts"),
      "utf8",
    );
    // A hand edit to the generated file, or a vendor update without a rebuild.
    expect(generated.replace(/\r\n/g, "\n")).toBe(
      buildMetronome(html).replace(/\r\n/g, "\n"),
    );
  });

  it("leaves no selector aimed at the page outside the shadow root", () => {
    expect(METRONOME_CSS).not.toMatch(/:root|\bbody\b|\bh1\b/);
    expect(METRONOME_MARKUP).not.toMatch(/<h1/);
  });

  it("server-renders its markup into the page HTML", () => {
    const html = renderToString(<Metronome />);
    expect(html).toContain('<template shadowrootmode="open">');
    expect(html).toContain('id="startStop"');
  });

  it("wires itself into the shadow root", () => {
    const { shadow, root, teardown } = mount();
    expect(
      shadow.getElementById("themeSelect")!.querySelectorAll("option").length,
    ).toBe(5);
    expect(root.dataset.theme).toBe("classic");
    teardown();
  });

  it("only takes Space after the player has clicked into it", () => {
    const start = vi.fn();
    vi.stubGlobal(
      "AudioContext",
      class {
        currentTime = 0;
        state = "running";
        destination = {};
        constructor() {
          start();
        }
        resume() {
          return Promise.resolve();
        }
        close() {
          return Promise.resolve();
        }
        createOscillator() {
          return {
            connect() {},
            start() {},
            stop() {},
            frequency: { value: 0, setValueAtTime() {} },
            type: "",
          };
        }
        createGain() {
          return {
            connect() {},
            gain: {
              value: 0,
              setValueAtTime() {},
              exponentialRampToValueAtTime() {},
              linearRampToValueAtTime() {},
            },
          };
        }
        createBiquadFilter() {
          return {
            connect() {},
            frequency: { value: 0, setValueAtTime() {} },
            Q: { value: 0 },
            type: "",
          };
        }
      },
    );
    vi.stubGlobal("requestAnimationFrame", () => 0);
    vi.stubGlobal("cancelAnimationFrame", () => {});

    const { root, teardown } = mount();
    pressSpace();
    expect(start).not.toHaveBeenCalled();

    root.dispatchEvent(
      new Event("pointerdown", { bubbles: true, composed: true }),
    );
    pressSpace();
    expect(start).toHaveBeenCalled();
    teardown();
  });

  it("stops listening to the document after teardown", () => {
    const { root, teardown } = mount();
    const heroBefore = root.querySelector("#heroBpm")!.textContent;
    root.dispatchEvent(
      new Event("pointerdown", { bubbles: true, composed: true }),
    );
    teardown();
    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true }),
    );
    expect(root.querySelector("#heroBpm")!.textContent).toBe(heroBefore);
  });
});
