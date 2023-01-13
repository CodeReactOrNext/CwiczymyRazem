import React from "react";
import { CircleSpinner } from "react-spinners-kit";
import { motion } from "framer-motion";

interface ButtonProps {
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "small";
  style?: string;
  type?: "submit" | "reset" | "button";
  disabled?: boolean;
  loading?: boolean;
  otherProps?: React.ReactNode;
}

const Button = ({
  onClick,
  variant,
  children,
  style,
  type,
  disabled,
  loading,
  ...otherProps
}: ButtonProps) => {
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={
        " sm:w-45 cursor-pointer border-2 border-transparent  text-center font-bold uppercase active:click-behavior xs:text-xl   " +
        (variant === "secondary"
          ? "bg-main-opposed hover:bg-main-opposed-100"
          : "bg-main hover:bg-main-100") +
        (variant === "small"
          ? "p-2 px-2  sm:text-xl "
          : " p-2 px-5  sm:text-2xl ") +
        (style ? style : "") +
        (disabled ? "pointer-events-none grayscale" : "")
      }
      {...otherProps}>
      {loading ? (
        <div className='px-3'>
          <CircleSpinner size={24} />
        </div>
      ) : (
        children
      )}
    </motion.button>
  );
};

export default Button;
