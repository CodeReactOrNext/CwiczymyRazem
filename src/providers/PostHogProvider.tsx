import { useRouter } from "next/router";
import posthog from "posthog-js";
import { useEffect } from "react";

export function PostHogProvider() {
  const router = useRouter();

  useEffect(() => {
    const init = () => {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
        // Analytics goes straight to PostHog rather than through a /ingest rewrite on
        // our own domain. The proxy only bought resistance to ad blockers, and it made
        // every event from every browser an edge request — and therefore a billed
        // observability event — on Vercel.
        api_host: "https://eu.i.posthog.com",
        ui_host: "https://eu.posthog.com",
        capture_exceptions: false,
        debug: process.env.NODE_ENV === "development",
        person_profiles: "identified_only",
        capture_pageview: false,
      });
      // Electron loads riff.quest itself, and its user agent parses as plain Chrome,
      // so without this super property desktop traffic is indistinguishable from web.
      const desktopVersion = window.electronApp?.appVersion;
      posthog.register({
        platform: window.electronWindow ? "desktop" : "web",
        ...(desktopVersion ? { desktop_version: desktopVersion } : {}),
      });
      posthog.capture("$pageview");
    };

    if ("requestIdleCallback" in window) {
      (window as Window & typeof globalThis & { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(init);
    } else {
      setTimeout(init, 1000);
    }
  }, []);

  useEffect(() => {
    const handleRouteComplete = () => posthog.capture("$pageview");
    router.events.on("routeChangeComplete", handleRouteComplete);
    return () => router.events.off("routeChangeComplete", handleRouteComplete);
  }, [router.events]);

  return null;
}
