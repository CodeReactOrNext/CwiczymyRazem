import type { NextPage } from "next";
import MainLayout from "../layouts/MainLayout";
import Button from "../components/Button";
import Input from "../components/Input";
import { FaUserAlt } from "react-icons/fa";

const Home: NextPage = () => {
  return (
    <MainLayout
      variant={"primary"}
      subtitle='Ćwicz, raportuj, zdobywaj punkty!'>
      <h1>Home Page</h1>
      <Button>Ćwiczymy Razem!</Button>
      <Input Icon={FaUserAlt} />
    </MainLayout>
  );
};

export default Home;
