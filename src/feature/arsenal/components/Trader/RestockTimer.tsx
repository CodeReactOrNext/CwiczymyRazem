import { useTranslation } from "hooks/useTranslation";
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

/**
 * Counts down to the next restock, as one quiet line beside the shelf's
 * heading. It is the reason to come back tomorrow, not something to act on
 * now, so it has no box, no icon and no weight of its own.
 */
export const RestockTimer = ({ restockAt }: RestockTimerProps) => {
  const [left, setLeft] = useState(() => restockAt - Date.now());
  const { t } = useTranslation("arsenal");

  useEffect(() => {
    const id = setInterval(() => setLeft(restockAt - Date.now()), 1000);
    return () => clearInterval(id);
  }, [restockAt]);

  return (
    <p className='text-sm text-zinc-500'>
      {t("trader.restocks_in")}{" "}
      {/* Server and client read their own clocks a moment apart — the first
          paint is allowed to disagree, the interval settles it a second later. */}
      <span
        suppressHydrationWarning
        className='font-semibold tabular-nums text-zinc-300'>
        {format(left)}
      </span>
    </p>
  );
};
