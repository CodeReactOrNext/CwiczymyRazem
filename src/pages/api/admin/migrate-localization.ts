import { EXERCISE_PLANS_COLLECTION,EXERCISES_COLLECTION } from "feature/exercisePlan/services/constants";
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { firestore } from "utils/firebase/api/firebase.config";

import { authOptions } from "../auth/[...nextauth]";

const migrateValue = (val: any) => {
  if (typeof val === "object" && val !== null) {
    if (val.pl) return val.pl;
    if (val.en) return val.en;
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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const userId = (session.user as any).id;
    const userDoc = await firestore.collection("users").doc(userId).get();
    const userData = userDoc.data();

    if (!userData || userData.role !== "admin") {
      return res.status(403).json({ message: "Forbidden - Admin only" });
    }

    let totalProcessed = 0;

    // 1. Migrate individual exercises
    const exercisesSnap = await firestore.collection(EXERCISES_COLLECTION).get();
    const exercisesDocs = exercisesSnap.docs;

    // 2. Migrate exercise plans
    const plansSnap = await firestore.collection(EXERCISE_PLANS_COLLECTION).get();
    const plansDocs = plansSnap.docs;

    const runBatch = async (docs: any[], migrateFn: (data: any) => any) => {
      let batch = firestore.batch();
      let count = 0;

      for (const doc of docs) {
        const data = doc.data();
        const migratedData = migrateFn(data);
        batch.update(doc.ref, migratedData);

        count++;
        totalProcessed++;

        if (count === 500) {
          await batch.commit();
          batch = firestore.batch();
          count = 0;
        }
      }

      if (count > 0) {
        await batch.commit();
      }
    };

    await runBatch(exercisesDocs, migrateExercise);
    await runBatch(plansDocs, (plan) => ({
      ...plan,
      title: migrateValue(plan.title),
      description: migrateValue(plan.description),
      exercises: Array.isArray(plan.exercises)
        ? plan.exercises.map(migrateExercise)
        : plan.exercises,
    }));

    return res.status(200).json({
      success: true,
      message: `Migration complete! Processed ${totalProcessed} objects.`,
      details: {
        exercises: exercisesDocs.length,
        plans: plansDocs.length
      }
    });

  } catch (error: any) {
    console.error("Migration API Error:", error);
    return res.status(500).json({
      success: false,
      message: "Migration failed",
      error: error.message
    });
  }
}
