import Avatar from "components/Avatar";
import OldEffect from "components/OldEffect";
import Background from "./components/Background";
import Statistic from "./components/Statistic";
import LandingNav from "./components/LandingNav";
import StatisticBar from "./components/StatisticBar";
import UserHeader from "./components/UserHeader";
import Achivment from "./components/Achivment";

interface LandingLayoutProps {
  children?: React.ReactNode;
  subtitle?: string;
}

export default function LandingLayout({
  children,
  subtitle,
}: LandingLayoutProps) {
  return (
    <main className='h-screen min-h-[600px] p-4 font-sans md:min-h-[900px] lg:p-8 '>
      <div className='relative flex h-full w-full items-center justify-center'>
        <div
          className={`bg-main-opposed-500"  relative flex h-full max-h-[calc(1080px_-_4rem)] w-full max-w-[1920px] flex-col overflow-x-hidden
          scrollbar-hide`}>
          <UserHeader />
          <LandingNav />
          <div className='z-40 m-4 flex flex-col justify-center   bg-second'>
            <p className='bg-tertiary p-2 px-3 text-2xl text-main-opposed '>
              Statystyki
            </p>
            <div className='flex justify-center '>
              <StatisticBar /> <StatisticBar /> <StatisticBar />
              <StatisticBar />
            </div>
            <Statistic /> <Statistic /> <Statistic /> <Statistic />
            <Statistic /> <Statistic />
            <Achivment />
          </div>
          <Background />
          <OldEffect />
        </div>
      </div>
    </main>
  );
}
