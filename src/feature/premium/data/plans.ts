import { exercisesAgregat } from "feature/exercisePlan/data/exercisesAgregat";
import { defaultPlans } from "feature/exercisePlan/data/plansAgregat";

export interface PlanFeature {
  label: string;
  pro: boolean;
  master: boolean;
}

/** Single source of truth for what each membership unlocks — the upgrade screen
 *  and the wiki's plan comparison both read from here so they can't drift apart. */
export const PLAN_FEATURES: PlanFeature[] = [
  { label: "Practice Plan Creator", pro: true, master: true },
  { label: "Guitar Pro File Support", pro: true, master: true },
  { label: `${exercisesAgregat.length}+ Exercises to Practice`, pro: true, master: true },
  { label: `${defaultPlans.length} Ready-made Practice Plans`, pro: true, master: true },
  { label: "Auto Practice Generator", pro: false, master: true },
  { label: "AI-guided Practice Sessions", pro: false, master: true },
  { label: "Skill Roadmaps", pro: false, master: true },
  { label: "Daily Practice Insights", pro: false, master: true },
  { label: "Weekly Progress Summary", pro: false, master: true },
  { label: "Goal-based Analytics", pro: false, master: true },
];

export const PLAN_PRICING = {
  pro: { monthly: "€1.99", yearly: "€19.99" },
  master: { monthly: "€3.99", yearly: "€39.99" },
};

/** Length of the free trial offered on checkout, in days. */
export const PLAN_TRIAL_DAYS = 7;
