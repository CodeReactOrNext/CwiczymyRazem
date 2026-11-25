import styles from "feature/liveMotivate/components/LiveMotivate.module.css";
import type { CSSProperties } from "react";
import { useMemo } from "react";

/** A repeatable 0–1 scatter, so every coin of a burst lands somewhere different without randomness in render. */
const scatter = (i: number, salt: number) => {
  const x = Math.sin((i + 1) * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

interface CoinBurstProps {
  /** How many coins fly out. */
  count: number;
  /** How far apart the outermost coins land, in px. */
  spread: number;
}

/** A fan of coins thrown up out of the middle of its parent, which must be positioned. */
export const CoinBurst = ({ count, spread }: CoinBurstProps) => {
  const coins = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const along = count > 1 ? i / (count - 1) - 0.5 : 0;
        return {
          "--dx": `${Math.round(along * spread + (scatter(i, 1) * 20 - 10))}px`,
          "--peak": `${-Math.round(50 + scatter(i, 2) * 50)}px`,
          "--fall": `${Math.round(10 + scatter(i, 3) * 40)}px`,
          "--spin": `${Math.round(scatter(i, 4) * 540 - 270)}deg`,
          "--size": (0.7 + scatter(i, 5) * 0.5).toFixed(2),
          "--delay": `${i * 25}ms`,
        } as CSSProperties;
      }),
    [count, spread],
  );

  return (
    <span aria-hidden className={styles.burst}>
      {coins.map((style, i) => (
        <img key={i} src='/images/tokens/coin.png' alt='' className={styles.coin} style={style} />
      ))}
    </span>
  );
};
