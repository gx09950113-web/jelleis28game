import {
  initializePlayer,
  savePlayer
}
from "../core/player.js";

import {
  formatNumber
}
from "../utils/format.js";

import {
  ROOM_CONFIG
}
from "../config/rooms.js";


const lobbyBgm =
  new Audio(
    "./assets/sounds/lobby.mp3"
  );

lobbyBgm.loop = true;

lobbyBgm.volume = 0.35;


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


let player;


function playSound(audio) {
  if (
    !player.soundEnabled
  ) {
    return;
  }

  audio.currentTime = 0;

  audio.play().catch(() => {});
}


function renderPlayer() {
  const balance =
    document.getElementById(
      "balance"
    );

  if (balance) {
    balance.textContent =
      formatNumber(
        player.balance
      );
  }


  const streak =
    document.getElementById(
      "streak"
    );

  if (streak) {
    streak.textContent =
      `${player.loginStreak} / 7`;
  }


  const totalDays =
    document.getElementById(
      "total-login-days"
    );

  if (totalDays) {
    totalDays.textContent =
      formatNumber(
        player.totalLoginDays
      );
  }


  const lastLogin =
    document.getElementById(
      "last-login"
    );

  if (lastLogin) {
    lastLogin.textContent =
      player.lastLoginDate;
  }
}


function showLoginReward(
  reward
) {
  if (!reward) {
    return;
  }

  playSound(
    loginRewardSound
  );

  if (
    reward.type
    ===
    "initial"
  ) {
    alert(
      `首次登入獲得 ${formatNumber(
        reward.amount
      )} 代幣！`
    );

    return;
  }


  if (
    reward.streakBonus > 0
  ) {
    alert(
      `連續登入第 7 天！

每日登入 +${formatNumber(
        reward.daily
      )}

七日獎勵 +${formatNumber(
        reward.streakBonus
      )}

共獲得 ${formatNumber(
        reward.amount
      )} 代幣！`
    );

    return;
  }


  alert(
    `每日登入獎勵 +${formatNumber(
      reward.daily
    )} 代幣！`
  );
}


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

            playSound(
              clickSound
            );

            const roomId =
              button.dataset.room;

            const room =
              ROOM_CONFIG[
                roomId
              ];

            if (!room) {
              return;
            }


            playSound(
              enterRoomSound
            );


            setTimeout(
              () => {

                window.location.href =
                  `./game.html?room=${roomId}`;

              },
              180
            );

          }
        );

      }
    );
}


function setupSoundButton() {
  const button =
    document.getElementById(
      "sound-toggle"
    );

  if (!button) {
    return;
  }


  const icon =
    button.querySelector(
      "img"
    );


  function renderSoundIcon() {
    if (!icon) {
      return;
    }

    icon.src =
      player.soundEnabled

      ? "./assets/icons/sound-on.svg"

      : "./assets/icons/sound-off.svg";
  }


  button.addEventListener(
    "click",
    () => {

      player.soundEnabled =
        !player.soundEnabled;

      savePlayer(player);

      renderSoundIcon();


      if (
        player.soundEnabled
      ) {
        lobbyBgm
          .play()
          .catch(() => {});
      }

      else {
        lobbyBgm.pause();
      }

    }
  );


  renderSoundIcon();
}


function setupLobbyBgm() {
  if (
    !player.soundEnabled
  ) {
    return;
  }

  /*
    多數瀏覽器禁止沒有
    使用者互動就自動播放音訊。

    因此第一次點擊頁面後
    再開始播放大廳 BGM。
  */

  const startBgm = () => {

    lobbyBgm
      .play()
      .catch(() => {});

    document.removeEventListener(
      "click",
      startBgm
    );

  };


  document.addEventListener(
    "click",
    startBgm
  );
}


function init() {
  const result =
    initializePlayer();

  player =
    result.player;


  renderPlayer();

  showLoginReward(
    result.reward
  );

  setupRoomButtons();

  setupSoundButton();

  setupLobbyBgm();
}


init();
