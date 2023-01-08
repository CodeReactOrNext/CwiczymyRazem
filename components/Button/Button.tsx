import React, { ButtonHTMLAttributes } from "react";

interface ButtonProps {
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "small";
  style?: string;
  type?: "submit" | "reset" | "button";
  disabled?: boolean;
  otherProps?: React.ReactNode;
}

const Button = ({
  onClick,
  variant,
  children,
  style,
  type,
  disabled,
  ...otherProps
}: ButtonProps) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={
        " sm:w-45 cursor-pointer border-2 border-transparent  text-center font-bold uppercase active:click-behavior xs:text-xl   " +
        (variant === "secondary"
          ? "bg-main-opposed hover:bg-main-opposed-100"
          : "bg-main hover:bg-main-100") +
        (variant === "small" ? "p-2 px-2  sm:text-xl " : " p-2 px-5  sm:text-2xl ") +
        (style ? style : "") +
        (disabled ? "pointer-events-none grayscale" : "")
      }
      {...otherProps}>
      {children}
    </button>
  );
};

export default Button;
