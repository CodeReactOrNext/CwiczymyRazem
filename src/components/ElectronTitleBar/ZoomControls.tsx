import { useElectronZoom } from "hooks/useElectronZoom";
import { useTranslation } from "hooks/useTranslation";
import { Minus, Plus } from "lucide-react";

const ZoomButton = ({
  onClick,
  label,
  children,
}: {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) => (
  <button
    type='button'
    onClick={onClick}
    aria-label={label}
    title={label}
    className='flex h-7 w-7 items-center justify-center rounded-full text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-zinc-100'>
    {children}
  </button>
);

/**
 * Zoom out / current zoom / zoom in for the desktop window. The percentage is
 * itself the reset button. Renders nothing where the desktop build has no
 * zoom bridge (older installs, the web).
 */
export const ZoomControls = () => {
  const { t } = useTranslation("desktop");
  const { canZoom, zoom, zoomIn, zoomOut, resetZoom } = useElectronZoom();

  if (!canZoom) return null;

  return (
    <div className='flex h-7 items-center rounded-full bg-zinc-900'>
      <ZoomButton label={t("zoom_out")} onClick={zoomOut}>
        <Minus size={14} strokeWidth={2} />
      </ZoomButton>
      <button
        type='button'
        onClick={resetZoom}
        aria-label={t("reset_zoom")}
        title={t("reset_zoom")}
        className='h-7 min-w-[2.75rem] rounded-full px-1 text-xs font-medium tabular-nums text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-zinc-100'>
        {Math.round(zoom * 100)}%
      </button>
      <ZoomButton label={t("zoom_in")} onClick={zoomIn}>
        <Plus size={14} strokeWidth={2} />
      </ZoomButton>
    </div>
  );
};
