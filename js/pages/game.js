/*
========================================
28 GAME LAB
pages/game.js

遊戲房間控制器

負責：
- 讀取 room query parameter
- 載入房間設定
- 顯示玩家餘額
- 管理本局下注
- 扣除下注代幣
- 倒數
- 開獎
- 結算
- 發放返還代幣
- 記錄每日統計
- 房間 BGM
- 遊戲音效
- 返回大廳

不負責：
- 定義遊戲規則
- 定義反水級距
- 每日登入
========================================
*/


import {
  ROOM_CONFIG
}
from "../config/rooms.js";


import {
  getPlayer,
  savePlayer
}
from "../core/player.js";


import {
  getBalance,
  subtractBalance,
  addBalance,
  canAfford
}
from "../core/wallet.js";


import {
  createDraw
}
from "../game/draw.js";


import {
  analyzeDraw
}
from "../game/rules.js";


import {
  BET_LABELS,
  createBetSlip,
  addBet,
  removeBet,
  clearBets,
  lockBetSlip,
  summarizeBets
}
from "../game/betting.js";


import {
  settleBetSlip,
  BET_RESULT
}
from "../game/settlement.js";


import {
  recordSettlement
}
from "../game/statistics.js";


import {
  formatNumber
}
from "../utils/format.js";


/*
========================================
遊戲設定
========================================
*/

const GAME_CONFIG = {

  /*
  每局下注時間
  */

  bettingSeconds: 15,


  /*
  最後幾秒開始播放倒數音
  */

  countdownSoundFrom: 5,


  /*
  開獎後多久進下一局
  */

  nextRoundDelay: 5000

};


/*
========================================
取得房間 ID
========================================
*/

const params =
  new URLSearchParams(
    window.location.search
  );


const roomId =
  params.get(
    "room"
  );


const room =
  ROOM_CONFIG[
    roomId
  ];


/*
========================================
房間不存在
========================================
*/

if (!room) {

  window.location.href =
    "./index.html";


  throw new Error(
    `不存在的房間：${roomId}`
  );

}


/*
========================================
玩家
========================================
*/

let player =
  getPlayer();


if (!player) {

  /*
  玩家沒有經過首頁初始化，
  直接進 game.html 時送回首頁。
  */

  window.location.href =
    "./index.html";


  throw new Error(
    "玩家資料不存在。"
  );

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
========================================
本局狀態
========================================
*/

let currentBetSlip =
  createBetSlip(
    roomId
  );


let bettingOpen =
  false;


let roundRunning =
  false;


let countdown =
  GAME_CONFIG
    .bettingSeconds;


let countdownTimer =
  null;


let nextRoundTimer =
  null;


/*
========================================
音訊
========================================
*/

const roomBgm =
  new Audio(
    room.bgm
  );


const clickSound =
  new Audio(
    "./assets/sounds/click.mp3"
  );


const betSound =
  new Audio(
    "./assets/sounds/bet.mp3"
  );


const countdownSound =
  new Audio(
    "./assets/sounds/countdown.mp3"
  );


const drawSound =
  new Audio(
    "./assets/sounds/draw.mp3"
  );


const winSound =
  new Audio(
    "./assets/sounds/win.mp3"
  );


const loseSound =
  new Audio(
    "./assets/sounds/lose.mp3"
  );


const refundSound =
  new Audio(
    "./assets/sounds/refund.mp3"
  );


/*
========================================
音量
========================================
*/

roomBgm.loop = true;

roomBgm.volume = 0.32;


clickSound.volume = 0.45;

betSound.volume = 0.6;

countdownSound.volume = 0.65;

drawSound.volume = 0.7;

winSound.volume = 0.75;

loseSound.volume = 0.5;

refundSound.volume = 0.65;


let bgmStarted =
  false;


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
Toast
========================================
*/

let toastTimer =
  null;


function showToast(
  title,
  message,
  duration = 3500
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
開始房間 BGM
========================================
*/

function startRoomBgm() {

  if (
    !player.soundEnabled
    ||
    bgmStarted
  ) {

    return;

  }


  roomBgm
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


/*
========================================
停止 BGM
========================================
*/

function stopRoomBgm() {

  roomBgm.pause();

  bgmStarted =
    false;

}


/*
========================================
更新玩家資料
========================================
*/

function refreshPlayer() {

  const latestPlayer =
    getPlayer();


  if (
    latestPlayer
  ) {

    player =
      latestPlayer;

  }

}


/*
========================================
餘額 UI
========================================
*/

function renderBalance() {

  const balance =
    getElement(
      "balance"
    );


  if (!balance) {

    return;

  }


  balance.textContent =
    formatNumber(
      getBalance()
    );

}


/*
========================================
房間資訊 UI
========================================
*/

function renderRoom() {

  const roomName =
    getElement(
      "room-name"
    );


  if (roomName) {

    roomName.textContent =
      room.name;

  }


  const multiplier =
    getElement(
      "room-multiplier"
    );


  if (multiplier) {

    multiplier.textContent =
      `${room.multiplier}×`;

  }


  /*
  房間背景
  */

  if (
    room.image
  ) {

    document.body.style
      .backgroundImage =
      `
        linear-gradient(
          rgba(5, 10, 18, 0.45),
          rgba(5, 10, 18, 0.78)
        ),
        url("${room.image}")
      `;


    document.body.style
      .backgroundSize =
      "cover";


    document.body.style
      .backgroundPosition =
      "center";


    document.body.style
      .backgroundAttachment =
      "fixed";

  }

}


/*
========================================
倒數 UI
========================================
*/

function renderCountdown() {

  const element =
    getElement(
      "countdown"
    );


  if (!element) {

    return;

  }


  element.textContent =
    countdown;

}


/*
========================================
遊戲狀態
========================================
*/

function setGameStatus(
  text
) {

  const element =
    getElement(
      "game-status"
    );


  if (element) {

    element.textContent =
      text;

  }

}


/*
========================================
下注按鈕狀態
========================================
*/

function renderBettingState() {

  document
    .querySelectorAll(
      "[data-bet-type]"
    )
    .forEach(
      button => {

        button.disabled =
          !bettingOpen;

      }
    );


  document
    .querySelectorAll(
      "[data-chip]"
    )
    .forEach(
      button => {

        button.disabled =
          !bettingOpen;

      }
    );


  const clearButton =
    getElement(
      "clear-bets"
    );


  if (clearButton) {

    clearButton.disabled =
      !bettingOpen;

  }

}


/*
========================================
顯示目前下注
========================================
*/

function renderBetSlip() {

  const container =
    getElement(
      "current-bets"
    );


  const totalElement =
    getElement(
      "total-bet"
    );


  if (
    totalElement
  ) {

    totalElement.textContent =
      formatNumber(
        currentBetSlip.totalAmount
      );

  }


  if (!container) {

    return;

  }


  container.innerHTML =
    "";


  const summary =
    summarizeBets(
      currentBetSlip
    );


  const entries =
    Object.entries(
      summary
    );


  if (
    entries.length
    ===
    0
  ) {

    container.innerHTML =
      `
        <div class="empty-bets">
          尚未下注
        </div>
      `;


    return;

  }


  for (
    const [
      type,
      amount
    ]
    of entries
  ) {

    const item =
      document.createElement(
        "div"
      );


    item.className =
      "bet-summary-item";


    item.innerHTML =
      `
        <span>
          ${BET_LABELS[type] ?? type}
        </span>

        <strong>
          ${formatNumber(amount)}
        </strong>
      `;


    container.appendChild(
      item
    );

  }

}


/*
========================================
目前選擇的籌碼
========================================
*/

let selectedChip =
  100;


function renderSelectedChip() {

  document
    .querySelectorAll(
      "[data-chip]"
    )
    .forEach(
      button => {

        const amount =
          Number(
            button.dataset.chip
          );


        button.classList.toggle(
          "selected",
          amount === selectedChip
        );

      }
    );

}


/*
========================================
選擇籌碼
========================================
*/

function setupChipButtons() {

  document
    .querySelectorAll(
      "[data-chip]"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            if (
              !bettingOpen
            ) {

              return;

            }


            playSound(
              clickSound
            );


            const amount =
              Number(
                button.dataset.chip
              );


            if (
              !Number.isFinite(
                amount
              )
              ||
              amount <= 0
            ) {

              return;

            }


            selectedChip =
              amount;


            renderSelectedChip();

          }
        );

      }
    );

}


/*
========================================
下注
========================================
*/

function placeBet(
  type
) {

  if (
    !bettingOpen
  ) {

    showToast(
      "停止下注",
      "目前已經封盤。"
    );

    return;

  }


  if (
    !canAfford(
      selectedChip
    )
  ) {

    showToast(
      "代幣不足",
      `目前餘額不足以下注 ${formatNumber(
        selectedChip
      )} 代幣。`
    );

    return;

  }


  /*
  先扣錢
  */

  const deducted =
    subtractBalance(
      selectedChip
    );


  if (!deducted) {

    showToast(
      "下注失敗",
      "無法扣除代幣。"
    );

    return;

  }


  /*
  再建立下注

  如果 addBet 發生錯誤，
  必須把錢退回。
  */

  try {

    addBet(
      currentBetSlip,
      type,
      selectedChip
    );

  }

  catch (
    error
  ) {

    addBalance(
      selectedChip
    );


    showToast(
      "下注失敗",
      error.message
    );


    return;

  }


  playSound(
    betSound
  );


  refreshPlayer();

  renderBalance();

  renderBetSlip();

}


/*
========================================
下注選項
========================================
*/

function setupBetButtons() {

  document
    .querySelectorAll(
      "[data-bet-type]"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            const type =
              button.dataset.betType;


            placeBet(
              type
            );

          }
        );

      }
    );

}


/*
========================================
清空下注

注意：

下注時已經扣款。

所以清空下注必須
把本金退回玩家。
========================================
*/

function clearCurrentBets() {

  if (
    !bettingOpen
  ) {

    return;

  }


  if (
    currentBetSlip.totalAmount
    <=
    0
  ) {

    return;

  }


  const refundAmount =
    currentBetSlip.totalAmount;


  addBalance(
    refundAmount
  );


  clearBets(
    currentBetSlip
  );


  refreshPlayer();

  renderBalance();

  renderBetSlip();


  playSound(
    clickSound
  );


  showToast(
    "已清除下注",
    `已退回 ${formatNumber(
      refundAmount
    )} 代幣。`
  );

}


/*
========================================
清空按鈕
========================================
*/

function setupClearButton() {

  const button =
    getElement(
      "clear-bets"
    );


  if (!button) {

    return;

  }


  button.addEventListener(
    "click",
    clearCurrentBets
  );

}


/*
========================================
顯示開獎結果
========================================
*/

function renderDrawResult(
  drawResult
) {

  const numbers =
    drawResult.numbers;


  const numberElements = [
    getElement(
      "number-1"
    ),

    getElement(
      "number-2"
    ),

    getElement(
      "number-3"
    )
  ];


  numberElements
    .forEach(
      (
        element,
        index
      ) => {

        if (element) {

          element.textContent =
            numbers[index];

        }

      }
    );


  const sum =
    getElement(
      "draw-sum"
    );


  if (sum) {

    sum.textContent =
      drawResult.sum;

  }


  const result =
    getElement(
      "draw-result"
    );


  if (result) {

    const labels = [];


    labels.push(
      drawResult.size
      ===
      "big"

      ? "大"

      : "小"
    );


    labels.push(
      drawResult.parity
      ===
      "odd"

      ? "單"

      : "雙"
    );


    if (
      drawResult.hasZero
    ) {

      labels.push(
        "含0"
      );

    }


    if (
      drawResult.isPair
    ) {

      labels.push(
        "對子"
      );

    }


    if (
      drawResult.isLeopard
    ) {

      labels.push(
        "豹子"
      );

    }


    if (
      drawResult.isSum13
    ) {

      labels.push(
        "13"
      );

    }


    if (
      drawResult.isSum14
    ) {

      labels.push(
        "14"
      );

    }


    result.textContent =
      labels.join(
        " · "
      );

  }

}


/*
========================================
結算 UI
========================================
*/

function renderSettlement(
  settlement
) {

  const element =
    getElement(
      "settlement-result"
    );


  if (!element) {

    return;

  }


  if (
    settlement.totalBet
    ===
    0
  ) {

    element.innerHTML =
      `
        <div class="settlement-empty">
          本局未下注
        </div>
      `;


    return;

  }


  const profitSign =
    settlement.netProfit > 0

    ? "+"

    : "";


  element.innerHTML =
    `
      <div>
        本局下注：
        <strong>
          ${formatNumber(
            settlement.totalBet
          )}
        </strong>
      </div>

      <div>
        本局返還：
        <strong>
          ${formatNumber(
            settlement.totalPayout
          )}
        </strong>
      </div>

      <div>
        本局盈虧：
        <strong>
          ${profitSign}${formatNumber(
            settlement.netProfit
          )}
        </strong>
      </div>
    `;

}


/*
========================================
播放結算音效
========================================
*/

function playSettlementSound(
  settlement
) {

  /*
  有回本
  優先播放 refund
  */

  if (
    settlement.refundCount
    >
    0
    &&
    settlement.winCount
    ===
    0
    &&
    settlement.loseCount
    ===
    0
  ) {

    playSound(
      refundSound
    );


    return;

  }


  /*
  整體盈利
  */

  if (
    settlement.netProfit
    >
    0
  ) {

    playSound(
      winSound
    );


    return;

  }


  /*
  整體虧損
  */

  if (
    settlement.netProfit
    <
    0
  ) {

    playSound(
      loseSound
    );


    return;

  }


  /*
  0 盈虧
  */

  if (
    settlement.refundCount
    >
    0
  ) {

    playSound(
      refundSound
    );

  }

}


/*
========================================
發放結算返還
========================================
*/

function applySettlement(
  settlement
) {

  /*
  下注本金已經下注時扣掉。

  所以這裡只要把
  totalPayout 加回即可。
  */

  if (
    settlement.totalPayout
    >
    0
  ) {

    addBalance(
      settlement.totalPayout
    );

  }


  refreshPlayer();

  renderBalance();

}


/*
========================================
執行開獎
========================================
*/

function executeDraw() {

  setGameStatus(
    "開獎中"
  );


  playSound(
    drawSound
  );


  /*
  產生開獎
  */

  const draw =
    createDraw();


  /*
  分析
  */

  const drawResult =
    analyzeDraw(
      draw
    );


  /*
  顯示
  */

  renderDrawResult(
    drawResult
  );


  /*
  即使沒下注，
  settlement 仍可正常處理
  空 betSlip。
  */

  const settlement =
    settleBetSlip(
      currentBetSlip,
      drawResult
    );


  /*
  發放返還
  */

  applySettlement(
    settlement
  );


  /*
  寫入每日統計

  如果沒有下注，
  不記錄成有效遊戲統計。
  */

  if (
    settlement.totalBet
    >
    0
  ) {

    recordSettlement(
      settlement
    );

  }


  renderSettlement(
    settlement
  );


  playSettlementSound(
    settlement
  );


  setGameStatus(
    "本局結算完成"
  );


  /*
  下一局
  */

  nextRoundTimer =
    setTimeout(
      () => {

        startRound();

      },
      GAME_CONFIG
        .nextRoundDelay
    );

}


/*
========================================
封盤
========================================
*/

function closeBetting() {

  if (
    !bettingOpen
  ) {

    return;

  }


  bettingOpen =
    false;


  lockBetSlip(
    currentBetSlip
  );


  renderBettingState();


  setGameStatus(
    "停止下注"
  );


  executeDraw();

}


/*
========================================
倒數
========================================
*/

function startCountdown() {

  clearInterval(
    countdownTimer
  );


  countdown =
    GAME_CONFIG
      .bettingSeconds;


  renderCountdown();


  countdownTimer =
    setInterval(
      () => {

        countdown -= 1;


        renderCountdown();


        /*
        最後幾秒播放提示音
        */

        if (
          countdown
          <=
          GAME_CONFIG
            .countdownSoundFrom
          &&
          countdown > 0
        ) {

          playSound(
            countdownSound
          );

        }


        /*
        時間到
        */

        if (
          countdown
          <= 0
        ) {

          clearInterval(
            countdownTimer
          );


          countdownTimer =
            null;


          closeBetting();

        }

      },
      1000
    );

}


/*
========================================
開始新一局
========================================
*/

function startRound() {

  if (
    roundRunning
  ) {

    /*
    roundRunning 在結算期間
    仍為 true。

    先重設。
    */

    roundRunning =
      false;

  }


  clearTimeout(
    nextRoundTimer
  );


  nextRoundTimer =
    null;


  /*
  建立新的下注單
  */

  currentBetSlip =
    createBetSlip(
      roomId
    );


  bettingOpen =
    true;


  roundRunning =
    true;


  /*
  清理 UI
  */

  renderBetSlip();


  const settlement =
    getElement(
      "settlement-result"
    );


  if (settlement) {

    settlement.innerHTML =
      "";

  }


  setGameStatus(
    "開放下注"
  );


  renderBettingState();


  startCountdown();

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


  function renderState() {

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


      renderState();


      if (
        player.soundEnabled
      ) {

        startRoomBgm();

      }

      else {

        stopRoomBgm();

      }

    }
  );


  renderState();

}


/*
========================================
BGM 自動播放解鎖
========================================
*/

function setupBgmUnlock() {

  if (
    !player.soundEnabled
  ) {

    return;

  }


  const unlock =
    () => {

      startRoomBgm();


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
返回首頁
========================================
*/

function setupBackButton() {

  const button =
    getElement(
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


      /*
      如果仍在下注期間，
      玩家已下注的本金
      必須先退回。

      否則直接離開會吃掉下注。
      */

      if (
        bettingOpen
        &&
        currentBetSlip
          .totalAmount
        >
        0
      ) {

        addBalance(
          currentBetSlip
            .totalAmount
        );


        clearBets(
          currentBetSlip
        );

      }


      stopRoomBgm();


      window.location.href =
        "./index.html";

    }
  );

}


/*
========================================
頁面離開防止未結算下注消失

如果玩家：
- 重新整理
- 關閉分頁
- 直接離開

瀏覽器不保證我們可以可靠
執行非同步流程。

這裡至少在 pagehide
嘗試把尚未封盤的下注退回。
========================================
*/

function setupPageLifecycle() {

  window.addEventListener(
    "pagehide",
    () => {

      stopRoomBgm();


      if (
        bettingOpen
        &&
        currentBetSlip
          .totalAmount
        >
        0
      ) {

        addBalance(
          currentBetSlip
            .totalAmount
        );


        /*
        防止同一 page lifecycle
        重複退回。
        */

        currentBetSlip
          .totalAmount =
          0;


        currentBetSlip
          .bets =
          [];

      }

    }
  );

}


/*
========================================
初始化
========================================
*/

function init() {

  /*
  房間
  */

  renderRoom();


  /*
  玩家
  */

  renderBalance();


  /*
  預設籌碼
  */

  renderSelectedChip();


  /*
  互動
  */

  setupChipButtons();

  setupBetButtons();

  setupClearButton();

  setupSoundToggle();

  setupBgmUnlock();

  setupBackButton();

  setupPageLifecycle();


  /*
  第一局
  */

  startRound();

}


/*
========================================
啟動
========================================
*/

init();
