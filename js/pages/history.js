/*
========================================
28 GAME LAB
pages/history.js

負責：
- 顯示今日遊戲統計
- 顯示 WIN / LOSE / REFUND
- 顯示各倍場統計
- 顯示今日反水預覽
- 顯示最近 20 局單局詳細紀錄
- 顯示最近 7 天紀錄
- 返回大廳
- 聲音開關
========================================
*/


import {
  getDailyStats,
  getRecentStatistics,
  getRecentRounds
}
from "../game/statistics.js";


import {
  previewRebate
}
from "../core/rebate.js";


import {
  getPlayer,
  savePlayer
}
from "../core/player.js";


import {
  getLocalDateString
}
from "../core/date.js";


import {
  formatNumber,
  formatPercent
}
from "../utils/format.js";


/*
========================================
下注名稱
========================================
*/

const BET_LABELS = {

  big: "大",

  small: "小",

  odd: "單",

  even: "雙",

  "big-odd": "大單",

  "big-even": "大雙",

  "small-odd": "小單",

  "small-even": "小雙"

};


/*
========================================
回本原因名稱
========================================
*/

const REFUND_REASON_LABELS = {

  "has-zero": "含 0",

  pair: "對子",

  leopard: "豹子",

  "sum-13-14": "和值 13 / 14"

};


/*
========================================
玩家
========================================
*/

let player =
  getPlayer();


/*
即使玩家資料不存在，
也允許查看紀錄頁。
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
設定文字
========================================
*/

function setText(
  id,
  value
) {

  const element =
    getElement(
      id
    );


  if (!element) {

    return;

  }


  element.textContent =
    value;

}


/*
========================================
格式化盈虧
========================================
*/

function formatProfit(
  value
) {

  const number =
    Number(value)
    ||
    0;


  if (
    number > 0
  ) {

    return (
      `+${formatNumber(
        number
      )}`
    );

  }


  return formatNumber(
    number
  );

}


/*
========================================
套用盈虧顏色
========================================
*/

function applyProfitClass(
  element,
  value
) {

  if (!element) {

    return;

  }


  element.classList.remove(
    "profit-positive",
    "profit-negative",
    "profit-zero"
  );


  if (
    value > 0
  ) {

    element.classList.add(
      "profit-positive"
    );

  }

  else if (
    value < 0
  ) {

    element.classList.add(
      "profit-negative"
    );

  }

  else {

    element.classList.add(
      "profit-zero"
    );

  }

}


/*
========================================
時間格式
========================================
*/

function formatTime(
  timestamp
) {

  if (
    !Number.isFinite(
      timestamp
    )
  ) {

    return "-";

  }


  const date =
    new Date(
      timestamp
    );


  const hours =
    String(
      date.getHours()
    ).padStart(
      2,
      "0"
    );


  const minutes =
    String(
      date.getMinutes()
    ).padStart(
      2,
      "0"
    );


  const seconds =
    String(
      date.getSeconds()
    ).padStart(
      2,
      "0"
    );


  return (
    `${hours}:`
    +
    `${minutes}:`
    +
    `${seconds}`
  );

}


/*
========================================
日期
========================================
*/

function renderDate() {

  const today =
    getLocalDateString();


  setText(
    "today-date",
    today
  );

}


/*
========================================
建立空白今日資料
========================================
*/

function createEmptyTodayStats() {

  const emptyRoom =
    () => ({

      validBet: 0,

      payout: 0,

      netProfit: 0,

      rounds: 0,

      betCount: 0,

      winCount: 0,

      loseCount: 0,

      refundCount: 0

    });


  return {

    total: {

      validBet: 0,

      payout: 0,

      netProfit: 0,

      rounds: 0,

      betCount: 0,

      winCount: 0,

      loseCount: 0,

      refundCount: 0

    },


    rooms: {

      "1.8":
        emptyRoom(),

      "2.0":
        emptyRoom(),

      "2.8":
        emptyRoom(),

      "3.2":
        emptyRoom()

    },


    rebate: {

      validBet: 0,

      netProfit: 0,

      rounds: 0,

      processed: false,

      amount: 0,

      rate: 0,

      type: null

    }

  };

}


/*
========================================
今日總覽
========================================
*/

function renderTodaySummary(
  stats
) {

  setText(
    "today-valid-bet",
    formatNumber(
      stats.total.validBet
    )
  );


  setText(
    "today-payout",
    formatNumber(
      stats.total.payout
    )
  );


  const profitElement =
    getElement(
      "today-net-profit"
    );


  if (
    profitElement
  ) {

    profitElement.textContent =
      formatProfit(
        stats.total.netProfit
      );


    applyProfitClass(
      profitElement,
      stats.total.netProfit
    );

  }


  setText(
    "today-rounds",
    formatNumber(
      stats.total.rounds
    )
  );

}


/*
========================================
WIN / LOSE / REFUND
========================================
*/

function renderResultStats(
  stats
) {

  setText(
    "today-win-count",
    formatNumber(
      stats.total.winCount
    )
  );


  setText(
    "today-lose-count",
    formatNumber(
      stats.total.loseCount
    )
  );


  setText(
    "today-refund-count",
    formatNumber(
      stats.total.refundCount
    )
  );

}


/*
========================================
房間 DOM 對應
========================================
*/

const ROOM_DOM_MAP = {

  "1.8": "18",

  "2.0": "20",

  "2.8": "28",

  "3.2": "32"

};


/*
========================================
單一房間
========================================
*/

function renderRoomStats(
  roomId,
  roomStats
) {

  const suffix =
    ROOM_DOM_MAP[
      roomId
    ];


  if (!suffix) {

    return;

  }


  setText(
    `room-${suffix}-valid-bet`,
    formatNumber(
      roomStats.validBet
    )
  );


  setText(
    `room-${suffix}-payout`,
    formatNumber(
      roomStats.payout
    )
  );


  const profitElement =
    getElement(
      `room-${suffix}-net-profit`
    );


  if (
    profitElement
  ) {

    profitElement.textContent =
      formatProfit(
        roomStats.netProfit
      );


    applyProfitClass(
      profitElement,
      roomStats.netProfit
    );

  }


  setText(
    `room-${suffix}-rounds`,
    formatNumber(
      roomStats.rounds
    )
  );

}


/*
========================================
四倍場
========================================
*/

function renderRooms(
  stats
) {

  for (
    const roomId
    of Object.keys(
      ROOM_DOM_MAP
    )
  ) {

    const roomStats =
      stats.rooms[
        roomId
      ];


    if (!roomStats) {

      continue;

    }


    renderRoomStats(
      roomId,
      roomStats
    );

  }

}


/*
========================================
今日反水
========================================
*/

function renderRebate(
  stats
) {

  const today =
    getLocalDateString();


  const rebateStats =
    stats.rebate;


  setText(
    "rebate-valid-bet",
    formatNumber(
      rebateStats.validBet
    )
  );


  const netProfitElement =
    getElement(
      "rebate-net-profit"
    );


  if (
    netProfitElement
  ) {

    netProfitElement.textContent =
      formatProfit(
        rebateStats.netProfit
      );


    applyProfitClass(
      netProfitElement,
      rebateStats.netProfit
    );

  }


  setText(
    "rebate-rounds",
    formatNumber(
      rebateStats.rounds
    )
  );


  const statusElement =
    getElement(
      "rebate-status"
    );


  const previewElement =
    getElement(
      "rebate-preview"
    );


  const preview =
    previewRebate(
      today
    );


  if (!statusElement) {

    return;

  }


  statusElement.classList.remove(
    "rebate-eligible",
    "rebate-not-eligible",
    "rebate-processed"
  );


  /*
  已處理
  */

  if (
    rebateStats.processed
  ) {

    statusElement.textContent =
      "已結算";


    statusElement.classList.add(
      "rebate-processed"
    );


    if (
      previewElement
    ) {

      if (
        rebateStats.amount
        >
        0
      ) {

        previewElement.textContent =
          `本日反水已結算，共發放 ${formatNumber(
            rebateStats.amount
          )} 代幣。`;

      }

      else {

        previewElement.textContent =
          "本日反水已結算，未達反水資格。";

      }

    }


    return;

  }


  /*
  尚無有效下注
  */

  if (
    rebateStats.validBet
    <=
    0
  ) {

    statusElement.textContent =
      "尚無紀錄";


    statusElement.classList.add(
      "rebate-not-eligible"
    );


    if (
      previewElement
    ) {

      previewElement.textContent =
        "今日尚無 2.0、2.8 或 3.2 倍場有效下注紀錄。";

    }


    return;

  }


  /*
  已符合反水
  */

  if (
    preview.eligible
  ) {

    statusElement.textContent =
      "目前符合";


    statusElement.classList.add(
      "rebate-eligible"
    );


    const typeLabel =
      preview.type
      ===
      "loss"

      ? "虧損反水"

      : "盈利反水";


    let message =
      `依目前紀錄，已符合${typeLabel}資格。`;


    message +=
      ` 有效下注 ${formatNumber(
        preview.validBet
      )}，`;


    message +=
      `目前淨盈虧 ${formatProfit(
        preview.netProfit
      )}，`;


    message +=
      `反水比例 ${formatPercent(
        preview.rate
      )}，`;


    message +=
      `預估可獲得 ${formatNumber(
        preview.amount
      )} 代幣。`;


    if (
      preview.capped
    ) {

      message +=
        " 已套用虧損反水上限。";

    }


    if (
      previewElement
    ) {

      previewElement.textContent =
        message;

    }


    return;

  }


  /*
  尚未達標
  */

  statusElement.textContent =
    "尚未達標";


  statusElement.classList.add(
    "rebate-not-eligible"
  );


  if (!previewElement) {

    return;

  }


  if (
    rebateStats.netProfit
    <
    0
  ) {

    const loss =
      Math.abs(
        rebateStats.netProfit
      );


    const remaining =
      Math.max(
        0,
        3000 - loss
      );


    if (
      remaining > 0
    ) {

      previewElement.textContent =
        `目前淨虧損 ${formatNumber(
          loss
        )}，距離最低虧損反水門檻還差 ${formatNumber(
          remaining
        )}。`;

    }

    else {

      previewElement.textContent =
        "目前尚未符合反水條件。";

    }


    return;

  }


  if (
    rebateStats.netProfit
    >
    0
  ) {

    const remaining =
      Math.max(
        0,
        15000
        -
        rebateStats.netProfit
      );


    if (
      remaining > 0
    ) {

      previewElement.textContent =
        `目前淨盈利 ${formatNumber(
          rebateStats.netProfit
        )}，距離最低盈利反水門檻還差 ${formatNumber(
          remaining
        )}。`;

    }

    else {

      previewElement.textContent =
        "目前尚未符合反水條件。";

    }


    return;

  }


  previewElement.textContent =
    "目前淨盈虧為 0，尚未達反水門檻。";

}


/*
========================================
產生開獎結果標籤
========================================
*/

function getDrawLabels(
  draw
) {

  const labels =
    [];


  labels.push(
    {
      text:
        draw.size
        ===
        "big"

        ? "大"

        : "小",

      special:
        false
    }
  );


  labels.push(
    {
      text:
        draw.parity
        ===
        "odd"

        ? "單"

        : "雙",

      special:
        false
    }
  );


  if (
    draw.hasZero
  ) {

    labels.push(
      {
        text: "含0",
        special: true
      }
    );

  }


  if (
    draw.isPair
  ) {

    labels.push(
      {
        text: "對子",
        special: true
      }
    );

  }


  if (
    draw.isLeopard
  ) {

    labels.push(
      {
        text: "豹子",
        special: true
      }
    );

  }


  if (
    draw.isSum13
  ) {

    labels.push(
      {
        text: "13",
        special: true
      }
    );

  }


  if (
    draw.isSum14
  ) {

    labels.push(
      {
        text: "14",
        special: true
      }
    );

  }


  return labels;

}


/*
========================================
回本原因文字
========================================
*/

function formatRefundReasons(
  reasons
) {

  if (
    !Array.isArray(
      reasons
    )
    ||
    reasons.length
    ===
    0
  ) {

    return "";

  }


  return reasons
    .map(
      reason =>
        REFUND_REASON_LABELS[
          reason
        ]
        ??
        reason
    )
    .join(
      "、"
    );

}


/*
========================================
單局詳細紀錄
========================================
*/

function renderRoundHistory() {

  const container =
    getElement(
      "round-history"
    );


  if (!container) {

    return;

  }


  const rounds =
    getRecentRounds(
      20
    );


  container.innerHTML =
    "";


  if (
    rounds.length
    ===
    0
  ) {

    container.innerHTML =
      `
        <div class="empty-history">
          尚無單局紀錄
        </div>
      `;


    return;

  }


  for (
    const round
    of rounds
  ) {

    /*
    防止舊版歷史資料沒有 draw
    導致整頁錯誤。
    */

    if (
      !round.draw
      ||
      !Array.isArray(
        round.draw.numbers
      )
    ) {

      continue;

    }


    const draw =
      round.draw;


    const card =
      document.createElement(
        "article"
      );


    card.className =
      "round-history-card";


    /*
    ================================
    開獎標籤
    ================================
    */

    const labels =
      getDrawLabels(
        draw
      );


    const labelsHtml =
      labels
        .map(
          label =>
            `
              <span
                class="
                  result-badge
                  ${
                    label.special
                    ? "special"
                    : ""
                  }
                "
              >
                ${label.text}
              </span>
            `
        )
        .join(
          ""
        );


    /*
    ================================
    下注明細
    ================================
    */

    let betsHtml =
      "";


    if (
      Array.isArray(
        round.bets
      )
      &&
      round.bets.length
      >
      0
    ) {

      betsHtml =
        round.bets
          .map(
            bet => {

              const typeLabel =
                BET_LABELS[
                  bet.type
                ]
                ??
                bet.type;


              const result =
                bet.result
                ??
                "lose";


              const resultText =
                result
                  .toUpperCase();


              const refundReason =
                result
                ===
                "refund"

                ? formatRefundReasons(
                    bet.refundReasons
                  )

                : "";


              const refundReasonHtml =
                refundReason

                ? `
                  <div class="round-refund-reason">
                    回本原因：${refundReason}
                  </div>
                `

                : "";


              return `
                <div class="round-bet-row">

                  <span class="round-bet-type">
                    ${typeLabel}
                  </span>

                  <span class="round-bet-amount">
                    下注 ${formatNumber(
                      bet.amount
                      ??
                      0
                    )}
                  </span>

                  <strong
                    class="
                      round-bet-result
                      ${result}
                    "
                  >
                    ${resultText}
                  </strong>

                  <span class="round-bet-payout">
                    返還 ${formatNumber(
                      bet.payout
                      ??
                      0
                    )}
                  </span>

                  ${refundReasonHtml}

                </div>
              `;

            }
          )
          .join(
            ""
          );

    }

    else {

      betsHtml =
        `
          <div class="empty-history">
            無下注明細
          </div>
        `;

    }


    /*
    ================================
    卡片
    ================================
    */

    card.innerHTML =
      `
        <div class="round-history-header">

          <div class="round-history-title">

            <strong>
              ${
                round.issue
                ??
                "-"
              }
              ·
              ${
                round.roomId
                ??
                "-"
              }倍場
            </strong>

            <span>
              ${
                round.date
                ??
                ""
              }
              ${
                formatTime(
                  round.settledAt
                )
              }
            </span>

          </div>


          <strong
            class="round-history-profit"
          >
            ${formatProfit(
              round.netProfit
              ??
              0
            )}
          </strong>

        </div>


        <div class="round-draw">

          <div class="round-draw-numbers">

            ${draw.numbers[0]}
            +
            ${draw.numbers[1]}
            +
            ${draw.numbers[2]}
            =
            ${draw.sum}

          </div>


          <div class="round-draw-result">

            ${labelsHtml}

          </div>

        </div>


        <div class="round-summary">

          <div class="round-summary-item">

            <span>
              本局下注
            </span>

            <strong>
              ${formatNumber(
                round.totalBet
                ??
                0
              )}
            </strong>

          </div>


          <div class="round-summary-item">

            <span>
              本局返還
            </span>

            <strong>
              ${formatNumber(
                round.totalPayout
                ??
                0
              )}
            </strong>

          </div>


          <div class="round-summary-item">

            <span>
              本局盈虧
            </span>

            <strong
              class="round-summary-profit"
            >
              ${formatProfit(
                round.netProfit
                ??
                0
              )}
            </strong>

          </div>

        </div>


        <div class="round-bets">

          <div class="round-bets-title">
            下注明細
          </div>

          ${betsHtml}

        </div>
      `;


    /*
    單局總盈虧顏色
    */

    const profitElement =
      card.querySelector(
        ".round-history-profit"
      );


    applyProfitClass(
      profitElement,
      round.netProfit
      ??
      0
    );


    /*
    Summary 盈虧顏色
    */

    const summaryProfit =
      card.querySelector(
        ".round-summary-profit"
      );


    applyProfitClass(
      summaryProfit,
      round.netProfit
      ??
      0
    );


    container.appendChild(
      card
    );

  }


  /*
  如果全部都是舊資料，
  最後仍顯示空狀態。
  */

  if (
    container.children.length
    ===
    0
  ) {

    container.innerHTML =
      `
        <div class="empty-history">
          尚無新版單局紀錄
        </div>
      `;

  }

}


/*
========================================
最近七天
========================================
*/

function renderHistoryTable() {

  const body =
    getElement(
      "history-table-body"
    );


  if (!body) {

    return;

  }


  const history =
    getRecentStatistics(
      7
    );


  body.innerHTML =
    "";


  if (
    history.length
    ===
    0
  ) {

    body.innerHTML =
      `
        <tr>

          <td
            colspan="6"
            class="empty-history"
          >
            尚無遊戲紀錄
          </td>

        </tr>
      `;


    return;

  }


  for (
    const dayStats
    of history
  ) {

    const row =
      document.createElement(
        "tr"
      );


    const profit =
      dayStats.total
        ?.netProfit
      ??
      0;


    /*
    ================================
    反水欄
    ================================
    */

    let rebateText =
      "-";


    if (
      dayStats.rebate
        ?.processed
    ) {

      if (
        dayStats.rebate.amount
        >
        0
      ) {

        rebateText =
          `+${formatNumber(
            dayStats.rebate.amount
          )}`;

      }

      else {

        rebateText =
          "無";

      }

    }

    else {

      const preview =
        previewRebate(
          dayStats.date
        );


      if (
        preview.eligible
      ) {

        rebateText =
          `預估 +${formatNumber(
            preview.amount
          )}`;

      }

      else {

        rebateText =
          "未達標";

      }

    }


    row.innerHTML =
      `
        <td>
          ${dayStats.date}
        </td>

        <td>
          ${formatNumber(
            dayStats.total
              ?.validBet
            ??
            0
          )}
        </td>

        <td>
          ${formatNumber(
            dayStats.total
              ?.payout
            ??
            0
          )}
        </td>

        <td
          class="history-profit"
        >
          ${formatProfit(
            profit
          )}
        </td>

        <td>
          ${formatNumber(
            dayStats.total
              ?.rounds
            ??
            0
          )}
        </td>

        <td>
          ${rebateText}
        </td>
      `;


    const profitCell =
      row.querySelector(
        ".history-profit"
      );


    applyProfitClass(
      profitCell,
      profit
    );


    body.appendChild(
      row
    );

  }

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


      stopBgm();


      window.location.href =
        "./index.html";

    }
  );

}


/*
========================================
聲音開關
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
BGM 解鎖
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


  /*
  從其他頁返回時，
  若瀏覽器使用 bfcache，
  重新讀取最新統計。
  */

  window.addEventListener(
    "pageshow",
    event => {

      if (
        !event.persisted
      ) {

        return;

      }


      renderAllStatistics();

    }
  );

}


/*
========================================
完整統計渲染
========================================
*/

function renderAllStatistics() {

  const today =
    getLocalDateString();


  const stats =
    getDailyStats(
      today
    )
    ??
    createEmptyTodayStats();


  renderDate();


  renderTodaySummary(
    stats
  );


  renderResultStats(
    stats
  );


  renderRooms(
    stats
  );


  renderRebate(
    stats
  );


  renderRoundHistory();


  renderHistoryTable();

}


/*
========================================
初始化
========================================
*/

function init() {

  renderAllStatistics();


  setupBackButton();

  setupSoundToggle();

  setupAudioUnlock();

  setupLifecycle();

}


/*
========================================
啟動
========================================
*/

init();
