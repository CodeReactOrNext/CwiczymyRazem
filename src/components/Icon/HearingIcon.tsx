import { IoEarOutline } from "react-icons/io5";

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

  return <IoEarOutline className={`${sizeClasses[size]} ${className}`} />;
};

export default HearingIcon;
