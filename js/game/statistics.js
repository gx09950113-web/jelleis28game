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
- 反水資格場次的流水與盈虧

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
    所有倍場統計
    包含 1.8
    */

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


    /*
    各倍場資料
    */

    rooms,


    /*
    ================================
    反水專用統計

    只包含：

    2.0
    2.8
    3.2

    1.8 完全不影響這裡。
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
      實際發放反水
      之後 rebate 系統填寫
      */

      amount: 0,

      rate: 0,

      type: null,

      processedAt: null

    },


    /*
    建立時間
    */

    createdAt:
      Date.now(),


    /*
    最後更新
    */

    updatedAt:
      Date.now()

  };

}


/*
========================================
讀取全部統計
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


  return statistics[date];

}


/*
========================================
取得或建立今日統計
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


    saveAllStatistics(
      statistics
    );

  }


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
記錄一局結算

傳入：

settleBetSlip()

產生的完整結算結果。
========================================
*/

export function recordSettlement(
  settlement,
  date = getLocalDateString()
) {

  validateSettlement(
    settlement
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
    settlement.settlements.length;


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

  dailyStats.total.validBet +=
    settlement.totalBet;


  dailyStats.total.payout +=
    settlement.totalPayout;


  dailyStats.total.netProfit +=
    settlement.netProfit;


  dailyStats.total.rounds +=
    1;


  dailyStats.total.betCount +=
    settlement.settlements.length;


  dailyStats.total.winCount +=
    settlement.winCount;


  dailyStats.total.loseCount +=
    settlement.loseCount;


  dailyStats.total.refundCount +=
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

    dailyStats.rebate.validBet +=
      settlement.totalBet;


    dailyStats.rebate.netProfit +=
      settlement.netProfit;


    dailyStats.rebate.rounds +=
      1;

  }


  /*
  保存
  */

  saveDailyStats(
    dailyStats
  );


  return dailyStats;

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


  return dailyStats
    .rooms[
      roomId
    ];

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

之後 rebate.js
真正計算完反水後使用。
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
取得日期排序後的統計紀錄

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
只取得最近 N 天
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
