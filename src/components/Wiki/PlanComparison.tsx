import {
  PLAN_FEATURES,
  PLAN_PRICING,
  PLAN_TRIAL_DAYS,
} from "feature/premium/data/plans";
import { Check, Minus } from "lucide-react";

const PLANS = [
  { key: "free", name: "Free", short: "Free", price: "€0", accent: "text-zinc-300" },
  {
    key: "pro",
    name: "Practice Pro",
    short: "Pro",
    price: PLAN_PRICING.pro.monthly,
    accent: "text-orange-400",
  },
  {
    key: "master",
    name: "Practice Master",
    short: "Master",
    price: PLAN_PRICING.master.monthly,
    accent: "text-amber-400",
  },
] as const;

const hasFeature = (
  plan: (typeof PLANS)[number]["key"],
  feature: (typeof PLAN_FEATURES)[number]
) => (plan === "free" ? false : plan === "pro" ? feature.pro : feature.master);

/**
 * What each membership unlocks, straight from the same list the upgrade screen
 * uses — so the wiki can never promise something the checkout doesn't give you.
 */
export const PlanComparison = () => (
  <div className='not-prose my-10 flex flex-col gap-4'>
    <div className='grid gap-4 sm:grid-cols-3'>
      {PLANS.map((plan) => (
        <div key={plan.key} className='rounded-lg bg-zinc-900/40 p-5'>
          <p className={`text-sm font-bold ${plan.accent}`}>{plan.name}</p>
          <p className='mt-2 text-2xl font-bold text-white'>
            {plan.price}
            <span className='ml-1 text-sm font-medium text-zinc-500'>/month</span>
          </p>
          <p className='mt-2 text-xs leading-relaxed text-zinc-500'>
            {plan.key === "free"
              ? "Practising, logging, songs, seasons and Arsenal — free forever"
              : `Includes a ${PLAN_TRIAL_DAYS}-day free trial`}
          </p>
        </div>
      ))}
    </div>

    <div className='rounded-lg bg-zinc-900/40 p-5 sm:p-6'>
      <div className='flex items-center gap-4 pb-3'>
        <span className='flex-1' />
        {PLANS.map((plan) => (
          <span
            key={plan.key}
            className={`w-14 text-center text-[11px] font-bold ${plan.accent}`}>
            {plan.short}
          </span>
        ))}
      </div>
      <div className='flex flex-col gap-3'>
        {PLAN_FEATURES.map((feature) => (
          <div key={feature.label} className='flex items-center gap-4'>
            <span className='flex-1 text-sm text-zinc-300'>{feature.label}</span>
            {PLANS.map((plan) => (
              <span key={plan.key} className='flex w-14 justify-center'>
                {hasFeature(plan.key, feature) ? (
                  <Check
                    className='h-4 w-4 text-emerald-400'
                    aria-label={`Included in ${plan.name}`}
                  />
                ) : (
                  <Minus
                    className='h-4 w-4 text-zinc-600'
                    aria-label={`Not in ${plan.name}`}
                  />
                )}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  </div>
);
