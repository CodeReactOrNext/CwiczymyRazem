import type { PlayerRoadmapsPageProps } from "feature/landing/lib/playerRoadmapsProps";
import { buildPlayerRoadmapsProps } from "feature/landing/lib/playerRoadmapsProps";
import { PlayerRoadmapsPage } from "feature/landing/PlayerRoadmapsPage";
import type { GetStaticProps } from "next";

const GuitarRoadmap = (props: PlayerRoadmapsPageProps) => (
  <PlayerRoadmapsPage {...props} />
);

export const getStaticProps: GetStaticProps<
  PlayerRoadmapsPageProps
> = async () => ({ props: buildPlayerRoadmapsProps() });

export default GuitarRoadmap;
