import { cn } from "assets/lib/utils";
import type { TablatureMeasure } from "feature/exercisePlan/types/exercise.types";
import { Maximize2, Minimize2, Music2 } from "lucide-react";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import {
  freqToPitchClass,
  getCentsDistance,
  getFrequencyFromTab,
  NOTES,
} from "utils/audio/noteUtils";

import { useNoteMatchingContext } from "../contexts/NoteMatchingContext";
import type { GemShapeKey } from "./highway3dSettings";
import { HIGHWAY3D_THEMES, useHighway3DSettings } from "./highway3dSettings";
import { MicHud } from "./MicHud";
import { STRING_PALETTES } from "./tablatureSettings";
import type { NoteRD } from "./useTablatureRenderData";
import { useTablatureRenderData } from "./useTablatureRenderData";

interface NoteHighway3DProps {
  measures: TablatureMeasure[];
  /** Force a rebuild of the note geometry (exercise change / restart). */
  resetKey?: number;
  /** Ear-training / riddle modes hide the notes but keep the board. */
  hideNotes?: boolean;
  /** Board height in px (windowed mode). The renderer + camera adapt via ResizeObserver. */
  heightPx?: number;
  className?: string;
  /** Shows the score/accuracy/combo HUD in full screen mode (it's already docked
   *  above the board in windowed mode, but full screen covers that with this canvas). */
  isMicEnabled?: boolean;
  /** Exercise/song title — shown top-left in full screen mode. */
  title?: string;
  /** Song cover art (only set when practicing a song that has one assigned). */
  coverUrl?: string;
  /** Artist name — only set (alongside coverUrl) when practicing a song. */
  subtitle?: string;
  /** e.g. "E Standard", "Drop D" — shown top-left in full screen mode. */
  tuningLabel?: string;
  bpm?: number;
  /** Remaining metronome count-in beats before playback starts (4 → 0). Drives the get-ready HUD. */
  countInRemaining?: number;
  /** Seek playback to a beat — clicking the full-screen waveform nav jumps to a measure. */
  onSeek?: (beat: number) => void;
}

// ── Highway projection ────────────────────────────────────────────────────────
// Highway X axis = fret lanes across the FULL 24-fret neck, note color = string,
// note height above the board = string (low E hugs the board, high e floats).
// A guitar neck (fret wires, inlay dots, numbers, the 6 colored strings) sits
// horizontal at the hit line; the highway ribbon is SHEARED so its far end
// drifts right, and the camera pans along the neck to follow
// wherever the notes are played.
const SPACING = 2.4; // z world-units per beat (base — scaled by settings)
const NECK_LEN = 400; // highway length into the fog
const LANE_W = 1.15; // x world-units per fret lane
const GEM_W = LANE_W * 0.84; // wide → rectangular (landscape) note face
const GEM_H = 0.38; // note block height (short vs wide = rectangular)
const GEM_DEPTH = 0.14; // note block thickness (front-to-back)
const STRIP_LEN = 2.6; // depth of the neck strip in front of the hit line
// Where sustain tails are consumed — the clip plane below sits here, so a
// parked gem placed at this z eats its own tail with no seam or overlap.
// MUST equal the strings'/wires'/inlays' own z (STRIP_LEN * 0.5, see the
// `str.position`/`wire.position` sets below): a parked gem's world Y already
// matches its string exactly, but under the tilted camera, matching Y at a
// DIFFERENT z than the physical string still projects to a different screen
// position — a parked/held note used to visibly settle a string-row off from
// the string it was actually on. Keeping this depth identical to the neck's
// own is what makes the note land exactly on its string, not just at the
// right height in the abstract.
const HIT_LINE_Z = STRIP_LEN * 0.5;
const NUM_TILT = -0.18; // lean fret-number plates back toward the camera
const FULL_FRETS = 24; // the whole neck is always drawn; the camera pans it
const PAN_LOOKAHEAD = 8; // build-time pan look-ahead (open-note placement)
const MARKER_FRETS = new Set([3, 5, 7, 9, 12, 15, 17, 19, 21, 24]);
const STRING_LABELS = ["e", "B", "G", "D", "A", "E"] as const; // strings 1..6, standard tuning
// ── Sustain ──────────────────────────────────────────────────────────────────
// A note this long stops at the neck instead of riding past, and throws sparks
// for exactly as long as its tail is still being drawn.
const SUSTAIN_MIN_BEATS = 1;
const SUSTAIN_FADE = 0.18; // beats the parked gem takes to dissolve at the end
// Pitch detection drops out constantly mid-ring (picking noise, harmonics
// swamping the fundamental). Sparks keep flowing through gaps this short, so
// a held note reads as one continuous shower instead of a strobe.
const HOLD_GRACE = 0.14; // seconds of silence tolerated before sparks cut
const SPARK_INTERVAL = 0.028; // seconds between spark emissions while holding
// ── String vibration ─────────────────────────────────────────────────────────
// A correctly-played string physically buzzes: a standing wave (ends pinned at
// nut + bridge, belly swinging) whose amplitude decays back to rest.
const VIB_SEGMENTS = 48; // length subdivisions so the wire can bend smoothly
const VIB_HZ = 22; // visual buzz frequency (real pitch would alias)
const VIB_AMP = 0.05; // peak belly swing (world units — under stringGap)
const VIB_DECAY = 0.45; // seconds a pluck takes to settle
const VIB_HOLD_LEVEL = 0.55; // steady buzz kept alive while a sustain is held
const HIT_COLOR = new THREE.Color(0x22c55e); // green — note played correctly
const MISS_COLOR = new THREE.Color(0xef4444); // red — note missed
const MISS_GRAY = new THREE.Color(0x52525b); // missed gems fade to this gray
const WHITE = new THREE.Color(0xffffff);

/**
 * Note-block geometry for the chosen silhouette, always occupying the same
 * width/height/depth footprint so the instancing maths, decals and tails line
 * up regardless of shape. The disc shapes are cylinders laid on the Z axis so
 * their face points at the camera.
 */
function makeGemGeometry(
  shape: GemShapeKey,
  w: number,
  h: number,
  d: number,
): THREE.BufferGeometry {
  switch (shape) {
    case "sharp":
      return new THREE.BoxGeometry(w, h, d);
    case "coin": {
      const g = new THREE.CylinderGeometry(0.5, 0.5, 1, 32);
      g.rotateX(Math.PI / 2);
      g.scale(w, h, d);
      return g;
    }
    case "hex": {
      const g = new THREE.CylinderGeometry(0.5, 0.5, 1, 6);
      g.rotateX(Math.PI / 2);
      g.rotateZ(Math.PI / 2);
      g.scale(w, h, d);
      return g;
    }
    default:
      // Radius must stay under half the smallest dimension — depth is the thin one.
      return new RoundedBoxGeometry(w, h, d, 3, Math.min(0.05, d * 0.45));
  }
}

// ── Canvas textures ──────────────────────────────────────────────────────────

/** Cache of fret-number textures (0–24, or "X" for muted): tinted digit.
 *  `halo` adds a soft dark drop-shadow for digits floating over the dark board;
 *  numbers printed on the bright note pills skip it (crisp ink, like the 2D tab). */
function fretTexture(
  fret: number | string,
  cache: Map<string, THREE.Texture>,
  color = "#ffffff",
  halo = true,
): THREE.Texture {
  const key = `${fret}:${color}:${halo ? 1 : 0}`;
  const existing = cache.get(key);
  if (existing) return existing;
  const size = 256;
  const cv = document.createElement("canvas");
  cv.width = cv.height = size;
  const ctx = cv.getContext("2d")!;
  ctx.clearRect(0, 0, size, size);
  // Exact same face as the 2D tab's pill digits (`bold 13px Inter`);
  // two-digit frets get a smaller size so they stay inside the texture.
  const fs = String(fret).length > 1 ? 138 : 168;
  ctx.font = `bold ${fs}px Inter, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  if (halo) {
    // Soft dark halo instead of a fat stroke — readable on any fill without
    // making the digit look heavy. Two passes deepen the halo.
    ctx.shadowColor = "rgba(0,0,0,0.9)";
    ctx.shadowBlur = 21;
    ctx.shadowOffsetY = 7;
    ctx.fillStyle = color;
    ctx.fillText(String(fret), size / 2, size / 2 + 7);
    ctx.shadowBlur = 9;
  } else {
    ctx.fillStyle = color;
  }
  ctx.fillText(String(fret), size / 2, size / 2 + 7);
  const tex = new THREE.CanvasTexture(cv);
  tex.anisotropy = 8;
  cache.set(key, tex);
  return tex;
}

/** Small round technique badge (H / P / B / S / ~ / PM), tinted per technique. */
function badgeTexture(
  label: string,
  color: string,
  cache: Map<string, THREE.Texture>,
): THREE.Texture {
  const existing = cache.get(label);
  if (existing) return existing;
  const size = 128;
  const cv = document.createElement("canvas");
  cv.width = cv.height = size;
  const ctx = cv.getContext("2d")!;
  ctx.clearRect(0, 0, size, size);
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2 - 6, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(24,24,27,0.92)";
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = color;
  ctx.stroke();
  ctx.font = `bold ${label.length > 1 ? 52 : 68}px system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = color;
  ctx.fillText(label, size / 2, size / 2 + 4);
  const tex = new THREE.CanvasTexture(cv);
  tex.anisotropy = 4;
  cache.set(label, tex);
  return tex;
}

/** Hexagonal per-string tuning-name tag (e/B/G/D/A/E), same dark-fill +
 *  colored-ring + colored-letter language as the technique badges, just a
 *  hexagon instead of a circle — a permanent legend pinned to the left edge
 *  of whatever fret window the camera is currently showing. */
function hexTagTexture(
  label: string,
  color: string,
  cache: Map<string, THREE.Texture>,
): THREE.Texture {
  const existing = cache.get(label);
  if (existing) return existing;
  const size = 256; // hi-res so it stays crisp at the small on-screen size
  const cv = document.createElement("canvas");
  cv.width = cv.height = size;
  const ctx = cv.getContext("2d")!;
  ctx.clearRect(0, 0, size, size);
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 16;
  const hex = () => {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i;
      const x = cx + r * Math.cos(a);
      const y = cy + r * Math.sin(a);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
  };
  // Solid near-black fill (fully opaque, high contrast) …
  hex();
  ctx.fillStyle = "#0d0d10";
  ctx.fill();
  // … a colored ring so the string reads at a glance even when the tag is tiny …
  ctx.lineWidth = 14;
  ctx.strokeStyle = color;
  hex();
  ctx.stroke();
  // … and a bright WHITE letter (max legibility on the dark fill).
  ctx.font = "bold 112px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#ffffff";
  ctx.fillText(label, cx, cy + 6);
  const tex = new THREE.CanvasTexture(cv);
  tex.anisotropy = 8;
  cache.set(label, tex);
  return tex;
}

/** Chord-name plate floating above a chord panel (cached per name). */
function chordNameTexture(
  name: string,
  cache: Map<string, THREE.Texture>,
): THREE.Texture {
  const existing = cache.get(name);
  if (existing) return existing;
  const cv = document.createElement("canvas");
  cv.width = 512;
  cv.height = 128;
  const ctx = cv.getContext("2d")!;
  ctx.clearRect(0, 0, cv.width, cv.height);
  ctx.font = "bold 84px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineWidth = 12;
  ctx.lineJoin = "round";
  ctx.strokeStyle = "rgba(0,0,0,0.95)";
  ctx.strokeText(name, 256, 68);
  ctx.fillStyle = "#a5f3fc";
  ctx.fillText(name, 256, 68);
  const tex = new THREE.CanvasTexture(cv);
  tex.anisotropy = 4;
  cache.set(name, tex);
  return tex;
}

/** Soft radial white glow, tinted per use via material color. */
function glowTexture(): THREE.Texture {
  const size = 128;
  const cv = document.createElement("canvas");
  cv.width = cv.height = size;
  const ctx = cv.getContext("2d")!;
  const g = ctx.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2,
  );
  g.addColorStop(0, "rgba(255,255,255,0.95)");
  g.addColorStop(0.35, "rgba(255,255,255,0.35)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(cv);
}

/** Faint nebula backdrop. Colours come from the active theme. */
function nebulaTexture(
  colors: readonly [string, string, string],
): THREE.Texture {
  const cv = document.createElement("canvas");
  cv.width = 512;
  cv.height = 256;
  const ctx = cv.getContext("2d")!;
  const blob = (x: number, y: number, r: number, color: string) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, cv.width, cv.height);
  };
  blob(150, 120, 160, colors[0]);
  blob(380, 90, 150, colors[1]);
  blob(280, 200, 120, colors[2]);
  return new THREE.CanvasTexture(cv);
}

// ── Theme scenery ─────────────────────────────────────────────────────────────
// Living 3D set-dressing per backdrop theme. Everything here rides the same
// scroll as the notes (world.position.z), wrapping in a fixed z-band so the
// environment streams past endlessly — sky elements follow the camera pan
// instead. All of it is additive/unlit and instanced or pooled, so the note
// hot path stays untouched.

interface ThemeScenery {
  update: (dt: number, scrollZ: number, panX: number, pulse: number) => void;
}

/** Retro synthwave sun: warm gradient disc with scanline slits over its lower half. */
function sunTexture(): THREE.Texture {
  const cv = document.createElement("canvas");
  cv.width = 256;
  cv.height = 256;
  const ctx = cv.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 20, 0, 236);
  g.addColorStop(0, "#ffd94a");
  g.addColorStop(0.45, "#ff8c37");
  g.addColorStop(1, "#ff2d95");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(128, 128, 108, 0, Math.PI * 2);
  ctx.fill();
  // Scanline slits, growing thicker toward the horizon.
  ctx.globalCompositeOperation = "destination-out";
  for (let i = 0; i < 7; i++) {
    const y = 132 + i * 14;
    ctx.fillRect(0, y, 256, 2 + i * 1.1);
  }
  return new THREE.CanvasTexture(cv);
}

/** One tile of neon floor grid — tiled via RepeatWrapping into an endless plane. */
function gridTexture(color: string): THREE.Texture {
  const cv = document.createElement("canvas");
  cv.width = 64;
  cv.height = 64;
  const ctx = cv.getContext("2d")!;
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.strokeRect(1.5, 1.5, 61, 61);
  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

/** Soft vertical light bands — an aurora curtain sheet. */
function auroraTexture(c1: string, c2: string): THREE.Texture {
  const cv = document.createElement("canvas");
  cv.width = 512;
  cv.height = 128;
  const ctx = cv.getContext("2d")!;
  for (let i = 0; i < 26; i++) {
    const x = Math.random() * 512;
    const w = 14 + Math.random() * 46;
    const g = ctx.createLinearGradient(0, 0, 0, 128);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(0.5, i % 2 ? c1 : c2);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.globalAlpha = 0.16 + Math.random() * 0.2;
    ctx.fillRect(x, 0, w, 128);
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = THREE.RepeatWrapping;
  return tex;
}

/**
 * Builds the moving environment for the active theme and returns its per-frame
 * updater. Wrapping trick: an item's visual z is (base + scrollZ) folded into
 * [-BAND..near], so as the song scrolls the set streams past and recycles.
 */
function buildThemeScenery(
  themeKey: string,
  theme: { hitLight: string; nebula: readonly [string, string, string] },
  scene: THREE.Scene,
  track: <T extends THREE.BufferGeometry>(g: T) => T,
  trackM: <T extends THREE.Material>(m: T) => T,
  textures: THREE.Texture[],
  glowTex: THREE.Texture,
  shear: number,
): ThemeScenery {
  const BAND = 170; // depth of the recycling band (world units)

  // ── Particle Waves: a rolling sea of glowing dots flanking the highway ────
  // Two interfering sine waves ripple a flat XZ grid of points below the board,
  // so it reads as a glowing ocean receding to the horizon on either side.
  if (themeKey === "waves") {
    const GRID = 60; // GRID×GRID dots — one draw call as THREE.Points
    const SEP = 8; // world units between neighbours
    const BASE_Y = -13; // sits under the board; peaks rise toward its edges
    const AMP = 5.5; // wave height
    const zStart = -360; // front edge of the field, receding into the fog
    const half = (GRID * SEP) / 2;

    const N = GRID * GRID;
    const pos = new Float32Array(N * 3);
    for (let ix = 0; ix < GRID; ix++) {
      for (let iy = 0; iy < GRID; iy++) {
        const i = ix * GRID + iy;
        pos[i * 3] = ix * SEP - half;
        pos[i * 3 + 1] = BASE_Y;
        pos[i * 3 + 2] = zStart + iy * SEP;
      }
    }
    const geo = track(new THREE.BufferGeometry());
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const mat = trackM(
      new THREE.PointsMaterial({
        size: 2.4,
        map: glowTex,
        color: new THREE.Color(theme.hitLight),
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
        fog: true,
      }),
    );
    const sea = new THREE.Points(geo, mat);
    scene.add(sea);
    let count = 0;

    return {
      update(dt, _scrollZ, panX, pulse) {
        count += dt * 3; // wave phase advance (≈ the original 0.1/frame)
        const p = geo.getAttribute("position") as THREE.BufferAttribute;
        const a = p.array as Float32Array;
        for (let ix = 0; ix < GRID; ix++) {
          const wx = Math.sin((ix + count) * 0.3) * AMP;
          for (let iy = 0; iy < GRID; iy++) {
            a[(ix * GRID + iy) * 3 + 1] =
              BASE_Y + wx + Math.sin((iy + count) * 0.5) * AMP;
          }
        }
        p.needsUpdate = true;
        sea.position.x = panX * 0.5;
        mat.opacity = 0.75 + 0.2 * pulse;
      },
    };
  }

  // ── Sunset Drive: synthwave sun + rushing neon grid floors ───────────────
  if (themeKey === "sunset") {
    const sunTex = sunTexture();
    textures.push(sunTex);
    const sunMat = trackM(
      new THREE.MeshBasicMaterial({
        map: sunTex,
        transparent: true,
        opacity: 0.9,
        depthWrite: false,
        fog: false,
      }),
    );
    const sun = new THREE.Mesh(track(new THREE.PlaneGeometry(56, 56)), sunMat);
    sun.position.set(shear * 60, 20, -155);
    scene.add(sun);

    // Soft magenta halo behind the sun, breathing with the beat.
    const haloMat = trackM(
      new THREE.SpriteMaterial({
        map: glowTex,
        color: 0xff2d95,
        transparent: true,
        opacity: 0.35,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        fog: false,
      }),
    );
    const halo = new THREE.Sprite(haloMat);
    halo.scale.set(115, 115, 1);
    halo.position.set(shear * 60, 20, -157);
    scene.add(halo);

    // Glowing horizon line where the grid meets the sky.
    const horizonMat = trackM(
      new THREE.MeshBasicMaterial({
        map: glowTex,
        color: 0xff5db0,
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        fog: false,
      }),
    );
    const horizon = new THREE.Mesh(
      track(new THREE.PlaneGeometry(300, 8)),
      horizonMat,
    );
    horizon.position.set(shear * 60, 0.8, -152);
    scene.add(horizon);

    const gTex = gridTexture("rgba(255,45,149,0.55)");
    textures.push(gTex);
    gTex.repeat.set(9, 40);
    const gridMat = trackM(
      new THREE.MeshBasicMaterial({
        map: gTex,
        transparent: true,
        opacity: 0.5,
        depthWrite: false,
      }),
    );
    const gridGeo = track(new THREE.PlaneGeometry(72, 250));
    const floors = [-1, 1].map((side) => {
      const m = new THREE.Mesh(gridGeo, gridMat);
      m.rotation.x = -Math.PI / 2;
      m.position.set(side * 52, -0.35, -95);
      scene.add(m);
      return m;
    });

    return {
      update(_dt, scrollZ, panX, pulse) {
        // 250 world units of plane / 40 repeats = 6.25 units per grid cell.
        gTex.offset.y = -scrollZ / 6.25;
        sun.position.x = panX + shear * 60;
        halo.position.x = panX + shear * 60;
        horizon.position.x = panX + shear * 60;
        sunMat.opacity = 0.85 + 0.15 * pulse;
        haloMat.opacity = 0.3 + 0.2 * pulse;
        for (const f of floors)
          f.position.x +=
            (panX + Math.sign(f.position.x) * 52 - f.position.x) * 0.1;
      },
    };
  }

  // ── Aurora: waving light curtains + falling snow ─────────────────────────
  if (themeKey === "aurora") {
    const curtains = [0, 1, 2].map((i) => {
      const tex = auroraTexture("rgba(52,211,153,0.8)", "rgba(34,211,238,0.7)");
      textures.push(tex);
      const mat = trackM(
        new THREE.MeshBasicMaterial({
          map: tex,
          transparent: true,
          opacity: 0.3 - i * 0.06,
          depthWrite: false,
          fog: false,
          blending: THREE.AdditiveBlending,
          side: THREE.DoubleSide,
        }),
      );
      const mesh = new THREE.Mesh(
        track(new THREE.PlaneGeometry(210, 44 + i * 10)),
        mat,
      );
      mesh.position.set(shear * 55, 34 + i * 6, -125 - i * 12);
      scene.add(mesh);
      return { mesh, mat, tex, speed: 0.008 + i * 0.005 };
    });

    const N = 320;
    const arr = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 130;
      arr[i * 3 + 1] = Math.random() * 30;
      arr[i * 3 + 2] = -Math.random() * BAND + 6;
    }
    const snowGeo = track(new THREE.BufferGeometry());
    snowGeo.setAttribute("position", new THREE.BufferAttribute(arr, 3));
    const snowMat = trackM(
      new THREE.PointsMaterial({
        size: 0.32,
        map: glowTex,
        transparent: true,
        opacity: 0.55,
        color: 0xcffafe,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
      }),
    );
    const snow = new THREE.Points(snowGeo, snowMat);
    scene.add(snow);
    let lastScroll = 0;

    return {
      update(dt, scrollZ, panX, pulse) {
        const dz = scrollZ - lastScroll;
        lastScroll = scrollZ;
        for (const c of curtains) {
          c.tex.offset.x += dt * c.speed;
          c.mesh.position.x = panX * 0.9 + shear * 55;
          c.mat.opacity = Math.max(
            0.12,
            c.mat.opacity * 0.98 + (0.3 + 0.18 * pulse) * 0.02,
          );
        }
        const p = snowGeo.getAttribute("position") as THREE.BufferAttribute;
        const a = p.array as Float32Array;
        for (let i = 0; i < N; i++) {
          a[i * 3 + 1] -= dt * (1.1 + (i % 5) * 0.22);
          a[i * 3 + 2] += dz;
          if (a[i * 3 + 1] < -1) a[i * 3 + 1] = 30;
          if (a[i * 3 + 2] > 6) a[i * 3 + 2] -= BAND;
        }
        p.needsUpdate = true;
        snow.position.x = panX;
      },
    };
  }

  // ── Ember: embers rising out of the dark, streaming past ─────────────────
  if (themeKey === "ember") {
    const N = 300;
    const arr = new Float32Array(N * 3);
    const seed = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 120;
      arr[i * 3 + 1] = Math.random() * 26;
      arr[i * 3 + 2] = -Math.random() * BAND + 6;
      seed[i] = Math.random() * Math.PI * 2;
    }
    const geo = track(new THREE.BufferGeometry());
    geo.setAttribute("position", new THREE.BufferAttribute(arr, 3));
    const mat = trackM(
      new THREE.PointsMaterial({
        size: 0.5,
        map: glowTex,
        transparent: true,
        opacity: 0.8,
        color: 0xff7a1a,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
      }),
    );
    const embers = new THREE.Points(geo, mat);
    scene.add(embers);
    let t = 0;
    let lastScroll = 0;

    return {
      update(dt, scrollZ, panX, pulse) {
        t += dt;
        const dz = scrollZ - lastScroll;
        lastScroll = scrollZ;
        const p = geo.getAttribute("position") as THREE.BufferAttribute;
        const a = p.array as Float32Array;
        for (let i = 0; i < N; i++) {
          a[i * 3] += Math.sin(t * 1.4 + seed[i]) * dt * 1.1;
          a[i * 3 + 1] += dt * (1.4 + (i % 7) * 0.28);
          a[i * 3 + 2] += dz;
          if (a[i * 3 + 1] > 27) a[i * 3 + 1] = -0.5;
          if (a[i * 3 + 2] > 6) a[i * 3 + 2] -= BAND;
        }
        p.needsUpdate = true;
        embers.position.x = panX;
        mat.opacity = 0.7 + 0.3 * pulse;
      },
    };
  }

  // Midnight (and any unknown key): the original nebula + starfield carry it.
  return { update: () => undefined };
}

/** One coil of a wound string: bright crown falling into the dark seam
 *  between windings. Tiled hundreds of times along the string as map+bump,
 *  it reads as the fine ridged winding of a real bass-side string. */
function stringWindingTexture(repeats: number): THREE.Texture {
  const cv = document.createElement("canvas");
  cv.width = 4;
  cv.height = 16;
  const ctx = cv.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 0, 0, 16);
  g.addColorStop(0, "#6f6f6f");
  g.addColorStop(0.3, "#ffffff");
  g.addColorStop(0.65, "#bdbdbd");
  g.addColorStop(1, "#3f3f3f");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 4, 16);
  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, repeats);
  tex.anisotropy = 8;
  return tex;
}

/** Hollow rounded-tag outline for the ghost note preview — border only,
 *  empty inside, so the "play this next" marker never reads as a real gem.
 *  Double stroke: soft outer halo + crisp inner line (tinted per string). */
function ghostOutlineTexture(): THREE.Texture {
  const cv = document.createElement("canvas");
  cv.width = 512;
  cv.height = 192;
  const ctx = cv.getContext("2d")!;
  const stroke = (inset: number, width: number, alpha: number) => {
    const r = Math.round((cv.height - inset * 2) * 0.23); // matches the gem tag radius

    const x0 = inset;
    const y0 = inset;
    const x1 = cv.width - inset;
    const y1 = cv.height - inset;
    ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(x0 + r, y0);
    ctx.arcTo(x1, y0, x1, y1, r);
    ctx.arcTo(x1, y1, x0, y1, r);
    ctx.arcTo(x0, y1, x0, y0, r);
    ctx.arcTo(x0, y0, x1, y0, r);
    ctx.closePath();
    ctx.stroke();
  };
  stroke(20, 30, 0.35);
  stroke(20, 13, 1);
  const tex = new THREE.CanvasTexture(cv);
  tex.anisotropy = 4;
  return tex;
}

/** Flat rounded-tag face used ONLY for the hit-flash echo (the gem itself is
 *  a real 3D block now — see gemsMesh). White/gray so per-instance tinting
 *  lands as a solid, saturated flash in the note's own color. */
function gemTagTexture(): THREE.Texture {
  const cv = document.createElement("canvas");
  cv.width = 1024;
  cv.height = 384;
  const ctx = cv.getContext("2d")!;
  const inset = 20;
  // Corner radius proportional to the 2D pill (5px on a 22px block ≈ 23%).
  const r = Math.round((cv.height - inset * 2) * 0.23);
  const x0 = inset;
  const y0 = inset;
  const x1 = cv.width - inset;
  const y1 = cv.height - inset;
  const path = () => {
    ctx.beginPath();
    ctx.moveTo(x0 + r, y0);
    ctx.arcTo(x1, y0, x1, y1, r);
    ctx.arcTo(x1, y1, x0, y1, r);
    ctx.arcTo(x0, y1, x0, y0, r);
    ctx.arcTo(x0, y0, x1, y0, r);
    ctx.closePath();
  };
  // Flat pure-white fill: after per-instance tinting the pill IS the string
  // color, exactly like the 2D pill. No border either (the 2D has none) —
  // the white top-half sheen lives on a separate overlay mesh, because a
  // multiplicative tint could never brighten past the base color.
  ctx.fillStyle = "#ffffff";
  path();
  ctx.fill();
  const tex = new THREE.CanvasTexture(cv);
  tex.anisotropy = 8;
  return tex;
}

/** The single most relevant technique to badge a note with (or none). */
function techBadge(n: NoteRD): { label: string; color: string } | null {
  if (n.isBend) return { label: "B", color: "#c084fc" };
  // slideOut/slideIn are enums where 0 = None (the GP parser stamps 0 on
  // every note) — only a positive value is an actual slide.
  if ((n.slideOut ?? 0) > 0 || (n.slideIn ?? 0) > 0)
    return { label: "S", color: "#4ade80" };
  if (n.isHammerOn) return { label: "H", color: "#fbbf24" };
  if (n.isPullOff) return { label: "P", color: "#22d3ee" };
  if (n.isVibrato) return { label: "~", color: "#f472b6" };
  if (n.isPalmMute) return { label: "PM", color: "#a1a1aa" };
  return null;
}

/** Names a root+fifth (optionally +octave) dyad/triad as a power chord (e.g.
 *  "E5", "F#5") from its actual sounding pitches. GP imports almost never
 *  attach a chord-diagram name to a power chord, so without this a beat like
 *  low-E-string + A-string a fret up never got boxed/labelled as a chord at
 *  all — just two loose gems. Returns undefined for anything that isn't a
 *  clean root+fifth shape (real chords still come from `beat.chordName`). */
function powerChordName(
  notes: NoteRD[],
  tuningOffsets?: readonly number[],
): string | undefined {
  const pitched = notes.filter((n) => !n.isDead);
  if (pitched.length < 2) return undefined;
  const freqs = pitched.map((n) =>
    getFrequencyFromTab(n.string, n.fret, tuningOffsets),
  );
  const rootPc = freqToPitchClass(Math.min(...freqs));
  const otherPcs = new Set(
    freqs.map(freqToPitchClass).filter((pc) => pc !== rootPc),
  );
  if (otherPcs.size !== 1) return undefined;
  const [fifthPc] = otherPcs;
  if ((fifthPc - rootPc + 12) % 12 !== 7) return undefined;
  return `${NOTES[rootPc]}5`;
}

/** A DEEPER, richer version of a colour — the "you played it" look: not brighter
 *  and never washed toward white, but MORE of its own hue (full saturation, the
 *  lightness pulled down a touch so it reads deep and expressive, e.g. a plain
 *  blue → a deep saturated blue). */
function deepen(src: THREE.Color, out: THREE.Color): THREE.Color {
  const hsl = { h: 0, s: 0, l: 0 };
  src.getHSL(hsl);
  return out.setHSL(hsl.h, 1, Math.min(0.5, hsl.l * 0.92));
}

/** A VIVID, punchy version of a colour — the "play this string next" look:
 *  pushed to full saturation and lifted to at least a mid lightness, so it
 *  reads as a bold, saturated hue under the lit-metal shading instead of a
 *  pastel wash. Never blended toward white (that flattens the hue itself). */
function vivid(src: THREE.Color, out: THREE.Color): THREE.Color {
  const hsl = { h: 0, s: 0, l: 0 };
  src.getHSL(hsl);
  return out.setHSL(hsl.h, 1, Math.max(0.6, hsl.l));
}

type NoteState = "idle" | "hit" | "miss";

interface NoteEntry {
  key: string;
  string: number;
  fret: number;
  x: number;
  y: number;
  z: number;
  beatPos: number;
  dur: number;
  vib: boolean; // vibrato — the gem wobbles on Y while the note plays
  spawn: number; // 0..1 materialize scale as the note comes out of the fog
  dist: number; // ≥1 far-distance size boost (keeps distant tags readable)
  fade: number; // 1 → 0 dissolve as the note slides off the end of the neck
  glow: number; // last written brightness (spawn ramp × distance dim)
  hitT: number; // seconds since a successful hit (-1 = not in the hit hold/decay)
  tailGone: boolean; // sustain tail hidden (its far end passed the neck too)
  yOff: number; // live Y offset (vibrato wobble)
  xScale: number; // gem x-scale (open notes stretch across the visible window)
  tailLen: number;
  hidden: boolean; // a repeat of the previous chord — only its frame shows, no gem
  // ── sustain ──
  sustain: boolean; // long enough to park at the neck and spark
  zOff: number; // park offset — pins a sustaining gem on the hit line
  targetFreq: number; // pitch that counts as "still holding it" (0 = never sparks)
  holdT: number; // seconds since the mic last heard this note (grace window)
  sparkAcc: number; // spark emitter accumulator (seconds)
  tailGlow: number; // 0..1 highlight on the sustain tail while it's being held
  // Whether tailFillMesh is currently shown for this note (mirrors the whole
  // visible tail, brighter, while the mic hears it actually ringing).
  tailFillOn: boolean;
  // The completion pop (spawnBurst/spawnEcho again) has already fired for
  // this sustain's natural end — fires at most once.
  completed: boolean;
  numMesh: THREE.InstancedMesh;
  numSlot: number;
  badgeMesh?: THREE.InstancedMesh;
  badgeSlot?: number;
  color: THREE.Color;
}

/**
 * Scrolling 3D note highway. A pure consumer of the session's shared
 * playback cursor (`currentBeatsElapsedRef`) and scoring (`hitNotes`/`missedNotes`)
 * from NoteMatchingContext — it renders, it does not track time or match notes.
 * Desktop only; mounted lazily (client-side) from TablatureSection.
 */
export const NoteHighway3D = memo(function NoteHighway3D({
  measures,
  resetKey,
  hideNotes = false,
  heightPx = 400,
  className,
  isMicEnabled = false,
  title,
  coverUrl,
  subtitle,
  tuningLabel,
  bpm,
  countInRemaining = 0,
  onSeek,
}: NoteHighway3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // HUD overlays updated imperatively from the rAF loop (no per-frame React
  // re-render): progress bar + measure counter, the get-ready count-in, and the
  // "why you missed" hint.
  const progressFillRef = useRef<HTMLDivElement>(null);
  const measureLabelRef = useRef<HTMLSpanElement>(null);
  const countdownRef = useRef<HTMLDivElement>(null);
  // Full-screen waveform nav: the played part is revealed via clip-path and the
  // playhead line moved, both written every frame from the rAF loop.
  const navFillRef = useRef<HTMLDivElement>(null);
  const navPlayheadRef = useRef<HTMLDivElement>(null);
  const [isFull, setIsFull] = useState(false);
  // Shared with the settings page, so dragging a slider there moves this scene too.
  const settings = useHighway3DSettings((s) => s.settings);
  const {
    currentBeatsElapsedRef,
    hitNotes,
    missedNotes,
    frequencyRef,
    tuningOffsets,
  } = useNoteMatchingContext();

  const renderData = useTablatureRenderData(measures);

  // Full-screen song navigator: note density bucketed into waveform-style bars,
  // plus measure starts (click → seek target) and a sparse measure-number ruler.
  const nav = useMemo(() => {
    const total = renderData.totalBeats;
    const ends = renderData.measureEndXs;
    if (hideNotes || total <= 0 || ends.length === 0) return null;
    const starts = [0, ...ends.slice(0, -1)];
    const barCount = Math.max(48, Math.min(160, ends.length * 8));
    const counts = new Array<number>(barCount).fill(0);
    for (const b of renderData.renderBeats) {
      if (b.isRest || b.notes.length === 0) continue;
      const i = Math.min(barCount - 1, Math.floor((b.offsetX / total) * barCount));
      counts[i] += b.notes.length;
    }
    let max = 1;
    for (const c of counts) if (c > max) max = c;
    // Silent buckets keep a stub bar so the strip reads as one continuous timeline.
    const bars = counts.map((c) => (c === 0 ? 0.08 : 0.3 + 0.7 * (c / max)));
    const step = [1, 2, 4, 8, 16, 32, 64].find((s) => ends.length / s <= 9) ?? 128;
    const ticks = starts
      .map((beat, i) => ({ n: i + 1, frac: beat / total }))
      .filter((t) => (t.n - 1) % step === 0);
    return { bars, ticks, starts, ends, total };
  }, [renderData, hideNotes]);

  // Keep the latest scoring maps + settings readable from inside the rAF closure.
  const hitRef = useRef(hitNotes);
  const missRef = useRef(missedNotes);
  const settingsRef = useRef(settings);
  // Read through a ref rather than a rebuild dep — a retune mid-exercise isn't
  // worth tearing the whole scene down; the next rebuild restamps the targets.
  const tuningRef = useRef(tuningOffsets);
  // Metronome's pre-roll count-in (4 → 0), read from the rAF loop for the get-ready HUD.
  const countInRef = useRef(countInRemaining);
  useEffect(() => {
    hitRef.current = hitNotes;
    missRef.current = missedNotes;
  }, [hitNotes, missedNotes]);
  useEffect(() => {
    countInRef.current = countInRemaining;
  }, [countInRemaining]);
  useEffect(() => {
    tuningRef.current = tuningOffsets;
  }, [tuningOffsets]);
  useEffect(() => {
    // Persistence now lives in the store; this only keeps the rAF closure current.
    settingsRef.current = settings;
  }, [settings]);

  // Esc exits full mode.
  useEffect(() => {
    if (!isFull) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsFull(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isFull]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const s0 = settingsRef.current; // rebuild-time snapshot (geometry settings)
    // Per-string colours for this build — same palette vocabulary as the flat tab.
    // Falls back when the stored key predates the current palette list.
    const gemPalette = (STRING_PALETTES[s0.palette] ?? STRING_PALETTES.rainbow)
      .colors;
    const spacing = SPACING * s0.noteSpacing;
    let shear = Math.tan(THREE.MathUtils.degToRad(s0.angleDeg));
    // s: 1 = high e … 6 = low E. The thick low E sits at the TOP of the neck,
    // mirroring how the player looks down at their own guitar from above.
    const stringYv = (st: number) => 0.2 + (st - 1) * s0.stringGap;
    // A note sits EXACTLY at its own string's height — so a note reads as
    // being ON that string (aligned with the hexagon label and the neck's
    // string at the hit line), not floating between two strings.
    const noteYv = (st: number) => stringYv(st);

    // ── Full neck: all fret lanes are always drawn; the camera pans along
    // the board to follow whichever frets the upcoming notes actually use. ──
    let minUsed = 25;
    let maxUsed = 0;
    for (const beat of renderData.renderBeats) {
      for (const n of beat.notes) {
        if (n.fret > 0) {
          if (n.fret < minUsed) minUsed = n.fret;
          if (n.fret > maxUsed) maxUsed = n.fret;
        }
      }
    }
    const hasFretted = minUsed <= maxUsed;
    const defaultCenterFret = hasFretted ? (minUsed + maxUsed) / 2 : 5;
    const minFret = 1;
    const maxFret = FULL_FRETS;
    const laneCount = maxFret - minFret + 1;
    const boardW = laneCount * LANE_W;
    const laneX = (fret: number) =>
      -boardW / 2 + (fret - minFret + 0.5) * LANE_W;
    // Open strings (fret 0) have no lane of their own — they're played right at
    // the nut, so that's their fixed world position too: the same bone-white
    // zero-fret wire and per-string hex tags already anchored there. A real,
    // constant spot on the neck instead of a screen-relative estimate means an
    // open note travels a straight lane exactly like every fretted one.
    const OPEN_X = -boardW / 2;

    // Visible window: wide enough for the exercise's fret span (plus context),
    // clamped so the camera never tries to frame the whole 24-fret neck.
    const usedSpan = hasFretted ? maxUsed - minUsed + 1 : 5;
    const visLanes = Math.min(12, Math.max(8, usedSpan + 3));
    const visW = visLanes * LANE_W * s0.windowWidth;
    const panMin = -boardW / 2 + visW / 2;
    const panMax = boardW / 2 - visW / 2;

    // ── Renderer / scene / camera / lights ─────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    // Board-level glow strips (string paths, sustain tails) get sliced off at
    // the hit line by this world-space plane — the `world` group scrolls
    // through it, so passed segments vanish instead of spilling over the neck.
    renderer.localClippingEnabled = true;
    const hitLineClip = new THREE.Plane(
      new THREE.Vector3(0, 0, -1),
      HIT_LINE_Z,
    );
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 380;
    renderer.setSize(width, height, false);
    container.appendChild(renderer.domElement);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";

    const theme = HIGHWAY3D_THEMES[s0.theme] ?? HIGHWAY3D_THEMES.midnight;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(theme.bg);
    const fogFarBase = 60 + visW;
    // Fog shares the sky colour so the highway dissolves into the backdrop
    // instead of fading to a different shade at the horizon.
    const sceneFog = new THREE.Fog(theme.bg, 14, fogFarBase);
    scene.fog = sceneFog;

    // Camera: straight-on, so the guitar neck always sits horizontal at the
    // bottom of the frame. The "rotated" look comes from shearing
    // the highway ribbon itself, NOT from yawing the camera. Per frame the
    // rig slides along X (panX) to follow the upcoming notes' fret region.
    // Tight framing on the active position — the smart zoom pulls back on its
    // own whenever an upcoming cluster wouldn't fit.
    const camH = 2.6 + visW * 0.18;
    const camD = 4.9 + visW * 0.25;
    const lookF = 12 + visW;
    const camera = new THREE.PerspectiveCamera(
      s0.camFov,
      width / height,
      0.1,
      260,
    );
    camera.position.set(0, camH, camD);
    camera.lookAt(0, 0, -lookF);

    // Shading: soft ambient + a key light from the upper front + a cyan wash
    // around the hit zone so approaching gems catch the light.
    scene.add(new THREE.AmbientLight(0xffffff, 0.65));
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.6);
    keyLight.position.set(3, 9, 7);
    scene.add(keyLight);
    const hitZoneLight = new THREE.PointLight(
      new THREE.Color(theme.hitLight),
      3.2,
      22,
      1.6,
    );
    hitZoneLight.position.set(0, 2.2, 1.5);
    scene.add(hitZoneLight);

    const geometries: THREE.BufferGeometry[] = [];
    const materials: THREE.Material[] = [];
    const textures: THREE.Texture[] = [];
    const track = <T extends THREE.BufferGeometry>(g: T): T => {
      geometries.push(g);
      return g;
    };
    const trackM = <T extends THREE.Material>(m: T): T => {
      materials.push(m);
      return m;
    };

    const glowTex = glowTexture();
    textures.push(glowTex);

    // ── Backdrop nebula (pulses on the beat + follows the camera pan) ──────
    const nebulaMat = trackM(
      new THREE.MeshBasicMaterial({
        map: nebulaTexture(theme.nebula),
        transparent: true,
        opacity: 0.6,
        depthWrite: false,
        fog: false,
      }),
    );
    textures.push(nebulaMat.map!);
    const nebula = new THREE.Mesh(
      track(new THREE.PlaneGeometry(260, 130)),
      nebulaMat,
    );
    nebula.position.set(shear * 60, 24, -140);
    scene.add(nebula);

    // ── Drifting starfield ─────────────────────────────────────────────────
    const starCount = 160;
    const starArr = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      starArr[i * 3] = (Math.random() - 0.5) * 240;
      starArr[i * 3 + 1] = 2 + Math.random() * 55;
      starArr[i * 3 + 2] = -30 - Math.random() * 170;
    }
    const starGeo = track(new THREE.BufferGeometry());
    starGeo.setAttribute("position", new THREE.BufferAttribute(starArr, 3));
    const starsMat = trackM(
      new THREE.PointsMaterial({
        size: 0.5,
        map: glowTex,
        transparent: true,
        opacity: 0.45,
        color: 0x93a4c8,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        fog: false,
        sizeAttenuation: true,
      }),
    );
    const stars = new THREE.Points(starGeo, starsMat);
    scene.add(stars);

    // ── Sheared highway container ──────────────────────────────────────────
    // x' = x + SHEAR·(z − HIT_LINE_Z): pinned at z = HIT_LINE_Z, not z = 0 —
    // that's the depth a parked/sustained gem actually settles at (see the
    // zOff park math below), and the neck's own strings/frets/numbers are
    // unsheared. Pinning at 0 left every note (and its fret number) reading a
    // hair off the neck's straight lines for as long as it sat there; pinning
    // at the real resting depth keeps it landed exactly on its fret. The far
    // end still drifts to the RIGHT — only the anchor of that drift moves.
    // Everything that runs into the distance lives in here; the neck stays straight.
    const highway = new THREE.Group();
    highway.matrixAutoUpdate = false;
    // Inverse shear, baked into every note-block instance matrix (between its
    // translation and scale): the parent shear then cancels on the geometry
    // but not the position — blocks stay ON their sheared lane yet stand
    // perfectly upright instead of skewing into a parallelogram (a 3D box
    // sheared with the board reads as a broken "flap"; flat planes never
    // showed it, real depth does).
    const invShearMat = new THREE.Matrix4();
    const applyShear = () => {
      highway.matrix.set(
        1,
        0,
        -shear,
        shear * HIT_LINE_Z,
        0,
        1,
        0,
        0,
        0,
        0,
        1,
        0,
        0,
        0,
        0,
        1,
      );
      highway.matrixWorldNeedsUpdate = true;
      invShearMat.set(1, 0, shear, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
    };
    applyShear();
    scene.add(highway);

    // ── Theme scenery — moving set-dressing that rides the note scroll. ────
    const scenery = buildThemeScenery(
      s0.theme in HIGHWAY3D_THEMES ? s0.theme : "midnight",
      theme,
      scene,
      track,
      trackM,
      textures,
      glowTex,
      shear,
    );

    // ── Highway board + fret grid + edge rails ─────────────────────────────
    // Board surface. "Board opacity" is a live setting driving DISTANT frets:
    // the stretch around the active fret window stays solid, and the ribbon
    // dissolves toward the far frets via per-vertex alpha (the plane is
    // segmented across its width so the falloff has vertices to ride on).
    const boardMat = trackM(
      new THREE.MeshBasicMaterial({ color: 0x0b0b10, vertexColors: true }),
    );
    const boardGeo = track(
      new THREE.PlaneGeometry(boardW, NECK_LEN + STRIP_LEN, 64, 1),
    );
    const boardVertCount = boardGeo.getAttribute("position").count;
    {
      const rgba = new Float32Array(boardVertCount * 4).fill(1);
      boardGeo.setAttribute("color", new THREE.BufferAttribute(rgba, 4));
    }
    const boardColorAttr = boardGeo.getAttribute(
      "color",
    ) as THREE.BufferAttribute;
    const boardPosAttr = boardGeo.getAttribute(
      "position",
    ) as THREE.BufferAttribute;
    const board = new THREE.Mesh(boardGeo, boardMat);
    board.rotation.x = -Math.PI / 2;
    board.position.set(0, -0.02, -(NECK_LEN - STRIP_LEN) / 2);
    highway.add(board);

    // Alternate lane shading (subtle columns across the highway)
    const laneShadeMat = trackM(
      new THREE.MeshBasicMaterial({
        color: 0x15151d,
        transparent: true,
        opacity: 0.5,
      }),
    );
    for (let k = 0; k < laneCount; k += 2) {
      const lane = new THREE.Mesh(
        track(new THREE.PlaneGeometry(LANE_W, NECK_LEN)),
        laneShadeMat,
      );
      lane.rotation.x = -Math.PI / 2;
      lane.position.set(laneX(minFret + k), -0.01, -NECK_LEN / 2);
      highway.add(lane);
    }

    // Fret boundary lines running into the distance
    const fretLineMat = trackM(
      new THREE.MeshBasicMaterial({ color: 0x1f1f2a }),
    );
    for (let k = 0; k <= laneCount; k++) {
      const x = -boardW / 2 + k * LANE_W;
      const line = new THREE.Mesh(
        track(new THREE.BoxGeometry(0.03, 0.006, NECK_LEN)),
        fretLineMat,
      );
      line.position.set(x, 0.003, -NECK_LEN / 2);
      highway.add(line);
    }

    // Marker fret numbers painted flat on the board (3, 5, 7, 9, 12…) in a few
    // rows into the distance, so lanes stay identifiable as the notes roll in.
    const boardNumCache = new Map<string, THREE.Texture>();
    const boardNumMats: { mat: THREE.MeshBasicMaterial; x: number }[] = [];
    const boardNumGeo = track(new THREE.PlaneGeometry(0.95, 0.95));
    for (const f of MARKER_FRETS) {
      const tex = fretTexture(f, boardNumCache);
      const mat = trackM(
        new THREE.MeshBasicMaterial({
          map: tex,
          transparent: true,
          opacity: 0.4,
          depthWrite: false,
        }),
      );
      boardNumMats.push({ mat, x: laneX(f) });
      for (const z of [-4, -14, -30]) {
        const plate = new THREE.Mesh(boardNumGeo, mat);
        plate.rotation.x = -Math.PI / 2;
        plate.position.set(laneX(f), 0.004, z);
        highway.add(plate);
      }
    }
    for (const t of boardNumCache.values()) textures.push(t);

    // ── Anchor zone: lighter panel over the lanes the hand covers ──────────
    const anchorMat = trackM(
      new THREE.MeshBasicMaterial({
        color: 0x42556e,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      }),
    );
    const anchor = new THREE.Mesh(
      track(new THREE.PlaneGeometry(1, NECK_LEN)),
      anchorMat,
    );
    anchor.rotation.x = -Math.PI / 2;
    anchor.position.set(0, 0.0095, -NECK_LEN / 2);
    highway.add(anchor);

    // ── Inactive-region dimmers: the board outside the camera's active fret
    // window falls into shadow, keeping the eye on the playable lanes. Two
    // flat panels (left/right of the window), resized per frame to the pan. ─
    const dimMat = trackM(
      new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
      }),
    );
    const dimGeo = track(new THREE.PlaneGeometry(1, NECK_LEN + STRIP_LEN));
    const dimSides: THREE.Mesh[] = [];
    for (let i = 0; i < 2; i++) {
      const m = new THREE.Mesh(dimGeo, dimMat);
      m.rotation.x = -Math.PI / 2;
      m.position.set(0, 0.012, -(NECK_LEN - STRIP_LEN) / 2);
      highway.add(m);
      dimSides.push(m);
    }

    // Vertical curtains shading the NECK outside the same window. The strings,
    // fret wires and inlays stand above the board, so the flat panels above
    // can't reach them — these front-facing planes catch what they miss. The
    // texture gives each curtain a soft inner edge instead of a hard cut.
    const curtainCv = document.createElement("canvas");
    curtainCv.width = 64;
    curtainCv.height = 4;
    {
      const cctx = curtainCv.getContext("2d")!;
      const cg = cctx.createLinearGradient(0, 0, 64, 0);
      cg.addColorStop(0, "rgba(0,0,0,1)");
      cg.addColorStop(0.8, "rgba(0,0,0,1)");
      cg.addColorStop(1, "rgba(0,0,0,0)");
      cctx.fillStyle = cg;
      cctx.fillRect(0, 0, 64, 4);
    }
    const curtainTex = new THREE.CanvasTexture(curtainCv);
    textures.push(curtainTex);
    const curtainMat = trackM(
      new THREE.MeshBasicMaterial({
        map: curtainTex,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        side: THREE.DoubleSide,
        fog: false,
      }),
    );
    // Tall enough to cover the top string from the camera's raised viewpoint.
    const curtainH = stringYv(6) + 1.6;
    const curtainGeo = track(new THREE.PlaneGeometry(1, curtainH));
    const neckCurtains: THREE.Mesh[] = [];
    for (let i = 0; i < 2; i++) {
      const m = new THREE.Mesh(curtainGeo, curtainMat);
      // In front of every neck element (strings sit at z = STRIP_LEN * 0.5).
      m.position.set(0, curtainH / 2 - 0.6, STRIP_LEN * 0.94);
      scene.add(m);
      neckCurtains.push(m);
    }

    // ── Guitar neck at the hit line: wood, fret wires, inlay dots, the 6
    // colored strings and a number under every single fret. The notes land
    // right on it, so the fret you play is read straight off the neck. ──────
    const topStringY = stringYv(6); // low E — the highest-drawn string

    // Floor under the strings — neutral near-black, matching the highway board
    // so the neck reads as one dark surface (no warm "wood" panel).
    const stripBase = new THREE.Mesh(
      track(new THREE.PlaneGeometry(boardW + 1.2, STRIP_LEN)),
      trackM(new THREE.MeshBasicMaterial({ color: 0x0b0b10 })),
    );
    stripBase.rotation.x = -Math.PI / 2;
    stripBase.position.set(0, 0.001, STRIP_LEN / 2);
    scene.add(stripBase);

    // …and a translucent fretboard face behind them, so the strings + inlay
    // dots read as one solid guitar neck instead of floating lines. Neutral
    // dark (no warm wood tint) so it disappears into the background.
    const faceH = topStringY + 0.18;
    const faceMat = trackM(
      new THREE.MeshBasicMaterial({
        color: 0x0d0d13,
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
      }),
    );
    const face = new THREE.Mesh(
      track(new THREE.PlaneGeometry(boardW + 1.2, faceH)),
      faceMat,
    );
    face.position.set(0, faceH / 2, STRIP_LEN * 0.5 - 0.16);
    scene.add(face);

    // Strings — kept as live handles so the animation loop can spotlight the
    // string(s) the upcoming notes are played on and dim the rest. Lit metal
    // cylinders: the bass-side strings carry a tiled winding texture (map +
    // bump) for the ridged wound-wire look, the treble side is plain shiny
    // steel. Emissive keeps the gameplay string color readable regardless of
    // the lighting; the key light adds the round 3D falloff and specular.
    interface StringHandle {
      mesh: THREE.Mesh;
      mat: THREE.MeshStandardMaterial;
      bright: THREE.Color;
      mid: THREE.Color;
      geo: THREE.BufferGeometry; // live geometry — its Y is bent while vibrating
      basePos: Float32Array; // rest-shape vertex positions to bend from
      halfLen: number; // half the string length (for the 0..1 axis map)
    }
    const stringMeshes: StringHandle[] = [];
    for (let s = 1; s <= 6; s++) {
      // Low strings drawn thicker (real string gauge); the low E (purple)
      // gets an extra bump so the bass anchor of the neck reads instantly.
      const t = s === 6 ? 0.033 : 0.009 + (s - 1) * 0.003;
      const base = new THREE.Color(gemPalette[s - 1] ?? "#ffffff");
      const len = boardW + 1.2;
      const wound = s >= 3; // G/D/A/E are wound wires; B/e are plain steel
      let mat: THREE.MeshStandardMaterial;
      if (wound) {
        // Winding pitch tied to gauge — thicker strings coil coarser.
        const tex = stringWindingTexture(Math.round(len / (t * 2)));
        textures.push(tex);
        mat = trackM(
          new THREE.MeshStandardMaterial({
            color: base.clone(),
            map: tex,
            bumpMap: tex,
            bumpScale: 0.03,
            metalness: 0.7,
            roughness: 0.45,
            emissive: base.clone().multiplyScalar(0.35),
          }),
        );
      } else {
        mat = trackM(
          new THREE.MeshStandardMaterial({
            color: base.clone(),
            metalness: 0.85,
            roughness: 0.22,
            emissive: base.clone().multiplyScalar(0.35),
          }),
        );
      }
      // Round cylinder, not a box — reads as an actual wire instead of a flat
      // bar. Baking the 90° turn into the geometry (not the mesh rotation)
      // keeps scale.y/scale.z as the thickness axes for the highlight boost.
      // Subdivided along its length so a played string can flex into a
      // standing-wave buzz (see the per-frame vibration pass).
      const strGeo = track(
        new THREE.CylinderGeometry(t / 2, t / 2, len, 12, VIB_SEGMENTS),
      );
      strGeo.rotateZ(Math.PI / 2);
      const str = new THREE.Mesh(strGeo, mat);
      str.position.set(0, stringYv(s), STRIP_LEN * 0.5);
      scene.add(str);
      stringMeshes.push({
        mesh: str,
        mat,
        bright: vivid(base, new THREE.Color()),
        mid: base.clone(),
        geo: strGeo,
        basePos: (
          strGeo.getAttribute("position").array as Float32Array
        ).slice(),
        halfLen: len / 2,
      });
    }
    // Lights the exact string just played up bright-white for an instant —
    // layered on top of the look-ahead spotlight, decays on its own each frame.
    const stringFlash = new Float32Array(6);
    const flashString = (str: number) => {
      stringFlash[Math.max(1, Math.min(6, Math.round(str))) - 1] = 1;
    };
    // Physical string buzz: amplitude per string (1 = fresh pluck, 0 = at rest),
    // decayed each frame; `vibDrawn` remembers which geometries are bent so a
    // settled string is restored to its rest shape exactly once.
    const stringVib = new Float32Array(6);
    const vibDrawn = [false, false, false, false, false, false];
    let vibClock = 0; // running time driving the oscillation phase
    const vibrateString = (str: number) => {
      stringVib[Math.max(1, Math.min(6, Math.round(str))) - 1] = 1;
    };

    // ── String tuning-name tags — a permanent hexagon legend (e/B/G/D/A/E)
    // pinned to the START of the neck (just left of the nut), one per string,
    // tinted in that string's own color. Fixed in world X (does NOT follow the
    // camera pan): it always marks the beginning of the fretboard. Sprites so
    // the legend faces the camera head-on whatever the framing. ──────────────
    const labelNutX = -boardW / 2 - 0.45;
    const hexTagCache = new Map<string, THREE.Texture>();
    for (let s = 1; s <= 6; s++) {
      const mat = trackM(
        new THREE.SpriteMaterial({
          map: hexTagTexture(
            STRING_LABELS[s - 1],
            gemPalette[s - 1] ?? "#ffffff",
            hexTagCache,
          ),
          transparent: true,
          depthTest: false,
        }),
      );
      const sprite = new THREE.Sprite(mat);
      sprite.scale.set(0.42, 0.42, 1); // smaller than before
      sprite.position.set(labelNutX, stringYv(s), STRIP_LEN * 0.5);
      scene.add(sprite);
    }
    for (const t of hexTagCache.values()) textures.push(t);

    // Fret wires (k = 0 is the nut — thicker and bone-white). They end right
    // at the top string — no posts sticking out like a fence. Each gets its
    // OWN material (not a shared one) so a hit can flash just that one fret
    // bright without touching its neighbours.
    const wireH = topStringY + 0.02;
    const WIRE_BASE = new THREE.Color(0x71717a);
    const NUT_BASE = new THREE.Color(0xd6d3d1);
    const wireMats: THREE.MeshBasicMaterial[] = [];
    const fretFlash = new Float32Array(laneCount + 1); // index 0 = nut
    const fretFlashColor: THREE.Color[] = [];
    for (let k = 0; k <= laneCount; k++) {
      const x = -boardW / 2 + k * LANE_W;
      const isNut = k === 0;
      const mat = trackM(
        new THREE.MeshBasicMaterial({
          color: (isNut ? NUT_BASE : WIRE_BASE).clone(),
        }),
      );
      wireMats.push(mat);
      fretFlashColor.push(WHITE.clone());
      const wire = new THREE.Mesh(
        track(
          new THREE.BoxGeometry(
            isNut ? 0.1 : 0.035,
            wireH,
            isNut ? 0.08 : 0.04,
          ),
        ),
        mat,
      );
      wire.position.set(x, wireH / 2, STRIP_LEN * 0.5);
      scene.add(wire);
    }
    // Lights up the fret just played, in the color of the string that hit it —
    // decays on its own each frame (see the flash-decay pass in the loop).
    const flashFret = (fret: number, color: THREE.Color) => {
      const k = Math.max(0, Math.min(laneCount, Math.round(fret)));
      fretFlash[k] = 1;
      fretFlashColor[k].copy(color).lerp(WHITE, 0.5);
    };

    // Inlay dots at the marker frets (double at 12 / 24) — centred on the
    // string band and sitting just behind the strings, like real inlays.
    const neckMidY = (stringYv(1) + topStringY) / 2;
    const inlayMat = trackM(
      new THREE.MeshBasicMaterial({
        color: 0x5eead4,
        transparent: true,
        opacity: 0.6,
      }),
    );
    const inlayGeo = track(new THREE.CircleGeometry(0.1, 24));
    for (const f of MARKER_FRETS) {
      const ys = f % 12 === 0 ? [neckMidY - 0.38, neckMidY + 0.38] : [neckMidY];
      for (const y of ys) {
        const dot = new THREE.Mesh(inlayGeo, inlayMat);
        dot.position.set(laneX(f), y, STRIP_LEN * 0.5 - 0.08);
        scene.add(dot);
      }
    }

    // Fret numbers under the neck — every single fret is labelled and kept
    // readable; the classic marker frets are amber, bigger, brighter.
    // They sit on the SAME z as the strings/wires/inlay dots (STRIP_LEN * 0.5):
    // the camera is tilted, so a same-X sprite at a different depth than the
    // fret it labels drifts sideways under perspective, worse the further the
    // pan centre is from that fret — it used to float at STRIP_LEN + 0.4, well
    // in front of the neck, which is exactly what caused that drift. Scale is
    // boosted to offset the extra camera distance so the labels read the same size.
    // Y is pinned clearly below the lowest string (stringYv(1)) — at the old,
    // much-closer z the same y=1.1 read as "under the neck" purely because
    // close-up objects sit lower on screen for a given world height, but at
    // this z (shared with the strings) that y sits mid-stack, not under it.
    const stripNumCache = new Map<string, THREE.Texture>();
    const rulerNums: { mat: THREE.SpriteMaterial; x: number; base: number }[] =
      [];
    const rulerZ = STRIP_LEN * 0.5;
    const rulerY = stringYv(1) - 0.55;
    const rulerSizeComp = (camD - rulerZ) / (camD - (STRIP_LEN + 0.4));
    for (let f = minFret; f <= maxFret; f++) {
      const isMarker = MARKER_FRETS.has(f);
      const tex = fretTexture(
        f,
        stripNumCache,
        isMarker ? "#fbbf24" : "#d4d4d8",
      );
      const mat = trackM(
        new THREE.SpriteMaterial({
          map: tex,
          transparent: true,
          opacity: isMarker ? 1 : 0.8,
          depthTest: false,
        }),
      );
      const sprite = new THREE.Sprite(mat);
      const sc = (isMarker ? 0.62 : 0.5) * s0.fretLabelSize * rulerSizeComp;
      sprite.scale.set(sc, sc, 1);
      sprite.position.set(laneX(f), rulerY, rulerZ);
      scene.add(sprite);
      rulerNums.push({ mat, x: laneX(f), base: isMarker ? 1 : 0.8 });
    }
    for (const t of stripNumCache.values()) textures.push(t);

    // ── Pulsing hit-line glow ───────────────────────────────────────────────
    // Subtle — the neck itself is the visual hit marker (like the real game).
    const hitGlowMat = trackM(
      new THREE.MeshBasicMaterial({
        map: glowTex,
        transparent: true,
        opacity: 0.4,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        color: 0x22d3ee,
      }),
    );
    const hitGlow = new THREE.Mesh(
      track(new THREE.PlaneGeometry(visW + 3, 2.4)),
      hitGlowMat,
    );
    hitGlow.rotation.x = -Math.PI / 2;
    hitGlow.position.set(0, 0.015, 0);
    scene.add(hitGlow);

    // ── Hit-burst particles (one pooled additive Points cloud) ─────────────
    const MAX_P = 240;
    const pPos = new Float32Array(MAX_P * 3);
    const pCol = new Float32Array(MAX_P * 3);
    const pVel = new Float32Array(MAX_P * 3);
    const pLife = new Float32Array(MAX_P);
    const pMaxLife = new Float32Array(MAX_P);
    const pBase = new Float32Array(MAX_P * 3);
    for (let i = 0; i < MAX_P; i++) pPos[i * 3 + 1] = -50; // park off-screen
    const pGeo = track(new THREE.BufferGeometry());
    pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
    pGeo.setAttribute("color", new THREE.BufferAttribute(pCol, 3));
    const particles = new THREE.Points(
      pGeo,
      trackM(
        new THREE.PointsMaterial({
          size: 0.32,
          map: glowTex,
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          vertexColors: true,
          sizeAttenuation: true,
        }),
      ),
    );
    particles.frustumCulled = false;
    scene.add(particles);
    let pCursor = 0;
    let pAlive = 0;
    let lightPulse = 0;
    // Damped presence of the inactive-region shadow (0 = no window → no dim).
    let dimK = 0;

    // Forked into a handful of arms (like a lightning strike) rather than an
    // even circular spray — reads as a jolt of electricity, not a dust puff.
    const BURST_ARMS = 5;
    const ELECTRIC = new THREE.Color(0.82, 0.92, 1); // white-hot electric blue
    const spawnBurst = (x: number, y: number, color: THREE.Color) => {
      const count = Math.round(settingsRef.current.particles);
      for (let k = 0; k < count; k++) {
        const i = pCursor;
        pCursor = (pCursor + 1) % MAX_P;
        pPos[i * 3] = x;
        pPos[i * 3 + 1] = y;
        // On the neck, same depth as the gem it bursts from (see spawnMissMarker) —
        // was a stale 0.2 left over from before HIT_LINE_Z lined up with the neck,
        // which put the burst noticeably off the string under the tilted camera.
        pPos[i * 3 + 2] = STRIP_LEN * 0.5 + 0.06;
        const arm = Math.floor(Math.random() * BURST_ARMS);
        const a =
          (arm / BURST_ARMS) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
        // Snappier and shorter-lived than a floaty confetti fall — a spark
        // jumps and is gone, it doesn't drift.
        const sp = 2.2 + Math.random() * 3.4;
        pVel[i * 3] = Math.cos(a) * sp;
        pVel[i * 3 + 1] = Math.abs(Math.sin(a)) * sp * 0.7 + 0.6;
        pVel[i * 3 + 2] = (Math.random() - 0.3) * 1.6;
        pLife[i] = pMaxLife[i] = 0.2 + Math.random() * 0.18;
        // Most sparks run hot white-blue (electricity is the same colour
        // whatever it arcs through); the rest keep the string's own colour
        // so the burst still reads as "this note, this string".
        const src = Math.random() < 0.6 ? ELECTRIC : color;
        pBase[i * 3] = Math.min(1, src.r * 1.5 + 0.2);
        pBase[i * 3 + 1] = Math.min(1, src.g * 1.5 + 0.2);
        pBase[i * 3 + 2] = Math.min(1, src.b * 1.5 + 0.2);
      }
      pAlive = 1; // force the update pass to run; it recounts live particles
      lightPulse = 2.2;
    };

    // Sustain sparks: a thin, continuous trickle off a parked gem — the same
    // pool as the hit burst, but a couple of short-lived embers per emission
    // rather than a one-shot explosion, so a long hold reads as a steady
    // shower that can run for bars without ever draining MAX_P.
    const spawnSpark = (
      x: number,
      y: number,
      z: number,
      color: THREE.Color,
      strength: number,
    ) => {
      const count = Math.max(1, Math.round(2 * strength));
      for (let k = 0; k < count; k++) {
        const i = pCursor;
        pCursor = (pCursor + 1) % MAX_P;
        pPos[i * 3] = x + (Math.random() - 0.5) * GEM_W * 0.7;
        pPos[i * 3 + 1] = y + (Math.random() - 0.5) * GEM_H * 0.6;
        pPos[i * 3 + 2] = z + (Math.random() - 0.5) * 0.15;
        // Mostly upward and toward the camera — embers coming off the neck,
        // not a sphere of debris (that's the hit burst's job).
        const a = Math.random() * Math.PI * 2;
        const sp = 0.5 + Math.random() * 1.1;
        pVel[i * 3] = Math.cos(a) * sp * 0.5;
        pVel[i * 3 + 1] = 1.1 + Math.random() * 1.5;
        pVel[i * 3 + 2] = Math.sin(a) * sp * 0.35 + 0.3;
        pLife[i] = pMaxLife[i] = 0.22 + Math.random() * 0.2;
        pBase[i * 3] = Math.min(1, color.r * 1.5 + 0.25);
        pBase[i * 3 + 1] = Math.min(1, color.g * 1.5 + 0.25);
        pBase[i * 3 + 2] = Math.min(1, color.b * 1.5 + 0.25);
      }
      pAlive = 1;
    };

    // Is the mic still hearing this note? Detection routinely locks onto an
    // upper harmonic (or the sub-octave on wound strings) instead of the
    // fundamental, so accept those too — same ladder the note matcher uses,
    // loosened a little: holding a note drifts more than the attack does.
    const stillRinging = (freq: number, target: number) => {
      if (target <= 0 || freq <= 20) return false;
      const tol = target < 100 ? 80 : target < 165 ? 70 : 55;
      return (
        Math.abs(getCentsDistance(freq, target)) <= tol ||
        (target < 165 && Math.abs(getCentsDistance(freq / 2, target)) <= tol) ||
        (target < 130 && Math.abs(getCentsDistance(freq / 3, target)) <= tol) ||
        (target > 70 && Math.abs(getCentsDistance(freq * 2, target)) <= tol)
      );
    };

    // Fade to black = invisible under additive blending, so per-particle alpha
    // is faked by scaling the color toward black as life runs out.
    const updateParticles = (dt: number) => {
      if (pAlive === 0) return;
      let alive = 0;
      for (let i = 0; i < MAX_P; i++) {
        if (pLife[i] <= 0) continue;
        pLife[i] -= dt;
        if (pLife[i] <= 0) {
          pPos[i * 3 + 1] = -50;
          pCol[i * 3] = pCol[i * 3 + 1] = pCol[i * 3 + 2] = 0;
          continue;
        }
        alive++;
        // Fast lateral jitter instead of a smooth ballistic path — sparks
        // crackle and zig-zag, they don't arc gracefully like debris. `i` as
        // a phase offset keeps particles alive at the same time decorrelated.
        const jitter = Math.sin(pLife[i] * 90 + i * 2.7) * 3.4;
        pPos[i * 3] += (pVel[i * 3] + jitter) * dt;
        pPos[i * 3 + 1] += pVel[i * 3 + 1] * dt;
        pPos[i * 3 + 2] += (pVel[i * 3 + 2] + jitter * 0.6) * dt;
        pVel[i * 3 + 1] -= 5 * dt; // lighter fall — a snap, not a drift
        const t = pLife[i] / pMaxLife[i];
        // Strobe flicker on top of the fade — electricity stutters, it
        // doesn't dim smoothly. Sharper (t*t) falloff makes it snap out too.
        const flicker =
          0.65 + 0.35 * Math.abs(Math.sin(i * 12.9 + pLife[i] * 220));
        const b = t * t * flicker;
        pCol[i * 3] = pBase[i * 3] * b;
        pCol[i * 3 + 1] = pBase[i * 3 + 1] * b;
        pCol[i * 3 + 2] = pBase[i * 3 + 2] * b;
      }
      pAlive = alive;
      (pGeo.getAttribute("position") as THREE.BufferAttribute).needsUpdate =
        true;
      (pGeo.getAttribute("color") as THREE.BufferAttribute).needsUpdate = true;
    };

    // ── Hit-flash echo: a brighter ghost of the gem pops outward and fades on
    // every hit — a mesh-based impact flash layered under the particle burst. ─
    const ECHO_N = 10;
    const ECHO_LIFE = 0.32;
    // Shared flat tag face (dark fill + thin bright border) — used by the
    // note gems and by this hit-flash echo, so the flash matches the tag.
    const tagTex = gemTagTexture();
    textures.push(tagTex);
    const echoGeo = track(
      new THREE.PlaneGeometry(GEM_W * s0.gemSize, GEM_H * s0.gemSize),
    );
    interface Echo {
      mesh: THREE.Mesh;
      mat: THREE.MeshBasicMaterial;
      life: number;
      xScale: number;
    }
    const echoes: Echo[] = [];
    for (let i = 0; i < ECHO_N; i++) {
      const mat = trackM(
        new THREE.MeshBasicMaterial({
          map: tagTex,
          transparent: true,
          opacity: 0,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        }),
      );
      const mesh = new THREE.Mesh(echoGeo, mat);
      mesh.visible = false;
      mesh.rotation.x = 0; // upright, matching the untilted blocks
      scene.add(mesh);
      echoes.push({ mesh, mat, life: 0, xScale: 1 });
    }
    let echoCursor = 0;
    const spawnEcho = (
      x: number,
      y: number,
      xScale: number,
      color: THREE.Color,
    ) => {
      if (settingsRef.current.echoStrength <= 0) return;
      const e = echoes[echoCursor];
      echoCursor = (echoCursor + 1) % ECHO_N;
      // Same depth as the neck/gem (see spawnMissMarker) — a stale 0.15 used to
      // sit well off the strings' z, so the flash read a string-row too high.
      e.mesh.position.set(x, y, STRIP_LEN * 0.5 + 0.06);
      // Leans electric-blue rather than neutral white, so the impact flash
      // matches the spark burst instead of reading as a plain camera flash.
      e.mat.color.copy(color).lerp(ELECTRIC, 0.55);
      e.life = ECHO_LIFE;
      e.xScale = xScale;
      e.mesh.visible = true;
    };
    const updateEchoes = (dt: number) => {
      for (const e of echoes) {
        if (!e.mesh.visible) continue;
        e.life -= dt;
        if (e.life <= 0) {
          e.mesh.visible = false;
          continue;
        }
        const t = e.life / ECHO_LIFE; // 1 → 0
        const grow = 0.85 + (1 - t) * 0.55; // pops outward as it fades
        e.mesh.scale.set(grow * e.xScale, grow, grow);
        e.mat.opacity = t * t * settingsRef.current.echoStrength;
      }
    };

    // ── Miss markers: a red note-outline that flashes ON THE NECK at the exact
    // string+fret a missed note should have been played — the mistake is shown
    // where you'd actually fix it (an upright frame on the fretboard, like the
    // ghost preview but red and momentary), not as a text popup off to the side.
    const MISS_N = 10;
    const MISS_LIFE = 0.8;
    const missTex = ghostOutlineTexture();
    textures.push(missTex);
    const missGeo = track(
      new THREE.PlaneGeometry(
        GEM_W * s0.gemSize * 1.18,
        GEM_H * s0.gemSize * 1.18,
      ),
    );
    interface MissMark {
      mesh: THREE.Mesh;
      mat: THREE.MeshBasicMaterial;
      life: number;
    }
    const missMarks: MissMark[] = [];
    for (let i = 0; i < MISS_N; i++) {
      const mat = trackM(
        new THREE.MeshBasicMaterial({
          map: missTex,
          color: 0xef4444,
          transparent: true,
          opacity: 0,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        }),
      );
      const mesh = new THREE.Mesh(missGeo, mat);
      mesh.visible = false;
      mesh.renderOrder = 5;
      scene.add(mesh);
      missMarks.push({ mesh, mat, life: 0 });
    }
    let missCursor = 0;
    const spawnMissMarker = (x: number, y: number) => {
      const m = missMarks[missCursor];
      missCursor = (missCursor + 1) % MISS_N;
      m.mesh.position.set(x, y, STRIP_LEN * 0.5 + 0.06); // on the neck, just in front
      m.life = MISS_LIFE;
      m.mesh.visible = true;
    };
    const updateMissMarks = (dt: number) => {
      for (const m of missMarks) {
        if (!m.mesh.visible) continue;
        m.life -= dt;
        if (m.life <= 0) {
          m.mesh.visible = false;
          continue;
        }
        const t = m.life / MISS_LIFE; // 1 → 0
        const grow = 1.35 - 0.3 * (1 - t); // pops big, settles slightly
        m.mesh.scale.set(grow, grow, 1);
        // Two quick blinks fading out — reads as "here!" without lingering.
        const blink = 0.55 + 0.45 * Math.abs(Math.sin(t * Math.PI * 2.5));
        m.mat.opacity = t * blink;
      }
    };

    // ── Moving world group (notes + measure/beat markers) ──────────────────
    // Lives inside the sheared container, so notes slide diagonally along the
    // ribbon and straighten out exactly as they reach the neck.
    const world = new THREE.Group();
    highway.add(world);

    const markerMat = trackM(new THREE.MeshBasicMaterial({ color: 0x2e2e3a }));
    for (const beatPos of [0, ...renderData.measureEndXs]) {
      const line = new THREE.Mesh(
        track(new THREE.BoxGeometry(boardW, 0.014, 0.04)),
        markerMat,
      );
      line.position.set(0, 0.008, -beatPos * spacing);
      world.add(line);
    }

    // Faint per-beat sublines (instanced — one draw call even for long songs)
    const beatCount = Math.max(0, Math.floor(renderData.totalBeats));
    if (beatCount > 0) {
      const beatLines = new THREE.InstancedMesh(
        track(new THREE.BoxGeometry(boardW, 0.006, 0.02)),
        trackM(new THREE.MeshBasicMaterial({ color: 0x1d1d26 })),
        beatCount,
      );
      const bDummy = new THREE.Object3D();
      for (let b = 1; b <= beatCount; b++) {
        bDummy.position.set(0, 0.004, -b * spacing);
        bDummy.updateMatrix();
        beatLines.setMatrixAt(b - 1, bDummy.matrix);
      }
      beatLines.instanceMatrix.needsUpdate = true;
      world.add(beatLines);
    }

    // Flatten notes from the shared render data.
    const flat: {
      key: string;
      string: number;
      fret: number;
      z: number;
      dur: number;
      beatPos: number;
      tech: { label: string; color: string } | null;
      rd: NoteRD;
    }[] = [];
    if (!hideNotes) {
      for (const beat of renderData.renderBeats) {
        for (const n of beat.notes) {
          flat.push({
            key: n.noteKey,
            string: n.string,
            fret: n.fret,
            z: -beat.offsetX * spacing,
            dur: beat.duration,
            beatPos: beat.offsetX,
            tech: techBadge(n),
            rd: n,
          });
        }
      }
    }

    // ── Camera pan targets: follow the fret window of the upcoming notes ───
    // Open notes (fret 0) count too — they live at the nut, so the same
    // widening/panning that keeps a wide chord in frame also keeps the nut in
    // frame whenever an open note is due, instead of a bespoke screen chase.
    const fretted = flat; // already beat-ordered
    const centerFretAt = (b: number): number => {
      let lo = 0;
      while (lo < fretted.length && fretted[lo].beatPos < b - 0.5) lo++;
      let mn = Infinity;
      let mx = -Infinity;
      for (
        let j = lo;
        j < fretted.length && fretted[j].beatPos <= b + PAN_LOOKAHEAD;
        j++
      ) {
        if (fretted[j].fret < mn) mn = fretted[j].fret;
        if (fretted[j].fret > mx) mx = fretted[j].fret;
      }
      if (mn !== Infinity) return (mn + mx) / 2;
      if (lo < fretted.length) return fretted[lo].fret; // gap → pre-aim at the next section
      return defaultCenterFret;
    };
    const panXAt = (b: number) =>
      THREE.MathUtils.clamp(laneX(centerFretAt(b)), panMin, panMax);

    const dummy = new THREE.Object3D();
    const tmpMat = new THREE.Matrix4();

    // Beats whose chord repeats the previous one (same shape, back-to-back):
    // their gems are hidden so only the chord frame shows. Filled by the chord
    // panel pass below, read when the note gems are built.
    const repeatChordBeats = new Set<number>();

    // Spawn materialize: how "grown in" a note is, given where the fog sits.
    // 1 = fully there, 0 = still hidden beyond the fog wall.
    const spawnScaleAt = (beatPos: number, beat: number): number => {
      const s = settingsRef.current;
      if (s.spawnFade <= 0) return 1;
      const spawnAtB = (fogFarBase * s.fogDistance) / spacing;
      return THREE.MathUtils.clamp(
        (spawnAtB - (beatPos - beat)) / s.spawnFade,
        0,
        1,
      );
    };

    // ── Chord panels: beats with 3+ notes get a translucent backdrop wall
    // spanning the chord's fret window, plus the chord name when it changes. ─
    if (!hideNotes) {
      interface ChordPanel {
        z: number;
        cx: number;
        w: number;
        y0: number;
        y1: number;
        name?: string;
        repeat: boolean;
      }
      const chordPanels: ChordPanel[] = [];
      let prevName: string | undefined;
      // Repeat-chain declutter: consecutive strums of the SAME shape render dimmed
      // (and unnamed), so a bar of chugging reads as one chord, not eight labels.
      let prevSig: string | undefined;
      let prevSigBeat = -Infinity;
      const gemHalfW = (GEM_W * s0.gemSize) / 2;
      const gemHalfH = (GEM_H * s0.gemSize) / 2;
      // Every chord gets the SAME box size regardless of its
      // shape — a constant-width, full-neck-height zone. Only its CENTRE
      // follows the chord. Width is a fixed slice of the visible window (so it's
      // constant per exercise); height spans all six strings, so open, muted or
      // any-string notes always sit inside.
      const CHORD_BOX_W = visW * 0.62;
      const y0 = Math.max(0, noteYv(1) - gemHalfH - 0.18);
      const y1 = noteYv(6) + gemHalfH + 0.18;
      for (const beat of renderData.renderBeats) {
        // Any 2+ simultaneous notes get boxed as one grouped shape — a plain
        // double-stop reads exactly like a chord it just isn't named. Naming
        // is best-effort on top: a named dyad from the source file, or a power
        // chord (root + fifth, e.g. E5) we can name ourselves from the actual
        // pitches. Single notes never get a box.
        const chordName =
          beat.chordName ?? powerChordName(beat.notes, tuningRef.current);
        if (beat.notes.length < 2) continue;
        // Centre the fixed-width box on the chord's actual gem span. Open (0)
        // notes sit at the nut, so both are folded in here — the box then
        // covers the whole shape.
        let minX = Infinity;
        let maxX = -Infinity;
        for (const n of beat.notes) {
          const open = n.fret === 0;
          const gx = open
            ? OPEN_X
            : laneX(Math.min(Math.max(n.fret, minFret), maxFret));
          const hw = (open ? 1.4 : 1) * gemHalfW;
          minX = Math.min(minX, gx - hw);
          maxX = Math.max(maxX, gx + hw);
        }
        const cx = (minX + maxX) / 2;
        const w = CHORD_BOX_W;
        const sig = beat.notes
          .map((n) => `${n.string}:${n.fret}`)
          .sort()
          .join("|");
        const repeat = sig === prevSig && beat.offsetX - prevSigBeat <= 2.001;
        if (repeat) repeatChordBeats.add(beat.offsetX);
        prevSig = sig;
        prevSigBeat = beat.offsetX;
        const showName =
          chordName && chordName !== prevName ? chordName : undefined;
        if (chordName) prevName = chordName;
        chordPanels.push({
          z: -beat.offsetX * spacing,
          cx,
          w,
          y0,
          y1,
          name: showName,
          repeat,
        });
      }

      if (chordPanels.length > 0) {
        const panelMesh = new THREE.InstancedMesh(
          track(new THREE.PlaneGeometry(1, 1)),
          trackM(
            new THREE.MeshBasicMaterial({
              color: 0x22d3ee,
              transparent: true,
              opacity: 0.05,
              depthWrite: false,
            }),
          ),
          chordPanels.length,
        );
        chordPanels.forEach((p, i) => {
          // A repeated identical chord shows ONLY its frame (see the border
          // pass) — no fill — so a run of the same shape reads as a row of
          // frames, not a stack of filled boxes. Park those instances off-screen.
          if (p.repeat) {
            dummy.position.set(0, -1000, 0);
            dummy.scale.set(0.0001, 0.0001, 0.0001);
          } else {
            // Sit on the notes' own z-plane (not behind it) so the fill+frame
            // line up with the gems instead of drifting up-and-right in the
            // sheared perspective. A touch behind, to stay under the gems.
            dummy.position.set(p.cx, (p.y0 + p.y1) / 2, p.z - GEM_DEPTH);
            dummy.scale.set(p.w, p.y1 - p.y0, 1);
          }
          dummy.rotation.set(0, 0, 0);
          dummy.updateMatrix();
          panelMesh.setMatrixAt(i, dummy.matrix);
          panelMesh.setColorAt(i, WHITE);
        });
        panelMesh.instanceMatrix.needsUpdate = true;
        if (panelMesh.instanceColor) panelMesh.instanceColor.needsUpdate = true;
        world.add(panelMesh);

        // Crisp border frame around each block, so the notes read as one
        // grouped chord. Built as merged quads (4 edges) rather than a
        // stretched texture, so the outline keeps a uniform thickness whatever
        // the panel's width. All four corners of a given panel share one z, so
        // the highway shear only slides them in x — the frame stays a clean
        // rectangle, aligned with the fill and the gems it encloses.
        const bPos: number[] = [];
        const bCol: number[] = [];
        const BORDER_T = 0.045; // frame thickness (world units)
        // The frame is drawn at full strength for repeats too — that IS the
        // "just repeat the frame" cue for a chord held/strummed several times.
        const borderCol = new THREE.Color(0x22d3ee);
        const quad = (
          x0: number,
          y0: number,
          x1: number,
          y1: number,
          z: number,
          c: THREE.Color,
        ) => {
          bPos.push(
            x0,
            y0,
            z,
            x1,
            y0,
            z,
            x1,
            y1,
            z,
            x0,
            y0,
            z,
            x1,
            y1,
            z,
            x0,
            y1,
            z,
          );
          for (let k = 0; k < 6; k++) bCol.push(c.r, c.g, c.b);
        };
        chordPanels.forEach((p) => {
          const c = borderCol;
          const hw = p.w / 2;
          const x0 = p.cx - hw;
          const x1 = p.cx + hw;
          const y0 = p.y0;
          const y1 = p.y1;
          const z = p.z + GEM_DEPTH; // just in front of the gems, aligned in z
          quad(x0, y1 - BORDER_T, x1, y1, z, c); // top
          quad(x0, y0, x1, y0 + BORDER_T, z, c); // bottom
          quad(x0, y0 + BORDER_T, x0 + BORDER_T, y1 - BORDER_T, z, c); // left
          quad(x1 - BORDER_T, y0 + BORDER_T, x1, y1 - BORDER_T, z, c); // right
        });
        if (bPos.length > 0) {
          const bGeo = track(new THREE.BufferGeometry());
          bGeo.setAttribute(
            "position",
            new THREE.Float32BufferAttribute(bPos, 3),
          );
          bGeo.setAttribute("color", new THREE.Float32BufferAttribute(bCol, 3));
          const bMesh = new THREE.Mesh(
            bGeo,
            trackM(
              new THREE.MeshBasicMaterial({
                vertexColors: true,
                transparent: true,
                opacity: 0.85,
                depthWrite: false,
                blending: THREE.AdditiveBlending,
              }),
            ),
          );
          world.add(bMesh);
        }

        const nameCache = new Map<string, THREE.Texture>();
        const nameMats = new Map<string, THREE.MeshBasicMaterial>();
        const nameGeo = track(new THREE.PlaneGeometry(2.4, 0.6));
        for (const p of chordPanels) {
          if (!p.name) continue;
          let mat = nameMats.get(p.name);
          if (!mat) {
            mat = trackM(
              new THREE.MeshBasicMaterial({
                map: chordNameTexture(p.name, nameCache),
                transparent: true,
                depthWrite: false,
              }),
            );
            nameMats.set(p.name, mat);
          }
          const plate = new THREE.Mesh(nameGeo, mat);
          plate.position.set(p.cx, p.y1 + 0.45, p.z + GEM_DEPTH);
          plate.rotation.x = NUM_TILT;
          world.add(plate);
        }
        for (const t of nameCache.values()) textures.push(t);
      }
    }

    // ── Technique ribbons ──────────────────────────────────────────────────
    // Bends rise off the string, slides glide across the lanes to their target
    // fret, vibrato wiggles — one merged, vertex-colored ribbon mesh replaces
    // the straight box tail on those notes, so the shape of the technique is
    // read off the highway itself instead of a badge alone.
    const ribbonRanges = new Map<number, { start: number; count: number }>();
    const hasRibbon: boolean[] = new Array(flat.length).fill(false);
    let ribbonColorAttr: THREE.BufferAttribute | null = null;
    let ribbonMat: THREE.MeshBasicMaterial | null = null;
    if (!hideNotes && flat.length > 0) {
      const SEG = 20;
      const RIB_W = 0.16;
      const rPos: number[] = [];
      const rCol: number[] = [];
      const rIdx: number[] = [];
      const rc = new THREE.Color();
      const smooth = (t: number) => t * t * (3 - 2 * t);

      // A slide's destination is the next note on the same string — the same
      // convention the 2D tab viewer uses for its slide lines.
      const slideTarget = (
        i: number,
      ): { fret: number; beatPos: number } | null => {
        const n = flat[i];
        for (
          let j = i + 1;
          j < flat.length && flat[j].beatPos <= n.beatPos + 4;
          j++
        ) {
          if (flat[j].string === n.string && flat[j].beatPos > n.beatPos)
            return flat[j];
        }
        return null;
      };

      for (let i = 0; i < flat.length; i++) {
        const n = flat[i];
        const rd = n.rd;
        const isSlide = (rd.slideOut ?? 0) > 0 && n.fret > 0;
        const isBend = !!rd.isBend;
        const isVib = !!rd.isVibrato;
        if (!isSlide && !isBend && !isVib) continue;
        if (repeatChordBeats.has(n.beatPos)) continue; // hidden repeat chord — no ribbon either

        const y0 = noteYv(n.string);
        const x0 = laneX(Math.min(Math.max(n.fret, minFret), maxFret));
        const z0 = n.z;
        // Guaranteed readability: even a lightning-fast bend/vibrato gets a
        // ribbon long enough for the eye to parse the curve.
        const visLen = Math.max(n.dur, 0.75);
        let zEnd = z0 - visLen * spacing;
        let x1 = x0;
        let fadeOut = false;

        if (isSlide) {
          const tgt = slideTarget(i);
          if (tgt && tgt.fret > 0) {
            x1 = laneX(Math.min(Math.max(tgt.fret, minFret), maxFret));
            zEnd = -tgt.beatPos * spacing;
          } else {
            // Slide-off with no destination: a short ramp that fades away.
            x1 = x0 - LANE_W * 1.2;
            zEnd = z0 - Math.max(n.dur, 0.5) * spacing;
            fadeOut = true;
          }
        }

        const bendH = isBend
          ? Math.min(0.9, 0.32 * Math.max(1, rd.bendSemitones ?? 1))
          : 0;
        const cycles = Math.max(2, Math.round(visLen * 2.5));
        rc.set(gemPalette[n.string - 1] ?? "#ffffff");

        const vStart = rPos.length / 3;
        for (let k = 0; k <= SEG; k++) {
          const t = k / SEG;
          const x = x0 + (x1 - x0) * smooth(t);
          let y = y0;
          if (isBend) {
            // Flat lead-in → eased rise → hold at the bent pitch; a release
            // bend falls back down over the last third.
            const riseT = THREE.MathUtils.clamp((t - 0.15) / 0.4, 0, 1);
            y = y0 + bendH * (rd.isPreBend ? 1 : smooth(riseT));
            if (rd.isRelease)
              y -= bendH * smooth(THREE.MathUtils.clamp((t - 0.7) / 0.3, 0, 1));
          } else if (isVib && !isSlide) {
            y = y0 + Math.sin(t * cycles * Math.PI * 2) * 0.07;
          }
          const z = z0 + (zEnd - z0) * t;
          // Width perpendicular to the path in the xz-plane — a lane-crossing
          // slide stays a constant-width ribbon instead of smearing into a
          // fat diagonal band.
          const dxd = (x1 - x0) * 6 * t * (1 - t); // d/dt of the smoothstep x
          const dzd = zEnd - z0;
          const inv = RIB_W / 2 / Math.max(1e-6, Math.hypot(dxd, dzd));
          const nx = -dzd * inv;
          const nz = dxd * inv;
          rPos.push(x - nx, y, z - nz, x + nx, y, z + nz);
          // Soft fade-in at the head; slides-to-nowhere fade out completely.
          const aIn = Math.min(1, t / 0.08);
          const aOut = fadeOut
            ? 1 - t
            : t > 0.8
              ? 1 - ((t - 0.8) / 0.2) * 0.65
              : 1;
          const a = 0.85 * aIn * aOut;
          rCol.push(rc.r, rc.g, rc.b, a, rc.r, rc.g, rc.b, a);
        }
        for (let k = 0; k < SEG; k++) {
          const b = vStart + k * 2;
          rIdx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2);
        }
        ribbonRanges.set(i, { start: vStart, count: (SEG + 1) * 2 });
        hasRibbon[i] = true;
      }

      if (rIdx.length > 0) {
        const rGeo = track(new THREE.BufferGeometry());
        rGeo.setAttribute(
          "position",
          new THREE.Float32BufferAttribute(rPos, 3),
        );
        ribbonColorAttr = new THREE.Float32BufferAttribute(rCol, 4);
        rGeo.setAttribute("color", ribbonColorAttr);
        rGeo.setIndex(rIdx);
        ribbonMat = trackM(
          new THREE.MeshBasicMaterial({
            transparent: true,
            vertexColors: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide,
            opacity: s0.tailOpacity,
          }),
        );
        const ribbonMesh = new THREE.Mesh(rGeo, ribbonMat);
        ribbonMesh.frustumCulled = false;
        world.add(ribbonMesh);
      }
    }

    // Recolor one note's ribbon in place (hit → whitened, miss → gray).
    const recolorRibbon = (i: number, color: THREE.Color) => {
      const r = ribbonRanges.get(i);
      if (!r || !ribbonColorAttr) return;
      const arr = ribbonColorAttr.array as Float32Array;
      for (let v = 0; v < r.count; v++) {
        const o = (r.start + v) * 4;
        arr[o] = color.r;
        arr[o + 1] = color.g;
        arr[o + 2] = color.b;
      }
      ribbonColorAttr.needsUpdate = true;
    };

    // ── Notes ──────────────────────────────────────────────────────────────
    const notes: NoteEntry[] = [];
    const noteStates: NoteState[] = new Array(flat.length).fill("idle");
    // Indices currently riding out their hit hold-then-dissolve (see the
    // HIT_HOLD/HIT_DECAY pass in the animation loop) instead of popping away.
    const activeHits: number[] = [];
    let gemsMesh: THREE.InstancedMesh | null = null;
    let glowsMesh: THREE.InstancedMesh | null = null;
    let tailsMesh: THREE.InstancedMesh | null = null;
    // Bright overlay riding the front of each sustain tail, growing as the
    // held-correctly beats accumulate — the 3D analog of the 2D tab's
    // progressive sustain fill (see `heldBeats`).
    let tailFillMesh: THREE.InstancedMesh | null = null;
    let stemsMesh: THREE.InstancedMesh | null = null;
    let shadowsMesh: THREE.InstancedMesh | null = null;
    const plateMeshes: THREE.InstancedMesh[] = [];
    // `celebrate` distinguishes a fresh hit (flash + hold + dissolve) from a
    // rebuild replaying a note that was already hit some time ago (just
    // snap it away — there's no "impact" to celebrate for something that
    // already happened).
    let applyState: (
      i: number,
      st: NoteState,
      celebrate: boolean,
    ) => void = () => undefined;
    let writeNoteMatrices: (i: number, visible: boolean) => void = () =>
      undefined;
    const tmpColor = new THREE.Color();
    const tmpDeep = new THREE.Color(); // scratch for the deepened "played" hue

    if (flat.length > 0) {
      // Reference note: a DARK-fill pill with a mega-saturated coloured
      // border — not a glow, just the geometry itself carrying the colour. The
      // shading is baked into vertex colours (× per-instance string hue) on an
      // UNLIT material: the flat front/back faces stay dark (the fill), while
      // the rounded rim, sides and top ride at full-plus saturation (the
      // border). The white fret number is a separate decal on the front face.
      const gemGeo = track(
        makeGemGeometry(
          s0.gemShape,
          GEM_W * s0.gemSize,
          GEM_H * s0.gemSize,
          GEM_DEPTH * s0.gemSize,
        ),
      );
      {
        const norm = gemGeo.getAttribute("normal");
        const shadeArr = new Float32Array(norm.count * 3);
        const FILL = 0.22; // dark fill on the flat faces (× hue)
        const BORDER = 1.25; // saturated colour on the rim/sides (× hue, clamps)
        for (let v = 0; v < norm.count; v++) {
          const nz = norm.getZ(v);
          // nz² is 1 on the flat front/back faces and falls to 0 across the
          // rim toward the sides/top. `rim` ramps to full quickly (×2.2) so the
          // border saturates crisply over the bevel instead of fading in like a
          // glow — a dark fill ringed by a solid, mega-saturated edge.
          const rim = Math.min(1, (1 - nz * nz) * 2.2);
          const shade = FILL + (BORDER - FILL) * rim;
          shadeArr[v * 3] = shadeArr[v * 3 + 1] = shadeArr[v * 3 + 2] = shade;
        }
        gemGeo.setAttribute("color", new THREE.BufferAttribute(shadeArr, 3));
      }
      gemsMesh = new THREE.InstancedMesh(
        gemGeo,
        trackM(new THREE.MeshBasicMaterial({ vertexColors: true })),
        flat.length,
      );
      gemsMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

      // Neon halo behind every block — an additive radial glow drawn before
      // the (opaque) block, so the block body covers its centre and only a
      // TIGHT rim spills out around the edges (barely larger than the block
      // itself — a wide soft blob reads as distracting fog, not neon).
      glowsMesh = new THREE.InstancedMesh(
        track(
          new THREE.PlaneGeometry(
            GEM_W * s0.gemSize * 1.45,
            GEM_H * s0.gemSize * 2.0,
          ),
        ),
        trackM(
          new THREE.MeshBasicMaterial({
            map: glowTex,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
          }),
        ),
        flat.length,
      );
      glowsMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

      // Sustain tails: a chunky glowing bar trailing straight back FROM the
      // block, at the block's own height (so it reads as the note being held,
      // not a stray line on the floor). Unlit + additive so it glows in the
      // string color; clipped at the hit line so a held note's tail vanishes
      // exactly as the note is struck.
      tailsMesh = new THREE.InstancedMesh(
        track(new THREE.BoxGeometry(GEM_W * 0.5, GEM_H * 0.45, 1)),
        trackM(
          new THREE.MeshBasicMaterial({
            transparent: true,
            opacity: 0.5,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            clippingPlanes: [hitLineClip],
          }),
        ),
        flat.length,
      );
      tailsMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

      // Sustain fill: a brighter core riding the front of the tail (the end
      // closest to the neck), growing as `heldBeats` accumulates — the 2D
      // tab's progressive sustain-fill bar, ported here. A hair wider/taller
      // than the base tail so it reads as a distinct bright core, not a
      // re-tint of the same box (which additive blending would wash flat).
      tailFillMesh = new THREE.InstancedMesh(
        track(new THREE.BoxGeometry(GEM_W * 0.58, GEM_H * 0.52, 1)),
        trackM(
          new THREE.MeshBasicMaterial({
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            clippingPlanes: [hitLineClip],
          }),
        ),
        flat.length,
      );
      tailFillMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

      // Thin stems from the board up to each tag — makes the fret lane of a
      // floating note instantly readable (same trick as the real game).
      stemsMesh = new THREE.InstancedMesh(
        track(new THREE.BoxGeometry(0.022, 1, 0.022)),
        trackM(
          new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.45 }),
        ),
        flat.length,
      );
      stemsMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

      // Soft dark blob under each gem grounds it on the board.
      shadowsMesh = new THREE.InstancedMesh(
        track(new THREE.PlaneGeometry(0.95, 0.55)),
        trackM(
          new THREE.MeshBasicMaterial({
            map: glowTex,
            color: 0x000000,
            transparent: true,
            opacity: 0.45,
            depthWrite: false,
          }),
        ),
        flat.length,
      );
      shadowsMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

      // One InstancedMesh of number plates per distinct fret → ≤25 draw calls
      // even for thousands of notes (per-note sprites would kill the frame rate).
      const numCache = new Map<string, THREE.Texture>();
      const groups = new Map<
        number,
        { mesh: THREE.InstancedMesh; next: number }
      >();
      const countByFret = new Map<number, number>();
      for (const n of flat)
        countByFret.set(n.fret, (countByFret.get(n.fret) ?? 0) + 1);
      // Sized so the digit lands at ~62% of the tag height — the 2D pill's
      // digit-to-pill ratio (13px on a 22px block).
      const numGeo = track(
        new THREE.PlaneGeometry(
          Math.max(0.001, 0.35 * s0.numberSize),
          Math.max(0.001, 0.35 * s0.numberSize),
        ),
      );
      for (const [fret, count] of countByFret) {
        // fret <0 = muted/dead note. Bold white digit with a soft dark halo
        // for contrast against any string color (green on hit, red on miss).
        const tex = fretTexture(
          fret < 0 ? "X" : fret,
          numCache,
          "#ffffff",
          true,
        );
        const mat = trackM(
          new THREE.MeshBasicMaterial({
            map: tex,
            transparent: true,
            depthWrite: false,
          }),
        );
        const mesh = new THREE.InstancedMesh(numGeo, mat, count);
        mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        mesh.renderOrder = 4; // over the tag AND the smoked-glass neck face
        groups.set(fret, { mesh, next: 0 });
        plateMeshes.push(mesh);
      }
      for (const t of numCache.values()) textures.push(t);

      // Same trick for technique badges: one InstancedMesh per technique.
      const badgeCache = new Map<string, THREE.Texture>();
      const badgeGroups = new Map<
        string,
        { mesh: THREE.InstancedMesh; next: number }
      >();
      const badgeCount = new Map<string, number>();
      for (const n of flat) {
        if (n.tech)
          badgeCount.set(n.tech.label, (badgeCount.get(n.tech.label) ?? 0) + 1);
      }
      const badgeGeo = track(
        new THREE.PlaneGeometry(
          Math.max(0.001, 0.34 * s0.badgeSize),
          Math.max(0.001, 0.34 * s0.badgeSize),
        ),
      );
      for (const [label, count] of badgeCount) {
        const color = flat.find((n) => n.tech?.label === label)!.tech!.color;
        const mat = trackM(
          new THREE.MeshBasicMaterial({
            map: badgeTexture(label, color, badgeCache),
            transparent: true,
            depthWrite: false,
          }),
        );
        const mesh = new THREE.InstancedMesh(badgeGeo, mat, count);
        mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        mesh.renderOrder = 4;
        badgeGroups.set(label, { mesh, next: 0 });
        plateMeshes.push(mesh);
      }
      for (const t of badgeCache.values()) textures.push(t);

      // (Re)writes every matrix a note owns; visible=false zero-scales the
      // gem, glow, stem, shadow, number and badge (used when a hit note
      // "pops" away). Blocks stand upright (no lean) like the reference —
      // the camera's own downward angle shows their glossy top face.
      // Spawn materialize (n.spawn) grows the whole block in — slightly
      // y-squashed at first — and vibrato (n.yOff) wobbles it on Y.
      // Every matrix is T(anchor) · invShear · (localOffset · R · S): the
      // parent highway shear cancels against invShear, leaving an upright,
      // unskewed shape whose ANCHOR still rides the sheared lane. Tails are
      // the deliberate exception — they lie along the lanes, so they shear.
      const anchored = (
        px: number,
        py: number,
        pz: number,
        lx: number,
        ly: number,
        lz: number,
        rx: number,
        sx: number,
        sy: number,
        sz: number,
        mesh: THREE.InstancedMesh,
        slot: number,
      ) => {
        tmpMat.makeTranslation(px, py, pz).multiply(invShearMat);
        dummy.position.set(lx, ly, lz);
        dummy.rotation.set(rx, 0, 0);
        dummy.scale.set(sx, sy, sz);
        dummy.updateMatrix();
        tmpMat.multiply(dummy.matrix);
        mesh.setMatrixAt(slot, tmpMat);
      };
      writeNoteMatrices = (i: number, visible: boolean) => {
        const n = notes[i];
        // Repeat-chord gems never draw — only the chord frame stands in for them.
        if (n.hidden) visible = false;
        // fade shrinks the whole tag away once it slides past the neck edge
        const sp = Math.max(0.0001, (0.35 + 0.65 * n.spawn) * n.fade);
        // Distance boost keeps far tags readable; open-note bars keep their
        // window-spanning width (only their height/depth grows).
        const d = n.dist;
        const dx = n.xScale > 1 ? 1 : d;
        const sc = visible ? sp : 0.0001;
        const scY = visible ? sp * (0.55 + 0.45 * n.spawn) : 0.0001;
        const y = n.y + n.yOff;
        // Everything the gem owns rides the park offset together; the tail is
        // written separately and deliberately stays at the note's musical z,
        // so a parked block sits still while its tail keeps feeding into it.
        const z = n.z + n.zOff;

        anchored(
          n.x,
          y,
          z,
          0,
          0,
          0,
          0,
          n.xScale * sc * dx,
          scY * d,
          sc * d,
          gemsMesh!,
          i,
        );
        // Neon halo: same footprint, floated just behind the block.
        anchored(
          n.x,
          y,
          z,
          0,
          0,
          -GEM_DEPTH / 2 - 0.06,
          0,
          n.xScale * sc * dx,
          scY * d,
          sc * d,
          glowsMesh!,
          i,
        );
        anchored(
          n.x,
          y / 2,
          z,
          0,
          0,
          0,
          0,
          sc,
          Math.max(0.001, y - 0.15) * sc,
          sc,
          stemsMesh!,
          i,
        );
        anchored(
          n.x,
          0.005,
          z,
          0,
          0,
          0,
          -Math.PI / 2,
          n.xScale * sc * dx,
          sc,
          1,
          shadowsMesh!,
          i,
        );
        // Fret number sits ON the block's front face (just past its depth,
        // so it doesn't z-fight with the box surface).
        anchored(
          n.x,
          y + 0.01,
          z,
          0,
          0,
          (GEM_DEPTH / 2) * sc * d + 0.03,
          0,
          sc * d,
          sc * d,
          1,
          n.numMesh,
          n.numSlot,
        );
        // Technique badge clips onto the tag's top-right corner.
        if (n.badgeMesh && n.badgeSlot !== undefined) {
          anchored(
            n.x,
            y,
            z,
            GEM_W * 0.42 * n.xScale * dx,
            0.2 * d,
            (GEM_DEPTH / 2) * sc * d + 0.05,
            0,
            sc * d,
            sc * d,
            1,
            n.badgeMesh,
            n.badgeSlot,
          );
        }
      };

      const beat0 = currentBeatsElapsedRef.current;
      flat.forEach((n, i) => {
        const group = groups.get(n.fret)!;
        let badgeMesh: THREE.InstancedMesh | undefined;
        let badgeSlot: number | undefined;
        if (n.tech) {
          const bg = badgeGroups.get(n.tech.label)!;
          badgeMesh = bg.mesh;
          badgeSlot = bg.next++;
        }
        const entry: NoteEntry = {
          key: n.key,
          string: n.string,
          fret: n.fret,
          // Open notes: a compact "0" tag pinned to the nut — a real, fixed
          // spot on the neck, so it travels a straight lane exactly like a
          // fretted note instead of chasing the camera.
          x:
            n.fret === 0
              ? OPEN_X
              : laneX(Math.min(Math.max(n.fret, minFret), maxFret)),
          y: noteYv(n.string),
          z: n.z,
          beatPos: n.beatPos,
          dur: n.dur,
          vib: !!n.rd.isVibrato,
          spawn: spawnScaleAt(n.beatPos, beat0),
          dist: 1,
          fade: 1,
          glow: 1,
          hitT: -1,
          tailGone: false,
          yOff: 0,
          xScale: n.fret === 0 ? 1.4 : 1,
          tailLen: Math.max(0.001, n.dur * spacing - 0.6),
          // A repeat of the previous chord — keep it fully playable/scored, but
          // draw nothing (the chord frame already stands in for it).
          hidden: repeatChordBeats.has(n.beatPos),
          // Slides/bends already show their length as a moving ribbon, so they
          // keep gliding — only straight-tail notes park on the neck.
          sustain: n.dur >= SUSTAIN_MIN_BEATS && !hasRibbon[i],
          zOff: 0,
          // A dead/muted note has no pitch to hold, so it never sparks — it
          // still parks, since its tail is drawn like any other sustain.
          targetFreq: n.rd.isDead
            ? 0
            : getFrequencyFromTab(n.string, n.fret, tuningRef.current),
          holdT: HOLD_GRACE,
          sparkAcc: 0,
          tailGlow: 0,
          tailFillOn: false,
          completed: false,
          numMesh: group.mesh,
          numSlot: group.next++,
          badgeMesh,
          badgeSlot,
          color: new THREE.Color(gemPalette[n.string - 1] ?? "#ffffff"),
        };
        notes.push(entry);

        writeNoteMatrices(i, true);
        gemsMesh!.setColorAt(i, entry.color);
        glowsMesh!.setColorAt(
          i,
          tmpColor.copy(entry.color).multiplyScalar(0.55),
        );
        stemsMesh!.setColorAt(i, entry.color);

        // Sustain tail: a glowing bar trailing back FROM the block at the
        // block's own height, along the note's fret lane (kept even after a
        // hit). Notes with a technique ribbon drop the straight tail — the
        // ribbon IS their sustain.
        const tailSc = hasRibbon[i] || entry.hidden ? 0.0001 : 1;
        dummy.rotation.set(0, 0, 0);
        dummy.position.set(
          entry.x,
          entry.y,
          entry.z - entry.tailLen / 2 - GEM_DEPTH / 2,
        );
        dummy.scale.set(tailSc, tailSc, entry.tailLen * tailSc);
        dummy.updateMatrix();
        tailsMesh!.setMatrixAt(i, dummy.matrix);
        tailsMesh!.setColorAt(i, entry.color);

        // Sustain fill starts empty (heldBeats = 0) — collapsed until the
        // player actually rings the note.
        dummy.scale.set(0.0001, 0.0001, 0.0001);
        dummy.updateMatrix();
        tailFillMesh!.setMatrixAt(i, dummy.matrix);
        tailFillMesh!.setColorAt(i, entry.color);

        entry.numMesh.setColorAt(entry.numSlot, WHITE);
      });

      for (const m of [
        gemsMesh,
        glowsMesh,
        tailsMesh,
        tailFillMesh,
        stemsMesh,
        shadowsMesh,
        ...plateMeshes,
      ]) {
        m.instanceMatrix.needsUpdate = true;
        if (m.instanceColor) m.instanceColor.needsUpdate = true;
      }

      world.add(shadowsMesh);
      world.add(stemsMesh);
      world.add(tailsMesh);
      world.add(tailFillMesh);
      world.add(glowsMesh);
      world.add(gemsMesh);
      for (const m of plateMeshes) world.add(m);

      // ── State transitions: hit → gem flashes bright, HOLDS, then dissolves
      // (see the HIT_HOLD/HIT_DECAY pass below — not an instant pop, so it
      // reads as "that landed" instead of "that vanished"); miss → everything
      // fades to gray, idle → restored (restart). ──
      applyState = (i: number, st: NoteState, celebrate: boolean) => {
        const n = notes[i];
        if (st !== "hit" && n.hitT >= 0) {
          // Restart/seek-back while a hit was still holding/dissolving —
          // drop it from the animated list so the pass below doesn't keep
          // driving a note that's just been reset to idle or gray.
          n.hitT = -1;
          const hi = activeHits.indexOf(i);
          if (hi !== -1) activeHits.splice(hi, 1);
        }
        if (st === "hit") {
          n.numMesh.setColorAt(n.numSlot, HIT_COLOR);
          // Tail keeps its own hue on hit (no wash to white) — the per-frame
          // tail-highlight pass then deepens it while it's lit.
          tailsMesh!.setColorAt(i, n.color);
          recolorRibbon(i, deepen(n.color, tmpDeep));
          if (celebrate) {
            // The block (and its halo) flash a DEEP, richly-saturated version of
            // the note's own hue — not a wash to white — so a played note reads
            // as more of its colour, not brighter.
            const flash = deepen(n.color, tmpColor);
            gemsMesh!.setColorAt(i, flash);
            stemsMesh!.setColorAt(i, flash);
            glowsMesh!.setColorAt(i, deepen(n.color, tmpDeep));
            n.fade = 1;
            writeNoteMatrices(i, true);
            flashString(n.string);
            vibrateString(n.string);
            flashFret(n.fret, n.color);
            // Short notes pop-and-dissolve via the hit-decay pass; a long note
            // stays parked on the neck (the per-frame sustain pass owns its
            // fade), so it must NOT join that list or it'd vanish mid-ring.
            if (!n.sustain) {
              n.hitT = 0;
              activeHits.push(i);
            }
          } else {
            // A replayed hit keeps a parked sustain on screen; short notes hide.
            writeNoteMatrices(i, n.sustain);
          }
        } else if (st === "miss") {
          n.numMesh.setColorAt(n.numSlot, MISS_COLOR);
          writeNoteMatrices(i, true);
          gemsMesh!.setColorAt(i, MISS_GRAY);
          stemsMesh!.setColorAt(i, MISS_GRAY);
          tailsMesh!.setColorAt(i, MISS_GRAY);
          tailFillMesh!.setColorAt(i, MISS_GRAY);
          // Black = zero light under additive blending — a missed block
          // loses its neon halo entirely.
          glowsMesh!.setColorAt(i, tmpColor.setScalar(0));
          recolorRibbon(i, MISS_GRAY);
        } else {
          n.numMesh.setColorAt(n.numSlot, WHITE);
          writeNoteMatrices(i, true);
          gemsMesh!.setColorAt(i, n.color);
          stemsMesh!.setColorAt(i, n.color);
          tailsMesh!.setColorAt(i, n.color);
          tailFillMesh!.setColorAt(i, n.color);
          glowsMesh!.setColorAt(i, tmpColor.copy(n.color).multiplyScalar(0.55));
          recolorRibbon(i, n.color);
          n.glow = -1; // force the depth-dim pass to restamp its brightness
          // Back to idle (restart/seek-back) — the sustain fill/completion pop
          // must not carry over stale state from a previous attempt.
          n.completed = false;
          if (n.tailFillOn) {
            n.tailFillOn = false;
            dummy.rotation.set(0, 0, 0);
            dummy.position.set(0, -1000, 0);
            dummy.scale.set(0.0001, 0.0001, 0.0001);
            dummy.updateMatrix();
            tailFillMesh!.setMatrixAt(i, dummy.matrix);
          }
        }
      };
    }

    // ── Ghost note preview: a translucent "ghost" of the next block to play
    // appears fixed on the neck — right on its string, at its fret — well
    // before the real gem travels all the way down the highway. Added to
    // `scene` directly (not `world`), so it sits still while notes scroll by;
    // the clearest possible "go here next" cue, even across long rests.
    const GHOST_N = 6;
    interface GhostSlot {
      mesh: THREE.Mesh;
      mat: THREE.MeshBasicMaterial;
    }
    const ghosts: GhostSlot[] = [];
    if (!hideNotes && flat.length > 0) {
      // Hollow outline plane, slightly larger than a real gem — reads as a
      // frame to fill, never as an already-spawned note. Deliberately blank
      // inside (no fret number): the string+fret position IS the message.
      const ghostTex = ghostOutlineTexture();
      textures.push(ghostTex);
      const ghostGeo = track(
        new THREE.PlaneGeometry(
          GEM_W * s0.gemSize * 1.12,
          GEM_H * s0.gemSize * 1.12,
        ),
      );
      for (let i = 0; i < GHOST_N; i++) {
        const mat = trackM(
          new THREE.MeshBasicMaterial({
            map: ghostTex,
            transparent: true,
            opacity: 0,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
          }),
        );
        const mesh = new THREE.Mesh(ghostGeo, mat);
        mesh.rotation.x = 0; // upright, matching the untilted blocks
        mesh.visible = false;
        scene.add(mesh);
        ghosts.push({ mesh, mat });
      }
    }

    // ── Animation loop ─────────────────────────────────────────────────────
    let rafId = 0;
    const dirtyPlates = new Set<THREE.InstancedMesh>();
    let panX = panXAt(currentBeatsElapsedRef.current);
    let panPtr = 0;
    let hlPtr = 0;
    let visLo = 0; // first note still on screen (spawn/distance/vibrato pass)
    let nextPtr = 0; // first note the player hasn't played yet (spotlight)
    let zoom = 1; // smart-zoom camera pull-back (1 = default framing)
    let zoomHeld = 1;
    let zoomHoldT = 0;
    let fretSmooth = defaultCenterFret; // slow-damped fret centre for the log dolly
    let lastBeat = -Infinity;
    let lastCenterFret = defaultCenterFret;
    let lastAngleDeg = settingsRef.current.angleDeg;
    let lastFov = settingsRef.current.camFov;
    let firstFrame = true;
    let prevT = performance.now();
    const tmpStrColor = new THREE.Color();
    const HIT_HOLD = 0.04; // seconds a hit tag stays fully visible/bright
    const HIT_DECAY = 0.08; // seconds it then takes to dissolve away

    // ── HUD state (progress / measure counter, count-in) ─────────────────────
    // Beat the first note lands on — the count-in ticks down to it.
    let firstNoteBeat = Infinity;
    for (const b of renderData.renderBeats) {
      if (b.notes.length > 0) {
        firstNoteBeat = b.offsetX;
        break;
      }
    }
    const totalMeasures = renderData.measureEndXs.length || 1;
    let hudProgress = -1; // last width written (avoid layout thrash)
    let hudMeasure = -1; // last measure index written
    let hudCount = -99; // last count-in number written (−1 = hidden)
    let prevBeatHud = 0; // to detect whether the transport is actually moving
    let lastMoveT = 0; // last time the beat advanced (ms) — debounces "moving"

    const animate = () => {
      const s = settingsRef.current;
      const beat = currentBeatsElapsedRef.current;
      world.position.z = beat * spacing;

      const now = performance.now();
      const dt = Math.min(0.1, (now - prevT) / 1000);
      prevT = now;

      // Live-applied settings (no scene rebuild needed).
      if (s.angleDeg !== lastAngleDeg) {
        lastAngleDeg = s.angleDeg;
        shear = Math.tan(THREE.MathUtils.degToRad(s.angleDeg));
        applyShear();
        // Every note matrix has the OLD inverse shear baked in — restamp them
        // all against the new one (rare: only while the slider is dragged).
        for (let i = 0; i < notes.length; i++) {
          writeNoteMatrices(
            i,
            !(
              noteStates[i] === "hit" &&
              notes[i].hitT < 0 &&
              !notes[i].sustain
            ),
          );
        }
        if (gemsMesh) {
          for (const m of [
            gemsMesh,
            glowsMesh!,
            stemsMesh!,
            shadowsMesh!,
            ...plateMeshes,
          ]) {
            m.instanceMatrix.needsUpdate = true;
          }
        }
      }
      if (s.camFov !== lastFov) {
        lastFov = s.camFov;
        camera.fov = s.camFov;
        camera.updateProjectionMatrix();
      }
      sceneFog.far = fogFarBase * s.fogDistance;
      faceMat.opacity = s.neckOpacity;
      inlayMat.opacity = s.inlayOpacity;
      laneShadeMat.opacity = s.laneShade;
      // Board glassiness flags. Below 1 the ribbon must stop writing depth and
      // render first among the transparents (renderOrder -1), or nothing would
      // show through it; at exactly 1 it flips back to a plain opaque floor.
      // The actual alpha is painted per vertex in the shadow block below, so
      // distant frets dissolve while the active window stays solid.
      {
        const glassy = s.boardOpacity < 0.999;
        boardMat.transparent = glassy;
        boardMat.depthWrite = !glassy;
        board.renderOrder = glassy ? -1 : 0;
      }
      starsMat.opacity = s.starsOpacity;
      if (tailsMesh)
        (tailsMesh.material as THREE.MeshBasicMaterial).opacity = s.tailOpacity;
      if (tailFillMesh)
        // Stays a brighter core than the base tail at any opacity setting —
        // scaled off the same slider so it still disappears with it at 0.
        (tailFillMesh.material as THREE.MeshBasicMaterial).opacity = Math.min(
          1,
          s.tailOpacity * 1.8,
        );
      if (ribbonMat) ribbonMat.opacity = s.tailOpacity;
      if (stemsMesh)
        (stemsMesh.material as THREE.MeshBasicMaterial).opacity = s.stemOpacity;
      if (shadowsMesh)
        (shadowsMesh.material as THREE.MeshBasicMaterial).opacity =
          s.shadowOpacity;

      // Smooth camera pan toward the fret window of the upcoming notes —
      // playing higher up the neck slides the whole view along the fretboard.
      // Smart lookahead: nearer notes weigh more, so the camera answers to
      // what's imminent instead of the average of the whole preview window.
      if (beat < lastBeat) {
        panPtr = 0;
        hlPtr = 0;
        visLo = 0;
        nextPtr = 0;
      } // restart / backwards seek
      lastBeat = beat;
      while (panPtr < fretted.length && fretted[panPtr].beatPos < beat - 0.5)
        panPtr++;
      let mn = Infinity;
      let mx = -Infinity;
      let uMn = Infinity; // urgent window — notes the player must read RIGHT NOW
      let uMx = -Infinity;
      let wSum = 0;
      let wFret = 0;
      for (
        let j = panPtr;
        j < fretted.length && fretted[j].beatPos <= beat + s.panLookahead;
        j++
      ) {
        const f = fretted[j].fret;
        const ahead = Math.max(0, fretted[j].beatPos - beat);
        const w = 1 / (0.6 + ahead);
        wSum += w;
        wFret += w * f;
        if (f < mn) mn = f;
        if (f > mx) mx = f;
        if (ahead <= 2.5) {
          if (f < uMn) uMn = f;
          if (f > uMx) uMx = f;
        }
      }
      const centerFret =
        wSum > 0
          ? wFret / wSum
          : panPtr < fretted.length
            ? fretted[panPtr].fret
            : lastCenterFret;
      lastCenterFret = centerFret;
      const targetX = THREE.MathUtils.clamp(laneX(centerFret), panMin, panMax);
      panX = THREE.MathUtils.damp(panX, targetX, s.panSpeed, dt);

      // Smart zoom: when the upcoming cluster is wider than the default
      // framing, pull the camera up/back just enough to fit it — snappy on
      // the way out, lazy on the way back, and held briefly so the framing
      // never pumps between notes.
      let zTarget = 1;
      if (s.smartZoom > 0) {
        if (uMn !== Infinity) {
          const half =
            Math.max(Math.abs(laneX(uMn) - panX), Math.abs(laneX(uMx) - panX)) +
            LANE_W * 1.6;
          zTarget = Math.max(zTarget, half / (visW / 2));
        }
        if (mn !== Infinity) {
          const half =
            Math.max(
              Math.abs(laneX(mn) - targetX),
              Math.abs(laneX(mx) - targetX),
            ) + LANE_W;
          zTarget = Math.max(zTarget, (0.85 * half) / (visW / 2));
        }
        zTarget =
          1 + (THREE.MathUtils.clamp(zTarget, 1, 1.8) - 1) * s.smartZoom;
      }
      if (zTarget >= zoomHeld) {
        zoomHeld = zTarget;
        zoomHoldT = 0.9;
      } else {
        zoomHoldT -= dt;
        if (zoomHoldT <= 0) zoomHeld = Math.max(zTarget, zoomHeld - dt * 0.8);
      }
      zoom = THREE.MathUtils.damp(
        zoom,
        zoomHeld,
        zoomHeld > zoom ? 6 : 1.8,
        dt,
      );

      // Log-fret dolly: frets compress going up a real neck, so playing high
      // brings the camera lower and closer; the fret centre is damped hard so
      // the framing never flickers around a position change.
      fretSmooth = THREE.MathUtils.damp(fretSmooth, centerFret, 2.5, dt);
      const logT =
        (1 - Math.pow(2, -THREE.MathUtils.clamp(fretSmooth, 0, 24) / 12)) /
        0.75;
      const dollyH = 1 - 0.22 * logT * s.neckDolly;
      const dollyD = 1 - 0.16 * logT * s.neckDolly;
      camera.position.set(
        panX,
        camH * s.camHeight * dollyH * zoom,
        camD * s.camDistance * dollyD * zoom,
      );
      camera.lookAt(
        panX,
        0,
        -lookF * s.camPitch * (1 - 0.12 * logT * s.neckDolly),
      );

      hitZoneLight.position.x = panX;
      hitGlow.position.x = panX;
      nebula.position.x = panX + shear * 60;
      stars.position.x = panX * 0.3;
      stars.rotation.y += dt * 0.008;

      // Anchor zone hugs the fret window the hand is about to cover.
      const hasWindow = mn !== Infinity;
      if (hasWindow) {
        anchor.position.x = THREE.MathUtils.damp(
          anchor.position.x,
          laneX((mn + mx) / 2),
          6,
          dt,
        );
        anchor.scale.x = THREE.MathUtils.damp(
          anchor.scale.x,
          Math.max((mx - mn + 1) * LANE_W + 0.3, LANE_W),
          6,
          dt,
        );
      }
      anchorMat.opacity = THREE.MathUtils.damp(
        anchorMat.opacity,
        hasWindow ? s.anchorOpacity : 0,
        6,
        dt,
      );

      // Inactive-region shadow: everything outside the fret window the hand is
      // about to cover — board AND neck — sinks into a soft shadow. Driven by
      // the anchor's own damped transform (not the camera window, which spans
      // the whole screen and would park the shadow out of view), so the shadow
      // glides along with the play position and lifts when nothing is coming.
      dimK = THREE.MathUtils.damp(dimK, hasWindow ? 1 : 0, 4, dt);
      const boardEdge = boardW / 2 + 0.9;
      const dimCx = anchor.position.x;
      const dimHalf = anchor.scale.x / 2 + 2.2;
      const wl = Math.max(0.001, dimCx - dimHalf + boardEdge);
      dimSides[0].scale.x = wl;
      dimSides[0].position.x = -boardEdge + wl / 2;
      const wr = Math.max(0.001, boardEdge - (dimCx + dimHalf));
      dimSides[1].scale.x = wr;
      dimSides[1].position.x = boardEdge - wr / 2;
      // A glassy board de-emphasises the far frets on its own — ease the black
      // panels off in step, or they'd sit as solid slabs over the see-through.
      dimMat.opacity = 0.5 * dimK * s.boardOpacity;

      // Distant-fret dissolve: full alpha inside the active window, easing down
      // to the slider's value over a few lanes beyond it. 130 vertices — cheap.
      {
        const bo = s.boardOpacity;
        const feather = 7;
        for (let vi = 0; vi < boardVertCount; vi++) {
          let a = 1;
          if (bo < 0.999) {
            const d = Math.max(
              0,
              Math.abs(boardPosAttr.getX(vi) - dimCx) - dimHalf,
            );
            const w = Math.max(0, 1 - d / feather);
            a = bo + (1 - bo) * w * w * (3 - 2 * w); // smoothstep feather
          }
          boardColorAttr.setW(vi, a);
        }
        boardColorAttr.needsUpdate = true;
      }
      // Neck curtains mirror the same rectangles; the right one flips its
      // texture (negative x-scale) so the soft edge faces the window.
      neckCurtains[0].scale.x = wl;
      neckCurtains[0].position.x = -boardEdge + wl / 2;
      neckCurtains[1].scale.x = -wr;
      neckCurtains[1].position.x = boardEdge - wr / 2;
      curtainMat.opacity = 0.5 * dimK;
      // Fret numbers (under-neck ruler + on-board markers) sink into the same
      // shadow instead of staying bright over the darkened stretch.
      for (const r of rulerNums) {
        const edge = THREE.MathUtils.clamp(
          (dimHalf + 0.9 - Math.abs(r.x - dimCx)) / 0.9,
          0,
          1,
        );
        r.mat.opacity = r.base * (1 - dimK * (1 - edge) * 0.8);
      }
      for (const bn of boardNumMats) {
        const edge = THREE.MathUtils.clamp(
          (dimHalf + 0.9 - Math.abs(bn.x - dimCx)) / 0.9,
          0,
          1,
        );
        bn.mat.opacity = s.boardMarkers * (1 - dimK * (1 - edge) * 0.8);
      }

      // Beat pulse: backdrop + hit-zone glow breathe on every beat.
      const pulse = Math.exp(-(beat % 1) * 5);
      nebulaMat.opacity = s.nebulaOpacity + 0.25 * s.beatPulse * pulse;
      hitGlowMat.opacity = s.hitGlow * (0.8 + 0.45 * s.beatPulse * pulse);
      hitZoneLight.intensity = 3.2 + lightPulse * 1.5;
      lightPulse = Math.max(0, lightPulse - dt * 9);

      // Theme scenery rides the same scroll as the notes and breathes with the beat.
      scenery.update(dt, world.position.z, panX, s.beatPulse * pulse);

      // Spotlight the string(s) the notes just ahead are played on; every
      // other string — including all six when nothing's coming up — fades
      // toward neutral, so colour always means "play this one next."
      // A just-played string additionally flashes bright-white on top of
      // this (see flashString) — decaying back to its spotlight color on
      // its own, every frame, cheap enough at only 6 strings.
      while (hlPtr < flat.length && flat[hlPtr].beatPos < beat - 0.25) hlPtr++;
      let mask = 0;
      for (
        let j = hlPtr;
        j < flat.length && flat[j].beatPos <= beat + s.hlLookahead;
        j++
      ) {
        mask |= 1 << (flat[j].string - 1);
      }
      for (let q = 0; q < 6; q++) {
        const sm = stringMeshes[q];
        // Emissive follows the color so dimmed strings actually go dark
        // (the lit-metal material would otherwise keep them glowing).
        let baseEmissive: number;
        if (mask !== 0 && ((mask >> q) & 1) === 1) {
          tmpStrColor.copy(sm.bright);
          baseEmissive = 0.85;
        } else {
          // Not one of the strings coming up next — fades toward the neutral
          // wire gray instead of just a darker version of its own hue, so
          // colour reads as "play this one" rather than painting the whole neck.
          tmpStrColor.copy(sm.mid).lerp(WIRE_BASE, s.dimStrength);
          baseEmissive = 0.35 * (1 - s.dimStrength);
        }
        const flash = stringFlash[q];
        if (flash > 0.001) stringFlash[q] = Math.max(0, flash - dt * 3.2); // decays the thickness pop
        // A played/ringing string DEEPENS — driven by the exact vibration
        // envelope (stringVib), so the richer colour lasts precisely as long as
        // the string is wobbling (a fresh pluck peaks, a held sustain stays
        // lifted). It goes toward a deeper, fully-saturated version of its own
        // hue (more colour), never brighter or washed to white.
        const vib = stringVib[q];
        if (vib > 0.001) {
          tmpStrColor.lerp(deepen(sm.mid, tmpDeep), vib);
          baseEmissive += vib * 0.35;
        }
        sm.mat.color.copy(tmpStrColor);
        sm.mat.emissive.copy(tmpStrColor).multiplyScalar(baseEmissive);
        const target =
          (mask !== 0 && ((mask >> q) & 1) === 1 ? s.stringBoost : 1) +
          flash * 0.3;
        const sc = THREE.MathUtils.damp(sm.mesh.scale.y, target, 12, dt);
        sm.mesh.scale.y = sc;
        sm.mesh.scale.z = sc;
      }

      // ── String vibration: bend a played string into a decaying standing wave
      // (ends pinned, belly swinging on Y) so a good hit reads as a real pluck.
      vibClock += dt;
      const vibOsc = Math.sin(vibClock * Math.PI * 2 * VIB_HZ);
      for (let q = 0; q < 6; q++) {
        const v = stringVib[q];
        const sm = stringMeshes[q];
        if (v <= 0.001) {
          if (vibDrawn[q]) {
            // Settled — snap back to the rest shape once, then leave it alone.
            (sm.geo.getAttribute("position").array as Float32Array).set(
              sm.basePos,
            );
            sm.geo.attributes.position.needsUpdate = true;
            vibDrawn[q] = false;
          }
          continue;
        }
        stringVib[q] = Math.max(0, v - dt / VIB_DECAY);
        const amp = VIB_AMP * v * vibOsc;
        const pos = sm.geo.getAttribute("position").array as Float32Array;
        const base = sm.basePos;
        const invLen = 1 / (2 * sm.halfLen);
        for (let i = 0; i < base.length; i += 3) {
          // u: 0 at the nut end … 1 at the far end; sin(πu) pins both ends and
          // bellies out in the middle — the fundamental mode of a plucked wire.
          const u = (base[i] + sm.halfLen) * invLen;
          pos[i + 1] = base[i + 1] + amp * Math.sin(Math.PI * u);
        }
        sm.geo.attributes.position.needsUpdate = true;
        vibDrawn[q] = true;
      }

      // Same idea for the fret wire just played: a quick bright pulse in the
      // string's own color, decaying back to the neutral wire/nut gray.
      for (let k = 0; k <= laneCount; k++) {
        const flash = fretFlash[k];
        if (flash <= 0.001) continue;
        fretFlash[k] = Math.max(0, flash - dt * 3.2);
        wireMats[k].color
          .copy(k === 0 ? NUT_BASE : WIRE_BASE)
          .lerp(fretFlashColor[k], flash);
      }

      // ── Per-frame note updates: spawn materialize, vibrato wobble, scoring ─
      dirtyPlates.clear();
      let instDirty = false;
      const markPlates = (n: NoteEntry) => {
        dirtyPlates.add(n.numMesh);
        if (n.badgeMesh) dirtyPlates.add(n.badgeMesh);
      };

      if (gemsMesh && stemsMesh && shadowsMesh && notes.length > 0) {
        // One pass over the on-screen notes: spawn materialize (grow out of
        // the fog), far-distance size boost (tags stay readable at the
        // horizon) and the vibrato Y-wobble all write matrices together.
        const spawnAtB = (fogFarBase * s.fogDistance) / spacing;
        // The drawn strings sit half a strip IN FRONT of the musical z=0
        // plane — a note isn't "there" the instant it crosses z=0, it has to
        // keep traveling to actually reach and cross the strings. passAt is
        // how far (in beats) it rides at full strength past that point —
        // just past the strings themselves, so it's unmistakably seen
        // sitting on the fretboard for a beat — then fadeSpan is a short
        // dissolve (not an instant pop) right after, so it doesn't linger.
        const passAt = (STRIP_LEN * 0.5 + 0.5) / spacing;
        const fadeSpan = 0.35 / spacing;
        const gcAt = passAt + fadeSpan + 0.3; // retire well after the fade finishes
        // A parked sustain is still on screen long after its own beatPos, so it
        // retires on its END. The cursor stalls on a long note rather than
        // stepping over it — the notes behind it just stay in the live loop a
        // little longer (they've already faded themselves out), which is
        // cheaper than letting a held gem get retired out from under the hold.
        while (
          visLo < notes.length &&
          notes[visLo].beatPos + (notes[visLo].sustain ? notes[visLo].dur : 0) <
            beat - gcAt
        ) {
          const n = notes[visLo];
          if (n.fade !== 0 || n.yOff !== 0 || n.zOff !== 0 || !n.tailGone) {
            n.spawn = 1;
            n.dist = 1;
            n.yOff = 0;
            n.zOff = 0;
            n.fade = 0; // long past the neck — gone for good
            writeNoteMatrices(visLo, false);
            if (tailsMesh && !n.tailGone) {
              n.tailGone = true;
              dummy.rotation.set(0, 0, 0);
              dummy.position.set(n.x, n.y, n.z);
              dummy.scale.set(0.0001, 0.0001, 0.0001);
              dummy.updateMatrix();
              tailsMesh.setMatrixAt(visLo, dummy.matrix);
              if (tailFillMesh) tailFillMesh.setMatrixAt(visLo, dummy.matrix);
            }
            markPlates(n);
            instDirty = true;
          }
          visLo++;
        }
        const micFreq = frequencyRef.current;
        for (
          let j = visLo;
          j < notes.length && notes[j].beatPos <= beat + spawnAtB + 0.5;
          j++
        ) {
          const n = notes[j];
          const ahead = n.beatPos - beat;
          const sp = spawnScaleAt(n.beatPos, beat);
          const dist =
            1 + s.farScale * Math.min(1, Math.max(0, ahead) / 18) * 1.1;
          // Long notes park ON the hit line and hold there while their tail
          // feeds in behind them (clipped away at that same z), then dissolve
          // in place once the sustain runs out — instead of riding past like a
          // short note. parkAhead is the beat-offset at which the gem reaches
          // the line; from there zOff freezes its scene-z on the line.
          const parkAhead = -HIT_LINE_Z / spacing;
          let zOff = 0;
          let fade: number;
          if (n.sustain && ahead <= parkAhead) {
            zOff = HIT_LINE_Z + ahead * spacing; // pin scene-z to the hit line
            const endAhead = -n.dur;
            fade =
              ahead >= endAhead
                ? 1
                : 1 -
                  THREE.MathUtils.smoothstep(
                    ahead,
                    endAhead - SUSTAIN_FADE,
                    endAhead,
                  );
          } else {
            // Full strength while it's still approaching or resting on the
            // fretboard; only once it's ridden all the way past does it
            // smoothly dissolve over fadeSpan (a pop here reads as "vanished
            // before touching the neck" even when the math says otherwise).
            fade =
              ahead >= -passAt
                ? 1
                : THREE.MathUtils.smoothstep(
                    ahead,
                    -(passAt + fadeSpan),
                    -passAt,
                  );
          }
          // …and the sustain tail goes the moment ITS far end crosses too.
          const tailVis = n.beatPos + n.dur >= beat - passAt;
          let yOff = 0;
          if (n.vib) {
            // Tempo-correct wobble (2.5 per beat) while the sustain plays.
            const rel = -ahead;
            if (rel >= -0.1 && rel <= Math.max(n.dur, 0.75)) {
              yOff = Math.sin(rel * Math.PI * 2 * 2.5) * 0.06;
            }
          }
          const spawnChanged = Math.abs(sp - n.spawn) > 0.001;
          const fadeChanged = Math.abs(fade - n.fade) > 0.008;
          const tailChanged = tailVis === n.tailGone; // gone-flag out of sync
          const zChanged = Math.abs(zOff - n.zOff) > 0.001;
          if (
            spawnChanged ||
            fadeChanged ||
            tailChanged ||
            zChanged ||
            Math.abs(dist - n.dist) > 0.004 ||
            yOff !== n.yOff
          ) {
            n.spawn = sp;
            n.dist = dist;
            n.yOff = yOff;
            n.fade = fade;
            n.zOff = zOff;
            // A parked sustain stays visible even after it scores a hit — its
            // fade is driven here, not by the short-note hit-decay pass.
            writeNoteMatrices(j, noteStates[j] !== "hit" || n.sustain);
            if (tailChanged && tailsMesh) {
              // The sustain tail is written once at build — hide it once it
              // clears the neck.
              n.tailGone = !tailVis;
              const tailSc = !tailVis || hasRibbon[j] || n.hidden ? 0.0001 : 1;
              dummy.rotation.set(0, 0, 0);
              dummy.position.set(n.x, n.y, n.z - n.tailLen / 2 - GEM_DEPTH / 2);
              dummy.scale.set(tailSc, tailSc, n.tailLen * tailSc);
              dummy.updateMatrix();
              tailsMesh.setMatrixAt(j, dummy.matrix);
              if (!tailVis && tailFillMesh) {
                dummy.scale.set(0.0001, 0.0001, 0.0001);
                dummy.updateMatrix();
                tailFillMesh.setMatrixAt(j, dummy.matrix);
              }
            }
            markPlates(n);
            instDirty = true;
          }
          // Tail highlight: fired by the HIT itself (the green-number moment),
          // so it's reliable regardless of the mic. A hit sustain stays lit for
          // its whole tail; the deepened colour owns hit tails (the depth-dim
          // pass only recolours idle ones). The tail deepens toward a richer,
          // fully-saturated version of its OWN hue — NOT brighter or washed to
          // white, just MORE of its colour (a plain blue → a deep saturated blue).
          if (n.sustain && !n.hidden && !n.tailGone && tailsMesh) {
            const lit = noteStates[j] === "hit";
            const prevGlow = n.tailGlow;
            n.tailGlow = THREE.MathUtils.damp(
              n.tailGlow,
              lit ? 1 : 0,
              lit ? 20 : 8,
              dt,
            );
            if (Math.abs(n.tailGlow - prevGlow) > 0.003) {
              if (noteStates[j] === "miss") {
                tmpColor.copy(MISS_GRAY);
              } else {
                deepen(n.color, tmpDeep);
                tmpColor.copy(n.color).lerp(tmpDeep, n.tailGlow);
              }
              tailsMesh.setColorAt(j, tmpColor);
              instDirty = true;
            }
          }

          // Mic-driven hold: sparks + string buzz while you keep the note
          // actually ringing (a short grace covers detection dropouts).
          if (
            n.sustain &&
            !n.hidden &&
            n.targetFreq > 0 &&
            ahead <= parkAhead &&
            ahead > -n.dur
          ) {
            if (stillRinging(micFreq, n.targetFreq)) n.holdT = 0;
            else n.holdT += dt;
            if (n.holdT < HOLD_GRACE) {
              // Keep the held string buzzing (a steady, lighter wave than the
              // initial pluck) for as long as the note is actually ringing.
              const si = n.string - 1;
              if (stringVib[si] < VIB_HOLD_LEVEL)
                stringVib[si] = VIB_HOLD_LEVEL;
              // Sustain fill: a bright core over the WHOLE currently-visible
              // tail while the mic hears it ringing. A version that grew a
              // short segment from the tail's front never actually grew — the
              // clip plane eats that end at exactly the same rate the growth
              // added to it (both driven by the same real-time scroll), so the
              // visible bit never exceeded a hair's width. Toggling the whole
              // tail is what actually reads as "lit" instead of "too little".
              if (tailFillMesh && !n.tailFillOn) {
                n.tailFillOn = true;
                dummy.rotation.set(0, 0, 0);
                dummy.position.set(
                  n.x,
                  n.y,
                  n.z - n.tailLen / 2 - GEM_DEPTH / 2,
                );
                dummy.scale.set(1, 1, n.tailLen);
                dummy.updateMatrix();
                tailFillMesh.setMatrixAt(j, dummy.matrix);
                tailFillMesh.instanceMatrix.needsUpdate = true;
              }
              if (s.sustainSparks > 0) {
                n.sparkAcc += dt;
                while (n.sparkAcc >= SPARK_INTERVAL) {
                  n.sparkAcc -= SPARK_INTERVAL;
                  spawnSpark(
                    n.x,
                    n.y + GEM_H * 0.5,
                    // The gem's own current depth (pinned to the neck while
                    // parked) — a stale 0.25 used to sit well short of it,
                    // reading as a string-row too high under the tilted camera.
                    n.z + n.zOff,
                    n.color,
                    s.sustainSparks,
                  );
                }
              }
            } else {
              n.sparkAcc = 0;
              if (tailFillMesh && n.tailFillOn) {
                n.tailFillOn = false;
                dummy.rotation.set(0, 0, 0);
                dummy.position.set(n.x, n.y, n.z);
                dummy.scale.set(0.0001, 0.0001, 0.0001);
                dummy.updateMatrix();
                tailFillMesh.setMatrixAt(j, dummy.matrix);
                tailFillMesh.instanceMatrix.needsUpdate = true;
              }
            }
          }
          // Completion pop: the sustain reached its natural end while it was
          // actually being held (holdT still under grace right at that
          // instant) — the same burst/echo the onset hit uses, fired again,
          // so finishing a long hold reads as a distinct "done!" instead of
          // just quietly running out. Fires at most once per note; skipped on
          // the very first frame of a rebuild so resuming mid-song doesn't
          // replay a pop for every sustain already behind the cursor.
          if (n.sustain && !n.completed && ahead < -n.dur) {
            n.completed = true;
            if (!firstFrame && !n.hidden && n.holdT < HOLD_GRACE) {
              spawnBurst(n.x, n.y, n.color);
              spawnEcho(n.x, n.y, n.xScale, n.color);
            }
          }
          // Depth cue: notes near the hit line burn at full color, far ones
          // sink toward the dark — the same visual grammar as the 2D tab's
          // dimmed upcoming pills — so the horizon never reads as a wall of
          // saturated noise. Brightness = spawn ramp × distance dim, restamped
          // only when it moves (a handful of writes per frame).
          const dimF = 1 - s.farDim * THREE.MathUtils.smoothstep(ahead, 5, 16);
          const bright = (0.35 + 0.65 * sp) * dimF;
          if (noteStates[j] === "idle" && Math.abs(bright - n.glow) > 0.012) {
            n.glow = bright;
            tmpColor.copy(n.color).multiplyScalar(bright);
            gemsMesh.setColorAt(j, tmpColor);
            stemsMesh.setColorAt(j, tmpColor);
            if (tailsMesh && !n.tailGone) tailsMesh.setColorAt(j, tmpColor);
            if (glowsMesh)
              glowsMesh.setColorAt(j, tmpColor.multiplyScalar(0.55));
            instDirty = true;
          }
        }
      }

      if (gemsMesh && tailsMesh && stemsMesh && shadowsMesh) {
        const hits = hitRef.current;
        const misses = missRef.current;
        for (let i = 0; i < notes.length; i++) {
          const n = notes[i];
          // "Miss" only applies once the note is at/behind the hit line —
          // after a seek-back or restart the notes ahead must read as fresh,
          // playable gems, not a gray wall of stale results.
          const next: NoteState =
            n.key in hits
              ? "hit"
              : n.key in misses && n.beatPos <= beat + 0.25
                ? "miss"
                : "idle";
          if (next !== noteStates[i]) {
            noteStates[i] = next;
            // No celebration on the first frame — a rebuild replays notes
            // that were already hit some time ago; just snap them away.
            const celebrate = next === "hit" && !firstFrame && !n.hidden;
            applyState(i, next, celebrate);
            if (celebrate) {
              spawnBurst(n.x, n.y, n.color);
              spawnEcho(n.x, n.y, n.xScale, n.color);
            }
            if (next === "miss" && !firstFrame && !n.hidden) {
              // Mark the miss ON THE NECK, at the exact string+fret where the
              // note should have been played (its gem's own hit-line spot).
              spawnMissMarker(n.x, n.y);
            }
            markPlates(n);
            instDirty = true;
          }
        }
      }
      // Hit hold-then-dissolve: a freshly-hit tag stays fully visible for
      // HIT_HOLD (unmistakably "that landed"), then smoothly shrinks away
      // over HIT_DECAY — reusing n.fade, the same scale-out machinery an
      // unplayed note uses to slide off the end of the neck.
      if (gemsMesh && activeHits.length > 0) {
        for (let k = activeHits.length - 1; k >= 0; k--) {
          const idx = activeHits[k];
          const n = notes[idx];
          n.hitT += dt;
          if (n.hitT < HIT_HOLD) {
            n.fade = 1;
          } else {
            const p = (n.hitT - HIT_HOLD) / HIT_DECAY;
            n.fade = p >= 1 ? 0 : 1 - THREE.MathUtils.smoothstep(p, 0, 1);
          }
          writeNoteMatrices(idx, n.fade > 0.001);
          markPlates(n);
          instDirty = true;
          if (n.hitT >= HIT_HOLD + HIT_DECAY) {
            n.hitT = -1;
            activeHits.splice(k, 1);
          }
        }
      }
      if (instDirty && gemsMesh && tailsMesh && stemsMesh && shadowsMesh) {
        for (const m of dirtyPlates) {
          m.instanceMatrix.needsUpdate = true;
          if (m.instanceColor) m.instanceColor.needsUpdate = true;
        }
        const core = tailFillMesh
          ? [gemsMesh, tailsMesh, tailFillMesh, stemsMesh, shadowsMesh]
          : [gemsMesh, tailsMesh, stemsMesh, shadowsMesh];
        for (const m of glowsMesh ? [...core, glowsMesh] : core) {
          m.instanceMatrix.needsUpdate = true;
          if (m.instanceColor) m.instanceColor.needsUpdate = true;
        }
      }
      firstFrame = false;

      updateParticles(dt);
      updateEchoes(dt);
      updateMissMarks(dt);

      // Ghost note preview: as soon as a note becomes "next", its full-color
      // ghost appears fixed on the neck at its real string/fret and stays put
      // — no matter how far away the traveling gem still is — until it's
      // actually played. If it scrolls by unplayed, the beat-position advance
      // below moves on to whichever note is next regardless.
      if (ghosts.length > 0) {
        while (
          nextPtr < notes.length &&
          (notes[nextPtr].beatPos < beat - 0.05 ||
            noteStates[nextPtr] === "hit")
        )
          nextPtr++;
        let gi = 0;
        if (s.ghostPreview > 0 && nextPtr < notes.length) {
          const groupBeat = notes[nextPtr].beatPos;
          const blink = 0.88 + 0.12 * Math.sin(beat * Math.PI * 3);
          const z = STRIP_LEN * 0.5 + 0.05;
          for (
            let j = nextPtr;
            j < notes.length &&
            notes[j].beatPos <= groupBeat + 0.001 &&
            gi < GHOST_N;
            j++
          ) {
            if (noteStates[j] !== "idle" || notes[j].hidden) continue;
            const n = notes[j];
            const g = ghosts[gi++];
            g.mesh.position.set(n.x, n.y, z);
            g.mesh.scale.set(n.xScale, 1, 1);
            g.mat.color.copy(n.color);
            g.mat.opacity = s.ghostPreview * blink;
            g.mesh.visible = true;
          }
        }
        for (; gi < GHOST_N; gi++) {
          ghosts[gi].mesh.visible = false;
          ghosts[gi].mat.opacity = 0;
        }
      }

      // ── HUD: progress bar + measure counter, count-in ───────────────────
      if (Math.abs(beat - prevBeatHud) > 1e-5) lastMoveT = now;
      prevBeatHud = beat;
      const moving = now - lastMoveT < 250; // debounced: the transport is running

      // Progress bar (0..1 of the whole exercise) — only rewrite on real change.
      const prog = Math.max(0, Math.min(1, beat / renderData.totalBeats));
      if (progressFillRef.current && Math.abs(prog - hudProgress) > 0.001) {
        hudProgress = prog;
        progressFillRef.current.style.width = `${prog * 100}%`;
      }
      // Full-screen waveform nav — written unconditionally so it's correct the
      // moment the overlay mounts (entering full screen mid-exercise, seeks
      // while paused); two style writes per frame are noise next to the scene.
      if (navFillRef.current && navPlayheadRef.current) {
        const pct = (prog * 100).toFixed(2);
        navFillRef.current.style.clipPath = `inset(0 ${(100 - prog * 100).toFixed(2)}% 0 0)`;
        navPlayheadRef.current.style.left = `${pct}%`;
      }
      // Measure counter: how many measure-ends the cursor has passed, + 1.
      let measure = 1;
      for (let m = 0; m < renderData.measureEndXs.length; m++) {
        if (beat >= renderData.measureEndXs[m] - 1e-6) measure = m + 2;
        else break;
      }
      measure = Math.min(measure, totalMeasures);
      if (measureLabelRef.current && measure !== hudMeasure) {
        hudMeasure = measure;
        measureLabelRef.current.textContent = `${measure} / ${totalMeasures}`;
      }

      // Count-in: the metronome's pre-roll (4 → 0, before playback/beat even starts)
      // takes priority; once that clears, fall back to ticking down the last few
      // beats before the first note lands (handles a pickup rest at the top).
      const remaining = firstNoteBeat - beat;
      const count =
        countInRef.current > 0
          ? countInRef.current
          : moving && remaining > 0 && remaining <= 4
            ? Math.ceil(remaining)
            : -1;
      if (countdownRef.current && count !== hudCount) {
        hudCount = count;
        if (count > 0) {
          countdownRef.current.textContent = String(count);
          countdownRef.current.style.opacity = "1";
          countdownRef.current.style.transform =
            "translate(-50%, -50%) scale(1.25)";
          // settle the pop on the next frame
          requestAnimationFrame(() => {
            if (countdownRef.current)
              countdownRef.current.style.transform =
                "translate(-50%, -50%) scale(1)";
          });
        } else {
          countdownRef.current.style.opacity = "0";
        }
      }

      renderer.render(scene, camera);
      rafId = requestAnimationFrame(animate);
    };
    rafId = requestAnimationFrame(animate);

    // ── Resize ─────────────────────────────────────────────────────────────
    const ro = new ResizeObserver(() => {
      const w = container.clientWidth || 800;
      const h = container.clientHeight || 380;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    });
    ro.observe(container);

    // ── Teardown ───────────────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      textures.forEach((t) => t.dispose());
      renderer.dispose();
      // Release the GPU context immediately — repeated exercise/mode switches
      // would otherwise pile up contexts until the browser drops the oldest.
      renderer.forceContextLoss();
      if (renderer.domElement.parentNode === container)
        container.removeChild(renderer.domElement);
    };
    // Rebuild when the tab data, exercise or a geometry-shaping setting changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    renderData,
    resetKey,
    hideNotes,
    settings.noteSpacing,
    settings.stringGap,
    settings.gemSize,
    settings.numberSize,
    settings.badgeSize,
    settings.fretLabelSize,
    settings.windowWidth,
    settings.gemShape,
    settings.palette,
    settings.theme,
  ]);

  return (
    <div
      className={cn(
        isFull ? "fixed inset-0 z-[1000000] bg-[#0a0a0f]" : "relative w-full",
        !isFull && className,
      )}
      style={isFull ? undefined : { height: heightPx }}>
      <div
        ref={containerRef}
        className={cn(
          "absolute inset-0 overflow-hidden",
          !isFull && "rounded-lg",
        )}
      />
      {/* Vignette — darkens the corners so the highway pops. */}
      <div
        className={cn(
          "pointer-events-none absolute inset-0",
          !isFull && "rounded-lg",
        )}
        style={{
          background:
            "radial-gradient(ellipse at 50% 45%, transparent 55%, rgba(0,0,0,0.5) 100%)",
        }}
      />

      {/* The 3D view is still experimental — keep that visible on the board itself. */}
      <div className='pointer-events-none absolute bottom-2 left-2 z-10 flex items-center gap-2'>
        <div className='rounded-md bg-zinc-900/70 px-2 py-1 text-[10px] font-semibold text-amber-400 backdrop-blur-sm'>
          Beta — may be buggy
        </div>
        {isFull && (
          <div className='font-mono rounded-md bg-zinc-900/70 px-2 py-1 text-[10px] text-zinc-500 backdrop-blur-sm'>
            Esc — exit full screen
          </div>
        )}
      </div>

      {!hideNotes && (
        <>
          {/* Song progress bar + measure counter (updated imperatively in rAF).
              Kept mounted in full screen (the rAF loop keeps writing to the refs)
              but hidden — the waveform nav takes over there. */}
          <div
            className={cn(
              "pointer-events-none absolute inset-x-0 top-0 z-10",
              isFull && "opacity-0",
            )}>
            <div className='h-[3px] w-full bg-white/5'>
              <div
                ref={progressFillRef}
                className='h-full w-0 bg-cyan-400/70'
              />
            </div>
            <span
              ref={measureLabelRef}
              className='font-mono absolute left-2 top-2 text-[11px] font-medium tabular-nums text-zinc-400'
            />
          </div>

          {/* Full-screen waveform nav — density bars, played part in cyan,
              playhead line; click jumps to the measure under the cursor. */}
          {isFull && nav && (
            <div className='absolute left-1/2 top-4 z-10 w-[clamp(320px,44vw,760px)] -translate-x-1/2'>
              <div
                className={cn("relative h-14", onSeek && "cursor-pointer")}
                title={onSeek ? "Click to jump to a measure" : undefined}
                onClick={(e) => {
                  if (!onSeek) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  const frac = Math.max(
                    0,
                    Math.min(1, (e.clientX - rect.left) / rect.width),
                  );
                  const beat = frac * nav.total;
                  let idx = nav.ends.findIndex((end) => beat < end);
                  if (idx === -1) idx = nav.ends.length - 1;
                  onSeek(nav.starts[idx]);
                }}>
                <div className='absolute inset-0 flex items-end gap-px'>
                  {nav.bars.map((h, i) => (
                    <div
                      key={i}
                      className='min-w-0 flex-1 rounded-[1px] bg-zinc-600/40'
                      style={{ height: `${h * 100}%` }}
                    />
                  ))}
                </div>
                <div
                  ref={navFillRef}
                  className='pointer-events-none absolute inset-0 flex items-end gap-px'
                  style={{ clipPath: "inset(0 100% 0 0)" }}>
                  {nav.bars.map((h, i) => (
                    <div
                      key={i}
                      className='min-w-0 flex-1 rounded-[1px] bg-cyan-400/80'
                      style={{ height: `${h * 100}%` }}
                    />
                  ))}
                </div>
                <div
                  ref={navPlayheadRef}
                  className='pointer-events-none absolute inset-y-0 w-[2px] -translate-x-1/2 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.7)]'
                  style={{ left: "0%" }}
                />
              </div>
              {/* Measure ruler under the strip. */}
              <div className='relative mt-1.5 h-4'>
                {nav.ticks.map((t) => (
                  <span
                    key={t.n}
                    className={cn(
                      "font-mono absolute text-[10px] tabular-nums text-zinc-500",
                      t.frac > 0 && "-translate-x-1/2",
                    )}
                    style={{ left: `${t.frac * 100}%` }}>
                    {t.n}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Get-ready count-in — big number that ticks down to the first note. */}
          <div
            ref={countdownRef}
            className='font-mono pointer-events-none absolute left-1/2 top-[38%] z-10 text-7xl font-bold text-cyan-200 opacity-0 drop-shadow-[0_0_20px_rgba(34,211,238,0.5)] transition-all duration-150 ease-out'
            style={{ transform: "translate(-50%, -50%) scale(1)" }}
          />
        </>
      )}

      <button
        type='button'
        onClick={() => setIsFull((f) => !f)}
        title={isFull ? "Exit full screen (Esc)" : "Full screen"}
        aria-label={isFull ? "Exit full screen" : "Full screen"}
        className='absolute right-3 top-3 z-10 flex h-8 items-center gap-1.5 rounded-lg border border-white/10 bg-zinc-900/85 px-2.5 text-zinc-300 backdrop-blur-sm transition-colors hover:bg-white/10 hover:text-white'>
        {isFull ? (
          <Minimize2 className='h-4 w-4' />
        ) : (
          <Maximize2 className='h-4 w-4' />
        )}
        <span className='text-[11px] font-semibold'>
          {isFull ? "Exit full screen" : "Full screen"}
        </span>
      </button>

      {/* Exercise/song header — the bar above the board is hidden behind full
          screen, so it's re-shown here top-left: cover art beside a stacked
          title / artist / tuning / BPM block. */}
      {isFull && title && (
        <div className='absolute left-5 top-4 z-10 flex max-w-[32vw] items-center gap-4 rounded-xl bg-zinc-900/60 p-3 backdrop-blur-sm'>
          {coverUrl && (
            <img
              src={coverUrl}
              alt=''
              className='h-24 w-24 shrink-0 rounded-lg object-cover'
            />
          )}
          <div className='min-w-0'>
            <h2 className='truncate text-2xl font-bold leading-tight tracking-tight text-zinc-100'>
              {title}
            </h2>
            {subtitle && (
              <div className='truncate text-sm font-semibold text-zinc-400'>
                {subtitle}
              </div>
            )}
            {(tuningLabel || bpm) && (
              <div className='mt-2 flex items-center gap-3'>
                {tuningLabel && (
                  <span className='text-[11px] font-semibold text-cyan-400'>
                    Tuning: {tuningLabel}
                  </span>
                )}
                {bpm && (
                  <span className='flex items-center gap-1.5 text-[11px] font-semibold text-zinc-400'>
                    <Music2 className='h-3 w-3' />
                    {bpm} BPM
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Full screen covers the HUD that's normally docked above the board, so
          re-show it here — windowed mode already has it via TablatureSection. */}
      {isFull && isMicEnabled && (
        <MicHud variant='full' className='absolute right-4 top-16 z-10' />
      )}
    </div>
  );
});

export default NoteHighway3D;
