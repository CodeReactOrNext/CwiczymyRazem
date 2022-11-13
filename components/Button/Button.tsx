interface ButtonProps {
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  children: string;
}

const Button = ({ onClick, children }: ButtonProps) => {
  return (
    <button
      onClick={onClick}
      className='border-2 border-transparent bg-main p-2 px-8 text-center text-3xl font-bold uppercase hover:bg-main-100  '>
      {children}
    </button>
  );
};

export default Button;
