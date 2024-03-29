import { FcGoogle } from "react-icons/fc";
import { CircleSpinner } from "react-spinners-kit";

import { useAppSelector } from "store/hooks";
import { selectIsFetching } from "feature/user/store/userSlice";

interface GoogleButtonProps {
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  children: string;
}

const GoogleButton = ({ onClick, children }: GoogleButtonProps) => {
  const isFetching = useAppSelector(selectIsFetching) === "google";
  return (
    <button
      onClick={onClick}
      type='button'
      className='active:click-behavio flex flex-row gap-3 bg-white p-3 font-medium tracking-wide text-googleButtonText radius-default'
      disabled={isFetching ? true : false}>
      {isFetching ? (
        <CircleSpinner size={24} color='#555555' />
      ) : (
        <FcGoogle size='24' />
      )}
      {children}
    </button>
  );
};

export default GoogleButton;
