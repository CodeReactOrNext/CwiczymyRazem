import { Timer } from "lucide-react";
import { useEffect, useState } from "react";

interface RestockTimerProps {
  /** Epoch ms the current stock is replaced. */
  restockAt: number;
}

const pad = (value: number) => String(value).padStart(2, "0");

const format = (msLeft: number): string => {
  const total = Math.max(0, Math.floor(msLeft / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
};

/** Counts down to the next restock. The whole point of coming back tomorrow. */
export const RestockTimer = ({ restockAt }: RestockTimerProps) => {
  const [left, setLeft] = useState(() => restockAt - Date.now());

  useEffect(() => {
    const id = setInterval(() => setLeft(restockAt - Date.now()), 1000);
    return () => clearInterval(id);
  }, [restockAt]);

  return (
    <div className='flex items-center gap-2.5 rounded-lg bg-zinc-800/40 px-4 py-2.5'>
      <Timer size={16} className='text-cyan-400' />
      <span className='text-xs font-semibold text-zinc-400'>Restocks in</span>
      {/* Server and client read their own clocks a moment apart — the first
          paint is allowed to disagree, the interval settles it a second later. */}
      <span
        suppressHydrationWarning
        className='text-lg font-black tabular-nums text-white'>
        {format(left)}
      </span>
    </div>
  );
};
