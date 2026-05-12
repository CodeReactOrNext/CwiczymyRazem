import { useRouter } from "next/router";
import { useEffect } from "react";
import posthog from "posthog-js";

export function PostHogProvider() {
  const router = useRouter();

  useEffect(() => {
    const init = () => {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
        api_host: "/ingest",
        ui_host: "https://eu.posthog.com",
        capture_exceptions: false,
        debug: process.env.NODE_ENV === "development",
        person_profiles: "identified_only",
        capture_pageview: false,
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
