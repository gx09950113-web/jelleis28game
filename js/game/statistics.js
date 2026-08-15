/*
========================================
28 GAME LAB
game/statistics.js

負責：
- 每日遊戲統計
- 每日有效下注
- 每日遊戲盈虧
- 各倍場統計
- WIN / LOSE / REFUND 次數
- 反水資格場次的流水與盈虧
- 單局詳細紀錄
- 開獎結果紀錄
- 期號
- 最近 N 局查詢

不負責：
- 開獎
- 玩家下注
- 實際結算
- 發放反水
- 修改玩家錢包

資料保存於 localStorage。
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


/*
========================================
Storage Key
========================================
*/

const STATISTICS_KEY =
  "statistics";


/*
========================================
支援的房間
========================================
*/

const ROOM_IDS = [
  "1.8",
  "2.0",
  "2.8",
  "3.2"
];


/*
========================================
每日最多保留多少局詳細紀錄

避免 localStorage 長期無限制增加。

300 局 / 日對目前朋友體驗用途
已經非常充裕。
========================================
*/

const MAX_ROUND_HISTORY_PER_DAY =
  300;


/*
========================================
建立單一房間的空白統計
========================================
*/

function createEmptyRoomStats() {

  return {

    /*
    有效下注總額
    */

    validBet: 0,


    /*
    實際返還總額
    */

    payout: 0,


    /*
    遊戲淨盈虧

    正數 = 玩家盈利
    負數 = 玩家虧損
    */

    netProfit: 0,


    /*
    局數
    */

    rounds: 0,


    /*
    下注筆數
    */

    betCount: 0,


    /*
    結算狀態
    */

    winCount: 0,

    loseCount: 0,

    refundCount: 0

  };

}


/*
========================================
建立總統計空白資料
========================================
*/

function createEmptyTotalStats() {

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
建立某一天的空白統計
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


    /*
    ================================
    所有倍場統計
    包含 1.8
    ================================
    */

    total:
      createEmptyTotalStats(),


    /*
    ================================
    各倍場資料
    ================================
    */

    rooms,


    /*
    ================================
    反水專用統計

    只包含：
    2.0
    2.8
    3.2
    ================================
    */

    rebate: {

      validBet: 0,

      netProfit: 0,

      rounds: 0,


      /*
      隔日是否已處理反水
      */

      processed: false,


      /*
      實際發放資料
      */

      amount: 0,

      rate: 0,

      type: null,

      processedAt: null

    },


    /*
    ================================
    單局詳細紀錄

    一個 element = 一局
    ================================
    */

    roundHistory: [],


    /*
    ================================
    當日期號流水

    第一筆 = 1
    第二筆 = 2
    ...
    ================================
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
舊資料相容

因為你之前已經玩過網站，
localStorage 裡可能存在舊版：

{
  total,
  rooms,
  rebate
}

但沒有：
roundHistory
nextIssueNumber

所以讀資料時自動補齊。
========================================
*/

function normalizeDailyStats(
  dailyStats
) {

  if (!dailyStats) {

    return dailyStats;

  }


  /*
  total
  */

  if (!dailyStats.total) {

    dailyStats.total =
      createEmptyTotalStats();

  }


  /*
  rooms
  */

  if (!dailyStats.rooms) {

    dailyStats.rooms = {};

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


  /*
  rebate
  */

  if (!dailyStats.rebate) {

    dailyStats.rebate = {

      validBet: 0,

      netProfit: 0,

      rounds: 0,

      processed: false,

      amount: 0,

      rate: 0,

      type: null,

      processedAt: null

    };

  }


  /*
  單局歷史
  */

  if (
    !Array.isArray(
      dailyStats.roundHistory
    )
  ) {

    dailyStats.roundHistory =
      [];

  }


  /*
  期號流水
  */

  if (
    !Number.isInteger(
      dailyStats.nextIssueNumber
    )
    ||
    dailyStats.nextIssueNumber
    < 1
  ) {

    dailyStats.nextIssueNumber =
      dailyStats.roundHistory.length
      +
      1;

  }


  return dailyStats;

}


/*
========================================
讀取全部統計
========================================
*/

export function getAllStatistics() {

  const statistics =
    getStorage(
      STATISTICS_KEY
    )
    ??
    {};


  /*
  把歷史舊格式一起補齊。
  */

  for (
    const date
    of Object.keys(
      statistics
    )
  ) {

    statistics[date] =
      normalizeDailyStats(
        statistics[date]
      );

  }


  return statistics;

}


/*
========================================
保存全部統計
========================================
*/

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
取得指定日期統計
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
取得或建立某日統計
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
保存指定日期統計
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


  dailyStats =
    normalizeDailyStats(
      dailyStats
    );


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
房間是否參與反水
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
驗證 Settlement
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


  if (
    !Number.isFinite(
      settlement.totalBet
    )
  ) {

    throw new Error(
      "結算資料缺少 totalBet。"
    );

  }


  if (
    !Number.isFinite(
      settlement.totalPayout
    )
  ) {

    throw new Error(
      "結算資料缺少 totalPayout。"
    );

  }


  if (
    !Number.isFinite(
      settlement.netProfit
    )
  ) {

    throw new Error(
      "結算資料缺少 netProfit。"
    );

  }


  return true;

}


/*
========================================
驗證 Draw Result
========================================
*/

function validateDrawResult(
  drawResult
) {

  if (!drawResult) {

    throw new Error(
      "缺少開獎結果。"
    );

  }


  if (
    !Array.isArray(
      drawResult.numbers
    )
    ||
    drawResult.numbers.length
    !==
    3
  ) {

    throw new Error(
      "開獎結果缺少三個號碼。"
    );

  }


  if (
    !Number.isInteger(
      drawResult.sum
    )
  ) {

    throw new Error(
      "開獎結果缺少和值。"
    );

  }


  return true;

}


/*
========================================
建立期號

例如：

日期：
2026-08-16

當日第 7 筆有下注結算：

20260816-007
========================================
*/

function createIssueNumber(
  date,
  issueNumber
) {

  const datePart =
    String(date)
      .replaceAll(
        "-",
        ""
      );


  const numberPart =
    String(
      issueNumber
    )
      .padStart(
        3,
        "0"
      );


  return (
    `${datePart}-${numberPart}`
  );

}


/*
========================================
複製每一筆下注詳細資料

不要直接保存原始 object reference，
避免後續修改影響歷史紀錄。
========================================
*/

function createBetRecord(
  settlement
) {

  return {

    betId:
      settlement.betId,


    type:
      settlement.type,


    amount:
      settlement.amount,


    result:
      settlement.result,


    payout:
      settlement.payout,


    netProfit:
      settlement.netProfit,


    refundReasons:
      Array.isArray(
        settlement.refundReasons
      )

      ? [
          ...settlement
            .refundReasons
        ]

      : []

  };

}


/*
========================================
建立單局詳細資料
========================================
*/

function createRoundRecord(
  dailyStats,
  settlement,
  drawResult
) {

  const issueNumber =
    dailyStats
      .nextIssueNumber;


  const issue =
    createIssueNumber(

      dailyStats.date,

      issueNumber

    );


  /*
  下一局使用下一號
  */

  dailyStats
    .nextIssueNumber +=
    1;


  return {

    /*
    ================================
    基本資料
    ================================
    */

    issue,

    issueNumber,

    date:
      dailyStats.date,

    roomId:
      settlement.roomId,


    /*
    ================================
    開獎結果
    ================================
    */

    draw: {

      numbers:
        [
          ...drawResult
            .numbers
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
        Boolean(
          drawResult.hasZero
        ),


      isPair:
        Boolean(
          drawResult.isPair
        ),


      isLeopard:
        Boolean(
          drawResult.isLeopard
        ),


      isMiddleSum:
        Boolean(
          drawResult.isMiddleSum
        ),


      isSum13:
        Boolean(
          drawResult.isSum13
        ),


      isSum14:
        Boolean(
          drawResult.isSum14
        )

    },


    /*
    ================================
    本局總結算
    ================================
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
    ================================
    每筆下注明細
    ================================
    */

    bets:
      settlement
        .settlements
        .map(
          createBetRecord
        ),


    /*
    ================================
    時間
    ================================
    */

    settledAt:
      settlement.settledAt
      ??
      Date.now()

  };

}


/*
========================================
限制每日歷史紀錄長度
========================================
*/

function trimRoundHistory(
  dailyStats
) {

  if (
    dailyStats
      .roundHistory
      .length
    <=
    MAX_ROUND_HISTORY_PER_DAY
  ) {

    return;

  }


  /*
  只保留最新 300 局。
  */

  dailyStats.roundHistory =
    dailyStats
      .roundHistory
      .slice(
        -MAX_ROUND_HISTORY_PER_DAY
      );

}


/*
========================================
記錄一局結算

新版呼叫方式：

recordSettlement(
  settlement,
  drawResult
);

注意：

目前 pages/game.js 只有在
settlement.totalBet > 0
才呼叫這個函式。

因此目前 roundHistory 的定義為：

「玩家有下注的開獎期數」

而不是：
「遊戲所有開獎期數」

真正獨立的全開獎歷史，
後面再拆 draw history。
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


  validateDrawResult(
    drawResult
  );


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
  全站遊戲統計
  ================================
  */

  dailyStats
    .total
    .validBet +=
    settlement.totalBet;


  dailyStats
    .total
    .payout +=
    settlement.totalPayout;


  dailyStats
    .total
    .netProfit +=
    settlement.netProfit;


  dailyStats
    .total
    .rounds +=
    1;


  dailyStats
    .total
    .betCount +=
    settlement
      .settlements
      .length;


  dailyStats
    .total
    .winCount +=
    settlement.winCount;


  dailyStats
    .total
    .loseCount +=
    settlement.loseCount;


  dailyStats
    .total
    .refundCount +=
    settlement.refundCount;


  /*
  ================================
  反水統計

  僅：
  2.0
  2.8
  3.2
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
  建立單局詳細紀錄
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


  trimRoundHistory(
    dailyStats
  );


  /*
  ================================
  保存
  ================================
  */

  saveDailyStats(
    dailyStats
  );


  /*
  回傳 dailyStats 的同時，
  也把剛建立的 roundRecord 回傳。

  之後如果 game.js 想顯示
  當期期號可以直接使用。
  */

  return {

    dailyStats,

    roundRecord

  };

}


/*
========================================
取得某日特定倍場統計
========================================
*/

export function getRoomStats(
  roomId,
  date = getLocalDateString()
) {

  if (
    !ROOM_IDS.includes(
      roomId
    )
  ) {

    throw new Error(
      `無效的倍場：${roomId}`
    );

  }


  const dailyStats =
    getDailyStats(
      date
    );


  if (!dailyStats) {

    return null;

  }


  return (
    dailyStats
      .rooms[
        roomId
      ]
    ??
    null
  );

}


/*
========================================
取得反水統計
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
將反水標記為已處理
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


  /*
  防止重複領取
  */

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
      Math.floor(
        amount
      )
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
取得日期排序後統計

新 → 舊
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
        first,
        second
      ) =>
        second.date
          .localeCompare(
            first.date
          )
    );

}


/*
========================================
最近 N 個有紀錄日期
========================================
*/

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
取得所有單局紀錄

跨日期合併。

回傳順序：
最新 → 最舊
========================================
*/

export function getAllRoundHistory() {

  const statistics =
    getStatisticsHistory();


  const rounds =
    [];


  for (
    const dailyStats
    of statistics
  ) {

    if (
      !Array.isArray(
        dailyStats
          .roundHistory
      )
    ) {

      continue;

    }


    rounds.push(
      ...dailyStats
        .roundHistory
    );

  }


  /*
  不直接相信陣列原本順序，
  用 settledAt 排一次。
  */

  rounds.sort(
    (
      first,
      second
    ) => {

      const firstTime =
        first.settledAt
        ??
        0;


      const secondTime =
        second.settledAt
        ??
        0;


      return (
        secondTime
        -
        firstTime
      );

    }
  );


  return rounds;

}


/*
========================================
取得最近 N 局

使用方式：

getRecentRounds(
  10
)

→ 所有倍場最近 10 局


getRecentRounds(
  10,
  "2.8"
)

→ 只取 2.8 倍場最近 10 局
========================================
*/

export function getRecentRounds(
  limit = 10,
  roomId = null
) {

  let rounds =
    getAllRoundHistory();


  /*
  房間篩選
  */

  if (
    roomId
    !==
    null
  ) {

    if (
      !ROOM_IDS.includes(
        roomId
      )
    ) {

      return [];

    }


    rounds =
      rounds.filter(
        round =>
          round.roomId
          ===
          roomId
      );

  }


  /*
  limit 防呆
  */

  const safeLimit =
    Number.isInteger(
      limit
    )
    &&
    limit > 0

    ? limit

    : 10;


  return rounds.slice(
    0,
    safeLimit
  );

}


/*
========================================
依期號取得單局紀錄

例如：

getRoundByIssue(
  "20260816-007"
)
========================================
*/

export function getRoundByIssue(
  issue
) {

  if (!issue) {

    return null;

  }


  const rounds =
    getAllRoundHistory();


  return (
    rounds.find(
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
取得指定日期的單局紀錄

預設：
新 → 舊
========================================
*/

export function getRoundsByDate(
  date
) {

  const dailyStats =
    getDailyStats(
      date
    );


  if (
    !dailyStats
    ||
    !Array.isArray(
      dailyStats
        .roundHistory
    )
  ) {

    return [];

  }


  return [
    ...dailyStats
      .roundHistory
  ]
    .sort(
      (
        first,
        second
      ) =>
        (
          second.settledAt
          ??
          0
        )
        -
        (
          first.settledAt
          ??
          0
        )
    );

}


/*
========================================
取得指定房間所有單局紀錄
========================================
*/

export function getRoundsByRoom(
  roomId
) {

  if (
    !ROOM_IDS.includes(
      roomId
    )
  ) {

    return [];

  }


  return getAllRoundHistory()
    .filter(
      round =>
        round.roomId
        ===
        roomId
    );

}


/*
========================================
清除指定日期統計

主要供：
- 開發
- 測試
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
