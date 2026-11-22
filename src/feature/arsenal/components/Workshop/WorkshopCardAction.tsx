import { useTranslation } from "hooks/useTranslation";
import { Hammer } from "lucide-react";

import { CardAction } from "../CardActions";
import { ReadyMark } from "./ReadyMark";

interface WorkshopCardActionProps {
  /** A bench job runs today — the key wears the green hammer mark. */
  ready?: boolean;
  onClick: () => void;
}

/**
 * The card's way onto the bench. Sits beside Equip: improving a piece is the
 * other thing a player does with gear they keep, and it used to be a tab away
 * with the piece to be found again in the rack.
 */
export const WorkshopCardAction = ({
  ready = false,
  onClick,
}: WorkshopCardActionProps) => {
  const { t } = useTranslation("arsenal");

  return (
    <CardAction icon={Hammer} onClick={onClick} title={t("card.workshop_hint")}>
      {t("card.workshop")}
      {ready && <ReadyMark className='ml-0.5' />}
    </CardAction>
  );
};
