import type { NextPage } from "next";
import Layout from "../components/layout/Layout";
import Button from "../components/Button";

const Home: NextPage = () => {
  return (
    <Layout variant={1} subtitle='Ćwicz, raportuj, zdobywaj punkty!'>
      <h1>Home Page</h1>
      <Button>Ćwiczymy Razem!</Button>
    </Layout>
  );
};

export default Home;
