import { GetStaticPaths, GetStaticProps, NextPage } from "next";
import { Exercise } from "feature/exercisePlan/types/exercise.types";
import { exercisesAgregat } from "feature/exercisePlan/data/exercisesAgregat";
import { ExerciseDetailView } from "feature/exercisePlan/views/ExerciseDetail/ExerciseDetailView";
import AppLayout from "layouts/AppLayout";
import { ReactElement } from "react";

interface ExercisePageProps {
  exercise: Exercise;
}

const ExercisePage: NextPage<ExercisePageProps> & { getLayout?: (page: ReactElement) => ReactElement } = ({ exercise }) => {
  if (!exercise) return null;
  return <ExerciseDetailView exercise={exercise} />;
};

ExercisePage.getLayout = (page) => {
  return (
    <AppLayout pageId="exercises" isPublic={true}>
      {page}
    </AppLayout>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = exercisesAgregat.map((ex) => ({
    params: { slug: ex.id.replace(/_/g, "-") },
  }));

  return {
    paths,
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slug = params?.slug as string;
  const exercise = exercisesAgregat.find((ex) => ex.id.replace(/_/g, "-") === slug);

  if (!exercise) {
    return {
      notFound: true,
    };
  }

  // We need to handle StaticImageData serialization issues if any, 
  // but usually Next.js handles it if it's imported directly.
  // However, props must be plain objects.
  
  return {
    props: {
      exercise: JSON.parse(JSON.stringify(exercise)),
    },
  };
};

export default ExercisePage;
