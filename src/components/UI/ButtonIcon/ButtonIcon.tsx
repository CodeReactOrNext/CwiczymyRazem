import type { IconType } from "react-icons/lib";

interface ButtonIconProps {
  Icon: IconType;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  size?: "sm" | "md" | "lg";
}

const ButtonIcon = ({ Icon, onClick, size = "md" }: ButtonIconProps) => {
  const buttonSizeClasses = {
    sm: "btn-sm",
    md: "btn-md",
    lg: "btn-lg",
  };

  const iconSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  return (
    <button
      onClick={onClick}
      className={`btn btn-square btn-outline ${buttonSizeClasses[size]} border !border-second-100 text-white`}>
      <Icon className={iconSizeClasses[size]} />
    </button>
  );
};

export default ButtonIcon;
