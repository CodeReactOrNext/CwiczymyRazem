import { FaHandPaper } from "react-icons/fa";

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

  return <FaHandPaper className={`${sizeClasses[size]} ${className}`} />;
};

export default TechniqueIcon;
