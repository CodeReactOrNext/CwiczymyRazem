import { FundingOverview } from "./components/FundingOverview";
import { FundingProgressBar } from "./components/FundingProgressBar";
import { RoadmapFaq } from "./components/RoadmapFaq";
import { RoadmapPitch } from "./components/RoadmapPitch";
import { useBuyMeACoffeeFunding } from "./hooks/useBuyMeACoffeeFunding";

export const RoadmapView = () => {
  const { totalRaised, supporters, raisedThisMonth } = useBuyMeACoffeeFunding();

  return (
    <div className='w-full space-y-8 p-4 sm:p-6'>
      {/* Funding bar — full width, tiers described inline in tooltip boxes */}
      <FundingProgressBar
        totalRaised={totalRaised}
        supporters={supporters}
        raisedThisMonth={raisedThisMonth}
      />

      {/* Why support + explanations */}
      <div className='mx-auto w-full max-w-4xl space-y-8'>
        <RoadmapPitch />
        <FundingOverview />
        <RoadmapFaq />
      </div>
    </div>
  );
};
