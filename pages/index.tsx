import type { NextPage } from "next";
import MainLayout from "../layouts/MainLayout";
import HeroSection from "../components/Sections/HeroSection/HeroSection";
import Button from "../components/Button";
import Input from "../components/Input";
import { FaUserAlt } from "react-icons/fa";

const Home: NextPage = () => {
  return (
    <MainLayout
      variant={"landing"}
      subtitle='Ćwicz, raportuj, zdobywaj punkty!'>
      <HeroSection />
      {/* <div>
        <h1>Home Page</h1>
      </div>
      <div>
        <Button>Ćwiczymy Razem!</Button>
        <Input Icon={FaUserAlt} />
      </div> */}
    </MainLayout>
  );
};

export default Home;
