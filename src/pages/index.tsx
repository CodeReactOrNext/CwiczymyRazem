import LandingPage from "feature/landing/LandingPage";
import { exercisesAgregat } from "feature/exercisePlan/data/exercisesAgregat";
import { serializeExercises } from "feature/exercises/lib/serializeExercise";
import type { BlogFrontmatter} from "lib/blog";
import {getAllBlogs } from "lib/blog";
import type { GetStaticProps } from "next";
import type { NextPageWithLayout } from "types/page";

interface HomeProps {
  blogs: BlogFrontmatter[];
  spotlightExercises: Array<{
    id: string;
    title: string;
    difficulty: 'easy' | 'medium' | 'hard';
    category: string;
    description: string;
    timeInMinutes: number;
  }>;
}

const Home: NextPageWithLayout<HomeProps> = ({ blogs, spotlightExercises }) => {
  return <LandingPage blogs={blogs} spotlightExercises={spotlightExercises} />;
};

export const getStaticProps: GetStaticProps<HomeProps> = async () => {
  const blogs = getAllBlogs();

  // Select 3 free exercises (unmarked as premium) with tablature for landing preview
  const spotlightExercises = serializeExercises(exercisesAgregat)
    .filter((ex) => !ex.premium && ex.tablature?.length)
    .slice(0, 3)
    .map((ex) => ({
      id: ex.id,
      title: ex.title,
      difficulty: ex.difficulty as 'easy' | 'medium' | 'hard',
      category: ex.category,
      description: ex.description,
      timeInMinutes: ex.timeInMinutes,
    }));

  return {
    props: {
      blogs,
      spotlightExercises,
    },
  };
};

Home.minimalLayout = true;

export default Home;


