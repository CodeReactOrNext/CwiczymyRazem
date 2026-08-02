import { Button } from "assets/components/ui/button";
import { DESKTOP_APP_RELEASES_URL, MIN_DESKTOP_APP_VERSION } from "constants/desktopApp";
import { useDesktopAppVersion } from "hooks/useDesktopAppVersion";
import { Download } from "lucide-react";
import { isVersionBelow } from "utils/version";

/**
 * Full-app, non-dismissable block for desktop shells older than
 * MIN_DESKTOP_APP_VERSION — independent of this install's own
 * electron-updater ever having succeeded (see useUpdateRequiredGate, which
 * only fires once an update has actually been downloaded). This is the
 * fallback for when the shell's own update check is silently broken: the web
 * bundle is always current, so it's the one place that can reliably say "this
 * install is too old" and point at a manual download.
 * No-op on the web build, where window.electronApp is undefined.
 */
export const DesktopUpdateRequired = () => {
  const appVersion = useDesktopAppVersion();
  if (!appVersion || !isVersionBelow(appVersion, MIN_DESKTOP_APP_VERSION)) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-zinc-950 p-6">
      <div className="w-full max-w-md space-y-6 text-center">
        <h1 className="text-xl font-semibold text-zinc-100">Update required</h1>
        <p className="text-sm text-zinc-400">
          This desktop app (v{appVersion}) is too old to keep working with riff.quest. Download
          the latest version to continue.
        </p>
        <Button asChild size="lg">
          <a href={DESKTOP_APP_RELEASES_URL} target="_blank" rel="noreferrer">
            <Download className="mr-2 h-4 w-4" />
            Download latest version
          </a>
        </Button>
      </div>
    </div>
  );
};
