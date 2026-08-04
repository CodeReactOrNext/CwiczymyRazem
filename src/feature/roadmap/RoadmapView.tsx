import { FundingProgressBar } from "./components/FundingProgressBar";
import { FundingProgressBarSkeleton } from "./components/FundingProgressBarSkeleton";
import { RoadmapFaq } from "./components/RoadmapFaq";
import { RoadmapHowItWorks } from "./components/RoadmapHowItWorks";
import { RoadmapPitch } from "./components/RoadmapPitch";
import { RoadmapThanks } from "./components/RoadmapThanks";
import { ROADMAP_RAISED_OFFSET } from "./data/roadmap.data";
import { useBuyMeACoffeeFunding } from "./hooks/useBuyMeACoffeeFunding";

export const RoadmapView = () => {
  const { totalRaised: rawTotalRaised, raisedThisMonth, isLoading } = useBuyMeACoffeeFunding();
  // Tiers count from $0 again as of the reset — the real lifetime total
  // (used for accounting) is untouched, only what drives the ladder here.
  const totalRaised = Math.max(0, rawTotalRaised - ROADMAP_RAISED_OFFSET);

  return (
    <div className='w-full space-y-8 p-4 sm:p-6'>
      {/* Why support — three single-row banners, each its own accent: cost
          (orange), how it works (cyan), no-strings thanks (purple). First
          thing on the page. */}
      <div className='w-full space-y-4'>
        <RoadmapPitch
          totalRaised={totalRaised}
          raisedThisMonth={raisedThisMonth}
        />
        <RoadmapHowItWorks />
        <RoadmapThanks />
      </div>

      {/* Funding bar — full width, tiers described inline in tooltip boxes */}
      {isLoading ? (
        <FundingProgressBarSkeleton />
      ) : (
        <FundingProgressBar totalRaised={totalRaised} />
      )}

      <div className='mx-auto w-full max-w-4xl'>
        <RoadmapFaq />
      </div>
    </div>
  );
};
