import { cn } from "assets/lib/utils";
import { Segment, SegmentGroup } from "components/SegmentedControl/SegmentedControl";
import { useTranslation } from "hooks/useTranslation";
import { CheckCircle2, CircleDashed, Zap } from "lucide-react";
import React from "react";

import type { StepStatus } from "../../../utils/stepStatus";

const OPTIONS: {
  status: StepStatus;
  label: string;
  Icon: typeof Zap;
  /** Icon colour once picked. */
  active: string;
}[] = [
  {
    status: "not-started",
    label: "status_control.not_yet",
    Icon: CircleDashed,
    active: "text-zinc-100",
  },
  {
    status: "in-progress",
    label: "status_control.practicing",
    Icon: Zap,
    active: "text-amber-400",
  },
  {
    status: "done",
    label: "status_control.got_it",
    Icon: CheckCircle2,
    active: "text-emerald-400",
  },
];

interface StepStatusControlProps {
  value: StepStatus;
  onChange: (status: StepStatus) => void;
}

/** Manual status for a step with nothing to tick off — the player says where they are. */
export const StepStatusControl: React.FC<StepStatusControlProps> = ({
  value,
  onChange,
}) => {
  const { t } = useTranslation("ai_coach");
  return (
    <section className='flex flex-col gap-3'>
      <div>
        <h3 className='text-sm font-semibold text-zinc-100'>
          {t("status_control.title")}
        </h3>
        <p className='mt-1 text-xs leading-relaxed text-zinc-400'>
          {t("status_control.body")}
        </p>
      </div>
      <SegmentGroup aria-label={t("status_control.title")}>
        {OPTIONS.map(({ status, label, Icon, active }) => {
          const isActive = value === status;
          return (
            <Segment
              key={status}
              active={isActive}
              onClick={() => onChange(status)}>
              {/* The status keeps its colour on the icon once picked. */}
              <Icon className={cn("h-4 w-4 shrink-0", isActive && active)} />
              {t(label)}
            </Segment>
          );
        })}
      </SegmentGroup>
    </section>
  );
};
