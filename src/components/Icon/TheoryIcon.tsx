
import { SKILL_CATEGORY_ICONS } from "components/Icon/skillCategoryIcons";


type TheoryIconProps = {
  className?: string;
  size?: "small" | "medium" | "large";
};

const TheoryIcon = ({
  className = "",
  size = "medium",
}: TheoryIconProps) => {
  const sizeClasses = {
    small: "text-sm",
    medium: "text-base",
    large: "text-xl",
  };

  const Icon = SKILL_CATEGORY_ICONS.theory;
  return <Icon className={`${sizeClasses[size]} ${className}`} />;
};

export default TheoryIcon;
