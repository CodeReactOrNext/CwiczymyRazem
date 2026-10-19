import { PluginLibrary } from "feature/toneStudio/components/vst/PluginLibrary";
import { RackFlow } from "feature/toneStudio/components/vst/RackFlow";
import { useVstHost } from "feature/toneStudio/hooks/useVstHost";
import { useTranslation } from "hooks/useTranslation";
import { X } from "lucide-react";
import { useMemo, useRef } from "react";

/**
 * Tone Studio's VST mode: the player's own rack of VST3 plugins in place of
 * the built-in chain. Two parts, top to bottom in the order you use them —
 * the rack you play through, then the library you fill it from.
 */
export const VstRackView = () => {
  const { t } = useTranslation("tone_studio");
  const vst = useVstHost();
  const searchRef = useRef<HTMLInputElement>(null);
  const libraryRef = useRef<HTMLDivElement>(null);

  const slots = useMemo(() => vst.rack?.slots ?? [], [vst.rack]);
  const inRack = useMemo(() => {
    const counts = new Map<string, number>();
    for (const s of slots)
      counts.set(s.pluginId, (counts.get(s.pluginId) ?? 0) + 1);
    return counts;
  }, [slots]);
  const playing = slots.filter((s) => !s.bypass && s.status === "ready").length;

  const goToLibrary = () => {
    libraryRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    // Search only exists once there is a library to search.
    window.setTimeout(
      () => searchRef.current?.focus({ preventScroll: true }),
      250,
    );
  };

  if (vst.rack && !vst.rack.supported) {
    return (
      <p className='m-3 rounded-lg bg-amber-500/10 px-4 py-3 text-sm text-amber-400'>
        {vst.rack.error ?? t("rack_vst.unsupported")}
      </p>
    );
  }

  return (
    <div className='flex flex-col gap-4 px-3 pb-4 pt-3'>
      {vst.actionError && (
        <div className='flex items-start gap-3 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400'>
          <span className='min-w-0 flex-1'>{vst.actionError}</span>
          <button
            type='button'
            onClick={vst.dismissError}
            aria-label={t("rack_vst.dismiss")}
            className='rounded p-0.5 text-red-400/70 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-400 hover:text-red-300'>
            <X size={14} />
          </button>
        </div>
      )}

      <section className='flex flex-col gap-4 rounded-lg bg-zinc-950/40 p-4 sm:p-5'>
        <header className='flex flex-wrap items-baseline gap-x-4 gap-y-1'>
          <h3 className='font-display text-base font-semibold text-zinc-100'>
            {t("rack_vst.title")}
          </h3>
          {slots.length > 0 && (
            <span className='text-xs text-zinc-500'>
              {t("rack_vst.summary", { playing, total: slots.length })}
              {vst.rack &&
                vst.rack.latencyMs > 0.05 &&
                ` · ${t("rack_vst.total_latency", { ms: vst.rack.latencyMs.toFixed(1) })}`}
            </span>
          )}
        </header>
        <RackFlow
          slots={slots}
          openingSlotId={vst.openingSlotId}
          onOpen={vst.openEditor}
          onToggleBypass={(slot) => vst.setBypass(slot.id, !slot.bypass)}
          onMove={vst.moveInRack}
          onRemove={vst.removeFromRack}
          onAdd={goToLibrary}
        />
      </section>

      <div ref={libraryRef} className='scroll-mt-4'>
        <PluginLibrary
          inRack={inRack}
          onAdd={(pluginId) => vst.addToRack(pluginId)}
          searchRef={searchRef}
        />
      </div>
    </div>
  );
};
