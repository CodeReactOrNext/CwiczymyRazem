import { SKILL_CATEGORY_ICONS } from "components/Icon/skillCategoryIcons";

type TechniqueIconProps = {
  className?: string;
  size?: "small" | "medium" | "large";
};

const TechniqueIcon = ({
  className = "",
  size = "medium",
}: TechniqueIconProps) => {
  const sizeClasses = {
    small: "text-sm",
    medium: "text-base",
    large: "text-xl",
  };

  const Icon = SKILL_CATEGORY_ICONS.technique;
  return <Icon className={`${sizeClasses[size]} ${className}`} />;
};

export default TechniqueIcon;
