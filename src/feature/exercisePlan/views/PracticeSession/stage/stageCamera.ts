/**
 * The camera of the session's stage mode.
 *
 * The room (StageRoom) and the tab hanging in it (TablatureSection) sit in two
 * different parts of the tree, each under its own `perspective` box. They read
 * as one space only while both are moved by the very same transform — so both
 * register their element here, and one animation frame writes it to all of them.
 */

/** Distance from the eye to the picture plane, shared by every perspective box. */
export const STAGE_PERSPECTIVE = "90vw";
/** Where the eye looks, as a share of the viewport — the horizon of the room. */
export const STAGE_ORIGIN = "50% 40%";
/** The two above as numbers, for the WebGL camera of the 3D tab. */
export const STAGE_PERSPECTIVE_VW = 90;
export const STAGE_ORIGIN_Y = 0.4;

/** How far the eye moves and turns at the edge of the screen (aim = ±1). */
const SHIFT_X_VW = 4;
const SHIFT_Y_VW = 1.2;
const TURN_Y_DEG = 3;
const TURN_X_DEG = 1.6;
/** Share of the remaining way covered each frame — the camera's weight. */
const EASE = 0.06;
/** The room breathes a little with nobody touching the mouse. */
const SWAY = 0.3;
const SWAY_PERIOD_MS = 5200;

const clampAim = (v: number) => Math.max(-1, Math.min(1, v));

/** How the room is moved for an eye pointed at (x, y), each in -1…1: vw across, vw down, degrees. */
export function stageCameraOffsets(x: number, y: number) {
  return {
    shiftX: -x * SHIFT_X_VW,
    shiftY: -y * SHIFT_Y_VW,
    turnY: x * TURN_Y_DEG,
    turnX: -y * TURN_X_DEG,
  };
}

/** The same move as a CSS transform, for the room's flat layers. */
export function stageCameraTransform(x: number, y: number): string {
  const { shiftX, shiftY, turnY, turnX } = stageCameraOffsets(x, y);
  return `translate3d(${shiftX.toFixed(3)}vw, ${shiftY.toFixed(3)}vw, 0) rotateY(${turnY.toFixed(3)}deg) rotateX(${turnX.toFixed(3)}deg)`;
}

const elements = new Set<HTMLElement>();
let aimX = 0;
let aimY = 0;
let camX = 0;
let camY = 0;
let still = false;
let rafId = 0;

const write = () => {
  const transform = stageCameraTransform(camX, camY);
  elements.forEach((el) => {
    el.style.transform = transform;
  });
};

const tick = (now: number) => {
  const sway = still ? 0 : Math.sin(now / SWAY_PERIOD_MS) * SWAY;
  camX += (aimX + sway - camX) * EASE;
  camY += (aimY - camY) * EASE;
  write();
  rafId = requestAnimationFrame(tick);
};

/** Where the eye is right now — what the 3D tab renders with, frame by frame. */
export function stageCameraPose() {
  return stageCameraOffsets(camX, camY);
}

/** Points the eye: where the pointer is on the screen, each axis in -1…1. */
export function aimStageCamera(x: number, y: number) {
  if (still) return;
  aimX = clampAim(x);
  aimY = clampAim(y);
}

/** Reduced motion: the room stands still, straight ahead. */
export function setStageCameraStill(value: boolean) {
  still = value;
  if (value) {
    aimX = 0;
    aimY = 0;
  }
}

/** Moves `el` with the camera until the returned function is called. */
export function registerStageCameraElement(el: HTMLElement): () => void {
  elements.add(el);
  el.style.transform = stageCameraTransform(camX, camY);
  if (elements.size === 1) rafId = requestAnimationFrame(tick);
  return () => {
    elements.delete(el);
    el.style.transform = "";
    if (elements.size === 0) {
      cancelAnimationFrame(rafId);
      aimX = 0;
      aimY = 0;
      camX = 0;
      camY = 0;
    }
  };
}
