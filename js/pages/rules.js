/*
========================================
28 GAME LAB
pages/rules.js
========================================
*/


import {
  getPlayer,
  savePlayer
}
from "../core/player.js";


/*
========================================
玩家
========================================
*/

let player =
  getPlayer();


/*
沒有玩家資料也允許看規則。

建立最低限度聲音設定。
*/

if (!player) {

  player = {
    soundEnabled: true
  };

}


if (
  typeof player.soundEnabled
  !==
  "boolean"
) {

  player.soundEnabled =
    true;

}


/*
========================================
Audio
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


lobbyBgm.loop = true;

lobbyBgm.volume = 0.25;

clickSound.volume = 0.45;


let bgmStarted =
  false;


/*
========================================
播放音效
========================================
*/

function playSound(
  audio
) {

  if (
    !player.soundEnabled
  ) {

    return;

  }


  audio.currentTime =
    0;


  audio
    .play()
    .catch(
      () => {}
    );

}


/*
========================================
BGM
========================================
*/

function startBgm() {

  if (
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

        bgmStarted =
          true;

      }
    )
    .catch(
      () => {}
    );

}


function stopBgm() {

  lobbyBgm.pause();

  bgmStarted =
    false;

}


/*
========================================
返回
========================================
*/

function setupBackButton() {

  const button =
    document.getElementById(
      "back-button"
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


      stopBgm();


      window.location.href =
        "./index.html";

    }
  );

}


/*
========================================
頁內導覽
========================================
*/

function setupNavigation() {

  const buttons =
    document.querySelectorAll(
      "[data-target]"
    );


  buttons.forEach(
    button => {

      button.addEventListener(
        "click",
        () => {

          playSound(
            clickSound
          );


          const targetId =
            button.dataset.target;


          const target =
            document.getElementById(
              targetId
            );


          if (!target) {

            return;

          }


          target.scrollIntoView({

            behavior:
              "smooth",

            block:
              "start"

          });

        }
      );

    }
  );

}


/*
========================================
目前 section 導覽狀態
========================================
*/

function setupSectionObserver() {

  const sections =
    document.querySelectorAll(
      ".rule-section"
    );


  const buttons =
    document.querySelectorAll(
      "[data-target]"
    );


  if (
    !sections.length
    ||
    !buttons.length
  ) {

    return;

  }


  const observer =
    new IntersectionObserver(

      entries => {

        entries.forEach(
          entry => {

            if (
              !entry.isIntersecting
            ) {

              return;

            }


            buttons.forEach(
              button => {

                button.classList.toggle(

                  "active",

                  button.dataset.target
                  ===
                  entry.target.id

                );

              }
            );

          }
        );

      },

      {

        rootMargin:
          "-25% 0px -60% 0px",

        threshold: 0

      }

    );


  sections.forEach(
    section => {

      observer.observe(
        section
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


  function renderState() {

    if (!icon) {

      return;

    }


    icon.src =
      player.soundEnabled

      ? "./assets/icons/sound-on.svg"

      : "./assets/icons/sound-off.svg";


    icon.alt =
      player.soundEnabled

      ? "關閉聲音"

      : "開啟聲音";

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


      /*
      如果有正式玩家資料，
      保存 soundEnabled。
      */

      if (
        getPlayer()
      ) {

        savePlayer(
          player
        );

      }


      renderState();


      if (
        player.soundEnabled
      ) {

        startBgm();

      }

      else {

        stopBgm();

      }

    }
  );


  renderState();

}


/*
========================================
瀏覽器 Audio 解鎖
========================================
*/

function setupAudioUnlock() {

  if (
    !player.soundEnabled
  ) {

    return;

  }


  const unlock =
    () => {

      startBgm();


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
Lifecycle
========================================
*/

function setupLifecycle() {

  window.addEventListener(
    "pagehide",
    () => {

      stopBgm();

    }
  );

}


/*
========================================
Init
========================================
*/

function init() {

  setupBackButton();

  setupNavigation();

  setupSectionObserver();

  setupSoundToggle();

  setupAudioUnlock();

  setupLifecycle();

}


init();
