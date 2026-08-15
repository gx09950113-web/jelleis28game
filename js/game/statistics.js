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
- 玩家單局詳細紀錄
- 玩家單局紀錄 ID
- 關聯真正開獎期號 drawIssue
- 最近 N 局玩家紀錄查詢

不負責：
- 真正的所有開獎歷史
- 開獎
- 玩家下注
- 實際結算
- 發放反水
- 修改玩家錢包

真正開獎歷史：
game/draw-history.js

玩家統計與結算：
game/statistics.js
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
每日最多保留多少局玩家詳細紀錄
========================================
*/

const MAX_ROUND_HISTORY_PER_DAY =
  300;


/*
========================================
建立單一房間空白統計
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
建立每日空白統計
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
    全部遊戲統計
    ================================
    */

    total:
      createEmptyTotalStats(),


    /*
    ================================
    各倍場統計
    ================================
    */

    rooms,


    /*
    ================================
    反水統計

    僅：
    2.0
    2.8
    3.2
    ================================
    */

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
    玩家單局詳細紀錄

    只有玩家有下注的局
    才會進入這裡。
    ================================
    */

    roundHistory: [],


    /*
    ================================
    玩家單局紀錄流水

    這不是開獎期號。

    真正開獎期號由：
    draw-history.js

    負責。
    ================================
    */

    nextPlayerRecordNumber: 1,


    createdAt:
      Date.now(),


    updatedAt:
      Date.now()

  };

}


/*
========================================
舊版資料相容
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
  roundHistory
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
  ================================
  舊版 nextIssueNumber → 新版
  nextPlayerRecordNumber

  你之前 statistics.js 使用：
  nextIssueNumber

  現在重新命名，
  明確表示這只是玩家紀錄流水。
  ================================
  */

  if (
    !Number.isInteger(
      dailyStats.nextPlayerRecordNumber
    )
    ||
    dailyStats.nextPlayerRecordNumber
    <
    1
  ) {

    if (
      Number.isInteger(
        dailyStats.nextIssueNumber
      )
      &&
      dailyStats.nextIssueNumber
      >
      0
    ) {

      dailyStats.nextPlayerRecordNumber =
        dailyStats.nextIssueNumber;

    }

    else {

      dailyStats.nextPlayerRecordNumber =
        dailyStats.roundHistory.length
        +
        1;

    }

  }


  /*
  ================================
  舊單局資料相容

  舊版：
  round.issue

  新版：
  round.playerRecordId

  舊紀錄沒有 drawIssue
  就保持 null。
  ================================
  */

  for (
    const round
    of dailyStats.roundHistory
  ) {

    if (
      !round.playerRecordId
      &&
      round.issue
    ) {

      round.playerRecordId =
        round.issue;

    }


    if (
      typeof round.drawIssue
      !==
      "string"
    ) {

      round.drawIssue =
        null;

    }

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
取得或建立每日統計
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
驗證真正開獎期號

允許 null，
是為了相容舊資料與開發情境。
========================================
*/

function normalizeDrawIssue(
  drawIssue
) {

  if (
    typeof drawIssue
    !==
    "string"
  ) {

    return null;

  }


  const trimmed =
    drawIssue.trim();


  if (
    trimmed.length
    ===
    0
  ) {

    return null;

  }


  return trimmed;

}


/*
========================================
建立玩家紀錄 ID

注意：
這不是開獎期號。

例如：

PR-20260816-000001

PR = Player Record
========================================
*/

function createPlayerRecordId(
  date,
  recordNumber
) {

  const datePart =
    String(date)
      .replaceAll(
        "-",
        ""
      );


  const numberPart =
    String(
      recordNumber
    )
      .padStart(
        6,
        "0"
      );


  return (
    `PR-${datePart}-${numberPart}`
  );

}


/*
========================================
複製每筆下注資料
========================================
*/

function createBetRecord(
  settlementItem
) {

  return {

    betId:
      settlementItem.betId,


    type:
      settlementItem.type,


    amount:
      settlementItem.amount,


    result:
      settlementItem.result,


    payout:
      settlementItem.payout,


    netProfit:
      settlementItem.netProfit,


    refundReasons:
      Array.isArray(
        settlementItem.refundReasons
      )

      ? [
          ...settlementItem
            .refundReasons
        ]

      : []

  };

}


/*
========================================
建立玩家單局詳細紀錄
========================================
*/

function createRoundRecord(
  dailyStats,
  settlement,
  drawResult,
  drawIssue
) {

  const recordNumber =
    dailyStats
      .nextPlayerRecordNumber;


  const playerRecordId =
    createPlayerRecordId(

      dailyStats.date,

      recordNumber

    );


  dailyStats
    .nextPlayerRecordNumber +=
    1;


  return {

    /*
    ================================
    玩家紀錄識別碼

    例：
    PR-20260816-000003
    ================================
    */

    playerRecordId,


    playerRecordNumber:
      recordNumber,


    /*
    ================================
    真正對應的開獎期號

    例：
    28-20260816-000007

    由 draw-history.js 產生。
    ================================
    */

    drawIssue:
      normalizeDrawIssue(
        drawIssue
      ),


    date:
      dailyStats.date,


    roomId:
      settlement.roomId,


    /*
    ================================
    開獎快照

    即使將來 draw-history 資料
    被清除，玩家紀錄仍知道
    當時開了什麼。
    ================================
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
    玩家本局總結算
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


    settledAt:
      settlement.settledAt
      ??
      Date.now()

  };

}


/*
========================================
限制每日玩家單局歷史
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


  dailyStats.roundHistory =
    dailyStats
      .roundHistory
      .slice(
        -MAX_ROUND_HISTORY_PER_DAY
      );

}


/*
========================================
記錄玩家一局結算

新版：

recordSettlement(
  settlement,
  drawResult,
  drawIssue
);

例如：

recordSettlement(
  settlement,
  drawResult,
  "28-20260816-000007"
);

只有玩家實際下注時
game.js 才應呼叫此函式。
========================================
*/

export function recordSettlement(
  settlement,
  drawResult,
  drawIssue = null,
  date = getLocalDateString()
) {

  validateSettlement(
    settlement
  );


  validateDrawResult(
    drawResult
  );


  const normalizedDrawIssue =
    normalizeDrawIssue(
      drawIssue
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
  玩家單局詳細紀錄
  ================================
  */

  const roundRecord =
    createRoundRecord(

      dailyStats,

      settlement,

      drawResult,

      normalizedDrawIssue

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
反水標記為已處理
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
日期統計
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
所有玩家單局紀錄
跨日期

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


  rounds.sort(
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


  return rounds;

}


/*
========================================
最近 N 局玩家紀錄
========================================
*/

export function getRecentRounds(
  limit = 10,
  roomId = null
) {

  let rounds =
    getAllRoundHistory();


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
依玩家紀錄 ID 查詢

例：
PR-20260816-000003
========================================
*/

export function getRoundByPlayerRecordId(
  playerRecordId
) {

  if (!playerRecordId) {

    return null;

  }


  return (
    getAllRoundHistory()
      .find(
        round =>
          round.playerRecordId
          ===
          playerRecordId
      )
    ??
    null
  );

}


/*
========================================
依真正開獎期號查玩家紀錄

例如：

28-20260816-000007

如果玩家有參與該期，
就能找到玩家結算。

玩家沒有下注時：
回傳 null。
========================================
*/

export function getRoundByDrawIssue(
  drawIssue
) {

  if (!drawIssue) {

    return null;

  }


  return (
    getAllRoundHistory()
      .find(
        round =>
          round.drawIssue
          ===
          drawIssue
      )
    ??
    null
  );

}


/*
========================================
舊 API 相容

之前可能有程式呼叫：
getRoundByIssue()

現在優先：
1. drawIssue
2. playerRecordId
3. 舊 issue
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
        round.drawIssue
        ===
        issue
        ||
        round.playerRecordId
        ===
        issue
        ||
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
指定日期玩家單局紀錄
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
指定房間玩家單局紀錄
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
刪除指定日期統計
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
