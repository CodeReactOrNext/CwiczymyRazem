"use client";

import { Button } from "assets/components/ui/button";
import { useTranslation } from "hooks/useTranslation";
import { Cookie } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

/**
 * On a phone the note is a low strip along the bottom edge: at the top it sat
 * on the hero's headline, the first thing a visitor from an ad reads. From sm
 * up it stays a small card in the top-right corner, clear of the headline.
 */
export const CookieBanner = () => {
  const { t } = useTranslation("common");
  // Only ever turned on from the effect, so the server render has no banner.
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");

    if (!consent) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookie-consent", "true");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  const content = (
    <div className='fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom,0px)+0.75rem)] z-[2147483647] duration-slow animate-in fade-in slide-in-from-bottom-3 sm:inset-x-auto sm:bottom-auto sm:right-6 sm:top-6 sm:w-[280px] sm:slide-in-from-bottom-0 sm:slide-in-from-right-5'>
      <div className='flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900 p-3 sm:flex-col sm:items-stretch sm:p-4'>
        <div className='flex min-w-0 flex-1 items-start gap-3'>
          <Cookie className='mt-0.5 hidden h-4 w-4 shrink-0 text-zinc-400 sm:block' />
          <p className='text-[11px] leading-relaxed text-zinc-400'>
            {t("cookies.description") as string}
          </p>
        </div>
        <Button
          onClick={handleAccept}
          size='sm'
          className='h-8 shrink-0 px-4 text-[11px] font-bold sm:w-full'>
          {t("cookies.accept") as string}
        </Button>
      </div>
    </div>
  );

  const overlaysElement =
    typeof document !== "undefined"
      ? document.getElementById("overlays")
      : null;
  return overlaysElement ? createPortal(content, overlaysElement) : null;
};
