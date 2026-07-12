import { useEffect, useMemo, useReducer, useRef } from "react";

import type { TablatureMeasure } from "../../../../types/exercise.types";

interface UseNoteHeadFeedbackOptions {
  apiRef: React.MutableRefObject<any>;
  /** Absolutely-positioned layer sharing AlphaTab's render coordinate space. */
  overlayRef: React.MutableRefObject<HTMLDivElement | null>;
  uiReady: boolean;
  /** Parsed session tablature — resolves scoring keys to (time, fret, string). */
  measures?: TablatureMeasure[];
  hitNotes?: Record<string, boolean | number>;
  missedNotes?: Record<string, boolean>;
  selectedTrackIdx: number;
}

const HIT_COLOR  = "#16a34a"; // green-600 — readable on the white staff
const MISS_COLOR = "#dc2626"; // red-600
const TICKS_PER_QUARTER = 960;
const MATCH_TOLERANCE_TICKS = 200; // ~1/5 beat — absorbs float drift

interface AtNote { start: number; fret: number; string: number; x: number; y: number; w: number; h: number; tabStaff: boolean; }

/**
 * Colours the actual fret numbers in the AlphaTab tab staff green (hit) / red
 * (miss), mirroring the 3D highway.
 *
 * AlphaTab owns its canvas, so a glyph can't be recoloured directly. Instead we
 * read each note head's pixel bounds from AlphaTab's `boundsLookup` (requires
 * `core.includeNoteBounds`) and lay a redrawn coloured number over it. Notes are
 * matched to our scoring by (time + fret + string) — never by index — because
 * our tab parse skips grace/tie notes and gap-fills rests, so indices diverge
 * from AlphaTab's model. Our `string` is the flipped convention from the parser
 * (`stringCount - alphaString + 1`), so we flip back when matching.
 */
export function useNoteHeadFeedback({
  apiRef, overlayRef, uiReady, measures, hitNotes, missedNotes, selectedTrackIdx,
}: UseNoteHeadFeedbackOptions) {
  // our note key -> { start ticks, fret, string (1 = high e) }
  const ourNotes = useMemo(() => {
    const map = new Map<string, { start: number; fret: number; string: number }>();
    if (!measures) return map;
    let cumQuarter = 0;
    measures.forEach((m, mi) => {
      m.beats.forEach((b, bi) => {
        const start = Math.round(cumQuarter * TICKS_PER_QUARTER);
        b.notes.forEach((n, ni) => map.set(`${mi}-${bi}-${ni}`, { start, fret: n.fret, string: n.string }));
        cumQuarter += b.duration;
      });
    });
    return map;
  }, [measures]);

  const atByFretRef    = useRef<Map<number, AtNote[]>>(new Map());
  const stringCountRef = useRef(6);
  const markersRef     = useRef<Map<string, HTMLDivElement>>(new Map());
  const [indexVersion, bumpIndex] = useReducer((v: number) => v + 1, 0);

  // Rebuild the AlphaTab note index whenever the score (re)renders (also fires on
  // resize/track change), so overlay positions stay aligned.
  useEffect(() => {
    if (!uiReady) return undefined;
    const api = apiRef.current;
    if (!api?.renderFinished) return undefined;

    const build = () => {
      const lookup = api.renderer?.boundsLookup;
      const byFret = new Map<number, AtNote[]>();
      for (const sys of lookup?.staffSystems ?? []) {
        for (const mb of sys.bars ?? []) {
          for (const bar of mb.bars ?? []) {
            for (const bb of bar.beats ?? []) {
              const start = bb.beat?.absoluteDisplayStart ?? 0;
              if (!bb.notes) continue;
              for (const nb of bb.notes) {
                const note = nb.note;
                const hb = nb.noteHeadBounds;
                if (!note || !hb || typeof note.fret !== "number") continue;
                // Prefer the tablature staff so we colour the fret number, not the
                // notation note head. Falls back to the lower glyph via y (below).
                const staff = note.beat?.voice?.bar?.staff;
                const tabStaff = staff?.showTablature === true && staff?.showStandardNotation !== true;
                const arr = byFret.get(note.fret) ?? [];
                arr.push({ start, fret: note.fret, string: note.string, x: hb.x, y: hb.y, w: hb.w, h: hb.h, tabStaff });
                byFret.set(note.fret, arr);
              }
            }
          }
        }
      }
      try {
        const track = api.score?.tracks?.[selectedTrackIdx] ?? api.score?.tracks?.[0];
        const staff = track?.staves?.[0];
        stringCountRef.current = staff?.stringCount || staff?.tuning?.length || 6;
      } catch { stringCountRef.current = 6; }
      atByFretRef.current = byFret;
      bumpIndex();
    };

    const unsubRender = api.renderFinished?.on?.(build);
    const unsubPost   = api.postRenderFinished?.on?.(build);
    build(); // in case the score is already rendered
    return () => {
      try { unsubRender?.(); } catch { /* ignore */ }
      try { unsubPost?.(); } catch { /* ignore */ }
    };
  }, [uiReady, apiRef, selectedTrackIdx]);

  // Reconcile coloured number markers with the current hit/miss sets.
  useEffect(() => {
    const overlay = overlayRef.current;
    const markers = markersRef.current;
    if (!overlay) return;
    if (!uiReady) { markers.forEach(el => el.remove()); markers.clear(); return; }

    const byFret = atByFretRef.current;
    const sc = stringCountRef.current;

    // Miss wins over hit if a key is somehow in both.
    const desired = new Map<string, string>();
    if (missedNotes) for (const k of Object.keys(missedNotes)) desired.set(k, MISS_COLOR);
    if (hitNotes)    for (const k of Object.keys(hitNotes)) if (!desired.has(k)) desired.set(k, HIT_COLOR);

    for (const [k, el] of markers) {
      if (!desired.has(k)) { el.remove(); markers.delete(k); }
    }

    for (const [k, color] of desired) {
      // Hit/miss state is final once resolved (never flips mid-pass), so a marker
      // already placed for this key needs no re-matching. Without this guard the
      // nearest-note search below re-runs for every note hit so far on every
      // single flush — cost (and therefore visual lag) grows with song length.
      if (markers.has(k)) continue;

      const our = ourNotes.get(k);
      if (!our) continue;
      const bucket = byFret.get(our.fret);
      if (!bucket || bucket.length === 0) continue;

      // Lexicographic match: (1) nearest beat in time, (2) same string (flipped
      // convention) to break chord ties, (3) the tab staff, (4) the lower glyph —
      // in a notation+tab view each note yields two bounds (head above, number
      // below); we want the number.
      const alphaString = sc - our.string + 1;
      let best: AtNote | null = null;
      let bestDt = Infinity;
      let bestSp = 2;
      for (const c of bucket) {
        const dt = Math.abs(c.start - our.start);
        if (dt > MATCH_TOLERANCE_TICKS) continue;
        const sp = c.string === alphaString ? 0 : 1;
        if (best === null) { best = c; bestDt = dt; bestSp = sp; continue; }
        const dtClose = Math.abs(dt - bestDt) <= 1;
        let better: boolean;
        if (dt < bestDt - 1) better = true;
        else if (dtClose && sp < bestSp) better = true;
        else if (dtClose && sp === bestSp) better = c.tabStaff !== best.tabStaff ? c.tabStaff : c.y > best.y;
        else better = false;
        if (better) { best = c; bestDt = dt; bestSp = sp; }
      }
      if (!best) continue;

      let el = markers.get(k);
      if (!el) {
        el = document.createElement("div");
        Object.assign(el.style, {
          position: "absolute", pointerEvents: "none",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: "700", lineHeight: "1", fontFamily: "system-ui, sans-serif",
          boxSizing: "content-box",
          // Tight white pad masks the original black digit so only the coloured
          // number shows — no doubling, no big box.
          background: "#ffffff",
          borderRadius: "2px",
        } as Partial<CSSStyleDeclaration>);
        el.textContent = String(our.fret);
        overlay.appendChild(el);
        markers.set(k, el);
      }
      // Cover exactly the fret-number glyph, centred on it.
      const padX = 1.5;
      const padY = 1;
      el.style.left     = `${best.x - padX}px`;
      el.style.top      = `${best.y - padY}px`;
      el.style.width    = `${best.w + padX * 2}px`;
      el.style.height   = `${best.h + padY * 2}px`;
      el.style.fontSize = `${Math.max(9, best.h * 1.05)}px`;
      el.style.color    = color;
    }
  }, [uiReady, ourNotes, hitNotes, missedNotes, indexVersion, overlayRef]);

  // Clear markers on unmount.
  useEffect(() => {
    const markers = markersRef.current;
    return () => { markers.forEach(el => el.remove()); markers.clear(); };
  }, []);
}
