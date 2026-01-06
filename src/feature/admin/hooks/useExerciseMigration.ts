import { useState } from "react";
import { collection, getDocs, writeBatch, doc } from "firebase/firestore";
import { db } from "utils/firebase/client/firebase.utils";
import { EXERCISES_COLLECTION, EXERCISE_PLANS_COLLECTION } from "feature/exercisePlan/services/constants";
import { toast } from "sonner";

export const useExerciseMigration = (password: string) => {
  const [isMigrating, setIsMigrating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const migrateValue = (val: any) => {
    if (typeof val === "object" && val !== null) {
      if (val.en) return val.en;
      if (val.pl) return val.pl;
    }
    return val;
  };

  const migrateExercise = (exercise: any) => {
    return {
      ...exercise,
      title: migrateValue(exercise.title),
      description: migrateValue(exercise.description),
      instructions: Array.isArray(exercise.instructions)
        ? exercise.instructions.map(migrateValue)
        : exercise.instructions,
      tips: Array.isArray(exercise.tips)
        ? exercise.tips.map(migrateValue)
        : exercise.tips,
    };
  };

  const runMigration = async () => {
    if (!password) {
      toast.error("Admin password required");
      return;
    }

    setIsMigrating(true);
    try {
      let totalProcessed = 0;

      // 1. Migrate individual exercises
      const exercisesSnap = await getDocs(collection(db, EXERCISES_COLLECTION));
      const exercises = exercisesSnap.docs;

      // 2. Migrate exercise plans
      const plansSnap = await getDocs(collection(db, EXERCISE_PLANS_COLLECTION));
      const plans = plansSnap.docs;

      const totalItems = exercises.length + plans.length;
      setProgress({ current: 0, total: totalItems });

      // Use batches (Firestore limit is 500 per batch)
      const runBatch = async (items: any[], migrateFn: (item: any) => any, collectionName: string) => {
        let count = 0;
        let batch = writeBatch(db);

        for (const itemDoc of items) {
          const data = itemDoc.data();
          const migratedData = migrateFn(data);

          batch.update(doc(db, collectionName, itemDoc.id), migratedData);

          count++;
          totalProcessed++;
          setProgress(prev => ({ ...prev, current: totalProcessed }));

          if (count === 500) {
            await batch.commit();
            batch = writeBatch(db);
            count = 0;
          }
        }

        if (count > 0) {
          await batch.commit();
        }
      };

      // Migrate Exercises
      await runBatch(exercises, migrateExercise, EXERCISES_COLLECTION);

      // Migrate Plans
      await runBatch(plans, (plan) => ({
        ...plan,
        title: migrateValue(plan.title),
        description: migrateValue(plan.description),
        exercises: Array.isArray(plan.exercises)
          ? plan.exercises.map(migrateExercise)
          : plan.exercises,
      }), EXERCISE_PLANS_COLLECTION);

      toast.success(`Migration complete! Processed ${totalProcessed} items.`);
    } catch (error) {
      console.error("Migration failed:", error);
      toast.error("Migration failed. See console.");
    } finally {
      setIsMigrating(false);
    }
  };

  return {
    runMigration,
    isMigrating,
    migrationProgress: progress
  };
};
