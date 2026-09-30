import { SKILL_CATEGORY_ICONS } from "components/Icon/skillCategoryIcons";

type CreativityIconProps = {
  className?: string;
  size?: "small" | "medium" | "large";
};

const CreativityIcon = ({
  className = "",
  size = "medium",
}: CreativityIconProps) => {
  const sizeClasses = {
    small: "text-sm",
    medium: "text-base",
    large: "text-xl",
  };

  const Icon = SKILL_CATEGORY_ICONS.creativity;
  return <Icon className={`${sizeClasses[size]} ${className}`} />;
};

export default CreativityIcon;
