import { FcGoogle } from "react-icons/fc";

interface GoogleButtonProps {
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  children: string;
}

const GoogleButton = ({ onClick, children }: GoogleButtonProps) => {
  return (
    <button
      onClick={onClick}
      className='flex flex-row gap-3 bg-white p-3 font-medium tracking-wide text-[#555555]'>
      <FcGoogle size='24' />
      {children}
    </button>
  );
};

export default GoogleButton;
