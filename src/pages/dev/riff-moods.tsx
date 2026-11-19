import { AnimeChip, AnimeMoment } from "components/AnimeMoment/AnimeMoment";
import { Riff, RiffFace, type RiffMood, RiffSays } from "components/Mascot/Riff";
import { AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

/**
 * Dev-only gallery of every Riff mood, to review poses and entry reactions in
 * one place. Click a tile to replay its reaction. Renders nothing in production.
 */
const MOODS: { mood: RiffMood; note: string; props?: Record<string, unknown> }[] = [
  { mood: "idle", note: "idle · lively", props: { lively: true, arrive: true } },
  { mood: "celebrate", note: "celebrate" },
  { mood: "celebrate", note: "celebrate · short", props: { short: true } },
  { mood: "hop", note: "hop" },
  { mood: "levelUp", note: "levelUp — knobs to 11" },
  { mood: "asleep", note: "asleep (click: wake)" },
  { mood: "standby", note: "standby — day off" },
  { mood: "focus", note: "focus — before a boss" },
  { mood: "nudge", note: "nudge · lookAt up", props: { lookAt: "up" } },
  { mood: "shrug", note: "shrug — nothing counted", props: { lookAt: "left" } },
  { mood: "dizzy", note: "dizzy — lost" },
  { mood: "lookAround", note: "lookAround — no results" },
  { mood: "warmup", note: "warmup — loading" },
  { mood: "unplugged", note: "unplugged — 404 / no mic" },
  { mood: "plugIn", note: "plugIn — signal found" },
  { mood: "error", note: "error" },
  { mood: "idle", note: "idle · eyesClosed (password)", props: { eyesClosed: true } },
];

const Tile = ({ mood, note, props }: (typeof MOODS)[number]) => {
  const [run, setRun] = useState(0);
  const [awake, setAwake] = useState(false);
  const shown: RiffMood = mood === "asleep" && awake ? "idle" : mood;
  return (
    <button
      type='button'
      onClick={() => (mood === "asleep" ? setAwake((a) => !a) : setRun((r) => r + 1))}
      className='flex flex-col items-center gap-3 rounded-lg bg-zinc-900/60 px-4 pb-4 pt-8 text-left'>
      <Riff key={run} mood={shown} className='h-36' {...props} />
      <span className='text-xs text-zinc-400'>{note}</span>
    </button>
  );
};

const Listen = () => {
  const [signal, setSignal] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setSignal(Math.random() < 0.3 ? Math.random() : Math.random() * 0.3), 180);
    return () => clearInterval(t);
  }, []);
  return (
    <div className='flex flex-col items-center gap-3 rounded-lg bg-zinc-900/60 px-4 pb-4 pt-8'>
      <Riff mood='listen' signal={signal} className='h-36' />
      <span className='text-xs text-zinc-400'>listen · signal {signal.toFixed(2)}</span>
    </div>
  );
};

const LINES = [
  "Lampy zimne. Pięć minut wystarczy.",
  "Nic tu jeszcze nie ma. Dodaj pierwsze ćwiczenie, a się obudzę.",
  "Ten kabel chyba nie tam, gdzie trzeba. Wracamy?",
];

const Speech = () => {
  const [i, setI] = useState(0);
  return (
    <button type='button' onClick={() => setI((n) => (n + 1) % LINES.length)} className='rounded-lg bg-zinc-900/60 p-6 text-left'>
      <RiffSays text={LINES[i]} key={i} riffClassName='h-36' />
      <span className='mt-3 block text-xs text-zinc-400'>RiffSays — click for the next line</span>
    </button>
  );
};

const MOMENTS = [
  { label: "Session done", title: "Sesja zaliczona!", props: {} },
  { label: "Exam mastered", title: "Opanowane!", props: { colors: { a: "#f4b63e", b: "#a78bfa" }, subtitle: "Pentatonika — pozycja 1" } },
  { label: "Boss record", title: "Nowy rekord", props: { colors: { a: "#f97316", b: "#22d3ee" } } },
];

const Moments = () => {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className='flex flex-wrap gap-3 rounded-lg bg-zinc-900/60 p-6'>
      {MOMENTS.map((m, i) => (
        <button key={m.label} type='button' onClick={() => setOpen(i)} className='rounded-lg bg-zinc-800 px-4 py-2 text-sm text-zinc-100'>
          AnimeMoment: {m.label}
        </button>
      ))}
      <AnimatePresence>
        {open !== null && (
          <AnimeMoment key={open} title={MOMENTS[open].title} {...MOMENTS[open].props} onDone={() => setOpen(null)}>
            <AnimeChip className='text-cyan-400'>
              <span className='font-teko text-4xl font-bold leading-none'>+120</span>
            </AnimeChip>
          </AnimeMoment>
        )}
      </AnimatePresence>
    </div>
  );
};

function RiffMoods() {
  if (process.env.NODE_ENV === "production") return null;
  return (
    <div className='min-h-screen bg-zinc-950 p-8'>
      <div className='mb-8 flex items-center gap-4'>
        <RiffFace className='h-8 w-8' />
        <RiffFace className='h-6 w-6' lampOn={false} />
        <RiffFace className='h-4 w-4' asleep lampOn={false} />
        <span className='text-sm text-zinc-400'>RiffFace 32 / 24 / 16 px</span>
      </div>
      <div className='grid grid-cols-2 gap-6 md:grid-cols-3 xl:grid-cols-5'>
        {MOODS.map((m) => (
          <Tile key={m.note} {...m} />
        ))}
        <Listen />
      </div>
      <div className='mt-8 flex flex-wrap gap-6'>
        <Speech />
        <Moments />
      </div>
    </div>
  );
}

export default dynamic(() => Promise.resolve(RiffMoods), { ssr: false });
