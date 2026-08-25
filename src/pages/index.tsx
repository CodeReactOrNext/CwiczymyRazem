import { exercisesAgregat } from "feature/exercisePlan/data/exercisesAgregat";
import { serializeExercises } from "feature/exercises/lib/serializeExercise";
import { featuredGuideSongIds } from "feature/landing/data/featuredGuides";
import LandingPage from "feature/landing/LandingPage";
import { getPathSongLiveData } from "feature/song-library/song-guides/services/getSongGuideLiveData";
import type { PathSongLiveDataMap } from "feature/song-library/song-guides/types";
import type { BlogFrontmatter} from "lib/blog";
import {getAllBlogs } from "lib/blog";
import type { GetStaticProps } from "next";
import type { NextPageWithLayout } from "types/page";

interface HomeProps {
  blogs: BlogFrontmatter[];
  spotlightExercises: Array<{
    id: string;
    title: string;
    difficulty: 'beginner' | 'easy' | 'medium' | 'hard';
    category: string;
    description: string;
    timeInMinutes: number;
  }>;
  guideLiveData: PathSongLiveDataMap;
}

const Home: NextPageWithLayout<HomeProps> = ({
  blogs,
  spotlightExercises,
  guideLiveData,
}) => {
  return (
    <LandingPage
      blogs={blogs}
      spotlightExercises={spotlightExercises}
      guideLiveData={guideLiveData}
    />
  );
};

export const getStaticProps: GetStaticProps<HomeProps> = async () => {
  const blogs = getAllBlogs();

  // Select 3 free exercises (unmarked as premium) with tablature for landing preview
  const spotlightExercises = serializeExercises(exercisesAgregat)
    .filter((ex) => !ex.premium && ex.tablature?.length && !ex.isHiddenFromLibrary)
    .slice(0, 3)
    .map((ex) => ({
      id: ex.id,
      title: ex.title,
      difficulty: ex.difficulty as 'beginner' | 'easy' | 'medium' | 'hard',
      category: ex.category,
      description: ex.description,
      timeInMinutes: ex.timeInMinutes,
    }));

  // Live tier badges for the "Popular guides" strip: see featuredGuides.
  const guideLiveData = await getPathSongLiveData(featuredGuideSongIds);

  return {
    props: {
      blogs,
      spotlightExercises,
      guideLiveData,
    },
  };
};

Home.minimalLayout = true;

export default Home;


