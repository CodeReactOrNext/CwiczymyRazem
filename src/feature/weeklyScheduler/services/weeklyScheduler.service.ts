import { db } from "utils/firebase/client/firebase.utils";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  Timestamp,
  serverTimestamp
} from "firebase/firestore";
import type { WeeklySchedule, DayOfWeek, DaySchedule } from "../types/weeklyScheduler.types";

const getWeeklyScheduleDocId = (weekStartDate: Date): string => {
  const year = weekStartDate.getFullYear();
  const month = String(weekStartDate.getMonth() + 1).padStart(2, "0");
  const day = String(weekStartDate.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const getWeeklySchedule = async (
  userId: string,
  weekStartDate: Date
): Promise<WeeklySchedule | null> => {
  try {
    const docId = getWeeklyScheduleDocId(weekStartDate);
    const scheduleRef = doc(db, "users", userId, "weeklySchedules", docId);
    const scheduleSnap = await getDoc(scheduleRef);

    if (scheduleSnap.exists()) {
      return scheduleSnap.data() as WeeklySchedule;
    }

    return null;
  } catch (error) {
    console.error("Error fetching weekly schedule:", error);
    throw error;
  }
};

export const createWeeklySchedule = async (
  userId: string,
  weekStartDate: Date
): Promise<WeeklySchedule> => {
  try {
    const docId = getWeeklyScheduleDocId(weekStartDate);
    const scheduleRef = doc(db, "users", userId, "weeklySchedules", docId);

    const emptyDaySchedule: DaySchedule = {
      completed: false,
    };

    const newSchedule: WeeklySchedule = {
      weekStartDate: Timestamp.fromDate(weekStartDate),
      userId,
      days: {
        monday: { ...emptyDaySchedule },
        tuesday: { ...emptyDaySchedule },
        wednesday: { ...emptyDaySchedule },
        thursday: { ...emptyDaySchedule },
        friday: { ...emptyDaySchedule },
        saturday: { ...emptyDaySchedule },
        sunday: { ...emptyDaySchedule },
      },
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp,
    };

    await setDoc(scheduleRef, newSchedule);
    return newSchedule;
  } catch (error) {
    console.error("Error creating weekly schedule:", error);
    throw error;
  }
};

export const updateDaySchedule = async (
  userId: string,
  weekStartDate: Date,
  day: DayOfWeek,
  planId?: string,
  exerciseId?: string,
  songId?: string
): Promise<void> => {
  try {
    const docId = getWeeklyScheduleDocId(weekStartDate);
    const scheduleRef = doc(db, "users", userId, "weeklySchedules", docId);

    const scheduleSnap = await getDoc(scheduleRef);
    if (!scheduleSnap.exists()) {
      await createWeeklySchedule(userId, weekStartDate);
    }

    await updateDoc(scheduleRef, {
      [`days.${day}.planId`]: planId || null,
      [`days.${day}.exerciseId`]: exerciseId || null,
      [`days.${day}.songId`]: songId || null,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating day schedule:", error);
    throw error;
  }
};

export const toggleDayCompletion = async (
  userId: string,
  weekStartDate: Date,
  day: DayOfWeek,
  completed: boolean
): Promise<void> => {
  try {
    const docId = getWeeklyScheduleDocId(weekStartDate);
    const scheduleRef = doc(db, "users", userId, "weeklySchedules", docId);

    const scheduleSnap = await getDoc(scheduleRef);
    if (!scheduleSnap.exists()) {
      await createWeeklySchedule(userId, weekStartDate);
    }

    await updateDoc(scheduleRef, {
      [`days.${day}.completed`]: completed,
      [`days.${day}.completedAt`]: completed ? serverTimestamp() : null,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error toggling day completion:", error);
    throw error;
  }
};

export const clearDaySchedule = async (
  userId: string,
  weekStartDate: Date,
  day: DayOfWeek
): Promise<void> => {
  try {
    const docId = getWeeklyScheduleDocId(weekStartDate);
    const scheduleRef = doc(db, "users", userId, "weeklySchedules", docId);

    await updateDoc(scheduleRef, {
      [`days.${day}.planId`]: null,
      [`days.${day}.exerciseId`]: null,
      [`days.${day}.songId`]: null,
      [`days.${day}.completed`]: false,
      [`days.${day}.completedAt`]: null,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error clearing day schedule:", error);
    throw error;
  }
};
