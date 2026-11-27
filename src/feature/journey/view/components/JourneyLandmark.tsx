import type { CSSProperties, ReactNode } from "react";

/**
 * Landmarks beside the Journey road: a small flat scene at the start of every
 * section, drawn from what that section teaches (a metronome for the first
 * rhythm steps, a bent string for bending...). They tell the player where on
 * the road they are while scrolling, the way landmarks do on a map.
 *
 * One look for all of them: dark zinc solids, the light from above (a lit top
 * edge, a darker underside, a shadow on the floor) and a single cyan detail
 * that carries the meaning. No outlines, no glow. On a phone they peek in from
 * the screen edge; from xl up they stand fully beside the road
 * (`.journey-landmark` in globals.css).
 */

const Z = {
  body: "#1e1e22",
  side: "#161619",
  face: "#131316",
  edge: "#2e2e34",
  panel: "#26262b",
  part: "#2a2a2f",
  metal: "#3a3a40",
  metalHi: "#55555d",
  dot: "#34343a",
  string: "#4a4a52",
  inlay: "#26262b",
  bone: "#57534e",
  muted: "#71717a",
  soft: "#a1a1aa",
  ink: "#d4d4d8",
  root: "#e4e4e7",
  cyan: "#22d3ee",
  cyanLip: "#0e7490",
  cyanInk: "#083344",
};

const FONT = "Inter, system-ui, sans-serif";

// ─── Shared parts ─────────────────────────────────────────────────────────────

const Shadow = ({ cx, cy, rx }: { cx: number; cy: number; rx: number }) => (
  <ellipse cx={cx} cy={cy} rx={rx} ry={9} fill='#000' opacity={0.45} />
);

const Txt = ({
  x,
  y,
  size,
  fill,
  children,
}: {
  x: number;
  y: number;
  size: number;
  fill: string;
  children: ReactNode;
}) => (
  <text
    x={x}
    y={y}
    fontFamily={FONT}
    fontSize={size}
    fontWeight={800}
    textAnchor='middle'
    fill={fill}>
    {children}
  </text>
);

/** Heights of six strings spread over a slab, high e on top. */
const stringYs = (y: number, h: number, pad: number) =>
  Array.from({ length: 6 }, (_, i) => y + pad + (i * (h - pad * 2)) / 5);

/** A slab of fretboard: body, lit top edge, darker underside, metal frets, strings. */
const Fretboard = ({
  x,
  y,
  w,
  h,
  frets,
  pad = 16,
  skipStrings = [],
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  frets: number[];
  pad?: number;
  skipStrings?: number[];
}) => (
  <g>
    <rect x={x} y={y} width={w} height={h} rx={10} fill={Z.body} />
    <rect x={x} y={y} width={w} height={5} rx={2.5} fill={Z.edge} />
    <rect x={x} y={y + h - 8} width={w} height={8} rx={4} fill={Z.side} />
    {frets.map((fx) => (
      <g key={fx}>
        <rect
          x={fx - 2.5}
          y={y + 5}
          width={5}
          height={h - 13}
          rx={2}
          fill={Z.metal}
        />
        <rect
          x={fx - 2.5}
          y={y + 5}
          width={2}
          height={h - 13}
          fill={Z.metalHi}
        />
      </g>
    ))}
    {stringYs(y, h, pad).map((sy, i) =>
      skipStrings.includes(i) ? null : (
        <line
          key={i}
          x1={x}
          x2={x + w}
          y1={sy}
          y2={sy}
          stroke={Z.string}
          strokeWidth={1 + i * 0.35}
        />
      ),
    )}
  </g>
);

/** A note on the neck: zinc, the root in near-white, or the one that matters in cyan. */
const Dot = ({
  cx,
  cy,
  r = 9,
  tone = "plain",
  label,
}: {
  cx: number;
  cy: number;
  r?: number;
  tone?: "plain" | "root" | "hot";
  label?: string;
}) => {
  const face = tone === "hot" ? Z.cyan : tone === "root" ? Z.root : Z.dot;
  const ink = tone === "plain" ? Z.ink : tone === "hot" ? Z.cyanInk : "#18181b";
  return (
    <g>
      {tone !== "plain" && (
        <circle
          cx={cx}
          cy={cy + 2}
          r={r}
          fill={tone === "hot" ? Z.cyanLip : Z.muted}
        />
      )}
      <circle cx={cx} cy={cy} r={r} fill={face} />
      {label && (
        <Txt x={cx} y={cy + r * 0.42} size={r * 1.15} fill={ink}>
          {label}
        </Txt>
      )}
    </g>
  );
};

const starPoints = (cx: number, cy: number, r: number) =>
  Array.from({ length: 10 }, (_, i) => {
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const rr = i % 2 ? r * 0.45 : r;
    return `${(cx + rr * Math.cos(a)).toFixed(1)},${(cy + rr * Math.sin(a)).toFixed(1)}`;
  }).join(" ");

// ─── Guitar Fundamentals ──────────────────────────────────────────────────────

/** Foundations: a metronome; the pendulum swings at 60 BPM. */
const Metronome = () => (
  <svg viewBox='0 0 220 300'>
    <Shadow cx={110} cy={288} rx={96} />
    <rect x={20} y={256} width={180} height={28} rx={7} fill='#232327' />
    <rect x={20} y={256} width={180} height={4} rx={2} fill='#34343a' />
    <polygon points='48,258 172,258 131,30 89,30' fill={Z.body} />
    <polygon points='131,30 172,258 156,258 124,30' fill={Z.side} />
    <line
      x1={89}
      y1={31}
      x2={48}
      y2={257}
      stroke='#2c2c31'
      strokeWidth={3}
      strokeLinecap='round'
    />
    <rect x={90} y={14} width={40} height={20} rx={6} fill={Z.part} />
    <rect x={90} y={14} width={40} height={4} rx={2} fill={Z.metal} />
    <polygon points='68,238 152,238 125,58 95,58' fill={Z.face} />
    {Array.from({ length: 11 }, (_, i) => {
      const w = i % 2 ? 8 : 16;
      return (
        <rect
          key={i}
          x={110 - w / 2}
          y={74 + i * 13}
          width={w}
          height={2.5}
          rx={1.2}
          fill={Z.metal}
        />
      );
    })}
    <rect x={170} y={196} width={22} height={9} rx={3} fill={Z.part} />
    <rect x={188} y={186} width={10} height={28} rx={4} fill={Z.part} />
    <g className='journey-pendulum'>
      <rect x={107.5} y={62} width={5} height={164} rx={2.5} fill={Z.metalHi} />
      <rect x={96} y={112} width={28} height={26} rx={5} fill={Z.cyan} />
      <rect x={96} y={133} width={28} height={5} rx={2.5} fill={Z.cyanLip} />
      <rect
        x={100}
        y={116}
        width={20}
        height={3}
        rx={1.5}
        fill='#fff'
        opacity={0.35}
      />
    </g>
    <circle cx={110} cy={224} r={8} fill={Z.metal} />
    <circle cx={110} cy={224} r={3} fill={Z.face} />
  </svg>
);

/** Legato & Scale Shapes: the first pentatonic box, with a hammer-on slur. */
const PentatonicHammer = () => {
  const ys = stringYs(58, 136, 18);
  const col: Record<number, number> = { 5: 70, 6: 130, 7: 190, 8: 250 };
  const box = [
    [5, 8],
    [5, 8],
    [5, 7],
    [5, 7],
    [5, 7],
    [5, 8],
  ];
  return (
    <svg viewBox='0 0 320 250'>
      <Shadow cx={160} cy={232} rx={140} />
      <g transform='rotate(-12 160 125)'>
        <Fretboard
          x={10}
          y={58}
          w={300}
          h={136}
          frets={[40, 100, 160, 220, 280]}
          pad={18}
        />
        {box.map((frets, s) =>
          frets.map((f) => (
            <Dot
              key={`${s}-${f}`}
              cx={col[f]}
              cy={ys[s]}
              r={s === 2 ? 9 : 8}
              tone={s === 2 ? "hot" : "plain"}
            />
          )),
        )}
        <path
          d={`M74 ${ys[2] - 16} Q130 ${ys[2] - 50} 186 ${ys[2] - 16}`}
          fill='none'
          stroke={Z.cyan}
          strokeWidth={3.5}
          strokeLinecap='round'
        />
        <Txt x={130} y={ys[2] - 40} size={20} fill={Z.cyan}>
          h
        </Txt>
      </g>
    </svg>
  );
};

/** Advanced Techniques: a bent G string pushing the two above it, under a "full" arrow. */
const Bend = () => {
  const ys = Array.from({ length: 6 }, (_, i) => 130 + i * 18);
  const lift = [9, 13, 17];
  const curve = (y: number, d: number) =>
    `M10 ${y} C130 ${y} 166 ${y - d} 196 ${y - d} C226 ${y - d} 256 ${y} 290 ${y}`;
  return (
    <svg viewBox='0 0 300 260'>
      <Shadow cx={150} cy={244} rx={134} />
      <Fretboard
        x={10}
        y={108}
        w={280}
        h={118}
        frets={[60, 140, 220]}
        pad={22}
        skipStrings={[0, 1, 2]}
      />
      <circle cx={100} cy={166} r={7} fill={Z.inlay} />
      {[0, 1].map((i) => (
        <path
          key={i}
          d={curve(ys[i], lift[i])}
          fill='none'
          stroke={Z.string}
          strokeWidth={1 + i * 0.35}
        />
      ))}
      <path
        d={curve(ys[2], lift[2])}
        fill='none'
        stroke={Z.cyan}
        strokeWidth={3.4}
        strokeLinecap='round'
      />
      <circle cx={196} cy={ys[2] - lift[2]} r={6} fill={Z.cyan} />
      <path
        d='M196 96 C196 66 236 70 236 38'
        fill='none'
        stroke={Z.soft}
        strokeWidth={3.5}
        strokeLinecap='round'
      />
      <polygon points='226,42 236,22 246,42' fill={Z.soft} />
      <Txt x={236} y={14} size={17} fill={Z.ink}>
        full
      </Txt>
    </svg>
  );
};

// ─── Fretboard Mastery ────────────────────────────────────────────────────────

/** Fundamentals: note names on the low strings, from the nut to fret 5. */
const NoteNames = () => {
  const ys = stringYs(40, 128, 16);
  return (
    <svg viewBox='0 0 330 200'>
      <Shadow cx={165} cy={188} rx={150} />
      <Fretboard x={20} y={40} w={300} h={128} frets={[80, 140, 200, 260]} />
      <rect x={14} y={40} width={12} height={128} rx={3} fill={Z.bone} />
      <circle cx={170} cy={104} r={7} fill={Z.inlay} />
      <circle cx={290} cy={104} r={7} fill={Z.inlay} />
      <Dot cx={110} cy={ys[3]} r={14} label='E' />
      <Dot cx={50} cy={ys[5]} r={14} label='F' />
      <Dot cx={170} cy={ys[5]} r={14} label='G' />
      <Dot cx={290} cy={ys[5]} r={14} tone='hot' label='A' />
    </svg>
  );
};

/** Octaves: the root and the same note an octave up, two strings and two frets away. */
const Octave = () => {
  const ys = stringYs(60, 120, 16);
  return (
    <svg viewBox='0 0 320 240'>
      <Shadow cx={160} cy={222} rx={140} />
      <g transform='rotate(-10 160 120)'>
        <Fretboard x={10} y={60} w={300} h={120} frets={[70, 130, 190, 250]} />
        <circle cx={160} cy={120} r={7} fill={Z.inlay} />
        <path
          d={`M112 ${ys[3] - 10} Q150 ${ys[1] - 46} 208 ${ys[1] - 8}`}
          fill='none'
          stroke={Z.cyan}
          strokeWidth={3}
          strokeDasharray='2 8'
          strokeLinecap='round'
        />
        <Dot cx={100} cy={ys[3]} r={11} tone='root' label='R' />
        <Dot cx={220} cy={ys[1]} r={11} tone='hot' label='8' />
        <Dot cx={40} cy={ys[5]} r={8} />
        <Dot cx={160} cy={ys[2]} r={8} />
      </g>
    </svg>
  );
};

/** Boxes: one four-fret box of the neck lit up, every note inside it. */
const FretBox = () => {
  const ys = stringYs(50, 130, 16);
  const notes: [number, number][] = [
    [40, 0],
    [100, 0],
    [160, 1],
    [40, 2],
    [160, 2],
    [100, 3],
    [40, 4],
    [160, 4],
    [40, 5],
    [100, 5],
  ];
  return (
    <svg viewBox='0 0 320 210'>
      <Shadow cx={160} cy={196} rx={140} />
      <Fretboard x={10} y={50} w={300} h={130} frets={[70, 130, 190, 250]} />
      <rect
        x={14}
        y={55}
        width={172}
        height={117}
        rx={8}
        fill={Z.cyan}
        opacity={0.12}
      />
      {notes.map(([x, s]) => (
        <Dot key={`${x}-${s}`} cx={x} cy={ys[s]} r={8} />
      ))}
      <Dot cx={100} cy={ys[2]} r={9} tone='hot' />
      <Txt x={100} y={38} size={16} fill={Z.soft}>
        0–4
      </Txt>
    </svg>
  );
};

/** Whole Neck: the headstock, the nut and all twelve frets, the double dot at 12 in cyan. */
const WholeNeck = () => {
  const x0 = 82;
  const scale = 576;
  const fret = (n: number) => x0 + scale * (1 - Math.pow(2, -n / 12));
  const frets = Array.from({ length: 12 }, (_, i) => fret(i + 1));
  const mid = (n: number) => (fret(n - 1) + fret(n)) / 2;
  return (
    <svg viewBox='0 0 380 170'>
      <Shadow cx={190} cy={156} rx={176} />
      <polygon points='8,36 74,50 74,130 8,144' fill={Z.body} />
      <polygon points='8,136 74,122 74,130 8,144' fill={Z.side} />
      {[24, 42, 60].map((x) => {
        const top = 36 + ((x - 8) * 14) / 66;
        const bottom = 144 - ((x - 8) * 14) / 66;
        return (
          <g key={x}>
            <rect
              x={x - 5}
              y={top - 13}
              width={10}
              height={12}
              rx={3}
              fill={Z.metal}
            />
            <rect
              x={x - 5}
              y={bottom + 1}
              width={10}
              height={12}
              rx={3}
              fill={Z.metal}
            />
            <circle cx={x} cy={top + 11} r={4.5} fill={Z.metalHi} />
            <circle cx={x} cy={bottom - 11} r={4.5} fill={Z.metalHi} />
          </g>
        );
      })}
      <Fretboard x={x0 - 4} y={50} w={296} h={80} frets={frets} pad={10} />
      <rect x={74} y={50} width={8} height={80} rx={2} fill={Z.bone} />
      {[3, 5, 7, 9].map((n) => (
        <circle key={n} cx={mid(n)} cy={90} r={5} fill={Z.inlay} />
      ))}
      <circle cx={mid(12)} cy={74} r={5.5} fill={Z.cyan} />
      <circle cx={mid(12)} cy={106} r={5.5} fill={Z.cyan} />
    </svg>
  );
};

/** Play!: a combo amp, its power light on. */
const ComboAmp = () => (
  <svg viewBox='0 0 260 250'>
    <Shadow cx={130} cy={238} rx={112} />
    <rect x={95} y={30} width={70} height={16} rx={8} fill={Z.part} />
    <rect x={20} y={44} width={220} height={186} rx={12} fill={Z.body} />
    <rect x={20} y={44} width={220} height={5} rx={2.5} fill={Z.edge} />
    <rect x={20} y={222} width={220} height={8} rx={4} fill={Z.side} />
    <rect x={32} y={58} width={196} height={36} rx={6} fill={Z.panel} />
    {Array.from({ length: 6 }, (_, i) => (
      <g key={i}>
        <circle cx={52 + i * 26} cy={76} r={8} fill={Z.metal} />
        <rect
          x={51}
          y={68}
          width={2}
          height={7}
          rx={1}
          fill={Z.ink}
          transform={`translate(${i * 26}) rotate(${-50 + i * 22} 52 76)`}
        />
      </g>
    ))}
    <circle cx={210} cy={78} r={7} fill={Z.cyanLip} />
    <circle cx={210} cy={76} r={7} fill={Z.cyan} />
    <rect x={32} y={104} width={196} height={110} rx={8} fill={Z.face} />
    <circle cx={130} cy={162} r={44} fill='#18181b' />
    <circle cx={130} cy={162} r={16} fill={Z.body} />
    <rect x={110} y={112} width={40} height={8} rx={4} fill={Z.metal} />
  </svg>
);

// ─── Interval Mastery ─────────────────────────────────────────────────────────

/** Seconds: a note and the one a fret above it — the half step. */
const HalfStep = () => {
  const ys = stringYs(56, 120, 16);
  return (
    <svg viewBox='0 0 320 200'>
      <Shadow cx={160} cy={188} rx={140} />
      <Fretboard x={10} y={56} w={300} h={120} frets={[70, 130, 190, 250]} />
      <circle cx={220} cy={116} r={7} fill={Z.inlay} />
      <Dot cx={100} cy={ys[3]} r={11} tone='root' label='R' />
      <Dot cx={160} cy={ys[3]} r={11} tone='hot' label='♭2' />
      <path
        d='M100 40 V32 H160 V40'
        fill='none'
        stroke={Z.soft}
        strokeWidth={3}
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <Txt x={130} y={24} size={17} fill={Z.ink}>
        ½
      </Txt>
    </svg>
  );
};

/** Thirds: a stave with stacked thirds, the upper note of the first in cyan. */
const StaveThirds = () => {
  const lines = [80, 96, 112, 128, 144];
  const head = (cx: number, cy: number, fill: string) => (
    <ellipse
      cx={cx}
      cy={cy}
      rx={10}
      ry={7}
      fill={fill}
      transform={`rotate(-20 ${cx} ${cy})`}
    />
  );
  return (
    <svg viewBox='0 0 300 230'>
      <Shadow cx={150} cy={216} rx={124} />
      <g transform='rotate(-6 150 115)'>
        <rect x={20} y={34} width={260} height={160} rx={10} fill='#232327' />
        <rect x={20} y={34} width={260} height={5} rx={2.5} fill={Z.edge} />
        {lines.map((y) => (
          <line
            key={y}
            x1={40}
            x2={260}
            y1={y}
            y2={y}
            stroke={Z.metal}
            strokeWidth={2}
          />
        ))}
        <line
          x1={119}
          x2={119}
          y1={140}
          y2={84}
          stroke={Z.soft}
          strokeWidth={2.5}
        />
        {head(110, 144, Z.soft)}
        {head(110, 128, Z.cyan)}
        <line
          x1={199}
          x2={199}
          y1={108}
          y2={52}
          stroke={Z.soft}
          strokeWidth={2.5}
        />
        {head(190, 112, Z.soft)}
        {head(190, 96, Z.soft)}
        <Txt x={80} y={140} size={18} fill={Z.cyan}>
          3
        </Txt>
      </g>
    </svg>
  );
};

/** Fourths & Fifths: the power chord shape — root, fifth and octave. */
const PowerChord = () => {
  const ys = stringYs(56, 144, 16);
  return (
    <svg viewBox='0 0 320 236'>
      <Shadow cx={160} cy={222} rx={140} />
      <g transform='rotate(-8 160 128)'>
        <Fretboard x={10} y={56} w={300} h={144} frets={[70, 130, 190, 250]} />
        <path
          d={`M104 ${ys[5] - 16} Q150 ${ys[4] - 70} 214 ${ys[4] - 16}`}
          fill='none'
          stroke={Z.cyan}
          strokeWidth={3}
          strokeDasharray='2 8'
          strokeLinecap='round'
        />
        <Txt x={154} y={ys[4] - 46} size={16} fill={Z.cyan}>
          P5
        </Txt>
        <Dot cx={100} cy={ys[5]} r={11} tone='root' label='R' />
        <Dot cx={220} cy={ys[4]} r={10.5} tone='hot' label='5' />
        <Dot cx={220} cy={ys[3]} r={10.5} label='8' />
      </g>
    </svg>
  );
};

/** The Tritone: a half stack — the interval of heavy metal. */
const HalfStack = () => (
  <svg viewBox='0 0 220 320'>
    <Shadow cx={110} cy={308} rx={98} />
    <rect x={80} y={38} width={60} height={14} rx={7} fill={Z.part} />
    <rect x={24} y={50} width={172} height={66} rx={8} fill='#232327' />
    <rect x={24} y={50} width={172} height={5} rx={2.5} fill={Z.edge} />
    <rect x={34} y={62} width={152} height={24} rx={4} fill={Z.face} />
    {Array.from({ length: 5 }, (_, i) => (
      <circle key={i} cx={50 + i * 22} cy={74} r={6} fill={Z.metal} />
    ))}
    <circle cx={170} cy={76} r={6} fill={Z.cyanLip} />
    <circle cx={170} cy={74} r={6} fill={Z.cyan} />
    <rect x={86} y={96} width={48} height={8} rx={4} fill={Z.metal} />
    <rect x={18} y={120} width={184} height={178} rx={10} fill={Z.body} />
    <rect x={18} y={120} width={184} height={5} rx={2.5} fill={Z.edge} />
    <rect x={18} y={290} width={184} height={8} rx={4} fill={Z.side} />
    <rect x={28} y={132} width={164} height={152} rx={6} fill={Z.face} />
    {[
      [70, 172],
      [150, 172],
      [70, 246],
      [150, 246],
    ].map(([cx, cy]) => (
      <g key={`${cx}-${cy}`}>
        <circle cx={cx} cy={cy} r={31} fill='#1a1a1d' />
        <circle cx={cx} cy={cy} r={10} fill={Z.body} />
      </g>
    ))}
  </svg>
);

/** Sixths: a stretch of keys, root to major sixth — nine half steps on one glance. */
const KeysSixth = () => {
  const keyW = 34;
  const whites = Array.from({ length: 8 }, (_, i) => 22 + i * keyW);
  // Black keys sit after C, D, F, G and A.
  const blacks = [0, 1, 3, 4, 5].map((i) => whites[i] + keyW - 10);
  const face = (i: number) => (i === 0 ? Z.soft : i === 5 ? Z.cyan : Z.metal);
  const lip = (i: number) => (i === 0 ? Z.muted : i === 5 ? Z.cyanLip : Z.edge);
  return (
    <svg viewBox='0 0 320 210'>
      <Shadow cx={160} cy={198} rx={142} />
      <rect x={12} y={64} width={296} height={124} rx={10} fill={Z.body} />
      <rect x={12} y={64} width={296} height={5} rx={2.5} fill={Z.edge} />
      {whites.map((x, i) => (
        <g key={x}>
          <rect
            x={x + 1.5}
            y={76}
            width={keyW - 3}
            height={102}
            rx={4}
            fill={lip(i)}
          />
          <rect
            x={x + 1.5}
            y={76}
            width={keyW - 3}
            height={96}
            rx={4}
            fill={face(i)}
          />
        </g>
      ))}
      {blacks.map((x) => (
        <rect
          key={x}
          x={x}
          y={76}
          width={20}
          height={60}
          rx={3}
          fill={Z.face}
        />
      ))}
      <path
        d={`M${whites[0] + keyW / 2} 54 V46 H${whites[5] + keyW / 2} V54`}
        fill='none'
        stroke={Z.soft}
        strokeWidth={3}
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <Txt
        x={(whites[0] + whites[5]) / 2 + keyW / 2}
        y={36}
        size={17}
        fill={Z.cyan}>
        6
      </Txt>
    </svg>
  );
};

/** Sevenths: an E7 chord box, the seventh in cyan. */
const ChordBox = () => {
  const xs = Array.from({ length: 6 }, (_, i) => 60 + i * 24);
  const frets = [80, 116, 152, 188, 224];
  return (
    <svg viewBox='0 0 240 280'>
      <Shadow cx={120} cy={266} rx={96} />
      <rect x={30} y={20} width={180} height={232} rx={12} fill='#232327' />
      <rect x={30} y={20} width={180} height={5} rx={2.5} fill={Z.edge} />
      <Txt x={120} y={56} size={22} fill={Z.ink}>
        E7
      </Txt>
      {frets.map((y, i) => (
        <rect
          key={y}
          x={58}
          y={y - (i ? 1.25 : 3)}
          width={124}
          height={i ? 2.5 : 6}
          rx={1}
          fill={i ? Z.metal : Z.muted}
        />
      ))}
      {xs.map((x) => (
        <line
          key={x}
          x1={x}
          x2={x}
          y1={80}
          y2={224}
          stroke={Z.string}
          strokeWidth={2}
        />
      ))}
      {[xs[0], xs[3], xs[5]].map((x) => (
        <circle
          key={x}
          cx={x}
          cy={68}
          r={5}
          fill='none'
          stroke={Z.soft}
          strokeWidth={2}
        />
      ))}
      <Dot cx={xs[1]} cy={134} r={9} />
      <Dot cx={xs[2]} cy={134} r={9} />
      <Dot cx={xs[3]} cy={98} r={9} />
      <Dot cx={xs[4]} cy={170} r={10} tone='hot' />
    </svg>
  );
};

/** Secrets of the Neck: the jump between G and B, where every shape slides one fret. */
const WarpZone = () => {
  const ys = stringYs(56, 124, 16);
  return (
    <svg viewBox='0 0 320 210'>
      <Shadow cx={160} cy={198} rx={140} />
      <Fretboard x={10} y={56} w={300} h={124} frets={[70, 130, 190, 250]} />
      <circle cx={220} cy={118} r={7} fill={Z.inlay} />
      <Dot cx={100} cy={ys[2]} r={10} tone='root' />
      <Dot cx={160} cy={ys[1]} r={10} tone='hot' />
      <path
        d={`M108 ${ys[2] - 12} Q118 ${ys[1] - 54} 150 ${ys[1] - 14}`}
        fill='none'
        stroke={Z.cyan}
        strokeWidth={3.5}
        strokeLinecap='round'
      />
      <polygon
        points={`${144},${ys[1] - 26} ${154},${ys[1] - 12} ${158},${ys[1] - 28}`}
        fill={Z.cyan}
      />
      <Txt x={100} y={ys[1] - 44} size={16} fill={Z.cyan}>
        +1
      </Txt>
    </svg>
  );
};

/** Mastery: a trophy with a star. */
const Trophy = () => (
  <svg viewBox='0 0 220 290'>
    <Shadow cx={110} cy={278} rx={92} />
    <rect x={50} y={232} width={120} height={38} rx={7} fill='#232327' />
    <rect x={50} y={232} width={120} height={4} rx={2} fill='#34343a' />
    <rect x={80} y={246} width={60} height={10} rx={3} fill={Z.metal} />
    <polygon points='98,232 122,232 116,186 104,186' fill={Z.body} />
    <rect x={86} y={180} width={48} height={10} rx={5} fill={Z.part} />
    <path
      d='M46 72 C14 72 14 130 60 134'
      fill='none'
      stroke={Z.part}
      strokeWidth={10}
      strokeLinecap='round'
    />
    <path
      d='M174 72 C206 72 206 130 160 134'
      fill='none'
      stroke={Z.part}
      strokeWidth={10}
      strokeLinecap='round'
    />
    <path
      d='M44 52 H176 C176 132 150 176 110 184 C70 176 44 132 44 52 Z'
      fill={Z.body}
    />
    <path
      d='M150 52 H176 C176 132 150 176 110 184 C138 170 150 124 150 52 Z'
      fill={Z.side}
    />
    <rect x={38} y={44} width={144} height={14} rx={7} fill={Z.edge} />
    <polygon
      points={starPoints(104, 112, 28)}
      fill={Z.cyanLip}
      transform='translate(0 3)'
    />
    <polygon points={starPoints(104, 112, 28)} fill={Z.cyan} />
  </svg>
);

// ─── Which scene where ────────────────────────────────────────────────────────

/** `width` is the scene's width in px from xl up; on a phone it shrinks to 62%. */
const LANDMARKS: Record<string, { Scene: () => ReactNode; width: number }> = {
  "fundamentals:stage_1": { Scene: Metronome, width: 156 },
  "fundamentals:stage_2": { Scene: PentatonicHammer, width: 236 },
  "fundamentals:stage_3": { Scene: Bend, width: 226 },
  "fretboard:stage_1": { Scene: NoteNames, width: 236 },
  "fretboard:stage_2": { Scene: Octave, width: 226 },
  "fretboard:stage_3": { Scene: FretBox, width: 226 },
  "fretboard:stage_4": { Scene: WholeNeck, width: 250 },
  "fretboard:stage_5": { Scene: ComboAmp, width: 176 },
  "intervals:stage_1": { Scene: HalfStep, width: 226 },
  "intervals:stage_2": { Scene: StaveThirds, width: 214 },
  "intervals:stage_3": { Scene: PowerChord, width: 226 },
  "intervals:stage_4": { Scene: HalfStack, width: 150 },
  "intervals:stage_5": { Scene: KeysSixth, width: 226 },
  "intervals:stage_6": { Scene: ChordBox, width: 156 },
  "intervals:stage_7": { Scene: WarpZone, width: 226 },
  "intervals:stage_8": { Scene: Trophy, width: 150 },
};

/** The landmark for a section, on its side of the road; nothing for a section without one. */
export const JourneyLandmark = ({
  moduleId,
  stageId,
  side,
}: {
  moduleId: string;
  stageId: string;
  side: "left" | "right";
}) => {
  const landmark = LANDMARKS[`${moduleId}:${stageId}`];
  if (!landmark) return null;
  const { Scene, width } = landmark;

  return (
    <div
      aria-hidden
      data-side={side}
      className='journey-landmark light-hide'
      style={{ "--lm-w": `${width}px` } as CSSProperties}>
      <Scene />
    </div>
  );
};

/**
 * A section's scene on its own, unpositioned: the picture on a module's card
 * in the module list, sized by the caller.
 */
export const LandmarkScene = ({
  moduleId,
  stageId,
  className,
}: {
  moduleId: string;
  stageId: string;
  className?: string;
}) => {
  const landmark = LANDMARKS[`${moduleId}:${stageId}`];
  if (!landmark) return null;
  const { Scene } = landmark;
  return (
    <div aria-hidden className={className}>
      <Scene />
    </div>
  );
};

/** Every scene by key, for the render check in JourneyLandmark.test. */
export const landmarkScenes = LANDMARKS;
