import { selectIsFetching } from "feature/user/store/userSlice";
import { Loader2 } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { useAppSelector } from "store/hooks";

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
        <Loader2 className='animate-spin' />
      ) : (
        <FcGoogle size='24' />
      )}
      {children}
    </button>
  );
};

export default GoogleButton;
