import { FaLightbulb } from "react-icons/fa";

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

  return <FaLightbulb className={`${sizeClasses[size]} ${className}`} />;
};

export default CreativityIcon;
