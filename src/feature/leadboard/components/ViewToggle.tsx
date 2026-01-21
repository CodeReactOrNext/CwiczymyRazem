import { cn } from "assets/lib/utils";
import Link from "next/link";
import { useTranslation } from "hooks/useTranslation";

interface ViewToggleProps {
  isSeasonalView: boolean;
  isLoading?: boolean;
}

const ViewToggle = ({
  isSeasonalView,
  isLoading,
}: ViewToggleProps) => {
  const { t } = useTranslation("leadboard");

  return (
    <div className='flex items-center gap-2'>
      <div className='flex p-1 gap-1 rounded-xl bg-zinc-950/50'>
        <Link
          href="/leaderboard/global"
          className={cn(
            "px-4 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all",
            !isSeasonalView 
              ? "bg-white text-black shadow-lg" 
              : "text-zinc-500 hover:text-zinc-300"
          )}
        >
          {t("global_leaderboard")}
        </Link>
        <Link
          href="/leaderboard/seasonal"
          className={cn(
            "px-4 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all",
            isSeasonalView 
              ? "bg-cyan-500 text-black shadow-lg" 
              : "text-zinc-500 hover:text-zinc-300"
          )}
        >
          {t("seasonal_leaderboard")}
        </Link>
      </div>
    </div>
  );
};

export default ViewToggle;
