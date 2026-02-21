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

export const addItemToDaySchedule = async (
  userId: string,
  weekStartDate: Date,
  day: DayOfWeek,
  item: { id: string; type: "plan" | "exercise" | "song" }
): Promise<void> => {
  try {
    const docId = getWeeklyScheduleDocId(weekStartDate);
    const scheduleRef = doc(db, "users", userId, "weeklySchedules", docId);

    const scheduleSnap = await getDoc(scheduleRef);
    if (!scheduleSnap.exists()) {
      await createWeeklySchedule(userId, weekStartDate);
    }

    const currentScheduleRef = await getDoc(scheduleRef);
    const currentData = currentScheduleRef.exists() ? (currentScheduleRef.data() as WeeklySchedule) : null;
    const currentDaySchedule = currentData?.days[day] || { completed: false };
    const currentItems = currentDaySchedule.items || [];

    // Migrate old fields to items if they exist and items is empty
    const itemsToSave = [...currentItems];
    if (itemsToSave.length === 0) {
      if (currentDaySchedule.planId) itemsToSave.push({ id: currentDaySchedule.planId, type: "plan", completed: currentDaySchedule.completed });
      if (currentDaySchedule.exerciseId) itemsToSave.push({ id: currentDaySchedule.exerciseId, type: "exercise", completed: currentDaySchedule.completed });
      if (currentDaySchedule.songId) itemsToSave.push({ id: currentDaySchedule.songId, type: "song", completed: currentDaySchedule.completed });
    }

    // Add new item if not already there
    if (!itemsToSave.find(i => i.id === item.id)) {
      itemsToSave.push({ ...item, completed: false });
    }

    // Update legacy fields for compatibility (using the first item)
    const firstItem = itemsToSave[0];
    const updates: any = {
      [`days.${day}.items`]: itemsToSave,
      [`days.${day}.planId`]: firstItem?.type === "plan" ? firstItem.id : null,
      [`days.${day}.exerciseId`]: firstItem?.type === "exercise" ? firstItem.id : null,
      [`days.${day}.songId`]: firstItem?.type === "song" ? firstItem.id : null,
      updatedAt: serverTimestamp(),
    };

    await updateDoc(scheduleRef, updates);
  } catch (error) {
    console.error("Error adding item to day schedule:", error);
    throw error;
  }
};

export const removeItemFromDaySchedule = async (
  userId: string,
  weekStartDate: Date,
  day: DayOfWeek,
  itemId: string
): Promise<void> => {
  try {
    const docId = getWeeklyScheduleDocId(weekStartDate);
    const scheduleRef = doc(db, "users", userId, "weeklySchedules", docId);

    const scheduleSnap = await getDoc(scheduleRef);
    if (!scheduleSnap.exists()) return;

    const currentData = scheduleSnap.data() as WeeklySchedule;
    const currentDaySchedule = currentData.days[day];
    const currentItems = currentDaySchedule.items || [];

    const updatedItems = currentItems.filter((i) => i.id !== itemId);

    const updates: any = {
      [`days.${day}.items`]: updatedItems,
      updatedAt: serverTimestamp(),
    };

    // Update legacy fields
    if (updatedItems.length === 0) {
      updates[`days.${day}.planId`] = null;
      updates[`days.${day}.exerciseId`] = null;
      updates[`days.${day}.songId`] = null;
    } else {
      const firstItem = updatedItems[0];
      updates[`days.${day}.planId`] = firstItem.type === "plan" ? firstItem.id : null;
      updates[`days.${day}.exerciseId`] = firstItem.type === "exercise" ? firstItem.id : null;
      updates[`days.${day}.songId`] = firstItem.type === "song" ? firstItem.id : null;
    }

    await updateDoc(scheduleRef, updates);
  } catch (error) {
    console.error("Error removing item from day schedule:", error);
    throw error;
  }
};

export const toggleItemCompletion = async (
  userId: string,
  weekStartDate: Date,
  day: DayOfWeek,
  itemId: string,
  completed: boolean
): Promise<void> => {
  try {
    const docId = getWeeklyScheduleDocId(weekStartDate);
    const scheduleRef = doc(db, "users", userId, "weeklySchedules", docId);

    const scheduleSnap = await getDoc(scheduleRef);
    if (!scheduleSnap.exists()) return;

    const currentData = scheduleSnap.data() as WeeklySchedule;
    const currentDaySchedule = currentData.days[day];
    const currentItems = currentDaySchedule.items || [];

    const updatedItems = currentItems.map((item) =>
      item.id === itemId
        ? { ...item, completed, completedAt: completed ? Timestamp.now() : null }
        : item
    );

    // If all items are completed, mark the day as completed
    const allCompleted = updatedItems.length > 0 && updatedItems.every((i) => i.completed);

    await updateDoc(scheduleRef, {
      [`days.${day}.items`]: updatedItems,
      [`days.${day}.completed`]: allCompleted,
      [`days.${day}.completedAt`]: allCompleted ? serverTimestamp() : null,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error toggling item completion:", error);
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
      [`days.${day}.items`]: [],
      [`days.${day}.completed`]: false,
      [`days.${day}.completedAt`]: null,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error clearing day schedule:", error);
    throw error;
  }
};
