import { HealthHabbitsBoxProps } from "layouts/ReportFormLayout/components/HealthHabbitsBox/HealthHabbitsBox";
import { i18n } from "next-i18next";
export const healthHabbitsList: HealthHabbitsBoxProps[] = [
  {
    name: "exercise_plan",
    questionMarkProps: {
      description: i18n?.t("report:habits.exercise_plan.description"),
    },
    title: i18n?.t("report:habits.exercise_plan.title"),
  },
  {
    name: "new_things",
    questionMarkProps: {
      description: i18n?.t("report:habits.new_things.description"),
    },
    title: i18n?.t("report:habits.new_things.title"),
  },
  {
    name: "warmup",
    questionMarkProps: {
      description: i18n?.t("report:habits.warmup.description"),
    },
    title: i18n?.t("report:habits.warmup.title"),
  },
  {
    name: "metronome",
    questionMarkProps: {
      description: i18n?.t("report:habits.metronome.description"),
    },
    title: i18n?.t("report:habits.metronome.title"),
  },
  {
    name: "exercise_plan",
    questionMarkProps: {
      description: i18n?.t("report:habits.exercise_plan.description"),
    },
    title: i18n?.t("report:habits.exercise_plan.title"),
  },
];
