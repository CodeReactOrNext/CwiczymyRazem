import type { NextPage } from "next";
import Layout from "../components/layout/Layout";

const Home: NextPage = () => {
  return (
    <Layout variant={1} subtitle='Ćwicz, raportuj, zdobywaj punkty!'>
      <h1>Home Page</h1>
    </Layout>
  );
};

export default Home;
