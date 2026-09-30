import { SKILL_CATEGORY_ICONS } from "components/Icon/skillCategoryIcons";

type HearingIconProps = {
  className?: string;
  size?: "small" | "medium" | "large";
};

const HearingIcon = ({ className = "", size = "medium" }: HearingIconProps) => {
  const sizeClasses = {
    small: "text-sm",
    medium: "text-base",
    large: "text-xl",
  };

  const Icon = SKILL_CATEGORY_ICONS.hearing;
  return <Icon className={`${sizeClasses[size]} ${className}`} />;
};

export default HearingIcon;
