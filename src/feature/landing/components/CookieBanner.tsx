"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "assets/components/ui/button";
import { useTranslation } from "react-i18next";
import { Cookie } from "lucide-react";


export const CookieBanner = () => {
  const { t } = useTranslation("common");
  const [isVisible, setIsVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const consent = localStorage.getItem("cookie-consent");

    if (!consent) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookie-consent", "true");
    setIsVisible(false);
  };

  if (!mounted) return null;

  const content = (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          style={{ 
            position: "fixed", 
            top: "1.5rem", 
            right: "1.5rem",
            width: "280px",
            zIndex: 2147483647
          }}
        >
          <div className="rounded-lg border border-white/10 bg-zinc-900 shadow-2xl p-4 backdrop-blur-md">
            <div className="flex items-start gap-3 mb-3">
              <Cookie className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                {t("common:cookies.description") as string}
              </p>
            </div>
            <Button
              onClick={handleAccept}
              size="sm"
              className="w-full h-8 bg-cyan-500 hover:bg-cyan-600 text-black font-bold text-[11px] transition-all"
            >
              {t("common:cookies.accept") as string}
            </Button>
          </div>

        </motion.div>
      )}
    </AnimatePresence>
  );

  const overlaysElement = typeof document !== 'undefined' ? document.getElementById("overlays") : null;
  return overlaysElement ? createPortal(content, overlaysElement) : null;
};



