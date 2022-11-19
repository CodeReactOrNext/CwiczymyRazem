import LightningRevSVG from "public/static/images/svg/LightningRev";
interface Props {
  variant: "primary" | "secondary" | "landing";
  children: React.ReactNode;
}

export default function SubtitleBar({ variant, children }: Props) {
  return (
    <div className='relative z-50 flex min-h-fit w-[120%] -translate-x-[10%] items-center justify-end lg:h-20'>
      <div
        className={`clip-bg-mobile absolute -z-10 h-full  w-full translate-y-[1px] lg:hidden ${
          variant === "secondary" ? "bg-main-opposed-500" : "bg-second-500"
        }`}></div>
      <LightningRevSVG
        className={`min-h-full w-full fill-tertiary-500 lg:hidden ${
          variant === "landing" ? "top-[40vh] sm:top-[42vh] " : ""
        }`}
      />
      <span
        className={`absolute top-0 bottom-0 right-[10%] my-auto flex h-fit translate-y-[60%] items-center text-right text-[5vw] font-medium text-second-500 lg:relative lg:right-0 lg:top-0 lg:h-full lg:w-8/12 lg:translate-y-0 lg:bg-tertiary-500 lg:text-left lg:text-3xl xl:text-4xl ${
          variant === "landing" ? " lg:w-5/12" : ""
        }`}>
        <p>{children}</p>
      </span>
    </div>
  );
}
