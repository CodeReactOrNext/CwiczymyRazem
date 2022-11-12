import type { NextPage } from "next";
import MainLayout from "../layouts/MainLayout/MainLayout";

const Home: NextPage = () => {
  return (
    <MainLayout
      variant={"primary"}
      subtitle='Ćwicz, raportuj, zdobywaj punkty!'>
      <h1>Home Page</h1>
    </MainLayout>
  );
};

export default Home;
