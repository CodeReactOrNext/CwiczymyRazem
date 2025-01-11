import { Loader2 } from "lucide-react";

const PageLoadingLayout = () => {
  return (
    <div className=' flex h-[40vh] w-full items-center justify-center'>
      <Loader2 className='animate-spin' />
    </div>
  );
};
export default PageLoadingLayout;
