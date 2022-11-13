interface ButtonProps {
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  children: string;
  variant?: "primary" | "secondary";
}

const Button = ({ onClick, variant, children }: ButtonProps) => {
  return (
    <button
      onClick={onClick}
      className={
        "w-52 border-2 border-transparent p-2 px-5 text-center text-2xl font-bold uppercase " +
        (variant === "secondary"
          ? "bg-main-opposed hover:bg-main-opposed-100"
          : "bg-main hover:bg-main-100")
      }>
      {children}
    </button>
  );
};

export default Button;
