import { layoutVariant } from "layouts/MainLayout/MainLayout";
import LightningRevSVG from "public/static/images/svg/LightningRev";
interface SubtitleBarProps {
  variant: layoutVariant;
  children: React.ReactNode;
}

const SubtitleBar = ({ variant, children }: SubtitleBarProps) => {
  return (
    <div
      className={`z-30 flex w-[120%] -translate-x-[10%] items-center justify-end lg:h-20
    ${
      variant === "landing"
        ? "absolute top-[55%] -translate-y-[50%] lg:relative lg:top-0 lg:translate-y-0"
        : "relative"
    }`}>
      <div
        className={`clip-bg-mobile absolute -z-10 h-full w-full rotate-x-40 lg:hidden ${
          variant === "secondary" ? "bg-main-opposed-500" : "bg-second-500"
        } ${variant === "landing" ? "bg-transparent" : ""}`}></div>
      <LightningRevSVG
        className={`min-h-full w-full fill-tertiary-500 rotate-x-40 lg:hidden`}
      />
      <span
        className={`absolute top-0 bottom-0 right-[10%] my-auto flex h-fit translate-y-[60%] items-center text-right text-[5vw] font-medium text-second-500 lg:relative lg:right-0 lg:top-0 lg:h-20  lg:translate-y-0 lg:bg-tertiary-500 lg:text-left lg:text-3xl  xl:text-4xl ${
          variant === "landing" ? " lg:w-6/12" : " lg:w-[70%] xl:w-[80%]"
        }`}>
        <p>{children}</p>
      </span>
    </div>
  );
};

export default SubtitleBar;
