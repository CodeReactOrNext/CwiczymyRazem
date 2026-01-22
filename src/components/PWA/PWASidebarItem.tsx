import { usePWAInstall } from "hooks/usePWAInstall";
import { Download, Laptop,Share } from "lucide-react";
import { useEffect, useState } from "react";

export const PWASidebarItem = () => {
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
        <div className="mt-4 px-2 pb-4">
            <div className="py-2 border-t border-white/10">
                <div className="flex items-center gap-2 px-3 py-2 text-zinc-400">
                    {isDesktop ? <Laptop size={14} /> : <Download size={14} />}
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">
                        {isDesktop ? "Desktop App" : "App"}
                    </span>
                </div>
                
                <div className="px-3">
                    {isIOS ? (
                        <div className="space-y-2">
                            <p className="text-[10px] text-zinc-500 leading-normal">
                                Use <span className="text-white font-semibold">Safari browser</span>, tap Share and then 'Add to Home Screen'
                            </p>
                            <div className="flex items-center gap-2 text-[10px] text-main font-bold">
                                <Share size={12} />
                                <span>Add to Home Screen</span>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={handleInstall}
                            className="w-full py-2 px-3 rounded-lg bg-main hover:opacity-90 text-white text-[10px] font-black uppercase tracking-tight transition-all shadow-[0_0_15px_rgba(var(--main),0.2)] text-center"
                        >
                            {isDesktop ? "Install on Desktop" : "Download App"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
