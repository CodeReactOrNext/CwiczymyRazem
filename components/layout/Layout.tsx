import Header from "./Header";
import Lightning from "../../public/static/images/lightning";
import LightningRev from "../../public/static/images/lightningRev";

interface LayoutProps {
  children: React.ReactNode;
  subtitle: string;
  variant: 1 | 2;
}

export default function Layout({ children, subtitle, variant }: LayoutProps) {
  return (
    <main className='min-h-screen p-4 font-sans md:p-8'>
      <div className='relative flex h-full w-full justify-center'>
        <div
          className={`relative h-full w-full max-w-[1920px] overflow-hidden ${
            variant === 1 ? "bg-main-opposed-500" : "bg-second-500"
          }`}>
          <Header />
          <div className='absolute top-20 right-0 z-10 flex h-1/5 w-full items-center justify-end  md:h-20'>
            <LightningRev className='absolute top-0 -right-6 bottom-0 min-h-full w-full  md:hidden xsm:min-w-[850px]' />
            <span className='absolute top-32 right-0 h-full w-full p-6 text-right text-2xl  font-medium text-second-500 md:top-0 md:w-8/12 md:bg-tertiary-500 md:text-left md:text-3xl xl:w-9/12'>
              {subtitle}
            </span>
          </div>
          <div
            className={`md:clip-bg mt-[32vh] h-full ${
              variant === 1 ? "bg-second-500" : "bg-main-opposed-500"
            } pt-[20%] md:mt-0`}></div>
          <div className='absolute -top-8 -left-6 z-0 hidden h-screen w-fit rotate-0 md:right-0 md:block'>
            <Lightning className='h-full w-full' />
          </div>
        </div>
        <section className='absolute bottom-0 right-0 h-[60%] w-full md:h-[82%]'>
          {children}
        </section>
      </div>
    </main>
  );
}
