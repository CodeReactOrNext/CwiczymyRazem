import type { BoardGeometry } from "feature/arsenal/utils/pedalboardLayout";
import { railPaddingPct } from "feature/arsenal/utils/powerLayout";

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
}

/**
 * The flight case a board is built in: shell, latches, the supply racked along
 * the top, the perforated deck, and the handles and feet underneath.
 *
 * One case for the owner's editable board and for the copy a visitor sees on a
 * profile, so a board looks the same from both sides — the profile used to draw
 * its own, and kept everything the Arsenal's had since dropped.
 */
export const PedalboardCase = ({
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
