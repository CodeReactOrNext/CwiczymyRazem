import type { MutableRefObject, RefObject } from "react";
import { memo, useEffect, useRef, useState } from "react";

import { useNoteScore } from "../contexts/NoteMatchingContext";
import type { StageEffects as Effects } from "./stageEffectsScene";

/** Where the flat board's cursor stands, as its worker last said (see the bridge's `onCursor`). */
export interface StageCursor {
  /** CSS px from the board canvas's left edge. */
  x: number;
  /** World → CSS px on the board. */
  scale: number;
}

/** The glass panel the board sits in — its top edge is where the effects live. */
const panelOf = (board: HTMLElement | null) => board?.parentElement ?? null;
/** 0…1 from the multiplier: how full and bright the effects are. */
const strengthOf = (multiplier: number) => (Math.min(8, multiplier) - 1) / 7;

interface StageEffectsProps {
  /** The element holding the flat board's canvas. */
  boardRef: RefObject<HTMLElement | null>;
  cursorRef: MutableRefObject<StageCursor | null>;
  hitNotes: Record<string, boolean | number>;
  /** The player's hit glow: the motes are its colour, softened. */
  hitGlow: string;
  /** The score is being kept (mic on). */
  live: boolean;
}

/**
 * Stage mode's 3D effects (stageEffectsScene), all above the board: light on the
 * glass's top edge and motes rising off it over every note played, fuller as the
 * multiplier climbs; light running along the whole edge when it goes up; dust in
 * the room. Nothing is drawn over the notes. Without WebGL the stage has none.
 */
export const StageEffects = memo(function StageEffects({ boardRef, cursorRef, hitNotes, hitGlow, live }: StageEffectsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const effectsRef = useRef<Effects | null>(null);
  const [ready, setReady] = useState(false);
  const { gameState } = useNoteScore();

  useEffect(() => {
    let cancelled = false;
    void import("./stageEffectsScene")
      .then(({ createStageEffects }) => {
        const canvas = canvasRef.current;
        if (cancelled || !canvas) return;
        effectsRef.current = createStageEffects(canvas);
        setReady(true);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
      effectsRef.current?.dispose();
      effectsRef.current = null;
      setReady(false);
    };
  }, []);

  // One rise for every batch of newly hit notes (a chord is one strike).
  const seenRef = useRef<Set<string> | null>(null);
  useEffect(() => {
    const keys = Object.keys(hitNotes).filter((key) => hitNotes[key]);
    const seen = seenRef.current;
    seenRef.current = new Set(keys);
    const effects = effectsRef.current;
    const cursor = cursorRef.current;
    const canvas = boardRef.current?.querySelector("canvas");
    const panel = panelOf(boardRef.current);
    if (!ready || !seen || !effects || !cursor || !canvas || !panel) return;
    if (!keys.some((key) => !seen.has(key))) return;
    const x = canvas.getBoundingClientRect().left + cursor.x;
    effects.rise(x, panel.getBoundingClientRect().top, hitGlow, live ? strengthOf(gameState.multiplier) : 0.2);
    // The refs are read at the moment of the hit; the effect runs on new marks only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hitNotes, ready]);

  // A multiplier that goes up runs light along the whole edge, from where it is being played.
  const lastMultiplierRef = useRef(gameState.multiplier);
  useEffect(() => {
    const wentUp = gameState.multiplier > lastMultiplierRef.current;
    lastMultiplierRef.current = gameState.multiplier;
    const cursor = cursorRef.current;
    const canvas = boardRef.current?.querySelector("canvas");
    const panel = panelOf(boardRef.current);
    if (!ready || !live || !wentUp || !cursor || !canvas || !panel) return;
    const edge = panel.getBoundingClientRect();
    effectsRef.current?.wave(edge.top, edge.left + 24, edge.right - 24, canvas.getBoundingClientRect().left + cursor.x, hitGlow);
    // The refs are read at the moment it goes up.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState.multiplier, ready, live]);

  useEffect(() => {
    if (!ready) return;
    effectsRef.current?.setHeat(live ? strengthOf(gameState.multiplier) : 0.3);
  }, [gameState.multiplier, live, ready]);

  return <canvas ref={canvasRef} aria-hidden className='pointer-events-none fixed inset-0 z-30 h-full w-full' />;
});
