import { useQuery } from "@tanstack/react-query";
import { DESKTOP_APP_RELEASES_URL } from "constants/desktopApp";
import { useDesktopAppVersion } from "hooks/useDesktopAppVersion";
import { useTranslation } from "hooks/useTranslation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { ElectronUpdaterState } from "types/electronApp";
import type { DesktopLatestRelease } from "utils/desktopRelease";
import { isDesktopPlatform } from "utils/desktopRelease";

import { decideDesktopUpdatePrompt, LEGACY_UPDATER_GRACE_MS } from "./desktopUpdatePrompt";

const TOAST_ID = "desktop-update";

const fetchLatestDesktopRelease = async (): Promise<DesktopLatestRelease> => {
  const response = await fetch("/api/desktop/latest-release");
  if (!response.ok) throw new Error(`latest-release: HTTP ${response.status}`);
  return response.json();
};

/**
 * Keeps the desktop shell from silently falling behind.
 *
 * The shell updates itself (electron/updater.js), but that has failed quietly
 * before — Squirrel.Mac rejecting every ad-hoc signed build, a version bumped
 * but never released — and a shell can't report a problem it doesn't know it
 * has. So the web bundle, which is always current, also compares the installed
 * version against the published feed and, whenever the shell can't or
 * apparently didn't update itself, offers the installer by hand.
 * No-op on the web build.
 */
export const useDesktopUpdatePrompt = () => {
  const { t } = useTranslation("toast");
  const installedVersion = useDesktopAppVersion();
  const [updaterState, setUpdaterState] = useState<ElectronUpdaterState | null>(null);
  const [legacyUpdateReady, setLegacyUpdateReady] = useState(false);
  const [graceElapsed, setGraceElapsed] = useState(false);

  const { data: latest } = useQuery({
    queryKey: ["desktop", "latest-release"],
    queryFn: fetchLatestDesktopRelease,
    enabled: Boolean(installedVersion),
    staleTime: 30 * 60 * 1000,
    // The app can sit in the tray for weeks.
    refetchInterval: 4 * 60 * 60 * 1000,
    retry: 1,
  });

  useEffect(() => {
    const api = window.electronApp;
    if (!api) return undefined;
    let cancelled = false;

    if (api.onUpdaterState && api.getUpdaterState) {
      const unsubscribe = api.onUpdaterState(setUpdaterState);
      api
        .getUpdaterState()
        .then((state) => {
          if (!cancelled && state) setUpdaterState(state);
        })
        .catch(() => {});
      return () => {
        cancelled = true;
        unsubscribe();
      };
    }

    // Shells before 0.2.0: only "an update is downloaded" is observable. The
    // event fires once; a remount long after it re-asks for the pending update.
    const unsubscribe = api.onUpdateReady(() => setLegacyUpdateReady(true));
    api
      .getUpdateStatus()
      .then((status) => {
        if (!cancelled && status) setLegacyUpdateReady(true);
      })
      .catch(() => {});
    const graceTimer = window.setTimeout(() => setGraceElapsed(true), LEGACY_UPDATER_GRACE_MS);
    return () => {
      cancelled = true;
      unsubscribe();
      window.clearTimeout(graceTimer);
    };
  }, []);

  const rawPlatform = typeof window === "undefined" ? undefined : window.electronWindow?.platform;
  const platformRelease = isDesktopPlatform(rawPlatform) ? latest?.[rawPlatform] : undefined;
  const latestVersion = platformRelease?.version ?? null;

  const prompt = installedVersion
    ? decideDesktopUpdatePrompt({
        installedVersion,
        latestVersion,
        platform: rawPlatform,
        updaterState,
        legacyUpdateReady,
        elapsedMs: graceElapsed ? LEGACY_UPDATER_GRACE_MS : 0,
      })
    : "none";
  const promptVersion = latestVersion ?? updaterState?.version ?? "";
  const downloadUrl =
    platformRelease?.downloadUrl ?? updaterState?.manualDownloadUrl ?? DESKTOP_APP_RELEASES_URL;

  useEffect(() => {
    const api = window.electronApp;
    if (!api) return;
    if (prompt === "restart") {
      toast.info(t("info.update_ready"), {
        id: TOAST_ID,
        duration: Infinity,
        action: {
          label: t("info.update_ready_action"),
          onClick: () => {
            api.installUpdate().catch(() => {});
          },
        },
      });
    } else if (prompt === "download") {
      toast.info(t("info.update_available", { version: promptVersion }), {
        id: TOAST_ID,
        description: t("info.update_available_description"),
        duration: Infinity,
        action: {
          label: t("info.update_available_action"),
          // The shell sends window.open to the OS browser (setWindowOpenHandler).
          onClick: () => window.open(downloadUrl, "_blank", "noopener"),
        },
      });
    } else {
      toast.dismiss(TOAST_ID);
    }
  }, [prompt, promptVersion, downloadUrl, t]);
};
