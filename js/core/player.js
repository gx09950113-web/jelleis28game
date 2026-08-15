import {
  ECONOMY_CONFIG
}
from "../config/economy.js";

import {
  getStorage,
  setStorage
}
from "./storage.js";

import {
  getLocalDateString,
  getDayDifference
}
from "./date.js";


const PLAYER_KEY = "player";


export function getPlayer() {
  return getStorage(
    PLAYER_KEY
  );
}


export function savePlayer(
  player
) {
  setStorage(
    PLAYER_KEY,
    player
  );
}


export function createPlayer() {
  const today =
    getLocalDateString();

  const player = {
    balance:
      ECONOMY_CONFIG.initialBalance,

    lastLoginDate:
      today,

    loginStreak:
      1,

    totalLoginDays:
      1,

    soundEnabled:
      true,

    createdAt:
      Date.now()
  };

  savePlayer(player);

  return {
    player,

    reward: {
      type: "initial",

      amount:
        ECONOMY_CONFIG.initialBalance,

      loginDay: 1
    }
  };
}


export function processDailyLogin(
  player
) {
  const today =
    getLocalDateString();

  const difference =
    getDayDifference(
      player.lastLoginDate,
      today
    );

  /*
    今天已經登入過。
  */
  if (difference <= 0) {
    return {
      player,
      reward: null
    };
  }

  /*
    昨天有登入。
  */
  if (difference === 1) {
    player.loginStreak += 1;
  }

  /*
    中斷至少一天。
  */
  else {
    player.loginStreak = 1;
  }

  const loginDay =
    player.loginStreak;

  let streakBonus = 0;

  player.balance +=
    ECONOMY_CONFIG
      .dailyLoginReward;

  player.totalLoginDays += 1;

  player.lastLoginDate =
    today;

  if (
    player.loginStreak
    >=
    ECONOMY_CONFIG
      .loginStreakDays
  ) {
    streakBonus =
      ECONOMY_CONFIG
        .loginStreakBonus;

    player.balance +=
      streakBonus;

    /*
      七日週期完成，
      下一輪重新計算。
    */
    player.loginStreak = 0;
  }

  savePlayer(player);

  return {
    player,

    reward: {
      type: "daily",

      daily:
        ECONOMY_CONFIG
          .dailyLoginReward,

      streakBonus,

      amount:
        ECONOMY_CONFIG
          .dailyLoginReward
        +
        streakBonus,

      loginDay
    }
  };
}


export function initializePlayer() {
  let player =
    getPlayer();

  if (!player) {
    return createPlayer();
  }

  return processDailyLogin(
    player
  );
}
