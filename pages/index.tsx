import type { NextPage } from "next";
import MainLayout from "../layouts/MainLayout";
import Button from "../components/Button";

const Home: NextPage = () => {
  return (
    <MainLayout
      variant={"primary"}
      subtitle='Ćwicz, raportuj, zdobywaj punkty!'>
      <h1>Home Page</h1>
      <Button>Ćwiczymy Razem!</Button>
    </MainLayout>
  );
};

export default Home;
