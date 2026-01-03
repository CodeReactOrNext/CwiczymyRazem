import type { PayloadAction } from "@reduxjs/toolkit";
import { createSlice, isAnyOf } from "@reduxjs/toolkit";
import { statisticsInitial } from "constants/userStatisticsInitialData";
import Router from "next/router";
import type { RootState } from "store/store";
import type {
  StatisticsDataInterface,
  TimerInterface,
  userSliceInitialState,
  ActiveChallenge,
  DailyQuest,
  DailyQuestTask,
  DailyQuestTaskType,
  StatisticsTime,
} from "types/api.types";
import type { SkillsType } from "types/skillsTypes";

import {
  autoLogIn,
  changeUserDisplayName,
  createAccount,
  getUserProvider,
  logInViaEmail,
  logInViaGoogle,
  logInViaGoogleCredential,
  logUserOff,
  restartUserStats,
  updateUserEmail,
  updateUserPassword,
  updateUserStats,
  uploadUserAvatar,
  uploadUserSocialData,
  rateSong,
  saveActiveChallenge,
  checkAndSaveChallengeProgress,
} from "./userSlice.asyncThunk";
import { challengesList } from "feature/challenges/data/challengesList";


const initialState: userSliceInitialState = {
  userInfo: null,
  userAuth: null,
  currentUserStats: null,
  previousUserStats: null,
  raitingData: null,
  isFetching: null,
  isLoggedOut: null,
  timer: { creativity: 0, hearing: 0, technique: 0, theory: 0 },
  providerData: {
    providerId: null,
    uid: null,
    displayName: null,
    email: null,
    photoURL: null,
  },
};

export const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    addUserAuth: (state, { payload }: PayloadAction<"string">) => {
      state.userAuth = payload;
    },
    addUserData: (
      state,
      { payload }: PayloadAction<StatisticsDataInterface>
    ) => {
      state.currentUserStats = payload;
    },
    addPracticeData: (
      state,
      { payload }: PayloadAction<StatisticsDataInterface>
    ) => {
      state.currentUserStats = payload;
    },


    updateLocalTimer: (state, { payload }: PayloadAction<TimerInterface>) => {
      if (!payload) {
        return;
      }
      state.timer = payload;
    },

    updateTimerTime: (
      state,
      { payload }: PayloadAction<{ type: SkillsType; time: number }>
    ) => {
      if (payload.type === "technique") {
        state.timer.technique = payload.time;
      }
      if (payload.type === "creativity") {
        state.timer.creativity = payload.time;
      }
      if (payload.type === "hearing") {
        state.timer.hearing = payload.time;
      }
      if (payload.type === "theory") {
        state.timer.theory = payload.time;
      }
    },
    increaseTimerTime: (
      state,
      { payload }: PayloadAction<{ type: SkillsType; time: number }>
    ) => {
      if (!state.timer) {
        state.timer = { creativity: 0, hearing: 0, technique: 0, theory: 0 };
      }
      if (payload.type === "technique") {
        state.timer.technique += payload.time;
      }
      if (payload.type === "creativity") {
        state.timer.creativity += payload.time;
      }
      if (payload.type === "hearing") {
        state.timer.hearing += payload.time;
      }
      if (payload.type === "theory") {
        state.timer.theory += payload.time;
      }
    },
    updatePoints: (state, { payload }: PayloadAction<number>) => {
      if (state.currentUserStats) {
        state.currentUserStats.points = (state.currentUserStats.points || 0) + payload;
      }
    },
    setActiveChallenge: (state, { payload }: PayloadAction<ActiveChallenge | null>) => {
      if (state.currentUserStats) {
        state.currentUserStats.activeChallenge = payload;
      }
    },
    generateDailyQuest: (state) => {
      if (!state.currentUserStats) return;
      const today = new Date().toISOString().split('T')[0];

      // If quest exists for today, do nothing
      if (state.currentUserStats.dailyQuest?.date === today) return;

      // Templates
      const taskTemplates: { type: DailyQuestTaskType; title: string; target: number }[] = [
        { type: 'rate_song', title: 'Rate a Song', target: 1 },
        { type: 'add_want_to_learn', title: 'Add song to "Want to Learn"', target: 1 },
        { type: 'practice_any_song', title: 'Practice any Song', target: 1 },
        { type: 'healthy_habits', title: 'Use 2 Healthy Habits', target: 2 },
        { type: 'auto_plan', title: 'Generate & Practice Auto Plan', target: 1 },
        { type: 'practice_plan', title: 'Complete a Practice Plan', target: 1 },
      ];

      // Shuffle and pick 3
      const shuffled = [...taskTemplates].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, 3);

      const newQuest: DailyQuest = {
        date: today,
        isRewardClaimed: false,
        tasks: selected.map((t, index) => ({
          id: `quest_${today}_${index}`,
          type: t.type,
          title: t.title,
          isCompleted: false,
          progress: 0,
          target: t.target
        }))
      };

      state.currentUserStats.dailyQuest = newQuest;
    },
    completeQuestTask: (state, { payload }: PayloadAction<{ type: DailyQuestTaskType; amount?: number }>) => {
      if (!state.currentUserStats?.dailyQuest) return;

      // Check if today
      const today = new Date().toISOString().split('T')[0];
      if (state.currentUserStats.dailyQuest.date !== today) return;

      const quest = state.currentUserStats.dailyQuest;

      const task = quest.tasks.find(t => t.type === payload.type);
      if (task && !task.isCompleted) {
        const amount = payload.amount || 1;
        task.progress = Math.min(task.progress + amount, task.target);
        if (task.progress >= task.target) {
          task.isCompleted = true;
        }
      }
    },
    claimQuestReward: (state) => {
      if (!state.currentUserStats?.dailyQuest) return;
      const quest = state.currentUserStats.dailyQuest;

      const allCompleted = quest.tasks.every(t => t.isCompleted);
      if (allCompleted && !quest.isRewardClaimed) {
        quest.isRewardClaimed = true;
        state.currentUserStats.points = (state.currentUserStats.points || 0) + 100;
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(rateSong.pending, (state, action) => {
        if (state.currentUserStats && action.meta.arg.isNewRating) {
          state.currentUserStats.points = (state.currentUserStats.points || 0) + 25;
        }
      })
      .addCase(rateSong.rejected, (state, action) => {
        if (state.currentUserStats && action.meta.arg.isNewRating) {
          state.currentUserStats.points = (state.currentUserStats.points || 0) - 25;
        }
      })
      .addCase(saveActiveChallenge.fulfilled, (state, { payload }) => {
        if (state.currentUserStats) {
          state.currentUserStats.activeChallenge = payload;
        }
      })
      .addCase(checkAndSaveChallengeProgress.fulfilled, (state, { payload }) => {
        if (!state.currentUserStats || !payload) return;

        const { challenge, challengeFinished, pointsToAdd, rewardSkillId } = payload;

        if (rewardSkillId) {
          if (!state.currentUserStats.skills) {
            state.currentUserStats.skills = { unlockedSkills: {} };
          }
          const currentLevel = state.currentUserStats.skills.unlockedSkills[rewardSkillId] || 0;
          state.currentUserStats.skills.unlockedSkills[rewardSkillId] = currentLevel + 1;
        }

        if (challengeFinished) {
          state.currentUserStats.activeChallenge = null;

          if (!state.currentUserStats.completedChallenges) {
            state.currentUserStats.completedChallenges = [];
          }
          if (!state.currentUserStats.completedChallenges.includes(challenge.challengeId)) {
            state.currentUserStats.completedChallenges.push(challenge.challengeId);
          }

          if (pointsToAdd > 0) {
            state.currentUserStats.points = (state.currentUserStats.points || 0) + pointsToAdd;
          }
        } else {
          state.currentUserStats.activeChallenge = challenge;
        }
      })
      .addCase(logInViaGoogle.pending, (state) => {
        state.isFetching = "google";
      })
      .addCase(logInViaGoogleCredential.pending, (state) => {
        state.isFetching = "google";
      })
      .addCase(logInViaEmail.pending, (state) => {
        state.isFetching = "email";
      })
      .addCase(createAccount.pending, (state) => {
        state.isFetching = "createAccount";
      })
      .addCase(updateUserStats.fulfilled, (state, { payload }) => {
        state.timer.technique = 0;
        state.timer.creativity = 0;
        state.timer.hearing = 0;
        state.timer.theory = 0;

        if (payload?.currentUserStats && state.currentUserStats) {
          const prevStats = { ...state.currentUserStats };

          const currentActiveChallenge = prevStats?.activeChallenge;
          const currentDailyQuest = prevStats?.dailyQuest;
          const currentSkills = prevStats?.skills;
          const currentAvailablePoints = prevStats?.availablePoints;
          const today = new Date().toISOString().split('T')[0];

          state.currentUserStats = {
            ...payload.currentUserStats,
            activeChallenge: currentActiveChallenge || payload.currentUserStats.activeChallenge,
            dailyQuest: (currentDailyQuest && currentDailyQuest.date === today) ? currentDailyQuest : payload.currentUserStats.dailyQuest,
            skills: currentSkills || payload.currentUserStats.skills,
            availablePoints: currentAvailablePoints || payload.currentUserStats.availablePoints,
          };

          state.previousUserStats = prevStats;

          // SKILL REWARD LOGIC: Every category practiced today gives +1 level to its master skill
          const isNewDayReport = prevStats?.lastReportDate?.split('T')[0] !== today;

          if (isNewDayReport && state.currentUserStats.skills) {
            const skills = { ...state.currentUserStats.skills };
            if (!skills.unlockedSkills) skills.unlockedSkills = {};

            const masterSkillMap: Record<string, string> = {
              technique: "alternate_picking",
              theory: "music_theory",
              hearing: "ear_training",
              creativity: "improvisation"
            };

            let pointsAwarded = false;
            Object.entries(masterSkillMap).forEach(([cat, skillId]) => {
              const categoryKey = cat as keyof StatisticsTime;
              const prevTime = prevStats?.time?.[categoryKey] || 0;
              const currTime = state.currentUserStats?.time?.[categoryKey] || 0;

              if (currTime > prevTime) {
                skills.unlockedSkills[skillId] = (skills.unlockedSkills[skillId] || 0) + 1;
                pointsAwarded = true;
              }
            });

            if (pointsAwarded) {
              state.currentUserStats.skills = skills;
            }
          }
        }

        state.raitingData = payload.raitingData;
        state.isFetching = null;
      })
      .addCase(restartUserStats.fulfilled, (state) => {
        state.currentUserStats = statisticsInitial;
        state.isFetching = null;
        state.previousUserStats = null;
        state.raitingData = null;
        state.timer = { creativity: 0, hearing: 0, technique: 0, theory: 0 };
      })
      .addCase(logUserOff.fulfilled, (state) => {
        state.isLoggedOut = true;
        state.userAuth = null;
        state.userInfo = null;
        state.currentUserStats = null;
        state.previousUserStats = null;
        state.raitingData = null;
        state.timer = { creativity: 0, hearing: 0, technique: 0, theory: 0 };
      })
      .addCase(getUserProvider.fulfilled, (state, action) => {
        state.isFetching = null;
        state.providerData = action.payload;
      })
      .addCase(changeUserDisplayName.fulfilled, (state, { payload }) => {
        state.isFetching = null;
        state.userInfo = {
          ...state.userInfo,
          displayName: payload,
        };
      })
      .addCase(uploadUserAvatar.fulfilled, (state, action) => {
        state.isFetching = null;
        state.userInfo = { ...state.userInfo, ...action.payload.avatar };
      })

      .addMatcher(
        isAnyOf(
          updateUserStats.pending,
          uploadUserAvatar.pending,
          restartUserStats.pending,
          changeUserDisplayName.pending,
          updateUserPassword.pending,
          updateUserEmail.pending,
          uploadUserSocialData.pending
        ),
        (state) => {
          state.isFetching = "updateData";
        }
      )
      .addMatcher(
        isAnyOf(
          updateUserEmail.fulfilled,
          updateUserPassword.fulfilled,
          uploadUserSocialData.fulfilled,
          uploadUserSocialData.fulfilled,
          updateUserStats.rejected,
          restartUserStats.rejected,
          changeUserDisplayName.rejected,
          updateUserPassword.rejected,
          updateUserEmail.rejected,
          uploadUserAvatar.rejected,
          logInViaEmail.rejected,
          logInViaGoogle.rejected,
          logInViaGoogleCredential.rejected,
          createAccount.rejected,
          uploadUserSocialData.rejected
        ),
        (state) => {
          state.isFetching = null;
        }
      )

      .addMatcher(
        isAnyOf(
          logInViaGoogle.fulfilled,
          logInViaGoogleCredential.fulfilled,
          logInViaEmail.fulfilled,
          createAccount.fulfilled,
          autoLogIn.fulfilled
        ),
        (state, action) => {
          state.isFetching = null;
          state.userInfo = action.payload.userInfo;
          state.currentUserStats = action.payload.currentUserStats;
          state.userAuth = action.payload.userAuth;
        }
      );
  },
});

export const {
  addUserAuth,
  addUserData,
  updateTimerTime,
  increaseTimerTime,
  updateLocalTimer,
  updatePoints,
  setActiveChallenge,
  generateDailyQuest,
  completeQuestTask,
  claimQuestReward
} = userSlice.actions;

export const selectUserAuth = (state: RootState) => state.user.userAuth;
export const selectCurrentUserStats = (state: RootState) =>
  state.user.currentUserStats;
export const selectPreviousUserStats = (state: RootState) =>
  state.user.previousUserStats;
export const selectIsFetching = (state: RootState) => state.user.isFetching;
export const selectRaitingData = (state: RootState) => state.user.raitingData;
export const selectTimerData = (state: RootState) => state.user.timer;
export const selectUserName = (state: RootState) =>
  state.user.userInfo?.displayName;
export const selectUserInfo = (state: RootState) => state.user.userInfo;
export const selectUserAvatar = (state: RootState) =>
  state.user.userInfo?.avatar;
export const selectActiveChallenge = (state: RootState) =>
  state.user.currentUserStats?.activeChallenge;
export const selectDailyQuest = (state: RootState) =>
  state.user.currentUserStats?.dailyQuest;
export const selectIsLoggedOut = (state: RootState) => state.user.isLoggedOut;

export default userSlice.reducer;
