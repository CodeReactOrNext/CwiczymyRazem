import { exercisesAgregat } from "feature/exercisePlan/data/exercisesAgregat";
import { serializeExercise } from "feature/exercises/lib/serializeExercise";
import { INTERACTIVE_PRACTICE_DEMO_EXERCISE_ID } from "feature/landing/data/interactivePractice";
import type { InteractiveGuitarPracticePageProps } from "feature/landing/InteractiveGuitarPracticePage";
import { InteractiveGuitarPracticePage } from "feature/landing/InteractiveGuitarPracticePage";
import type { GetStaticProps } from "next";

const InteractiveGuitarPractice = (
  props: InteractiveGuitarPracticePageProps,
) => <InteractiveGuitarPracticePage {...props} />;

export const getStaticProps: GetStaticProps<
  InteractiveGuitarPracticePageProps
> = async () => {
  const exercise = exercisesAgregat.find(
    (ex) => ex.id === INTERACTIVE_PRACTICE_DEMO_EXERCISE_ID,
  );
  if (!exercise) {
    // The id is a hard-coded constant; a typo should fail the build, not ship
    // a landing page with an empty demo.
    throw new Error(
      `Interactive practice landing: unknown demo exercise "${INTERACTIVE_PRACTICE_DEMO_EXERCISE_ID}"`,
    );
  }
  return { props: { exercise: serializeExercise(exercise) } };
};

export default InteractiveGuitarPractice;
