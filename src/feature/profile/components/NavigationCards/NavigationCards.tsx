import { ArrowRight, Loader2 } from "lucide-react";
import { useRouter } from "next/router";
import { useState } from "react";
import { FaClock } from "react-icons/fa";

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
      className="relative cursor-pointer overflow-hidden rounded-xl border border-white/20 bg-white/10 px-6 py-5 shadow-lg backdrop-blur-sm transition-all duration-300 hover:bg-white/15 hover:shadow-xl hover:border-white/30 active:scale-[0.99]">
      {/* Subtle glow */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/5 via-white/10 to-white/5 pointer-events-none" />

      <div className="relative z-10 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-white/20">
            {loading ? (
              <Loader2 className="h-5 w-5 text-white animate-spin" />
            ) : (
              <FaClock className="h-5 w-5 text-white" />
            )}
          </div>
          <div>
            <p className="text-base font-bold text-white">Start Practice</p>
            <p className="text-sm text-white/60">Choose your mode and begin today's session</p>
          </div>
        </div>
        <ArrowRight className="h-5 w-5 flex-shrink-0 text-white/70 transition-transform duration-300 group-hover:translate-x-1" />
      </div>
    </div>
  );
};
