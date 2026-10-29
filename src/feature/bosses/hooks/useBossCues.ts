import { useEffect } from "react";

import { bossCuePlayer } from "../audio/bossCuePlayer";
import { cueEvents } from "../audio/cueEvents";
import { useBossFightStore } from "../store/bossFightStore";
import { useBossSoundStore } from "../store/bossSoundStore";

/**
 * Turns the fight into sound: every change of the store is read for a cue —
 * from the store's own subscription, not from renders, so none is lost when
 * notes come ten a second. Mount it once per session (the fight's overlay).
 */
export const useBossCues = () => {
  const enabled = useBossSoundStore((s) => s.enabled);
  useEffect(() => {
    bossCuePlayer.setEnabled(enabled);
  }, [enabled]);

  useEffect(
    () =>
      useBossFightStore.subscribe((state, previous) => {
        if (state.fight === previous.fight) return;
        for (const event of cueEvents(state.fight, previous.fight)) bossCuePlayer.play(event);
      }),
    [],
  );
};
