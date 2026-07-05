import { cn } from "assets/lib/utils";
import type { TablatureMeasure } from "feature/exercisePlan/types/exercise.types";
import { Maximize2, Minimize2 } from "lucide-react";
import { memo, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

import { useNoteMatchingContext } from "../contexts/NoteMatchingContext";
import { STRING_COLORS, useTablatureRenderData } from "./useTablatureRenderData";

interface RocksmithHighway3DProps {
  measures: TablatureMeasure[];
  /** Force a rebuild of the note geometry (exercise change / restart). */
  resetKey?: number;
  /** Ear-training / riddle modes hide the notes but keep the board. */
  hideNotes?: boolean;
  className?: string;
}

// ── Rocksmith projection ─────────────────────────────────────────────────────
// Highway X axis = fret lanes (like the real game), note color = string,
// note height above the board = string (low E hugs the board, high e floats).
// A neck strip with the 6 colored strings + fret numbers sits at the hit line.
const SPACING = 2.4;        // z world-units per beat
const NECK_LEN = 400;       // highway length into the fog
const LANE_W = 1.15;        // x world-units per fret lane
const GEM_W = LANE_W * 0.78;
const STRIP_LEN = 2.6;      // depth of the neck strip in front of the hit line
const NUM_TILT = -0.18;     // lean fret-number plates back toward the camera
const BG = 0x0a0a0f;

const stringY = (s: number) => 0.16 + (6 - s) * 0.24; // s: 1 = high e … 6 = low E
const HIT_COLOR = new THREE.Color(0x22c55e);  // green — note played correctly
const MISS_COLOR = new THREE.Color(0xef4444); // red — note missed
const WHITE = new THREE.Color(0xffffff);

/** Cache of fret-number textures (0–24): white digit with a dark outline. */
function fretTexture(fret: number, cache: Map<number, THREE.Texture>): THREE.Texture {
  const existing = cache.get(fret);
  if (existing) return existing;
  const size = 128;
  const cv = document.createElement("canvas");
  cv.width = cv.height = size;
  const ctx = cv.getContext("2d")!;
  ctx.clearRect(0, 0, size, size);
  ctx.font = "bold 88px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineWidth = 12;
  ctx.lineJoin = "round";
  ctx.strokeStyle = "rgba(0,0,0,0.95)";
  ctx.strokeText(String(fret), size / 2, size / 2 + 4);
  ctx.fillStyle = "#ffffff";
  ctx.fillText(String(fret), size / 2, size / 2 + 4);
  const tex = new THREE.CanvasTexture(cv);
  tex.anisotropy = 4;
  cache.set(fret, tex);
  return tex;
}

/** Soft radial white glow, tinted per use via material color. */
function glowTexture(): THREE.Texture {
  const size = 128;
  const cv = document.createElement("canvas");
  cv.width = cv.height = size;
  const ctx = cv.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(255,255,255,0.95)");
  g.addColorStop(0.35, "rgba(255,255,255,0.35)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(cv);
}

/** Faint nebula backdrop, Rocksmith-style. */
function nebulaTexture(): THREE.Texture {
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
  blob(150, 120, 160, "rgba(76,29,149,0.5)");   // violet
  blob(380, 90, 150, "rgba(14,116,144,0.4)");   // teal
  blob(280, 200, 120, "rgba(30,64,175,0.3)");   // blue
  return new THREE.CanvasTexture(cv);
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
  xScale: number;   // gem x-scale (open notes stretch across the board)
  tailLen: number;
  numMesh: THREE.InstancedMesh;
  numSlot: number;
  color: THREE.Color;
}

/**
 * Rocksmith-style 3D note highway. A pure consumer of the session's shared
 * playback cursor (`currentBeatsElapsedRef`) and scoring (`hitNotes`/`missedNotes`)
 * from NoteMatchingContext — it renders, it does not track time or match notes.
 * Desktop only; mounted lazily (client-side) from TablatureSection.
 */
export const RocksmithHighway3D = memo(function RocksmithHighway3D({
  measures,
  resetKey,
  hideNotes = false,
  className,
}: RocksmithHighway3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFull, setIsFull] = useState(false);
  const { currentBeatsElapsedRef, hitNotes, missedNotes } = useNoteMatchingContext();

  const renderData = useTablatureRenderData(measures);

  // Keep the latest scoring maps readable from inside the rAF closure.
  const hitRef = useRef(hitNotes);
  const missRef = useRef(missedNotes);
  hitRef.current = hitNotes;
  missRef.current = missedNotes;

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

    // ── Fret window: lanes only for the frets this tab actually uses ───────
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
    const minFret = minUsed > maxUsed ? 1 : Math.max(1, minUsed);
    const maxFret = Math.min(24, Math.max(maxUsed, minFret + 3));
    const laneCount = maxFret - minFret + 1;
    const boardW = laneCount * LANE_W;
    const laneX = (fret: number) => -boardW / 2 + (fret - minFret + 0.5) * LANE_W;

    // ── Renderer / scene / camera / lights ─────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 380;
    renderer.setSize(width, height, false);
    container.appendChild(renderer.domElement);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(BG);
    scene.fog = new THREE.Fog(BG, 14, 60 + boardW);

    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 260);
    camera.position.set(0, 3.4 + boardW * 0.26, 6.2 + boardW * 0.32);
    camera.lookAt(0, 0, -16 - boardW);

    // Shading: soft ambient + a key light from the upper front + a cyan wash
    // around the hit zone so approaching gems catch the light.
    scene.add(new THREE.AmbientLight(0xffffff, 0.65));
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.6);
    keyLight.position.set(3, 9, 7);
    scene.add(keyLight);
    const hitZoneLight = new THREE.PointLight(0x22d3ee, 3.2, 22, 1.6);
    hitZoneLight.position.set(0, 2.2, 1.5);
    scene.add(hitZoneLight);

    const geometries: THREE.BufferGeometry[] = [];
    const materials: THREE.Material[] = [];
    const textures: THREE.Texture[] = [];
    const track = <T extends THREE.BufferGeometry>(g: T): T => { geometries.push(g); return g; };
    const trackM = <T extends THREE.Material>(m: T): T => { materials.push(m); return m; };

    const glowTex = glowTexture();
    textures.push(glowTex);

    // ── Backdrop nebula ────────────────────────────────────────────────────
    {
      const tex = nebulaTexture();
      textures.push(tex);
      const mat = trackM(new THREE.MeshBasicMaterial({
        map: tex, transparent: true, opacity: 0.6, depthWrite: false, fog: false,
      }));
      const plane = new THREE.Mesh(track(new THREE.PlaneGeometry(260, 130)), mat);
      plane.position.set(0, 24, -140);
      scene.add(plane);
    }

    // ── Highway board + fret grid + edge rails ─────────────────────────────
    const boardMat = trackM(new THREE.MeshBasicMaterial({ color: 0x101015 }));
    const board = new THREE.Mesh(track(new THREE.PlaneGeometry(boardW, NECK_LEN + STRIP_LEN)), boardMat);
    board.rotation.x = -Math.PI / 2;
    board.position.set(0, -0.02, -(NECK_LEN - STRIP_LEN) / 2);
    scene.add(board);

    // Alternate lane shading (subtle columns like the RS highway)
    const laneShadeMat = trackM(new THREE.MeshBasicMaterial({
      color: 0x1a1a22, transparent: true, opacity: 0.5,
    }));
    for (let k = 0; k < laneCount; k += 2) {
      const lane = new THREE.Mesh(track(new THREE.PlaneGeometry(LANE_W, NECK_LEN)), laneShadeMat);
      lane.rotation.x = -Math.PI / 2;
      lane.position.set(laneX(minFret + k), -0.01, -NECK_LEN / 2);
      scene.add(lane);
    }

    // Fret boundary lines running into the distance
    const fretLineMat = trackM(new THREE.MeshBasicMaterial({ color: 0x2b2b36 }));
    for (let k = 0; k <= laneCount; k++) {
      const x = -boardW / 2 + k * LANE_W;
      const line = new THREE.Mesh(track(new THREE.BoxGeometry(0.03, 0.006, NECK_LEN)), fretLineMat);
      line.position.set(x, 0.003, -NECK_LEN / 2);
      scene.add(line);
    }

    // Glowing edge rails framing the highway
    const railMat = trackM(new THREE.MeshBasicMaterial({ color: 0x0e7490 }));
    for (const side of [-1, 1]) {
      const rail = new THREE.Mesh(track(new THREE.BoxGeometry(0.09, 0.11, NECK_LEN)), railMat);
      rail.position.set(side * (boardW / 2 + 0.08), 0.05, -NECK_LEN / 2);
      scene.add(rail);
    }

    // ── Neck strip at the hit line: 6 colored strings + fret markers ───────
    const stripBase = new THREE.Mesh(
      track(new THREE.PlaneGeometry(boardW + 1.2, STRIP_LEN)),
      trackM(new THREE.MeshBasicMaterial({ color: 0x16161c })),
    );
    stripBase.rotation.x = -Math.PI / 2;
    stripBase.position.set(0, 0.001, STRIP_LEN / 2);
    scene.add(stripBase);

    for (let s = 1; s <= 6; s++) {
      const t = 0.028 + (s - 1) * 0.009; // low strings drawn thicker
      const mat = trackM(new THREE.MeshBasicMaterial({
        color: new THREE.Color(STRING_COLORS[s - 1] ?? "#ffffff"),
      }));
      const str = new THREE.Mesh(track(new THREE.BoxGeometry(boardW + 1.2, t, t)), mat);
      str.position.set(0, stringY(s), STRIP_LEN * 0.5);
      scene.add(str);
    }

    const sepMat = trackM(new THREE.MeshBasicMaterial({ color: 0x3a3a46 }));
    for (let k = 0; k <= laneCount; k++) {
      const x = -boardW / 2 + k * LANE_W;
      const sep = new THREE.Mesh(track(new THREE.BoxGeometry(0.045, stringY(1) + 0.25, 0.05)), sepMat);
      sep.position.set(x, (stringY(1) + 0.25) / 2, STRIP_LEN * 0.5);
      scene.add(sep);
    }

    // Fret numbers on the strip
    const stripNumCache = new Map<number, THREE.Texture>();
    for (let f = minFret; f <= maxFret; f++) {
      const tex = fretTexture(f, stripNumCache);
      const mat = trackM(new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0.9, depthTest: false }));
      const sprite = new THREE.Sprite(mat);
      sprite.scale.set(0.55, 0.55, 1);
      sprite.position.set(laneX(f), 0.12, STRIP_LEN + 0.35);
      scene.add(sprite);
    }
    for (const t of stripNumCache.values()) textures.push(t);

    // ── Hit line + pulsing glow ────────────────────────────────────────────
    const hitLine = new THREE.Mesh(
      track(new THREE.BoxGeometry(boardW + 1.2, 0.045, 0.14)),
      trackM(new THREE.MeshBasicMaterial({ color: 0x67e8f9 })),
    );
    hitLine.position.set(0, 0.03, 0);
    scene.add(hitLine);

    const hitGlowMat = trackM(new THREE.MeshBasicMaterial({
      map: glowTex, transparent: true, opacity: 0.4, depthWrite: false,
      blending: THREE.AdditiveBlending, color: 0x22d3ee,
    }));
    const hitGlow = new THREE.Mesh(track(new THREE.PlaneGeometry(boardW + 3, 2.4)), hitGlowMat);
    hitGlow.rotation.x = -Math.PI / 2;
    hitGlow.position.set(0, 0.015, 0);
    scene.add(hitGlow);

    // ── Moving world group (notes + measure/beat markers) ──────────────────
    const world = new THREE.Group();
    scene.add(world);

    const markerMat = trackM(new THREE.MeshBasicMaterial({ color: 0x2e2e3a }));
    for (const beatPos of [0, ...renderData.measureEndXs]) {
      const line = new THREE.Mesh(track(new THREE.BoxGeometry(boardW, 0.014, 0.04)), markerMat);
      line.position.set(0, 0.008, -beatPos * SPACING);
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
        bDummy.position.set(0, 0.004, -b * SPACING);
        bDummy.updateMatrix();
        beatLines.setMatrixAt(b - 1, bDummy.matrix);
      }
      beatLines.instanceMatrix.needsUpdate = true;
      world.add(beatLines);
    }

    // Flatten notes from the shared render data.
    const flat: { key: string; string: number; fret: number; z: number; dur: number; beatPos: number }[] = [];
    if (!hideNotes) {
      for (const beat of renderData.renderBeats) {
        for (const n of beat.notes) {
          flat.push({
            key: n.noteKey, string: n.string, fret: n.fret,
            z: -beat.offsetX * SPACING, dur: beat.duration, beatPos: beat.offsetX,
          });
        }
      }
    }

    const notes: NoteEntry[] = [];
    const noteStates: NoteState[] = new Array(flat.length).fill("idle");
    let gemsMesh: THREE.InstancedMesh | null = null;
    let tailsMesh: THREE.InstancedMesh | null = null;
    let stemsMesh: THREE.InstancedMesh | null = null;
    let shadowsMesh: THREE.InstancedMesh | null = null;
    const numMeshes: THREE.InstancedMesh[] = [];
    const dummy = new THREE.Object3D();

    if (flat.length > 0) {
      // Rounded, lit gems — the shading gives them real depth.
      gemsMesh = new THREE.InstancedMesh(
        track(new RoundedBoxGeometry(GEM_W, 0.22, 0.55, 2, 0.07)),
        trackM(new THREE.MeshStandardMaterial({ metalness: 0.25, roughness: 0.35, emissive: 0x0c0c10 })),
        flat.length,
      );
      gemsMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

      tailsMesh = new THREE.InstancedMesh(
        track(new THREE.BoxGeometry(0.14, 0.05, 1)),
        trackM(new THREE.MeshLambertMaterial({ transparent: true, opacity: 0.5 })),
        flat.length,
      );
      tailsMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

      // Thin stems from the board up to each gem — makes the fret lane of a
      // floating note instantly readable (same trick as the real game).
      stemsMesh = new THREE.InstancedMesh(
        track(new THREE.BoxGeometry(0.035, 1, 0.035)),
        trackM(new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.45 })),
        flat.length,
      );
      stemsMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

      // Soft dark blob under each gem grounds it on the board.
      shadowsMesh = new THREE.InstancedMesh(
        track(new THREE.PlaneGeometry(0.95, 0.55)),
        trackM(new THREE.MeshBasicMaterial({
          map: glowTex, color: 0x000000, transparent: true, opacity: 0.45, depthWrite: false,
        })),
        flat.length,
      );
      shadowsMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

      // One InstancedMesh of number plates per distinct fret → ≤25 draw calls
      // even for thousands of notes (per-note sprites would kill the frame rate).
      const numCache = new Map<number, THREE.Texture>();
      const groups = new Map<number, { mesh: THREE.InstancedMesh; next: number }>();
      const countByFret = new Map<number, number>();
      for (const n of flat) countByFret.set(n.fret, (countByFret.get(n.fret) ?? 0) + 1);
      const numGeo = track(new THREE.PlaneGeometry(0.7, 0.7));
      for (const [fret, count] of countByFret) {
        const tex = fretTexture(fret, numCache);
        const mat = trackM(new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
        const mesh = new THREE.InstancedMesh(numGeo, mat, count);
        mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        groups.set(fret, { mesh, next: 0 });
        numMeshes.push(mesh);
      }
      for (const t of numCache.values()) textures.push(t);

      flat.forEach((n, i) => {
        const group = groups.get(n.fret)!;
        const entry: NoteEntry = {
          key: n.key,
          string: n.string,
          fret: n.fret,
          x: n.fret === 0 ? 0 : laneX(Math.min(Math.max(n.fret, minFret), maxFret)),
          y: stringY(n.string),
          z: n.z,
          beatPos: n.beatPos,
          xScale: n.fret === 0 ? (boardW * 0.94) / GEM_W : 1,
          tailLen: Math.max(0.001, n.dur * SPACING - 0.6),
          numMesh: group.mesh,
          numSlot: group.next++,
          color: new THREE.Color(STRING_COLORS[n.string - 1] ?? "#ffffff"),
        };
        notes.push(entry);

        // gem
        dummy.position.set(entry.x, entry.y, entry.z);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(entry.xScale, 1, 1);
        dummy.updateMatrix();
        gemsMesh!.setMatrixAt(i, dummy.matrix);
        gemsMesh!.setColorAt(i, entry.color);

        // sustain tail behind the gem
        dummy.position.set(entry.x, entry.y - 0.02, entry.z - entry.tailLen / 2 - 0.3);
        dummy.scale.set(1, 1, entry.tailLen);
        dummy.updateMatrix();
        tailsMesh!.setMatrixAt(i, dummy.matrix);
        tailsMesh!.setColorAt(i, entry.color);

        // stem down to the board
        dummy.position.set(entry.x, entry.y / 2, entry.z);
        dummy.scale.set(1, Math.max(0.001, entry.y - 0.08), 1);
        dummy.updateMatrix();
        stemsMesh!.setMatrixAt(i, dummy.matrix);
        stemsMesh!.setColorAt(i, entry.color);

        // shadow blob on the board
        dummy.position.set(entry.x, 0.005, entry.z);
        dummy.rotation.set(-Math.PI / 2, 0, 0);
        dummy.scale.set(entry.xScale, 1, 1);
        dummy.updateMatrix();
        shadowsMesh!.setMatrixAt(i, dummy.matrix);

        // fret-number plate above the gem
        dummy.position.set(entry.x, entry.y + 0.4, entry.z + 0.3);
        dummy.rotation.set(NUM_TILT, 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        entry.numMesh.setMatrixAt(entry.numSlot, dummy.matrix);
        entry.numMesh.setColorAt(entry.numSlot, WHITE);
      });

      for (const m of [gemsMesh, tailsMesh, stemsMesh, shadowsMesh, ...numMeshes]) {
        m.instanceMatrix.needsUpdate = true;
        if (m.instanceColor) m.instanceColor.needsUpdate = true;
      }

      world.add(shadowsMesh);
      world.add(stemsMesh);
      world.add(tailsMesh);
      world.add(gemsMesh);
      for (const m of numMeshes) world.add(m);
    }

    // ── State → recolour ONLY the fret number (green = hit, red = miss) ────
    // The gem itself keeps its string colour; nothing moves, nothing overlays.
    const applyState = (i: number, st: NoteState) => {
      const n = notes[i];
      const c = st === "hit" ? HIT_COLOR : st === "miss" ? MISS_COLOR : WHITE;
      n.numMesh.setColorAt(n.numSlot, c);
    };

    // ── Animation loop ─────────────────────────────────────────────────────
    let rafId = 0;
    const dirtyNum = new Set<THREE.InstancedMesh>();
    const animate = () => {
      world.position.z = currentBeatsElapsedRef.current * SPACING;

      if (gemsMesh && tailsMesh && stemsMesh) {
        const hits = hitRef.current;
        const misses = missRef.current;
        let changed = false;
        dirtyNum.clear();
        for (let i = 0; i < notes.length; i++) {
          const n = notes[i];
          const next: NoteState = n.key in hits ? "hit" : n.key in misses ? "miss" : "idle";
          if (next !== noteStates[i]) {
            noteStates[i] = next;
            applyState(i, next);
            dirtyNum.add(n.numMesh);
            changed = true;
          }
        }
        if (changed) {
          for (const m of dirtyNum) {
            if (m.instanceColor) m.instanceColor.needsUpdate = true;
          }
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
      if (renderer.domElement.parentNode === container) container.removeChild(renderer.domElement);
    };
    // Rebuild when the tab data or exercise changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [renderData, resetKey, hideNotes]);

  return (
    <div
      className={cn(
        isFull ? "fixed inset-0 z-[1000000] bg-[#0a0a0f]" : "relative w-full",
        !isFull && className,
      )}
      style={isFull ? undefined : { height: 400 }}
    >
      <div ref={containerRef} className={cn("absolute inset-0 overflow-hidden", !isFull && "rounded-lg")} />
      {/* Vignette — darkens the corners so the highway pops. */}
      <div
        className={cn("pointer-events-none absolute inset-0", !isFull && "rounded-lg")}
        style={{ background: "radial-gradient(ellipse at 50% 45%, transparent 55%, rgba(0,0,0,0.5) 100%)" }}
      />
      <button
        type="button"
        onClick={() => setIsFull((f) => !f)}
        title={isFull ? "Exit full screen (Esc)" : "Full screen"}
        aria-label={isFull ? "Exit full screen" : "Full screen"}
        className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-zinc-900/85 text-zinc-300 backdrop-blur-sm transition-colors hover:bg-white/10 hover:text-white"
      >
        {isFull ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
      </button>
      {isFull && (
        <div className="absolute left-3 top-3 z-10 rounded-md bg-zinc-900/70 px-2 py-1 font-mono text-[10px] text-zinc-500">
          Esc — exit full screen
        </div>
      )}
    </div>
  );
});

export default RocksmithHighway3D;
