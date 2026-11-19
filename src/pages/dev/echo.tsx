import { Echo, EchoFace, type EchoMood, EchoSays } from "components/Mascot/Echo";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

/**
 * Dev-only gallery of Echo, the mascot: every mood with where it is used, a
 * live listening tile, speech, and the face icon. Click a tile to replay its
 * reaction. Renders nothing in production.
 */
const MOODS: { mood: EchoMood; note: string; props?: Record<string, unknown> }[] = [
  { mood: "idle", note: "idle · lively", props: { lively: true, arrive: true } },
  { mood: "celebrate", note: "celebrate — po sesji, rekord" },
  { mood: "celebrate", note: "celebrate · short", props: { short: true } },
  { mood: "hop", note: "hop — zaliczone ćwiczenie" },
  { mood: "levelUp", note: "levelUp — nowy poziom" },
  { mood: "asleep", note: "asleep — przerwana seria" },
  { mood: "standby", note: "standby — dzień wolny" },
  { mood: "focus", note: "focus — przed bossem" },
  { mood: "nudge", note: "nudge · lookAt right", props: { lookAt: "right" } },
  { mood: "shrug", note: "shrug — za krótko", props: { lookAt: "left" } },
  { mood: "dizzy", note: "dizzy — przegrana" },
  { mood: "lookAround", note: "lookAround — brak wyników" },
  { mood: "warmup", note: "warmup — ładowanie" },
  { mood: "unplugged", note: "unplugged — 404, brak mikrofonu" },
  { mood: "plugIn", note: "plugIn — sygnał złapany" },
  { mood: "error", note: "error — awaria" },
  { mood: "sad", note: "sad — pudło" },
  { mood: "surprised", note: "surprised" },
  { mood: "think", note: "think" },
  { mood: "idle", note: "eyesClosed — hasło", props: { eyesClosed: true } },
];

const Tile = ({ mood, note, props }: (typeof MOODS)[number]) => {
  const [run, setRun] = useState(0);
  return (
    <button type='button' onClick={() => setRun((r) => r + 1)} className='flex flex-col items-center gap-3 rounded-lg bg-zinc-900/60 px-4 pb-4 pt-8'>
      <Echo key={run} mood={mood} className='h-32' {...props} />
      <span className='text-xs text-zinc-400'>{note}</span>
    </button>
  );
};

const Listen = () => {
  const [signal, setSignal] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setSignal(Math.random() < 0.35 ? 0.5 + Math.random() * 0.5 : Math.random() * 0.3), 220);
    return () => clearInterval(t);
  }, []);
  return (
    <div className='flex flex-col items-center gap-3 rounded-lg bg-zinc-900/60 px-4 pb-4 pt-8'>
      <Echo mood='listen' signal={signal} className='h-32' />
      <span className='text-xs text-zinc-400'>listen · sygnał {signal.toFixed(2)}</span>
    </div>
  );
};

const LINES = ["Czysto! Tylko w 14. takcie lewa ręka się spieszyła.", "Cisza. Pięć minut wystarczy, żeby wrócić do rytmu.", "Tej strony tu nie ma. Wracamy na scenę?"];
const Speech = () => {
  const [i, setI] = useState(0);
  return (
    <button type='button' onClick={() => setI((n) => (n + 1) % LINES.length)} className='col-span-2 rounded-lg bg-zinc-900/60 p-6 text-left'>
      <EchoSays text={LINES[i]} key={i} echoClassName='h-32' />
      <span className='mt-3 block text-xs text-zinc-400'>EchoSays — klik: następne zdanie</span>
    </button>
  );
};

function EchoGallery() {
  if (process.env.NODE_ENV === "production") return null;
  return (
    <div className='min-h-screen bg-zinc-950 p-8'>
      <div className='mb-8 flex items-center gap-4'>
        <EchoFace className='h-8 w-8' />
        <EchoFace className='h-6 w-6' />
        <EchoFace className='h-6 w-6' active={false} asleep />
        <EchoFace className='h-4 w-4' />
        <span className='text-sm text-zinc-400'>EchoFace 32 / 24 / 24 (seria przerwana) / 16 px</span>
      </div>
      <div className='grid grid-cols-2 gap-6 md:grid-cols-4 xl:grid-cols-5'>
        {MOODS.map((m) => (
          <Tile key={m.note} {...m} />
        ))}
        <Listen />
        <Speech />
      </div>
    </div>
  );
}

export default dynamic(() => Promise.resolve(EchoGallery), { ssr: false });
