import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

// Store the event globally in case it fires before the hook mounts
let globalDeferredPrompt: any = null;
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    globalDeferredPrompt = e;
  });
}

export const usePWAInstall = () => {
  const { data: session } = useSession();
  const [isPromptAvailable, setIsPromptAvailable] = useState(!!globalDeferredPrompt);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as any).standalone
      || document.referrer.includes('android-app://');

    setIsStandalone(isStandaloneMode);

    const userAgent = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(ios);

    const handler = (e: any) => {
      e.preventDefault();
      globalDeferredPrompt = e;
      setIsPromptAvailable(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Check if it's already caught
    if (globalDeferredPrompt) {
      setIsPromptAvailable(true);
    }

    // For iOS, availability is based on the OS itself if not standalone
    if (ios && !isStandaloneMode) {
      setIsPromptAvailable(true);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (globalDeferredPrompt) {
      globalDeferredPrompt.prompt();
      const { outcome } = await globalDeferredPrompt.userChoice;
      if (outcome === "accepted") {
        globalDeferredPrompt = null;
        setIsPromptAvailable(false);
      }
    }
  };

  return {
    showPrompt: !!session && !isStandalone && isPromptAvailable,
    isIOS,
    handleInstall,
    isStandalone
  };
};
