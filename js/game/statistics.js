/*
========================================
28 GAME LAB
statistics.js

負責：
- 每日遊戲統計
- 每日有效下注
- 每日遊戲盈虧
- 各倍場統計
- WIN / LOSE / REFUND 次數
- 反水統計
- 保存每局詳細資料
- 開獎歷史
- 近 N 期查詢
========================================
*/


import {
  getStorage,
  setStorage
}
from "../core/storage.js";


import {
  getLocalDateString
}
from "../core/date.js";


import {
  REBATE_CONFIG
}
from "../config/rebate.js";


const STATISTICS_KEY =
  "statistics";


const ROOM_IDS = [
  "1.8",
  "2.0",
  "2.8",
  "3.2"
];


/*
避免 localStorage 無限膨脹。

每個日期最多保存 300 局詳細資料。
一般體驗用途已經非常足夠。
*/

const MAX_ROUNDS_PER_DAY =
  300;


/*
========================================
空白房間統計
========================================
*/

function createEmptyRoomStats() {

  return {

    validBet: 0,

    payout: 0,

    netProfit: 0,

    rounds: 0,

    betCount: 0,

    winCount: 0,

    loseCount: 0,

    refundCount: 0

  };

}


/*
========================================
空白每日統計
========================================
*/

export function createDailyStats(
  date = getLocalDateString()
) {

  const rooms = {};


  for (
    const roomId
    of ROOM_IDS
  ) {

    rooms[roomId] =
      createEmptyRoomStats();

  }


  return {

    date,


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


    rooms,


    rebate: {

      validBet: 0,

      netProfit: 0,

      rounds: 0,

      processed: false,

      amount: 0,

      rate: 0,

      type: null,

      processedAt: null

    },


    /*
    ================================
    每局詳細紀錄
    ================================
    */

    roundHistory: [],


    /*
    當日期號流水號
    */

    nextIssueNumber: 1,


    createdAt:
      Date.now(),

    updatedAt:
      Date.now()

  };

}


/*
========================================
舊版資料升級
========================================
*/

function normalizeDailyStats(
  dailyStats
) {

  if (!dailyStats) {

    return dailyStats;

  }


  if (
    !Array.isArray(
      dailyStats.roundHistory
    )
  ) {

    dailyStats.roundHistory =
      [];

  }


  if (
    !Number.isInteger(
      dailyStats.nextIssueNumber
    )
  ) {

    dailyStats.nextIssueNumber =
      dailyStats.roundHistory.length
      +
      1;

  }


  if (!dailyStats.rooms) {

    dailyStats.rooms =
      {};

  }


  for (
    const roomId
    of ROOM_IDS
  ) {

    if (
      !dailyStats.rooms[
        roomId
      ]
    ) {

      dailyStats.rooms[
        roomId
      ] =
        createEmptyRoomStats();

    }

  }


  return dailyStats;

}


/*
========================================
全部統計
========================================
*/

export function getAllStatistics() {

  return (
    getStorage(
      STATISTICS_KEY
    )
    ??
    {}
  );

}


function saveAllStatistics(
  statistics
) {

  setStorage(
    STATISTICS_KEY,
    statistics
  );

}


/*
========================================
單日統計
========================================
*/

export function getDailyStats(
  date = getLocalDateString()
) {

  const statistics =
    getAllStatistics();


  if (
    !statistics[date]
  ) {

    return null;

  }


  return normalizeDailyStats(
    statistics[date]
  );

}


/*
========================================
取得或建立
========================================
*/

export function getOrCreateDailyStats(
  date = getLocalDateString()
) {

  const statistics =
    getAllStatistics();


  if (
    !statistics[date]
  ) {

    statistics[date] =
      createDailyStats(
        date
      );

  }


  statistics[date] =
    normalizeDailyStats(
      statistics[date]
    );


  saveAllStatistics(
    statistics
  );


  return statistics[date];

}


/*
========================================
保存每日統計
========================================
*/

export function saveDailyStats(
  dailyStats
) {

  if (
    !dailyStats
    ||
    !dailyStats.date
  ) {

    throw new Error(
      "無效的每日統計資料。"
    );

  }


  dailyStats.updatedAt =
    Date.now();


  const statistics =
    getAllStatistics();


  statistics[
    dailyStats.date
  ] =
    dailyStats;


  saveAllStatistics(
    statistics
  );

}


/*
========================================
反水資格房間
========================================
*/

export function isRebateEligibleRoom(
  roomId
) {

  return (
    REBATE_CONFIG
      .eligibleRooms
      .includes(
        roomId
      )
  );

}


/*
========================================
Settlement 驗證
========================================
*/

function validateSettlement(
  settlement
) {

  if (!settlement) {

    throw new Error(
      "缺少結算資料。"
    );

  }


  if (
    !ROOM_IDS.includes(
      settlement.roomId
    )
  ) {

    throw new Error(
      `無效的倍場：${settlement.roomId}`
    );

  }


  if (
    !Array.isArray(
      settlement.settlements
    )
  ) {

    throw new Error(
      "結算資料缺少 settlements。"
    );

  }


  return true;

}


/*
========================================
期號格式
========================================

例如：

2026-08-16
第 12 局

→ 20260816-012
========================================
*/

function createIssueNumber(
  date,
  number
) {

  const datePart =
    date.replaceAll(
      "-",
      ""
    );


  return (
    `${datePart}-`
    +
    String(number)
      .padStart(
        3,
        "0"
      )
  );

}


/*
========================================
建立單局紀錄
========================================
*/

function createRoundRecord(
  dailyStats,
  settlement,
  drawResult
) {

  const issue =
    createIssueNumber(

      dailyStats.date,

      dailyStats
        .nextIssueNumber

    );


  dailyStats
    .nextIssueNumber +=
    1;


  return {

    issue,

    roomId:
      settlement.roomId,


    /*
    開獎
    */

    draw: {

      numbers:
        [
          ...drawResult.numbers
        ],

      sum:
        drawResult.sum,

      size:
        drawResult.size,

      parity:
        drawResult.parity,

      sizeParity:
        drawResult.sizeParity,

      hasZero:
        drawResult.hasZero,

      isPair:
        drawResult.isPair,

      isLeopard:
        drawResult.isLeopard,

      isSum13:
        drawResult.isSum13,

      isSum14:
        drawResult.isSum14

    },


    /*
    玩家本局結算
    */

    totalBet:
      settlement.totalBet,

    totalPayout:
      settlement.totalPayout,

    netProfit:
      settlement.netProfit,

    winCount:
      settlement.winCount,

    loseCount:
      settlement.loseCount,

    refundCount:
      settlement.refundCount,


    /*
    每一筆下注詳細
    */

    bets:
      settlement.settlements
        .map(
          item => ({

            betId:
              item.betId,

            type:
              item.type,

            amount:
              item.amount,

            result:
              item.result,

            payout:
              item.payout,

            netProfit:
              item.netProfit,

            refundReasons:
              Array.isArray(
                item.refundReasons
              )

              ? [
                  ...item.refundReasons
                ]

              : []

          })
        ),


    settledAt:
      settlement.settledAt
      ??
      Date.now()

  };

}


/*
========================================
記錄一局

現在需要：

recordSettlement(
  settlement,
  drawResult
)
========================================
*/

export function recordSettlement(
  settlement,
  drawResult,
  date = getLocalDateString()
) {

  validateSettlement(
    settlement
  );


  if (
    !drawResult
    ||
    !Array.isArray(
      drawResult.numbers
    )
  ) {

    throw new Error(
      "缺少開獎結果。"
    );

  }


  const dailyStats =
    getOrCreateDailyStats(
      date
    );


  const roomId =
    settlement.roomId;


  const roomStats =
    dailyStats.rooms[
      roomId
    ];


  /*
  ================================
  房間統計
  ================================
  */

  roomStats.validBet +=
    settlement.totalBet;


  roomStats.payout +=
    settlement.totalPayout;


  roomStats.netProfit +=
    settlement.netProfit;


  roomStats.rounds +=
    1;


  roomStats.betCount +=
    settlement
      .settlements
      .length;


  roomStats.winCount +=
    settlement.winCount;


  roomStats.loseCount +=
    settlement.loseCount;


  roomStats.refundCount +=
    settlement.refundCount;


  /*
  ================================
  全站統計
  ================================
  */

  dailyStats.total.validBet +=
    settlement.totalBet;


  dailyStats.total.payout +=
    settlement.totalPayout;


  dailyStats.total.netProfit +=
    settlement.netProfit;


  dailyStats.total.rounds +=
    1;


  dailyStats.total.betCount +=
    settlement
      .settlements
      .length;


  dailyStats.total.winCount +=
    settlement.winCount;


  dailyStats.total.loseCount +=
    settlement.loseCount;


  dailyStats.total.refundCount +=
    settlement.refundCount;


  /*
  ================================
  反水
  ================================
  */

  if (
    isRebateEligibleRoom(
      roomId
    )
  ) {

    dailyStats
      .rebate
      .validBet +=
      settlement.totalBet;


    dailyStats
      .rebate
      .netProfit +=
      settlement.netProfit;


    dailyStats
      .rebate
      .rounds +=
      1;

  }


  /*
  ================================
  保存單局詳細資料
  ================================
  */

  const roundRecord =
    createRoundRecord(

      dailyStats,

      settlement,

      drawResult

    );


  dailyStats
    .roundHistory
    .push(
      roundRecord
    );


  /*
  限制資料量
  */

  if (
    dailyStats
      .roundHistory
      .length
    >
    MAX_ROUNDS_PER_DAY
  ) {

    dailyStats.roundHistory =
      dailyStats
        .roundHistory
        .slice(
          -MAX_ROUNDS_PER_DAY
        );

  }


  saveDailyStats(
    dailyStats
  );


  return {

    dailyStats,

    roundRecord

  };

}


/*
========================================
單一房間每日統計
========================================
*/

export function getRoomStats(
  roomId,
  date = getLocalDateString()
) {

  const dailyStats =
    getDailyStats(
      date
    );


  if (!dailyStats) {

    return null;

  }


  return dailyStats
    .rooms[
      roomId
    ]
    ??
    null;

}


/*
========================================
反水統計
========================================
*/

export function getRebateStats(
  date = getLocalDateString()
) {

  const dailyStats =
    getDailyStats(
      date
    );


  if (!dailyStats) {

    return null;

  }


  return dailyStats.rebate;

}


/*
========================================
標記反水
========================================
*/

export function markRebateProcessed(
  date,
  {
    amount = 0,
    rate = 0,
    type = null
  } = {}
) {

  const dailyStats =
    getDailyStats(
      date
    );


  if (!dailyStats) {

    return false;

  }


  if (
    dailyStats
      .rebate
      .processed
  ) {

    return false;

  }


  dailyStats.rebate.processed =
    true;


  dailyStats.rebate.amount =
    Math.max(
      0,
      Math.floor(amount)
    );


  dailyStats.rebate.rate =
    rate;


  dailyStats.rebate.type =
    type;


  dailyStats.rebate.processedAt =
    Date.now();


  saveDailyStats(
    dailyStats
  );


  return true;

}


/*
========================================
日期紀錄
========================================
*/

export function getStatisticsHistory() {

  const statistics =
    getAllStatistics();


  return Object
    .values(
      statistics
    )
    .map(
      normalizeDailyStats
    )
    .sort(
      (
        a,
        b
      ) =>
        b.date.localeCompare(
          a.date
        )
    );

}


export function getRecentStatistics(
  days = 7
) {

  return getStatisticsHistory()
    .slice(
      0,
      days
    );

}


/*
========================================
取得所有單局詳細紀錄

新 → 舊
========================================
*/

export function getAllRoundHistory() {

  const days =
    getStatisticsHistory();


  const rounds = [];


  for (
    const day
    of days
  ) {

    if (
      !Array.isArray(
        day.roundHistory
      )
    ) {

      continue;

    }


    rounds.push(
      ...day.roundHistory
    );

  }


  return rounds.sort(
    (
      a,
      b
    ) =>
      (
        b.settledAt
        ?? 0
      )
      -
      (
        a.settledAt
        ?? 0
      )
  );

}


/*
========================================
最近 N 局

可指定 roomId。

例如：

getRecentRounds(10, "2.8")

→ 2.8 倍場最近 10 期
========================================
*/

export function getRecentRounds(
  limit = 10,
  roomId = null
) {

  let rounds =
    getAllRoundHistory();


  if (roomId) {

    rounds =
      rounds.filter(
        round =>
          round.roomId
          ===
          roomId
      );

  }


  return rounds.slice(
    0,
    limit
  );

}


/*
========================================
取得單一期號
========================================
*/

export function getRoundByIssue(
  issue
) {

  return (
    getAllRoundHistory()
      .find(
        round =>
          round.issue
          ===
          issue
      )
    ??
    null
  );

}


/*
========================================
刪除某日
========================================
*/

export function removeDailyStats(
  date
) {

  const statistics =
    getAllStatistics();


  if (
    !statistics[date]
  ) {

    return false;

  }


  delete statistics[
    date
  ];


  saveAllStatistics(
    statistics
  );


  return true;

}
