import Header from "./components/Header";
import Lightning from "../../public/static/images/lightning";
import LightningRev from "../../public/static/images/lightningRev";

interface LayoutProps {
  children: React.ReactNode;
  subtitle: string;
  variant: "primary" | "secondary";
}

export default function Layout({ children, subtitle, variant }: LayoutProps) {
  return (
    <main className='min-h-screen p-4 font-sans lg:p-8'>
      <div className='relative flex h-full w-full items-center justify-center'>
        <div
          className={`relative h-full max-h-[1080px] w-full max-w-[1920px] overflow-hidden ${
            variant === "primary" ? "bg-main-opposed-500" : "bg-second-500"
          }`}>
          <Header />
          <div className='absolute top-[10%] right-0 z-10 flex h-1/5 w-full items-center justify-end lg:top-20 lg:h-20'>
            <LightningRev className='absolute top-0 -right-10 bottom-0 m-auto min-h-full w-[130%] lg:hidden' />
            <span className='absolute top-[40%] h-full w-full p-6 text-right text-[5vw] font-medium text-second-500 lg:top-0 lg:w-9/12 lg:bg-tertiary-500 lg:text-left lg:text-4xl'>
              {subtitle}
            </span>
          </div>
          <div
            className={`clip-bg-mobile lg:clip-bg mt-[15vh] h-full pt-[20%] lg:mt-0 ${
              variant === "primary" ? "bg-second-500" : "bg-main-opposed-500"
            }`}></div>
          <div className='absolute bottom-0 left-0 hidden h-[120%] w-fit rotate-0  lg:right-0 lg:block'>
            <Lightning className='h-full w-full' />
          </div>
          <section className='absolute bottom-0 right-0 z-50 flex h-[70%] w-full items-center justify-center lg:h-[82%]'>
            {children}
          </section>
        </div>
        <div className='absolute h-full w-full bg-old-effect bg-cover bg-no-repeat lg:bg-old-effect-hr'></div>
      </div>
    </main>
  );
}
