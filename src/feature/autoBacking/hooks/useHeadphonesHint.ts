import { useTranslation } from "hooks/useTranslation";
import { useEffect } from "react";
import { toast } from "sonner";

import { useAutoBackingStore } from "../store/autoBackingStore";

/**
 * The backing is on by default, so the first time it plays while the mic is
 * listening the player is told, once, what that means: through speakers the
 * mic hears the band as if they were playing it. The note offers to switch
 * the backing off on the spot.
 */
export function useHeadphonesHint(active: boolean) {
  const { t } = useTranslation("session");
  const shown = useAutoBackingStore((state) => state.headphonesHintShown);
  const markShown = useAutoBackingStore(
    (state) => state.markHeadphonesHintShown,
  );
  const setEnabled = useAutoBackingStore((state) => state.setEnabled);

  useEffect(() => {
    if (!active || shown) return;
    markShown();
    toast.info(
      t("auto_backing.headphones_toast.title", "The backing track is on"),
      {
        id: "auto-backing-headphones",
        description: t(
          "auto_backing.headphones_toast.body",
          "With the mic on, wear headphones — otherwise the mic hears the band as your playing. You can change it any time in the Volume menu.",
        ),
        duration: 12000,
        action: {
          label: t("auto_backing.headphones_toast.off", "Turn it off"),
          onClick: () => setEnabled(false),
        },
      },
    );
  }, [active, shown, markShown, setEnabled, t]);
}
