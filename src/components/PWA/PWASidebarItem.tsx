import { Download, Share, Laptop } from "lucide-react";
import { useTranslation } from "next-i18next";
import { usePWAInstall } from "hooks/usePWAInstall";
import { useEffect, useState } from "react";

export const PWASidebarItem = () => {
    const { t } = useTranslation("common");
    const { showPrompt, isIOS, handleInstall } = usePWAInstall();
    const [isDesktop, setIsDesktop] = useState(false);

    useEffect(() => {
        const checkDesktop = () => {
            setIsDesktop(window.innerWidth >= 1024);
        };
        checkDesktop();
        window.addEventListener('resize', checkDesktop);
        return () => window.removeEventListener('resize', checkDesktop);
    }, []);

    if (!showPrompt) return null;

    return (
        <div className="mt-4 px-2">
            <div className="py-2 border-t border-white/10">
                <div className="flex items-center gap-2 px-3 py-2 text-zinc-400">
                    {isDesktop ? <Laptop size={14} /> : <Download size={14} />}
                    <span className="text-xs font-medium uppercase tracking-wider opacity-60">
                        {isDesktop ? "Desktop App" : "App"}
                    </span>
                </div>
                
                <div className="px-3">
                    {isIOS ? (
                        <div className="space-y-2">
                            <p className="text-[10px] text-zinc-500 leading-normal">
                                {t("pwa.install_description_ios")}
                            </p>
                            <div className="flex items-center gap-2 text-[10px] text-cyan-500/80 font-medium">
                                <Share size={12} />
                                <span>Dodaj do ekranu początkowego</span>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={handleInstall}
                            className="w-full py-2 px-3 rounded-lg bg-white/5 hover:bg-white/10 text-white text-[10px] font-bold transition-colors border border-white/10 text-center"
                        >
                            {isDesktop ? "Zainstaluj na komputerze" : t("pwa.install_button")}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
