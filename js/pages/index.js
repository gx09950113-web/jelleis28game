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
- 倍場入口
- 重置本機資料

不負責：
- 開獎
- 下注
- 遊戲結算
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
大廳 BGM 設定
*/

lobbyBgm.loop = true;

lobbyBgm.volume = 0.35;


/*
UI 音效音量
*/

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

function getElement(id) {

  return document.getElementById(
    id
  );

}


/*
========================================
播放音效
========================================
*/

function playSound(audio) {

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


  /*
  如果目前 HTML 沒有 Toast，
  就 fallback 到 console。
  */

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

    /*
    如果剛領完第七天，
    player.loginStreak 已經變 0。

    但首頁當下仍然可以顯示 7 / 7。
    */

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


  container.innerHTML = "";


  let progress =
    player.loginStreak;


  /*
  剛領完第七天時，
  仍顯示七格完成。
  */

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
    day <= ECONOMY_CONFIG.loginStreakDays;
    day++
  ) {

    const card =
      document.createElement(
        "div"
      );


    card.className =
      "day-card";


    /*
    已完成
    */

    if (
      day <= progress
    ) {

      card.classList.add(
        "completed"
      );

    }


    /*
    今日位置
    */

    if (
      day === progress
      &&
      progress
      <
      ECONOMY_CONFIG.loginStreakDays
    ) {

      card.classList.add(
        "current"
      );

    }


    /*
    第七天
    */

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
  七日獎勵
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


  /*
  沒有昨日統計
  */

  if (
    rebateResult.reason
    ===
    "no-statistics"
  ) {

    return;

  }


  /*
  已處理過
  不重複提示。
  */

  if (
    rebateResult.reason
    ===
    "already-processed"
  ) {

    return;

  }


  /*
  沒達標
  */

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


  /*
  如果觸發虧損反水上限
  */

  if (
    rebateResult.capped
  ) {

    message +=
      ` 已套用虧損反水上限。`;

  }


  showToast(
    typeLabel,
    message,
    7000
  );

}


/*
========================================
房間卡片資料
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


        /*
        如果 HTML 有對應 room card，
        可以自動放背景圖。

        預期結構：
        <article class="room-card">
        */

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


            /*
            避免 BGM 與進場音重疊太多
            */

            lobbyBgm.pause();


            playSound(
              enterRoomSound
            );


            /*
            稍微留一點時間
            讓進場音效播放。
            */

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
聲音按鈕
========================================
*/

function setupSoundToggle() {

  const button =
    getElement(
      "sound-toggle"
    );


  /*
  如果首頁還沒放音量按鈕，
  不會報錯。
  */

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

      /*
      如果目前是開啟狀態，
      先播放 click。
      */

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

多數瀏覽器不允許頁面
完全沒有互動就開始播放音樂。

因此：
首次 click / touch / keydown
之後才啟動 BGM。
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
一般按鈕 Click Sound

避免：
.room-button
#sound-toggle
被重複播放。
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
規則頁
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

      window.location.href =
        "./rules.html";

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
頁面離開時停止 BGM
========================================
*/

function setupPageLifecycle() {

  window.addEventListener(
    "pagehide",
    () => {

      lobbyBgm.pause();

    }
  );


  /*
  從上一頁返回時，
  某些瀏覽器會使用 bfcache。

  回到首頁後重新讀玩家資料。
  */

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
  1.
  初始化玩家 + 每日登入
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
  2.
  處理昨日反水

  注意：
  這一步可能修改玩家錢包。
  ================================
  */

  rebateResult =
    processYesterdayRebate();


  /*
  ================================
  3.
  反水發放後重新讀取玩家

  避免畫面拿到舊 balance。
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
  舊玩家資料可能還沒有
  soundEnabled。

  做版本兼容。
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
  4.
  渲染 UI
  ================================
  */

  renderPlayer();

  renderLoginDays();

  renderRoomCards();


  /*
  ================================
  5.
  建立互動
  ================================
  */

  setupRoomButtons();

  setupSoundToggle();

  setupGlobalClickSounds();

  setupRulesButton();

  setupResetButton();

  setupBgmAutoplayUnlock();

  setupPageLifecycle();


  /*
  ================================
  6.
  顯示登入 / 反水

  先登入獎勵，
  反水稍後顯示，
  避免兩個 Toast 互相蓋掉。
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
