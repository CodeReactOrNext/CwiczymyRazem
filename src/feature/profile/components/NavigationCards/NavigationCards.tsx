import { ArrowRight, Clock,Loader2 } from "lucide-react";
import { useRouter } from "next/router";
import { useState } from "react";

export const NavigationCards = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    await router.push("/timer");
  };

  return (
    <div
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && handleClick()}
      className="light-card relative cursor-pointer overflow-hidden rounded-lg bg-zinc-800/40 px-6 py-5 transition-colors duration-base hover:bg-zinc-800/60">
      {/* Subtle glow */}
      <div className="light-hide absolute inset-0 rounded-lg bg-gradient-to-r from-white/5 via-white/10 to-white/5 pointer-events-none" />

      <div className="relative z-10 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-white/20">
            {loading ? (
              <Loader2 className="h-5 w-5 text-white animate-spin" />
            ) : (
              <Clock className="h-5 w-5 text-white" />
            )}
          </div>
          <div>
            <p className="text-base font-bold text-white">Practice</p>
            <p className="text-sm text-white/60">Choose your mode and begin today&apos;s session</p>
          </div>
        </div>
        <ArrowRight className="h-5 w-5 flex-shrink-0 text-white/70 transition-transform duration-base group-hover:translate-x-1" />
      </div>
    </div>
  );
};
