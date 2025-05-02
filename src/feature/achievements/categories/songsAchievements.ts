import type { AchievementCheckerReturnType } from "feature/achievements/types";
import type { SongListInterface } from "src/pages/api/user/report";

export const checkWannaLearn1 = (songLists: SongListInterface) : AchievementCheckerReturnType => {
  if (songLists.wantToLearn.length >= 1) return "wannaLearn1";
  
  return undefined;
};

export const checkWannaLearn3 = (songLists: SongListInterface) : AchievementCheckerReturnType => {
  if (songLists.wantToLearn.length >= 3) return "wannaLearn2";
  
  return undefined;
};

export const checkWannaLearn5 = (songLists: SongListInterface) : AchievementCheckerReturnType => {
  if (songLists.wantToLearn.length >= 5) return "wannaLearn3";
  
  return undefined;
};

export const checkWannaLearn10 = (songLists: SongListInterface) : AchievementCheckerReturnType => {
  if (songLists.wantToLearn.length >= 10) return "wannaLearn10";
  
  return undefined;
};



export const checkWannaLearn30 = (songLists: SongListInterface) : AchievementCheckerReturnType => {
  if (songLists.wantToLearn.length >= 30) return "wannaLearn30";
  
  return undefined;
};



export const checkLearning1 = (songLists: SongListInterface) : AchievementCheckerReturnType => {
  if (songLists.learning.length >= 1) return "learning1";
  
  return undefined;
};

export const checkLearning3 = (songLists: SongListInterface) : AchievementCheckerReturnType => {
  if (songLists.learning.length >= 3) return "learning3";
  
  return undefined;
};

export const checkLearning5 = (songLists: SongListInterface) : AchievementCheckerReturnType => {
  if (songLists.learning.length >= 5) return "learning5";
  
  return undefined;
};


export const checkLearning10 = (songLists: SongListInterface) : AchievementCheckerReturnType => {
  if (songLists.learning.length >= 10) return "learning10";
  
  return undefined;
};


export const checkLearned1 = (songLists: SongListInterface) : AchievementCheckerReturnType => {
  if (songLists.learned.length >= 1) return "learned1";
  
  return undefined;
};

export const checkLearned3 = (songLists: SongListInterface) : AchievementCheckerReturnType => {
  if (songLists.learned.length >= 3) return "learned3";
  
  return undefined;
};

export const checkLearned5 = (songLists: SongListInterface) : AchievementCheckerReturnType => {
  if (songLists.learned.length >= 5) return "learned5";
  
  return undefined;
};

export const checkLearned10 = (songLists: SongListInterface) : AchievementCheckerReturnType => {
  if (songLists.learned.length >= 10) return "learned10";
  
  return undefined;
};

export const checkLearned20 = (songLists: SongListInterface) : AchievementCheckerReturnType => {
  if (songLists.learned.length >= 20) return "learned20";
  
  return undefined;
};

export const checkLearned30 = (songLists: SongListInterface) : AchievementCheckerReturnType => {
  if (songLists.learned.length >= 30) return "learned30";
  
  return undefined;
};


export const checkLearned50 = (songLists: SongListInterface) : AchievementCheckerReturnType => {
  if (songLists.learned.length >= 50) return "learned50";
  
  return undefined;
};

export const checkLearned100 = (songLists: SongListInterface) : AchievementCheckerReturnType => {
  if (songLists.learned.length >= 100) return "learned100";
  
  return undefined;
};












