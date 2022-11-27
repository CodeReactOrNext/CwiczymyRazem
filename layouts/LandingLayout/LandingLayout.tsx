import OldEffect from "components/OldEffect";
import Wrapper from "./components/Wrapper";
import Statistic, { StatisticProps } from "./components/Statistic";
import LandingNav from "./components/LandingNav";
import StatisticBar from "./components/StatisticBar";
import UserHeaderMobile from "./components/UserHeaderMobile";
import Achivment from "./components/Achivment";
import UserHeaderDesktop from "./components/UserHeaderDesktop";
import Decoration from "./components/Decoration";

interface LandingLayoutProps {
  statistics: StatisticProps[];
}

export default function LandingLayout({ statistics }: LandingLayoutProps) {
  return (
    <main className='h-screen min-h-[600px] p-4 font-sans md:min-h-[900px] lg:p-8 '>
      <div className='relative flex h-full w-full items-center justify-center'>
        <div
          className={`bg-main-opposed-500"  relative flex h-full max-h-[calc(1080px_-_4rem)] w-full max-w-[1920px] flex-col overflow-y-auto
          overflow-x-hidden scrollbar-hide`}>
          <Wrapper>
            <UserHeaderDesktop />
            <UserHeaderMobile />
            <LandingNav />
            <div className=' relative z-40   m-4 mt-28 flex w-[90%]  max-w-[1080px] flex-col justify-center bg-second pb-4 '>
              <Decoration />
              <div className='grid-cols-2 grid-rows-2 items-center md:grid'>
                <div className=' order-2 row-span-2 my-5 flex justify-center '>
                  <StatisticBar /> <StatisticBar /> <StatisticBar />
                  <StatisticBar />
                </div>
                <div className=' row-cols-1  order-1'>
                  {statistics.map(({ Icon, description, value }, index) => (
                    <Statistic
                      key={index}
                      Icon={Icon}
                      description={description}
                      value={value}
                    />
                  ))}
                </div>
                <div className=' row-cols-1 order-2 '>
                  <Achivment />
                  <Achivment />
                  <Achivment />
                </div>
              </div>
            </div>
          </Wrapper>
          <OldEffect />
        </div>
      </div>
    </main>
  );
}
