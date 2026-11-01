import type { PlanDemoProps } from "feature/landing/components/howItWorks/StepDemos";

/**
 * Step 01 of /how-it-works replays the Auto Plan: 30 minutes, two cells of the
 * focus grid ticked, and a plan of real exercises from those cells. Kept apart
 * from howItWorksStats so the page component does not import the catalogue.
 */
export const PLAN_DEMO_PICKS: PlanDemoProps["picks"] = [
  { category: "technique", difficulty: "medium" },
  { category: "theory", difficulty: "hard" },
];
