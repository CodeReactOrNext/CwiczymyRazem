import type { NextPage } from "next";
import MainLayout from "../layouts/MainLayout";
import HeroLayout from "../layouts/HeroLayout";

const Home: NextPage = () => {
  return (
    <MainLayout
      variant={"landing"}
      subtitle='Ćwicz, raportuj, zdobywaj punkty!'>
      <HeroLayout
        buttonOnClick={() => {
          console.log("Here should be onclick");
        }}>
        <>
          <p>Pnij się po szczeblach rankingu.</p>
          <p>Gromadź statystyki swoich ćwiczeń.</p>
          <p>Otrzymuj punkty za swoje codzinne ćwiczenia</p>
          <p>Dołącz do nas i zmotywuj się do grania na gitarze!</p>
        </>
      </HeroLayout>
    </MainLayout>
  );
};

export default Home;
