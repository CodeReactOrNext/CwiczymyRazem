import { layoutVariant } from "layouts/MainLayout/MainLayout";
import LightningRevSVG from "public/static/images/svg/LightningRev";
interface SubtitleBarProps {
  variant: layoutVariant;
  children: React.ReactNode;
}

const SubtitleBar = ({ variant, children }: SubtitleBarProps) => {
  return (
    <div className='z-30 flex w-full  items-center justify-end lg:h-20'>
      <span
        className={` relative top-0 bottom-0 my-auto flex h-fit  w-full items-center bg-tertiary-500  lg:h-20 `}>
        <p className='ml-[10%] p-2 text-right font-medium text-main-opposed-text xs:text-xl sm:text-4xl lg:text-left lg:text-3xl  xl:text-4xl'>
          {children}
        </p>
      </span>
    </div>
  );
};

export default SubtitleBar;
