/*
========================================
28 GAME LAB
pages/index.js

首頁控制器

負責：
- 初始化玩家
- 處理每日登入
- 處理昨日反水
- 更新玩家資料 UI
- 更新七日登入 UI
- 顯示登入獎勵
- 顯示反水資訊
- 大廳 BGM
- 音效開關
- 遊戲紀錄入口
- 規則頁入口
- 倍場入口
- 重置本機資料
========================================
*/


import {
  ECONOMY_CONFIG
}
from "../config/economy.js";


import {
  ROOM_CONFIG
}
from "../config/rooms.js";


import {
  initializePlayer,
  getPlayer,
  savePlayer
}
from "../core/player.js";


import {
  processYesterdayRebate
}
from "../core/rebate.js";


import {
  clearGameStorage
}
from "../core/storage.js";


import {
  formatNumber,
  formatPercent
}
from "../utils/format.js";


/*
========================================
音訊
========================================
*/

const lobbyBgm =
  new Audio(
    "./assets/sounds/lobby.mp3"
  );


const clickSound =
  new Audio(
    "./assets/sounds/click.mp3"
  );


const enterRoomSound =
  new Audio(
    "./assets/sounds/enter-room.mp3"
  );


const loginRewardSound =
  new Audio(
    "./assets/sounds/login-reward.mp3"
  );


/*
========================================
音量
========================================
*/

lobbyBgm.loop = true;

lobbyBgm.volume = 0.35;


clickSound.volume = 0.5;

enterRoomSound.volume = 0.65;

loginRewardSound.volume = 0.7;


/*
========================================
全域狀態
========================================
*/

let player = null;

let loginReward = null;

let rebateResult = null;

let toastTimer = null;

let bgmStarted = false;


/*
========================================
DOM Helper
========================================
*/

function getElement(
  id
) {

  return document.getElementById(
    id
  );

}


/*
========================================
播放音效
========================================
*/

function playSound(
  audio
) {

  if (
    !player
    ||
    !player.soundEnabled
  ) {

    return;

  }


  audio.currentTime = 0;


  audio
    .play()
    .catch(
      () => {}
    );

}


/*
========================================
開始大廳 BGM
========================================
*/

function startLobbyBgm() {

  if (
    !player
    ||
    !player.soundEnabled
    ||
    bgmStarted
  ) {

    return;

  }


  lobbyBgm
    .play()
    .then(
      () => {

        bgmStarted = true;

      }
    )
    .catch(
      () => {}
    );

}


/*
========================================
停止大廳 BGM
========================================
*/

function stopLobbyBgm() {

  lobbyBgm.pause();

  bgmStarted = false;

}


/*
========================================
Toast
========================================
*/

function showToast(
  title,
  message,
  duration = 5000
) {

  const toast =
    getElement(
      "toast"
    );


  const titleElement =
    getElement(
      "toast-title"
    );


  const messageElement =
    getElement(
      "toast-message"
    );


  if (
    !toast
    ||
    !titleElement
    ||
    !messageElement
  ) {

    console.log(
      `[${title}] ${message}`
    );

    return;

  }


  titleElement.textContent =
    title;


  messageElement.textContent =
    message;


  toast.classList.add(
    "show"
  );


  clearTimeout(
    toastTimer
  );


  toastTimer =
    setTimeout(
      () => {

        toast.classList.remove(
          "show"
        );

      },
      duration
    );

}


/*
========================================
玩家基本資料 UI
========================================
*/

function renderPlayer() {

  if (!player) {

    return;

  }


  const balance =
    getElement(
      "balance"
    );


  if (balance) {

    balance.textContent =
      formatNumber(
        player.balance
      );

  }


  const streak =
    getElement(
      "streak"
    );


  if (streak) {

    const visibleStreak =
      loginReward?.loginDay === 7

      ? 7

      : player.loginStreak;


    streak.textContent =
      `${visibleStreak} / 7`;

  }


  const totalDays =
    getElement(
      "total-login-days"
    );


  if (totalDays) {

    totalDays.textContent =
      formatNumber(
        player.totalLoginDays
      );

  }


  const lastLogin =
    getElement(
      "last-login"
    );


  if (lastLogin) {

    lastLogin.textContent =
      player.lastLoginDate
      ??
      "-";

  }

}


/*
========================================
七日登入 UI
========================================
*/

function renderLoginDays() {

  const container =
    getElement(
      "login-days"
    );


  if (
    !container
    ||
    !player
  ) {

    return;

  }


  container.innerHTML =
    "";


  let progress =
    player.loginStreak;


  if (
    loginReward?.loginDay
    ===
    ECONOMY_CONFIG
      .loginStreakDays
  ) {

    progress =
      ECONOMY_CONFIG
        .loginStreakDays;

  }


  for (
    let day = 1;
    day <=
    ECONOMY_CONFIG
      .loginStreakDays;
    day++
  ) {

    const card =
      document.createElement(
        "div"
      );


    card.className =
      "day-card";


    if (
      day <= progress
    ) {

      card.classList.add(
        "completed"
      );

    }


    if (
      day === progress
      &&
      progress
      <
      ECONOMY_CONFIG
        .loginStreakDays
    ) {

      card.classList.add(
        "current"
      );

    }


    if (
      day
      ===
      ECONOMY_CONFIG
        .loginStreakDays
    ) {

      card.classList.add(
        "final"
      );

    }


    const bonusText =
      day
      ===
      ECONOMY_CONFIG
        .loginStreakDays

      ? `
        <span class="bonus">
          額外 +${formatNumber(
            ECONOMY_CONFIG
              .loginStreakBonus
          )}
        </span>
      `

      : "";


    card.innerHTML = `

      <span class="day">
        DAY ${day}
      </span>

      <span class="reward">
        +${formatNumber(
          ECONOMY_CONFIG
            .dailyLoginReward
        )}
      </span>

      ${bonusText}

    `;


    container.appendChild(
      card
    );

  }

}


/*
========================================
登入獎勵提示
========================================
*/

function announceLoginReward() {

  if (!loginReward) {

    return;

  }


  playSound(
    loginRewardSound
  );


  /*
  首次建立玩家
  */

  if (
    loginReward.type
    ===
    "initial"
  ) {

    showToast(

      "歡迎加入 28 GAME LAB",

      `首次登入獲得 ${formatNumber(
        loginReward.amount
      )} 代幣。`

    );


    return;

  }


  /*
  七日登入
  */

  if (
    loginReward.streakBonus
    >
    0
  ) {

    showToast(

      "連續登入第 7 天",

      `每日登入 +${formatNumber(
        loginReward.daily
      )}，七日額外獎勵 +${formatNumber(
        loginReward.streakBonus
      )}，共獲得 ${formatNumber(
        loginReward.amount
      )} 代幣。`,

      7000

    );


    return;

  }


  /*
  普通每日登入
  */

  showToast(

    `連續登入第 ${loginReward.loginDay} 天`,

    `今日登入獎勵 +${formatNumber(
      loginReward.daily
    )} 代幣。`

  );

}


/*
========================================
反水提示
========================================
*/

function announceRebate() {

  if (!rebateResult) {

    return;

  }


  if (
    rebateResult.reason
    ===
    "no-statistics"
  ) {

    return;

  }


  if (
    rebateResult.reason
    ===
    "already-processed"
  ) {

    return;

  }


  if (
    !rebateResult.eligible
  ) {

    return;

  }


  const typeLabel =
    rebateResult.type
    ===
    "loss"

    ? "虧損反水"

    : "盈利反水";


  let message =
    `昨日有效下注 ${formatNumber(
      rebateResult.validBet
    )}，`;


  message +=
    `昨日淨盈虧 ${
      rebateResult.netProfit >= 0
        ? "+"
        : ""
    }${formatNumber(
      rebateResult.netProfit
    )}，`;


  message +=
    `反水比例 ${formatPercent(
      rebateResult.rate
    )}，`;


  message +=
    `獲得 ${formatNumber(
      rebateResult.amount
    )} 代幣。`;


  if (
    rebateResult.capped
  ) {

    message +=
      " 已套用虧損反水上限。";

  }


  showToast(
    typeLabel,
    message,
    7000
  );

}


/*
========================================
房間卡片
========================================
*/

function renderRoomCards() {

  document
    .querySelectorAll(
      "[data-room]"
    )
    .forEach(
      button => {

        const roomId =
          button.dataset.room;


        const room =
          ROOM_CONFIG[
            roomId
          ];


        if (!room) {

          button.disabled =
            true;

          return;

        }


        const card =
          button.closest(
            ".room-card"
          );


        if (
          card
          &&
          room.image
        ) {

          card.style.backgroundImage =
            `
              linear-gradient(
                rgba(10, 15, 24, 0.45),
                rgba(10, 15, 24, 0.88)
              ),
              url("${room.image}")
            `;


          card.style.backgroundSize =
            "cover";


          card.style.backgroundPosition =
            "center";

        }

      }
    );

}


/*
========================================
房間按鈕
========================================
*/

function setupRoomButtons() {

  document
    .querySelectorAll(
      "[data-room]"
    )
    .forEach(
      button => {

        button.addEventListener(

          "click",

          () => {

            const roomId =
              button.dataset.room;


            const room =
              ROOM_CONFIG[
                roomId
              ];


            if (!room) {

              showToast(
                "錯誤",
                "找不到這個倍場。"
              );

              return;

            }


            playSound(
              clickSound
            );


            lobbyBgm.pause();


            playSound(
              enterRoomSound
            );


            setTimeout(
              () => {

                window.location.href =
                  `./game.html?room=${encodeURIComponent(
                    roomId
                  )}`;

              },
              180
            );

          }

        );

      }
    );

}


/*
========================================
遊戲紀錄按鈕
========================================
*/

function setupHistoryButton() {

  const button =
    getElement(
      "history-button"
    );


  if (!button) {

    return;

  }


  button.addEventListener(
    "click",
    () => {

      playSound(
        clickSound
      );


      stopLobbyBgm();


      setTimeout(
        () => {

          window.location.href =
            "./history.html";

        },
        120
      );

    }
  );

}


/*
========================================
規則頁按鈕
========================================
*/

function setupRulesButton() {

  const button =
    getElement(
      "rules-button"
    );


  if (!button) {

    return;

  }


  button.addEventListener(
    "click",
    () => {

      playSound(
        clickSound
      );


      stopLobbyBgm();


      setTimeout(
        () => {

          window.location.href =
            "./rules.html";

        },
        120
      );

    }
  );

}


/*
========================================
聲音按鈕
========================================
*/

function setupSoundToggle() {

  const button =
    getElement(
      "sound-toggle"
    );


  if (!button) {

    return;

  }


  const icon =
    button.querySelector(
      "img"
    );


  function renderSoundState() {

    if (icon) {

      icon.src =
        player.soundEnabled

        ? "./assets/icons/sound-on.svg"

        : "./assets/icons/sound-off.svg";


      icon.alt =
        player.soundEnabled

        ? "關閉聲音"

        : "開啟聲音";

    }


    button.setAttribute(
      "aria-label",

      player.soundEnabled
      ? "關閉聲音"
      : "開啟聲音"
    );

  }


  button.addEventListener(

    "click",

    () => {

      if (
        player.soundEnabled
      ) {

        playSound(
          clickSound
        );

      }


      player.soundEnabled =
        !player.soundEnabled;


      savePlayer(
        player
      );


      renderSoundState();


      if (
        player.soundEnabled
      ) {

        startLobbyBgm();

      }

      else {

        stopLobbyBgm();

      }

    }

  );


  renderSoundState();

}


/*
========================================
瀏覽器自動播放限制
========================================
*/

function setupBgmAutoplayUnlock() {

  if (
    !player.soundEnabled
  ) {

    return;

  }


  const unlock =
    () => {

      startLobbyBgm();


      document.removeEventListener(
        "click",
        unlock
      );


      document.removeEventListener(
        "touchstart",
        unlock
      );


      document.removeEventListener(
        "keydown",
        unlock
      );

    };


  document.addEventListener(
    "click",
    unlock
  );


  document.addEventListener(
    "touchstart",
    unlock
  );


  document.addEventListener(
    "keydown",
    unlock
  );

}


/*
========================================
全域 Click Sound

避免 data-room、
history、rules、
sound-toggle 重複播放。
========================================
*/

function setupGlobalClickSounds() {

  document
    .querySelectorAll(
      "button"
    )
    .forEach(
      button => {

        if (
          button.matches(
            "[data-room]"
          )
          ||
          button.id
          ===
          "sound-toggle"
          ||
          button.id
          ===
          "history-button"
          ||
          button.id
          ===
          "rules-button"
        ) {

          return;

        }


        button.addEventListener(
          "click",
          () => {

            playSound(
              clickSound
            );

          }
        );

      }
    );

}


/*
========================================
重置本機遊戲資料
========================================
*/

function setupResetButton() {

  const button =
    getElement(
      "reset-button"
    );


  if (!button) {

    return;

  }


  button.addEventListener(

    "click",

    () => {

      const confirmed =
        window.confirm(
          "確定要重置所有本機遊戲資料嗎？\n\n代幣、登入紀錄、遊戲統計與反水紀錄都會被清除。"
        );


      if (!confirmed) {

        return;

      }


      stopLobbyBgm();


      clearGameStorage();


      window.location.reload();

    }

  );

}


/*
========================================
頁面 Lifecycle
========================================
*/

function setupPageLifecycle() {

  window.addEventListener(
    "pagehide",
    () => {

      lobbyBgm.pause();

    }
  );


  window.addEventListener(
    "pageshow",
    event => {

      if (
        !event.persisted
      ) {

        return;

      }


      const latestPlayer =
        getPlayer();


      if (
        latestPlayer
      ) {

        player =
          latestPlayer;


        renderPlayer();

        renderLoginDays();

      }

    }
  );

}


/*
========================================
初始化首頁
========================================
*/

function init() {

  /*
  ================================
  1. 初始化玩家
  ================================
  */

  const playerResult =
    initializePlayer();


  player =
    playerResult.player;


  loginReward =
    playerResult.reward;


  /*
  ================================
  2. 處理昨日反水
  ================================
  */

  rebateResult =
    processYesterdayRebate();


  /*
  ================================
  3. 重新讀取玩家
  ================================
  */

  const refreshedPlayer =
    getPlayer();


  if (
    refreshedPlayer
  ) {

    player =
      refreshedPlayer;

  }


  /*
  舊版資料相容
  */

  if (
    typeof player.soundEnabled
    !==
    "boolean"
  ) {

    player.soundEnabled =
      true;


    savePlayer(
      player
    );

  }


  /*
  ================================
  4. 渲染 UI
  ================================
  */

  renderPlayer();

  renderLoginDays();

  renderRoomCards();


  /*
  ================================
  5. 建立互動
  ================================
  */

  setupRoomButtons();

  setupHistoryButton();

  setupRulesButton();

  setupSoundToggle();

  setupGlobalClickSounds();

  setupResetButton();

  setupBgmAutoplayUnlock();

  setupPageLifecycle();


  /*
  ================================
  6. 顯示登入與反水
  ================================
  */

  announceLoginReward();


  if (
    rebateResult?.eligible
  ) {

    setTimeout(
      () => {

        announceRebate();

      },
      loginReward
        ? 5600
        : 300
    );

  }

}


/*
========================================
啟動
========================================
*/

init();
