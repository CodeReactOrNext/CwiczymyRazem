import { buttonVariants } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { useTranslation } from "hooks/useTranslation";
import { Coffee } from "lucide-react";
import type { ReactNode } from "react";

import { BMC_URL } from "../data/roadmap.data";

interface SupportCtaProps {
  className?: string;
  children?: ReactNode;
  /** `xl` in the hero, where it is the page's one main action. */
  size?: "lg" | "xl";
}

/**
 * The one action on the page. Same white button the HeroBanner and the
 * dashboard SupportBanner use, so wherever it is repeated it reads as the
 * primary thing to do and not as another tinted panel. Pressed like every
 * other key in the app: the lip is the face darkened by the black border.
 */
export const SupportCta = ({
  className,
  children,
  size = "lg",
}: SupportCtaProps) => {
  const { t } = useTranslation("supporter");
  return (
  <a
    href={BMC_URL}
    target='_blank'
    rel='noopener noreferrer'
    className={cn(buttonVariants({ size }), className)}>
    <Coffee size={16} />
    {children ?? t("cta.support")}
  </a>
  );
};
