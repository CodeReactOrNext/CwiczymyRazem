import { ButtonHTMLAttributes } from "react";

interface ButtonProps {
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  children: string;
  variant?: "primary" | "secondary";
  style?: string;
  type?: "submit" | "reset" | "button";
}

const Button = ({ onClick, variant, children, style, type }: ButtonProps) => {
  return (
    <button
      type={type}
      onClick={onClick}
      className={
        "sm:w-45 border-2 border-transparent p-2 px-5 text-center font-bold uppercase xs:text-xl sm:text-2xl " +
        (variant === "secondary"
          ? "bg-main-opposed hover:bg-main-opposed-100"
          : "bg-main hover:bg-main-100") +
        (style ? style : "")
      }>
      {children}
    </button>
  );
};

export default Button;
