import { cn } from "assets/lib/utils";
import { PAGE_CONTENT } from "components/PageShell/PageShell";

import { FundingProgressBar } from "./components/FundingProgressBar";
import { FundingProgressBarSkeleton } from "./components/FundingProgressBarSkeleton";
import { RoadmapFaq } from "./components/RoadmapFaq";
import { RoadmapHero } from "./components/RoadmapHero";
import { RoadmapPerks } from "./components/RoadmapPerks";
import { RoadmapThanks } from "./components/RoadmapThanks";
import { ROADMAP_RAISED_OFFSET } from "./data/roadmap.data";
import { useBuyMeACoffeeFunding } from "./hooks/useBuyMeACoffeeFunding";

export const RoadmapView = () => {
  const {
    totalRaised: rawTotalRaised,
    raisedThisMonth,
    isLoading,
  } = useBuyMeACoffeeFunding();
  // Tiers count from $0 again as of the reset — the real lifetime total
  // (used for accounting) is untouched, only what drives the ladder here.
  const totalRaised = Math.max(0, rawTotalRaised - ROADMAP_RAISED_OFFSET);

  return (
    <>
      {/* Pitch, status and the button live in the hero, so the page opens on
          the ask instead of on a stack of explanatory banners. */}
      <RoadmapHero
        totalRaised={totalRaised}
        raisedThisMonth={raisedThisMonth}
        isLoading={isLoading}
      />

      <div className={cn("w-full space-y-6", PAGE_CONTENT)}>
        {/* What the money builds comes first — it is the argument. */}
        {isLoading ? (
          <FundingProgressBarSkeleton />
        ) : (
          <FundingProgressBar totalRaised={totalRaised} />
        )}
        <RoadmapPerks />
        <RoadmapFaq />
        <RoadmapThanks />
      </div>
    </>
  );
};
