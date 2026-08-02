import { FundingProgressBar } from "./components/FundingProgressBar";
import { FundingProgressBarSkeleton } from "./components/FundingProgressBarSkeleton";
import { RoadmapFaq } from "./components/RoadmapFaq";
import { RoadmapHowItWorks } from "./components/RoadmapHowItWorks";
import { RoadmapPitch } from "./components/RoadmapPitch";
import { RoadmapThanks } from "./components/RoadmapThanks";
import { useBuyMeACoffeeFunding } from "./hooks/useBuyMeACoffeeFunding";

export const RoadmapView = () => {
  const { totalRaised, raisedThisMonth, isLoading } = useBuyMeACoffeeFunding();

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
