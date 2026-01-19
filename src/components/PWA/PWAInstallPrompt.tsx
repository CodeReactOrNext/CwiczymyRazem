import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { X, Download, Share } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "next-i18next";

export const PWAInstallPrompt = () => {
    const { t } = useTranslation("common");
    const { data: session } = useSession();
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        // Check if already installed or standalone
        const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches 
            || (window.navigator as any).standalone 
            || document.referrer.includes('android-app://');
        
        setIsStandalone(isStandaloneMode);

        // Detect iOS
        const userAgent = window.navigator.userAgent.toLowerCase();
        const ios = /iphone|ipad|ipod/.test(userAgent);
        setIsIOS(ios);

        // Handle Android/Chrome prompt
        const handler = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
            
            // Only show if not dismissed recently and logged in
            const dismissed = localStorage.getItem("pwa_prompt_dismissed");
            if (!dismissed && !isStandaloneMode) {
                setShowPrompt(true);
            }
        };

        window.addEventListener("beforeinstallprompt", handler);

        // For iOS, we show it manually if not standalone
        if (ios && !isStandaloneMode) {
            const dismissed = localStorage.getItem("pwa_prompt_dismissed");
            if (!dismissed) {
                setShowPrompt(true);
            }
        }

        return () => window.removeEventListener("beforeinstallprompt", handler);
    }, []);

    const handleInstall = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === "accepted") {
                setDeferredPrompt(null);
                setShowPrompt(false);
            }
        }
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        localStorage.setItem("pwa_prompt_dismissed", "true");
    };

    if (!session || isStandalone || !showPrompt) return null;

    return (
        <AnimatePresence>
            <motion.div 
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="fixed bottom-6 left-4 right-4 z-[100] md:max-w-md md:left-auto"
            >
                <div className="bg-zinc-900/95 border border-zinc-800 backdrop-blur-md p-4 rounded-2xl shadow-2xl flex items-center gap-4">
                    <div className="w-12 h-12 bg-cyan-500/10 rounded-xl flex items-center justify-center text-cyan-500 shrink-0">
                        <Download className="w-6 h-6" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-white">{t("pwa.install_title")}</h3>
                        <p className="text-xs text-zinc-400 truncate">
                            {isIOS 
                                ? t("pwa.install_description_ios") 
                                : t("pwa.install_description_android")}
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        {isIOS ? (
                            <div className="bg-white/10 p-2 rounded-lg">
                                <Share className="w-5 h-5 text-white" />
                            </div>
                        ) : (
                            <button 
                                onClick={handleInstall}
                                className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold py-2 px-4 rounded-lg transition-colors"
                            >
                                {t("pwa.install_button")}
                            </button>
                        )}
                        <button 
                            onClick={handleDismiss}
                            className="text-zinc-500 hover:text-white p-1"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};
