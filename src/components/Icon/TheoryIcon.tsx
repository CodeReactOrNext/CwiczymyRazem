
import { FaBrain } from "react-icons/fa";


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

  return <FaBrain className={`${sizeClasses[size]} ${className}`} />;
};

export default TheoryIcon;
