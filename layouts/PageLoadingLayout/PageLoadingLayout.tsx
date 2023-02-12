import { CircleSpinner } from "react-spinners-kit";

const PageLoadingLayout = () => {
  return (
    <div className=' flex h-[40vh] w-full items-center justify-center'>
      <CircleSpinner size={60} />
    </div>
  );
};
export default PageLoadingLayout;
