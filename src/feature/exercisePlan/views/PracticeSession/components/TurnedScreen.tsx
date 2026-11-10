import { cn } from "assets/lib/utils";
import type { ReactNode } from "react";

import { QUARTER_TURN_STYLE } from "./tablatureDirection";

interface TurnedScreenProps {
  /** Lay the screen on its side — the upright phone, where the practice screen is too. */
  turned: boolean;
  className?: string;
  children: ReactNode;
}

/**
 * A full-screen scroller that can be laid on its side, the way the phone's
 * practice screen is on an upright phone (`QUARTER_TURN_STYLE`). What follows
 * that screen — the session summary — is read with the phone still held
 * sideways, so it turns with it instead of standing upright again.
 *
 * Turned, it carries `sideways-screen`, which switches the `shortwide:` layouts
 * on inside it: the viewport is still the upright phone and no media query can
 * tell. Sized in dynamic viewport units rather than measured, so it is right on
 * the first frame; the safe-area insets move to the edges they end up on.
 */
export const TurnedScreen = ({ turned, className, children }: TurnedScreenProps) => {
  if (!turned) {
    return <div className={cn("fixed inset-0 overflow-y-auto", className)}>{children}</div>;
  }
  return (
    <div className={cn("fixed inset-0 overflow-hidden", className)}>
      <div
        className='sideways-screen absolute left-0 top-0 overflow-y-auto overscroll-contain'
        style={{
          ...QUARTER_TURN_STYLE,
          width: "100dvh",
          height: "100dvw",
          paddingLeft: "env(safe-area-inset-top, 0px)",
          paddingRight: "env(safe-area-inset-bottom, 0px)",
        }}>
        {children}
      </div>
    </div>
  );
};
