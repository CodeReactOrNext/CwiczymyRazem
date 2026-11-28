/**
 * Stage mode's effects. The tab itself stays the ordinary 2D board (sharp,
 * every setting the player chose) and nothing is drawn over its notes. All of
 * it happens above the board: a played note lights the glass's top edge over
 * where it was played and lifts motes off it — more, the higher the multiplier —
 * and a multiplier that goes up sends light running along the whole edge,
 * lifting motes as it goes. Dust drifts in the lamp's light with the room's
 * parallax.
 *
 * The camera is set so the z = 0 plane is the screen in CSS pixels: an effect is
 * placed where it is seen, and depth only carries what drifts off that plane.
 * Loaded on demand — this file pulls in three.js.
 */
import * as THREE from "three";

import { stageCameraPose } from "./stageCamera";

const FOV = 45;
const MAX_MOTES = 900;
/** Motes per hit, from a cold start up to the top multiplier. */
const MOTES_PER_HIT = 5;
const MOTES_PER_HIT_HOT = 12;
/** The light on the glass's edge at a hit: how wide it opens and how long it stays. */
const EDGE_GLOWS = 12;
const EDGE_MS = 520;
/** The multiplier's run along the edge, and how often it lifts a mote as it goes. */
const WAVE_MS = 950;
const WAVE_SPAWN_MS = 16;
/** The motes rise (negative gravity) and slow down as they go. */
const LIFT = -60;
const DRAG = 2.2;
/** How much white is in a mote: the hit colour, softened. */
const MOTE_WHITE = 0.5;

/** Fast out of the start, settling at the end. */
const smoothOut = (u: number) => 1 - (1 - u) * (1 - u);
const DUST = 220;

export interface StageEffects {
  /**
   * A hit: light on the board's top edge at (x, y) (CSS px) and motes rising off
   * it. `strength` 0…1 — the multiplier — makes it brighter and fuller.
   */
  rise: (x: number, y: number, color: string, strength: number) => void;
  /** The multiplier went up: light runs from `fromX` both ways along the edge at `y`, out to `left` and `right`. */
  wave: (y: number, left: number, right: number, fromX: number, color: string) => void;
  /** 0…1: the score's warmth — the dust catches more light. */
  setHeat: (heat: number) => void;
  dispose: () => void;
}

/**
 * Light added to what is under it, and nothing else: the canvas stays clear
 * (alpha untouched), so a mote that has gone out leaves no dark dot behind.
 * Three's own AdditiveBlending also adds to alpha, which over a transparent
 * canvas shows every black pixel it draws.
 */
function additive<T extends THREE.Material>(material: T): T {
  material.blending = THREE.CustomBlending;
  material.blendEquation = THREE.AddEquation;
  material.blendSrc = THREE.SrcAlphaFactor;
  material.blendDst = THREE.OneFactor;
  material.blendSrcAlpha = THREE.ZeroFactor;
  material.blendDstAlpha = THREE.OneFactor;
  return material;
}

/** A soft round spot, white in the middle: every glow here is this texture tinted. */
function glowTexture(): THREE.CanvasTexture {
  const size = 64;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const g = c.getContext("2d");
  if (g) {
    const r = size / 2;
    const gradient = g.createRadialGradient(r, r, 0, r, r, r);
    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(0.25, "rgba(255,255,255,0.55)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = gradient;
    g.fillRect(0, 0, size, size);
  }
  return new THREE.CanvasTexture(c);
}

/**
 * Starts the effects on `canvas` (transparent, over the whole screen) and keeps
 * them running until `dispose`. Throws where WebGL isn't to be had — the stage
 * then simply goes without them.
 */
export function createStageEffects(canvas: HTMLCanvasElement): StageEffects {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV, 1, 1, 6000);
  let width = 1;
  let height = 1;
  const glow = glowTexture();

  // ── Motes off a played note ─────────────────────────────────────────────────
  const pos = new Float32Array(MAX_MOTES * 3);
  const vel = new Float32Array(MAX_MOTES * 3);
  const life = new Float32Array(MAX_MOTES);
  const span = new Float32Array(MAX_MOTES);
  const hue = new Float32Array(MAX_MOTES * 3);
  const motePositions = new THREE.BufferAttribute(new Float32Array(MAX_MOTES * 3), 3);
  const moteColors = new THREE.BufferAttribute(new Float32Array(MAX_MOTES * 3), 3);
  motePositions.setUsage(THREE.DynamicDrawUsage);
  moteColors.setUsage(THREE.DynamicDrawUsage);
  const moteGeometry = new THREE.BufferGeometry();
  moteGeometry.setAttribute("position", motePositions);
  moteGeometry.setAttribute("color", moteColors);
  const moteMaterial = additive(new THREE.PointsMaterial({ size: 9, map: glow, vertexColors: true, transparent: true, depthWrite: false }));
  const motes = new THREE.Points(moteGeometry, moteMaterial);
  motes.frustumCulled = false;
  scene.add(motes);
  let nextMote = 0;

  const color = new THREE.Color();
  const white = new THREE.Color("#ffffff");

  // ── Light on the glass's top edge ─────────────────────────────────────────
  const edgeGlows = Array.from({ length: EDGE_GLOWS }, () => {
    const sprite = new THREE.Sprite(additive(new THREE.SpriteMaterial({ map: glow, transparent: true, depthWrite: false })));
    sprite.visible = false;
    scene.add(sprite);
    return { sprite, at: -Infinity, ms: EDGE_MS, wide: 1, bright: 1 };
  });
  let nextGlow = 0;
  const showEdgeGlow = (wx: number, wy: number, hex: string, wide: number, bright: number, ms: number) => {
    const g = edgeGlows[nextGlow];
    nextGlow = (nextGlow + 1) % EDGE_GLOWS;
    g.at = performance.now();
    g.ms = ms;
    g.wide = wide;
    g.bright = bright;
    g.sprite.position.set(wx, wy, 1);
    g.sprite.material.color.set(hex).lerp(white, 0.35);
  };

  // ── The multiplier's run along the edge: a light each way ──────────────────
  interface Runner {
    from: number;
    to: number;
    y: number;
    at: number;
    hex: string;
    lastSpawn: number;
    sprite: THREE.Sprite;
  }
  const runnerSprites = Array.from({ length: 6 }, () => {
    const sprite = new THREE.Sprite(additive(new THREE.SpriteMaterial({ map: glow, transparent: true, depthWrite: false })));
    sprite.visible = false;
    scene.add(sprite);
    return sprite;
  });
  let nextRunner = 0;
  const runners: Runner[] = [];

  // ── Dust in the lamp's light: deep in the room, moving with its parallax ───
  const dustGroup = new THREE.Group();
  const dustPositions = new Float32Array(DUST * 3);
  const dustDrift = new Float32Array(DUST * 3);
  const dustGeometry = new THREE.BufferGeometry();
  const dustAttribute = new THREE.BufferAttribute(dustPositions, 3);
  dustAttribute.setUsage(THREE.DynamicDrawUsage);
  dustGeometry.setAttribute("position", dustAttribute);
  const dustMaterial = additive(new THREE.PointsMaterial({ size: 5, map: glow, color: "#ffc98f", transparent: true, opacity: 0.3, depthWrite: false }));
  const dust = new THREE.Points(dustGeometry, dustMaterial);
  dust.frustumCulled = false;
  dustGroup.add(dust);
  scene.add(dustGroup);
  let heat = 0.3;

  const seedDust = () => {
    for (let i = 0; i < DUST; i++) {
      // Thickest on the left, where the lamp stands, and in the room above the
      // board — not up in the dark under the ceiling, where a mote reads as noise.
      const side = Math.random() < 0.65 ? -1 : 1;
      dustPositions[i * 3] = side * Math.random() * width * 0.75;
      dustPositions[i * 3 + 1] = height * (Math.random() * 0.34 - 0.02);
      dustPositions[i * 3 + 2] = -900 + Math.random() * 1000;
      dustDrift[i * 3] = (Math.random() - 0.5) * 8;
      dustDrift[i * 3 + 1] = 3 + Math.random() * 7;
      dustDrift[i * 3 + 2] = (Math.random() - 0.5) * 6;
    }
    dustAttribute.needsUpdate = true;
  };

  const resize = () => {
    width = window.innerWidth;
    height = window.innerHeight;
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    // At this distance one world unit on the z = 0 plane is one CSS pixel.
    camera.position.set(0, 0, height / 2 / Math.tan(THREE.MathUtils.degToRad(FOV / 2)));
    camera.updateProjectionMatrix();
    seedDust();
  };
  resize();
  window.addEventListener("resize", resize);

  /** `count` motes off (wx, wy) in world space, `lift` scaling how hard they rise. */
  const emit = (wx: number, wy: number, hex: string, count: number, lift: number, spread: number) => {
    color.set(hex);
    for (let k = 0; k < count; k++) {
      const i = nextMote;
      nextMote = (nextMote + 1) % MAX_MOTES;
      const j = i * 3;
      // Up off the edge, a little apart, drifting toward the player.
      const angle = Math.PI / 2 + (Math.random() - 0.5) * 1.1;
      const speed = (30 + Math.random() * 70) * lift;
      pos[j] = wx + (Math.random() - 0.5) * spread;
      pos[j + 1] = wy;
      pos[j + 2] = 0;
      vel[j] = Math.cos(angle) * speed;
      vel[j + 1] = Math.sin(angle) * speed;
      vel[j + 2] = 20 + Math.random() * 90;
      span[i] = 0.8 + Math.random() * 0.6;
      life[i] = span[i];
      hue[j] = color.r;
      hue[j + 1] = color.g;
      hue[j + 2] = color.b;
    }
  };

  let rafId = 0;
  let last = performance.now();
  const frame = (now: number) => {
    rafId = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;

    edgeGlows.forEach((g) => {
      const age = Math.max(0, (now - g.at) / g.ms);
      g.sprite.visible = age < 1;
      if (age < 1) {
        // Opens out along the edge, thin, and fades.
        const w = (70 + smoothOut(age) * 220) * g.wide;
        g.sprite.scale.set(w, 12 + 6 * g.wide, 1);
        g.sprite.material.opacity = (1 - age) * (1 - age) * g.bright;
      }
    });

    for (let r = runners.length - 1; r >= 0; r--) {
      const run = runners[r];
      const p = Math.min(1, Math.max(0, (now - run.at) / WAVE_MS));
      const x = run.from + (run.to - run.from) * smoothOut(p);
      run.sprite.visible = p < 1;
      run.sprite.position.set(x, run.y, 1);
      run.sprite.scale.set(240, 20, 1);
      run.sprite.material.opacity = (1 - p) * 0.9;
      if (p < 1 && now - run.lastSpawn >= WAVE_SPAWN_MS) {
        run.lastSpawn = now;
        emit(x, run.y, run.hex, 2, 1.4, 24);
      }
      if (p >= 1) runners.splice(r, 1);
    }

    const mp = motePositions.array as Float32Array;
    const mc = moteColors.array as Float32Array;
    for (let i = 0; i < MAX_MOTES; i++) {
      const j = i * 3;
      if (life[i] <= 0) {
        mc[j] = mc[j + 1] = mc[j + 2] = 0;
        continue;
      }
      life[i] -= dt;
      const keep = Math.max(0, 1 - DRAG * dt);
      vel[j] *= keep;
      vel[j + 1] = vel[j + 1] * keep - LIFT * dt;
      vel[j + 2] *= keep;
      pos[j] += vel[j] * dt;
      pos[j + 1] += vel[j + 1] * dt;
      pos[j + 2] += vel[j + 2] * dt;
      // In softly, out slowly.
      const age = 1 - Math.max(0, life[i]) / span[i];
      const fade = Math.min(1, age * 6) * Math.pow(1 - age, 1.8) * 0.8;
      color.setRGB(hue[j], hue[j + 1], hue[j + 2]).lerp(white, MOTE_WHITE);
      mp[j] = pos[j];
      mp[j + 1] = pos[j + 1];
      mp[j + 2] = pos[j + 2];
      mc[j] = color.r * fade;
      mc[j + 1] = color.g * fade;
      mc[j + 2] = color.b * fade;
    }
    motePositions.needsUpdate = true;
    moteColors.needsUpdate = true;

    for (let i = 0; i < DUST; i++) {
      const j = i * 3;
      dustPositions[j] += (dustDrift[j] + Math.sin(now / 2400 + i) * 3) * dt;
      dustPositions[j + 1] += dustDrift[j + 1] * dt * 0.4;
      dustPositions[j + 2] += dustDrift[j + 2] * dt;
      if (dustPositions[j + 1] > height * 0.34) dustPositions[j + 1] = -height * 0.02;
    }
    dustAttribute.needsUpdate = true;
    dustMaterial.opacity = 0.16 + heat * 0.3;
    // The room's own parallax (stageCamera), in pixels.
    const pose = stageCameraPose();
    dustGroup.position.set((pose.shiftX * width) / 100, (-pose.shiftY * width) / 100, 0);
    dustGroup.rotation.set(THREE.MathUtils.degToRad(-pose.turnX), THREE.MathUtils.degToRad(pose.turnY), 0);

    renderer.render(scene, camera);
  };
  rafId = requestAnimationFrame(frame);


  return {
    rise(x, y, hex, strength) {
      const k = Math.min(1, Math.max(0, strength));
      const wx = x - width / 2;
      const wy = height / 2 - y;
      emit(wx, wy, hex, Math.round(MOTES_PER_HIT + (MOTES_PER_HIT_HOT - MOTES_PER_HIT) * k), 1 + k * 0.6, 14 + k * 30);
      showEdgeGlow(wx, wy, hex, 1 + k * 0.8, 0.55 + k * 0.35, EDGE_MS);
    },
    wave(y, left, right, fromX, hex) {
      const now = performance.now();
      for (const to of [left, right]) {
        const sprite = runnerSprites[nextRunner];
        nextRunner = (nextRunner + 1) % runnerSprites.length;
        sprite.material.color.set(hex).lerp(white, 0.3);
        runners.push({ from: fromX - width / 2, to: to - width / 2, y: height / 2 - y, at: now, hex, lastSpawn: now, sprite });
      }
    },
    setHeat(next) {
      heat = Math.min(1, Math.max(0, next));
    },
    dispose() {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      [moteGeometry, dustGeometry, moteMaterial, dustMaterial, glow].forEach((thing) => thing.dispose());
      edgeGlows.forEach((g) => g.sprite.material.dispose());
      runnerSprites.forEach((sprite) => sprite.material.dispose());
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
