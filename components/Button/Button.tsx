import React, { ButtonHTMLAttributes } from "react";

interface ButtonProps {
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
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
        " sm:w-45 cursor-pointer border-2 border-transparent p-2 px-5 text-center font-bold uppercase active:click-behavior xs:text-xl sm:text-2xl " +
        (variant === "secondary"
          ? "bg-main-opposed hover:bg-main-opposed-100"
          : "bg-main hover:bg-main-100") +
        (style ? style : "") +
        (disabled ? "pointer-events-none grayscale" : "")
      }
      {...otherProps}>
      {children}
    </button>
  );
};

export default Button;
