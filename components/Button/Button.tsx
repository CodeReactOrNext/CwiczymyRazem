interface ButtonProps {
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  children: string;
}

const Button = ({ onClick, children }: ButtonProps) => {
  return (
    <button className='border-2 border-transparent bg-main p-2 px-8 text-center text-3xl font-bold uppercase hover:bg-main-100  '>
      Ćwiczymy z nami!
    </button>
  );
};

export default Button;
