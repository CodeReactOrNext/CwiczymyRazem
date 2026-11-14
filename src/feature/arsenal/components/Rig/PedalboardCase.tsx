import type { BoardLookId } from "feature/arsenal/data/boardSkins";
import {
  BOARD_LOOK_MARGINS,
  boardLookArt,
} from "feature/arsenal/utils/boardSkinArt";
import type { BoardGeometry } from "feature/arsenal/utils/pedalboardLayout";
import { RAIL_H, railPaddingPct } from "feature/arsenal/utils/powerLayout";
import { useId, useMemo } from "react";

/** One steel latch on the case's top edge. */
const Latch = () => (
  <div
    style={{
      width: 32,
      height: 11,
      background: "linear-gradient(180deg,#aaa 0%,#666 50%,#888 100%)",
      borderRadius: 4,
      boxShadow:
        "0 2px 5px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.25)",
    }}
  />
);

/** One carry handle on the case's bottom edge. */
const Handle = () => (
  <div
    style={{
      width: 52,
      height: 9,
      background: "linear-gradient(180deg,#555,#2a2a2a)",
      borderRadius: 4,
      boxShadow:
        "0 3px 6px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.1)",
    }}
  />
);

interface PedalboardCaseProps {
  geo: BoardGeometry;
  /** Wired by the book: the deck washes emerald from the inside. */
  flawless: boolean;
  /** What is racked above the deck — the supply, and on the owner's board the
      handle a cable is dragged out of. */
  rail: React.ReactNode;
  /** Everything standing on the deck. */
  children: React.ReactNode;
  deckRef?: React.Ref<HTMLDivElement>;
  /** The editor's hand while a pedal is being carried. */
  deckCursor?: React.CSSProperties["cursor"];
  /**
   * A board skin bought in the supporter panel. Left out, the board stands in
   * the stock flight case below.
   */
  look?: BoardLookId;
}

/** The inside of a deck wired by the book, whatever it is built from. */
const FLAWLESS_WASH =
  "inset 0 0 0 1px rgba(52,211,153,0.10), inset 0 0 44px rgba(16,185,129,0.11)";

/**
 * A skinned board: the same rail and deck, standing in a drawing of something
 * else. The drawing is one SVG stretched behind both, with its margins turned
 * into padding so the bay it leaves open is exactly where the rail and the
 * deck land — see `utils/boardSkinArt`.
 */
const SkinnedCase = ({
  geo,
  flawless,
  rail,
  children,
  deckRef,
  deckCursor,
  look,
}: PedalboardCaseProps & { look: BoardLookId }) => {
  const uid = useId();
  const art = useMemo(
    () =>
      boardLookArt(
        look,
        uid,
        geo.viewW,
        RAIL_H + geo.viewH,
        // Where the top row ends: half way down the channel under it.
        geo.rows > 1
          ? RAIL_H +
              ((geo.rowYPct[0] + geo.pedalHPct + geo.rowYPct[1]) / 200) *
                geo.viewH
          : null,
      ),
    [look, uid, geo],
  );
  const m = BOARD_LOOK_MARGINS[look];
  const pct = (units: number) => `${(units / art.width) * 100}%`;

  return (
    <div
      className='relative w-full select-none'
      style={{ padding: `${pct(m.t)} ${pct(m.r)} ${pct(m.b)} ${pct(m.l)}` }}>
      <svg
        viewBox={`0 0 ${art.width} ${art.height}`}
        preserveAspectRatio='none'
        className='pointer-events-none absolute inset-0 h-full w-full overflow-visible'
        aria-hidden
        dangerouslySetInnerHTML={{ __html: art.markup }}
      />

      <div
        className='relative w-full'
        style={{ paddingTop: `${railPaddingPct(geo)}%` }}>
        {rail}
      </div>

      <div
        ref={deckRef}
        className='relative w-full overflow-hidden'
        style={{
          aspectRatio: `${geo.w} / ${geo.h}`,
          boxShadow: flawless ? FLAWLESS_WASH : undefined,
          transition: "box-shadow 0.4s ease",
          cursor: deckCursor,
        }}>
        {children}
      </div>
    </div>
  );
};

/**
 * The flight case a board is built in: shell, latches, the supply racked along
 * the top, the perforated deck, and the handles and feet underneath.
 *
 * One case for the owner's editable board and for the copy a visitor sees on a
 * profile, so a board looks the same from both sides — the profile used to draw
 * its own, and kept everything the Arsenal's had since dropped.
 */
const FlightCase = ({
  geo,
  flawless,
  rail,
  children,
  deckRef,
  deckCursor,
}: PedalboardCaseProps) => (
  <div
    className='relative w-full select-none'
    style={{
      background: "linear-gradient(160deg, #2e2e2e 0%, #1c1c1c 50%, #222 100%)",
      borderRadius: 4,
      padding: "10px 14px 14px",
      boxShadow:
        "0 20px 60px rgba(0,0,0,0.9), 0 4px 12px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.06)",
      border: "2px solid #383838",
    }}>
    {/* Top bar: latches */}
    <div className='mb-2.5 flex items-center justify-between px-1'>
      <div className='flex gap-2'>
        <Latch />
        <Latch />
      </div>
      <div className='flex gap-2'>
        <Latch />
        <Latch />
      </div>
    </div>

    {/* The supply, racked on the case above the deck. Its cables carry on into
        the board below — see `PowerLoom` for the seam. */}
    <div
      className='relative w-full'
      style={{ paddingTop: `${railPaddingPct(geo)}%` }}>
      {rail}
    </div>

    {/* Board surface — perforated */}
    <div
      ref={deckRef}
      className='relative w-full overflow-hidden'
      style={{
        aspectRatio: `${geo.w} / ${geo.h}`,
        borderRadius: 4,
        backgroundImage:
          "radial-gradient(circle, #272727 1.4px, transparent 1.4px)",
        backgroundSize: "9px 9px",
        backgroundColor: "#141414",
        // A board wired by the book washes emerald from the inside. It is the
        // one piece of feedback that needs no reading at all.
        boxShadow: flawless
          ? "inset 0 4px 16px rgba(0,0,0,0.85), inset 0 0 0 1px rgba(52,211,153,0.10), inset 0 0 44px rgba(16,185,129,0.11)"
          : "inset 0 4px 16px rgba(0,0,0,0.85), inset 0 0 0 1px rgba(255,255,255,0.02)",
        transition: "box-shadow 0.4s ease",
        cursor: deckCursor,
      }}>
      {children}
    </div>

    {/* Bottom: handles + rubber feet */}
    <div className='mt-2.5 flex items-center justify-between px-3'>
      <Handle />
      <div className='flex gap-6'>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              width: 11,
              height: 11,
              borderRadius: 4,
              background: "radial-gradient(circle at 35% 35%,#3a3a3a,#0a0a0a)",
              boxShadow:
                "0 3px 5px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.05)",
            }}
          />
        ))}
      </div>
      <Handle />
    </div>
  </div>
);

export const PedalboardCase = (props: PedalboardCaseProps) =>
  props.look ? (
    <SkinnedCase {...props} look={props.look} />
  ) : (
    <FlightCase {...props} />
  );
