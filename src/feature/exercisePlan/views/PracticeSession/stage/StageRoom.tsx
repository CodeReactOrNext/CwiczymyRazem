import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { useReducedMotion } from "framer-motion";
import { useTranslation } from "hooks/useTranslation";
import { Minimize2, Pause, Play } from "lucide-react";
import type { CSSProperties } from "react";
import { memo, useEffect, useRef, useState } from "react";

import { useNoteScore } from "../contexts/NoteMatchingContext";
import { useLingeringControls } from "../hooks/useTabFullscreen";
import {
  aimStageCamera,
  registerStageCameraElement,
  setStageCameraStill,
  STAGE_ORIGIN,
  STAGE_PERSPECTIVE,
} from "./stageCamera";
import { StageCoverFrame } from "./StageCoverFrame";
import { caseSpots, StageWallCases, wallHolesMask } from "./StageWallCases";
import { useStageGuitars } from "./useStageGuitars";

const ART = "/static/images/session/stage-studio";

/** Mirrors the multiplier cap in useNoteMatching — the light is full at the top of it. */
const MAX_MULTIPLIER = 8;
/** The room's light with no score to follow (mic off). */
const RESTING_HEAT = 0.3;
/** A broken combo: the lamps sag for a moment. */
const DIP_HEAT = -0.8;
const DIP_MS = 380;

/**
 * The room is a box of flat photographs standing in real depth. Units are vw, so
 * it is cut to the window's width; the origin is the eye line (STAGE_ORIGIN),
 * x to the right, y down, z toward the player.
 *
 *   back wall   z = -70      floor    y = +20
 *   side walls  x = ±75      ceiling  y = -28
 *
 * The tab hangs in the same space from TablatureSection (see STAGE_TAB_TRANSFORM
 * there) — move a wall here and check it still clears the board.
 */
const plane = (
  width: number,
  height: number,
  transform: string,
  background: string,
): CSSProperties => ({
  position: "absolute",
  left: 0,
  top: 0,
  width: `${width}vw`,
  height: `${height}vw`,
  transform,
  background,
  overflow: "hidden",
});

/** Follows the score: brighter with the multiplier, quick to drop, slow to come back. */
const lit = (dip: boolean): CSSProperties => ({
  filter: "brightness(calc(0.95 + var(--stage-heat) * 0.5))",
  transition: `filter ${dip ? 120 : 700}ms ease`,
});

const overlay = (background: string): CSSProperties => ({
  position: "absolute",
  inset: 0,
  background,
});

const BACK_WALL = plane(
  150,
  48,
  "translate(-50%, -50%) translate3d(0, -4vw, -70vw)",
  `#0c0806 url(${ART}/back.webp) center / cover`,
);
const LEFT_WALL = plane(
  130,
  48,
  "translate(-50%, -50%) translate3d(-75vw, -4vw, -5vw) rotateY(90deg)",
  `#0c0806 url(${ART}/wall.webp) left center / auto 100% repeat-x`,
);
const RIGHT_WALL = plane(
  130,
  48,
  "translate(-50%, -50%) translate3d(75vw, -4vw, -5vw) rotateY(-90deg)",
  `#0c0806 url(${ART}/wall.webp) left center / auto 100% repeat-x`,
);
const FLOOR = plane(
  150,
  130,
  "translate(-50%, -50%) translate3d(0, 20vw, -5vw) rotateX(90deg)",
  `#0a0706 url(${ART}/floor.webp) 0 0 / 34vw`,
);
/**
 * A ceiling of walnut slats running back to the wall, so they draw the room's
 * perspective. Its far edge (the plane's bottom, after the turn) meets the
 * back wall's top; the downlights sit just in front of it.
 */
const CEILING = plane(
  150,
  130,
  "translate(-50%, -50%) translate3d(0, -28vw, -5vw) rotateX(-90deg)",
  `#0a0706 url(${ART}/ceiling.webp) 0 0 / 52vw`,
);
/** Dark over the player's head, lifting toward the wall where the downlights are. */
const CEILING_SHADE = overlay(
  "linear-gradient(to bottom, rgba(0,0,0,0.93) 0%, rgba(0,0,0,0.76) 70%, rgba(0,0,0,0.42) 100%)",
);

/*
 * Where the ceiling meets the back wall: a light slot. A narrow dark recess
 * runs along the ceiling's far edge with a warm strip hidden in it; the strip's
 * lip catches the light, the slats beside it get its bounce, and the wall's top
 * is grazed by it — the slats' relief brightest at the top and fading down.
 * A hairline of shadow sits right in the corner, where neither surface gets light.
 */
/** On the ceiling, measured from its far edge (the plane's bottom after the turn). */
const COVE_ON_CEILING = overlay(
  [
    "linear-gradient(to top, #060403 0vw, #060403 1.1vw, rgba(255,214,170,0.6) 1.1vw, rgba(255,214,170,0.16) 1.5vw, rgba(255,214,170,0.05) 7vw, rgba(255,214,170,0) 18vw)",
  ].join(", "),
);
/** On the back wall, from its top. */
const COVE_ON_WALL = overlay(
  "linear-gradient(to bottom, rgba(255,202,152,0.34) 0%, rgba(255,202,152,0.13) 9%, rgba(255,202,152,0.04) 22%, rgba(255,202,152,0) 36%)",
);
const CORNER_LINE = overlay(
  "linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.85) 0.5%, rgba(0,0,0,0) 1.4%)",
);
/** How far in front of the back wall the downlights are set (vw), and the room's own spots when no case hangs. */
const DOWNLIGHT_FROM_WALL = 5;
const DOWNLIGHT_SPOTS_EMPTY = [38, 68];

/**
 * The ceiling's downlights, one over each case: a recessed fixture with a warm
 * core and a dark trim, and the soft glow it leaves on the slats round it.
 */
const Downlights = ({ spots }: { spots: number[] }) => (
  <>
    {spots.map((spot) => (
      <div key={spot}>
        <div
          className='absolute'
          style={{
            left: `calc(${spot}% - 9vw)`,
            top: `${130 - DOWNLIGHT_FROM_WALL - 9}vw`,
            width: "18vw",
            height: "18vw",
            background:
              "radial-gradient(circle, rgba(255,214,170,0.2) 0%, rgba(255,214,170,0.06) 40%, rgba(255,214,170,0) 70%)",
          }}
        />
        <div
          className='absolute rounded-full'
          style={{
            left: `calc(${spot}% - 1.3vw)`,
            top: `${130 - DOWNLIGHT_FROM_WALL - 1.3}vw`,
            width: "2.6vw",
            height: "2.6vw",
            background:
              "radial-gradient(circle, #fff8ec 0%, #fbe7c8 38%, #a08a70 48%, #2a2420 56%, #15110e 70%, rgba(21,17,14,0) 72%)",
          }}
        />
      </div>
    ))}
  </>
);

/**
 * Each downlight's light on the back wall: the scallop a downlight throws on a
 * wall right under it, washing down over the case it hangs above.
 */
const scallops = (spots: number[]) =>
  spots
    .flatMap((spot) => [
      `radial-gradient(ellipse 2.6% 13% at ${spot}% 0%, rgba(255,236,210,0.2), rgba(255,236,210,0) 100%)`,
      `radial-gradient(ellipse 6% 40% at ${spot}% 0%, rgba(255,222,184,0.16), rgba(255,222,184,0) 100%)`,
    ])
    .join(", ");
const RUG = {
  ...plane(
    80,
    46,
    "translate(-50%, -50%) translate3d(0, 19.85vw, -14vw) rotateX(90deg)",
    `#2a1210 url(${ART}/rug.webp) center / cover`,
  ),
  borderRadius: "0.4vw",
};

// The far end of a side wall is lit by the room; the near end is behind the player.
const LEFT_WALL_SHADE = overlay(
  "linear-gradient(to left, rgba(0,0,0,0.45), rgba(0,0,0,0.94) 55%)",
);
const RIGHT_WALL_SHADE = overlay(
  "linear-gradient(to right, rgba(0,0,0,0.45), rgba(0,0,0,0.94) 55%)",
);
// On the floor: the dark seam under the wall, the lamp's pool where the lamp
// stands in the photograph, and the falloff toward the player.
const FLOOR_SHADE = overlay(
  [
    "linear-gradient(to bottom, rgba(0,0,0,0.7), rgba(0,0,0,0) 3%)",
    "radial-gradient(ellipse 20% 14% at 7% 5%, rgba(255,170,90,0.42), rgba(255,170,90,0) 100%)",
    "linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.5) 45%, rgba(0,0,0,0.9))",
  ].join(", "),
);
const RUG_SHADE = overlay(
  "linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.62))",
);
// Over the whole picture: a dark top for the title and the score, a darker
// floor for the tab to stand out against, and soft corners.
const VIGNETTE = overlay(
  [
    "linear-gradient(to bottom, rgba(0,0,0,0.62), rgba(0,0,0,0) 24%)",
    "linear-gradient(to top, rgba(0,0,0,0.6), rgba(0,0,0,0) 50%)",
    "radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.5) 100%)",
  ].join(", "),
);

/** How often the grain moves on — a film's frame rate, not the screen's. */
const GRAIN_FPS = 14;
/** How strong the grain is over the room. */
const GRAIN_OPACITY = 0.04;

/**
 * Film grain over the room: one small noise tile, light and dark specks on a
 * clear ground, repeated over a layer larger than the screen and jumped to a
 * new place a dozen times a second. Moving a layer is the compositor's job, so
 * it costs next to nothing, unlike a filter redrawn every frame. Still for
 * players who asked for less motion.
 */
const FilmGrain = ({ still }: { still: boolean }) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || still) return undefined;
    const id = window.setInterval(() => {
      const x = (Math.random() * 20 - 10).toFixed(2);
      const y = (Math.random() * 20 - 10).toFixed(2);
      el.style.transform = `translate3d(${x}%, ${y}%, 0)`;
    }, 1000 / GRAIN_FPS);
    return () => window.clearInterval(id);
  }, [still]);
  return (
    <div
      ref={ref}
      className='absolute -inset-[25%] will-change-transform'
      style={{
        backgroundImage: `url(${ART}/grain.png)`,
        backgroundSize: "256px 256px",
        opacity: GRAIN_OPACITY,
      }}
    />
  );
};

interface StageRoomProps {
  title: string;
  /** The song's cover, framed on the back wall; absent — no frame. */
  coverUrl?: string;
  isPlaying: boolean;
  /** The score is being kept (mic on) — the room's light follows it. */
  live: boolean;
  /** The Electron shell's titlebar covers the top 40px. */
  belowTitlebar: boolean;
  onTogglePlay: () => void;
  onExit: () => void;
}

/**
 * Stage mode's picture and its only chrome: the studio behind the tab, the
 * exercise's name, and two keys that come up with the mouse — play/pause and
 * the way out. Rendered by DesktopSessionView in place of the whole session UI.
 */
export const StageRoom = memo(function StageRoom({
  title,
  coverUrl,
  isPlaying,
  live,
  belowTitlebar,
  onTogglePlay,
  onExit,
}: StageRoomProps) {
  const { t } = useTranslation("session");
  const { gameState } = useNoteScore();
  const reducedMotion = useReducedMotion();
  const roomRef = useRef<HTMLDivElement>(null);
  const { visible, wake } = useLingeringControls(true, isPlaying);

  // A combo that falls back to nothing dims the room for a moment.
  const [dip, setDip] = useState(false);
  const lastComboRef = useRef(gameState.combo);
  useEffect(() => {
    const broke = lastComboRef.current > 0 && gameState.combo === 0;
    lastComboRef.current = gameState.combo;
    if (!broke) return undefined;
    setDip(true);
    const id = window.setTimeout(() => setDip(false), DIP_MS);
    return () => window.clearTimeout(id);
  }, [gameState.combo]);

  const heat = !live
    ? RESTING_HEAT
    : dip
      ? DIP_HEAT
      : (Math.min(MAX_MULTIPLIER, gameState.multiplier) - 1) /
        (MAX_MULTIPLIER - 1);

  useEffect(() => {
    setStageCameraStill(!!reducedMotion);
    const room = roomRef.current;
    if (!room) return undefined;
    return registerStageCameraElement(room);
  }, [reducedMotion]);

  useEffect(() => {
    const move = (e: PointerEvent) => {
      aimStageCamera(
        (e.clientX / window.innerWidth) * 2 - 1,
        (e.clientY / window.innerHeight) * 2 - 1,
      );
      wake();
    };
    // Capture: Escape leaves the stage and nothing else — not the session's own exit dialog.
    const key = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      onExit();
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("keydown", key, true);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("keydown", key, true);
    };
  }, [wake, onExit]);

  const light = lit(dip);
  const guitars = useStageGuitars(true);
  const lightSpots =
    guitars.length > 0 ? caseSpots(guitars.length) : DOWNLIGHT_SPOTS_EMPTY;

  return (
    <>
      <div
        aria-hidden
        // Fades up out of the dark when the stage opens.
        className='force-dark pointer-events-none fixed inset-0 z-[1] overflow-hidden bg-[#050403] duration-700 animate-in fade-in'
        style={{
          perspective: STAGE_PERSPECTIVE,
          perspectiveOrigin: STAGE_ORIGIN,
          ["--stage-heat" as string]: heat,
        }}>
        <div
          ref={roomRef}
          className='absolute left-1/2 top-[40%] h-0 w-0'
          style={{ transformStyle: "preserve-3d" }}>
          <div style={CEILING}>
            <div style={CEILING_SHADE} />
            <div style={COVE_ON_CEILING} />
            <Downlights spots={lightSpots} />
          </div>
          {/* Cut where the cases are set into it; the cases themselves stand beside it in 3D. */}
          <div style={{ ...BACK_WALL, ...light, ...wallHolesMask(guitars) }}>
            <div
              className='absolute inset-0 mix-blend-screen'
              style={{ background: scallops(lightSpots) }}
            />
            <div className='mix-blend-screen' style={COVE_ON_WALL} />
            <div style={CORNER_LINE} />
          </div>
          <StageWallCases guitars={guitars} />
          {coverUrl && (
            <StageCoverFrame key={coverUrl} coverUrl={coverUrl} title={title} />
          )}
          <div style={{ ...LEFT_WALL, ...light }}>
            <div style={LEFT_WALL_SHADE} />
            <div style={CORNER_LINE} />
          </div>
          <div style={{ ...RIGHT_WALL, ...light }}>
            <div style={RIGHT_WALL_SHADE} />
            <div style={CORNER_LINE} />
          </div>
          <div style={{ ...FLOOR, ...light }}>
            <div style={FLOOR_SHADE} />
          </div>
          <div style={{ ...RUG, ...light }}>
            <div style={RUG_SHADE} />
          </div>
        </div>
        <div style={VIGNETTE} />
        <FilmGrain still={!!reducedMotion} />
      </div>

      <div className='force-dark pointer-events-none fixed inset-0 z-40'>
        <p
          className={cn(
            "absolute left-8 max-w-[40vw] truncate text-lg font-semibold text-zinc-100",
            belowTitlebar ? "top-16" : "top-7",
          )}>
          {title}
        </p>
        <div
          className={cn(
            "absolute bottom-7 left-8 flex items-center gap-3 transition-opacity duration-slow",
            visible ? "pointer-events-auto opacity-100" : "opacity-0",
          )}>
          <Button
            type='button'
            variant='secondary'
            size='sm'
            className='gap-1.5'
            onClick={onTogglePlay}>
            {isPlaying ? <Pause /> : <Play />}
            {isPlaying ? t("controls.pause") : t("controls.resume")}
          </Button>
          <Button
            type='button'
            variant='subtle'
            size='sm'
            className='gap-1.5'
            onClick={onExit}>
            <Minimize2 />
            {t("tab.stage_exit")}
          </Button>
        </div>
      </div>
    </>
  );
});
