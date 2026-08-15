/*
========================================
28 GAME LAB
core/rebate.js

負責：
- 讀取前一日反水統計
- 判斷虧損／盈利反水資格
- 計算反水比例
- 計算反水金額
- 套用虧損反水上限
- 發放反水至玩家錢包
- 標記該日反水已處理

不負責：
- 統計每日下注
- 統計每日盈虧
- 決定哪些倍場參與反水
- 修改反水級距設定

反水設定來源：
config/rebate.js

每日統計來源：
game/statistics.js
========================================
*/


import {
  REBATE_CONFIG
}
from "../config/rebate.js";


import {
  getDailyStats,
  markRebateProcessed
}
from "../game/statistics.js";


import {
  addBalance
}
from "./wallet.js";


import {
  getLocalDateString
}
from "./date.js";


/*
========================================
反水類型
========================================
*/

export const REBATE_TYPE = {

  LOSS: "loss",

  PROFIT: "profit",

  NONE: "none"

};


/*
========================================
取得指定日期的前一天

輸入：
2026-08-17

輸出：
2026-08-16
========================================
*/

export function getPreviousDateString(
  dateString = getLocalDateString()
) {

  const [
    year,
    month,
    day
  ] =
    dateString
      .split("-")
      .map(Number);


  const date =
    new Date(
      year,
      month - 1,
      day
    );


  date.setDate(
    date.getDate() - 1
  );


  const previousYear =
    date.getFullYear();


  const previousMonth =
    String(
      date.getMonth() + 1
    ).padStart(
      2,
      "0"
    );


  const previousDay =
    String(
      date.getDate()
    ).padStart(
      2,
      "0"
    );


  return (
    `${previousYear}-`
    +
    `${previousMonth}-`
    +
    `${previousDay}`
  );

}


/*
========================================
取得虧損反水比例

netProfit 必須是負數。

例如：

-4500
→ 虧損 4500
→ 0.5%

-8000
→ 虧損 8000
→ 1%

-15000
→ 1.5%

-25000
→ 2%
========================================
*/

export function getLossRebateRate(
  netProfit
) {

  if (
    !Number.isFinite(
      netProfit
    )
  ) {

    return 0;

  }


  if (
    netProfit >= 0
  ) {

    return 0;

  }


  const loss =
    Math.abs(
      netProfit
    );


  let rate = 0;


  for (
    const tier
    of REBATE_CONFIG.lossTiers
  ) {

    if (
      loss >= tier.min
    ) {

      rate =
        tier.rate;

    }

  }


  return rate;

}


/*
========================================
取得盈利反水比例

例如：

18000
→ 0.3%

35000
→ 0.6%

70000
→ 0.9%

120000
→ 1.2%
========================================
*/

export function getProfitRebateRate(
  netProfit
) {

  if (
    !Number.isFinite(
      netProfit
    )
  ) {

    return 0;

  }


  if (
    netProfit <= 0
  ) {

    return 0;

  }


  let rate = 0;


  for (
    const tier
    of REBATE_CONFIG.profitTiers
  ) {

    if (
      netProfit >= tier.min
    ) {

      rate =
        tier.rate;

    }

  }


  return rate;

}


/*
========================================
判斷反水類型
========================================
*/

export function getRebateType(
  netProfit
) {

  /*
  虧損反水
  */

  const lossRate =
    getLossRebateRate(
      netProfit
    );


  if (
    lossRate > 0
  ) {

    return REBATE_TYPE.LOSS;

  }


  /*
  盈利反水
  */

  const profitRate =
    getProfitRebateRate(
      netProfit
    );


  if (
    profitRate > 0
  ) {

    return REBATE_TYPE.PROFIT;

  }


  return REBATE_TYPE.NONE;

}


/*
========================================
計算反水

輸入：

validBet
→ 2.0 / 2.8 / 3.2
   當日有效下注總額

netProfit
→ 這些倍場的當日淨盈虧

輸出：
{
  eligible,
  type,
  rate,
  amount,
  rawAmount,
  capped,
  capAmount
}
========================================
*/

export function calculateRebate({
  validBet,
  netProfit
}) {

  /*
  基本驗證
  */

  if (
    !Number.isFinite(
      validBet
    )
    ||
    !Number.isFinite(
      netProfit
    )
  ) {

    return {

      eligible: false,

      type:
        REBATE_TYPE.NONE,

      rate: 0,

      amount: 0,

      rawAmount: 0,

      capped: false,

      capAmount: 0

    };

  }


  if (
    validBet <= 0
  ) {

    return {

      eligible: false,

      type:
        REBATE_TYPE.NONE,

      rate: 0,

      amount: 0,

      rawAmount: 0,

      capped: false,

      capAmount: 0

    };

  }


  const type =
    getRebateType(
      netProfit
    );


  /*
  不符合反水資格
  */

  if (
    type
    ===
    REBATE_TYPE.NONE
  ) {

    return {

      eligible: false,

      type,

      rate: 0,

      amount: 0,

      rawAmount: 0,

      capped: false,

      capAmount: 0

    };

  }


  /*
  取得比例
  */

  let rate = 0;


  if (
    type
    ===
    REBATE_TYPE.LOSS
  ) {

    rate =
      getLossRebateRate(
        netProfit
      );

  }


  else if (
    type
    ===
    REBATE_TYPE.PROFIT
  ) {

    rate =
      getProfitRebateRate(
        netProfit
      );

  }


  /*
  原始反水

  有效下注 × 比例
  */

  const rawAmount =
    Math.floor(
      validBet * rate
    );


  let amount =
    rawAmount;


  let capped =
    false;


  let capAmount =
    0;


  /*
  ================================
  虧損反水上限

  最高不得超過：
  實際虧損 × 50%
  ================================
  */

  if (
    type
    ===
    REBATE_TYPE.LOSS
  ) {

    const loss =
      Math.abs(
        netProfit
      );


    capAmount =
      Math.floor(

        loss

        *

        REBATE_CONFIG
          .lossRebateCapRatio

      );


    if (
      amount > capAmount
    ) {

      amount =
        capAmount;


      capped =
        true;

    }

  }


  /*
  如果算出來小於 1，
  就視為沒有可發放反水。
  */

  if (
    amount <= 0
  ) {

    return {

      eligible: false,

      type,

      rate,

      amount: 0,

      rawAmount,

      capped,

      capAmount

    };

  }


  return {

    eligible: true,

    type,

    rate,

    amount,

    rawAmount,

    capped,

    capAmount

  };

}


/*
========================================
預覽指定日期反水

只計算，
不發錢，
不標記 processed。

主要用於：
- UI
- 測試
- 顯示昨日資料
========================================
*/

export function previewRebate(
  date
) {

  const dailyStats =
    getDailyStats(
      date
    );


  if (!dailyStats) {

    return {

      exists: false,

      date,

      alreadyProcessed: false,

      eligible: false,

      validBet: 0,

      netProfit: 0,

      type:
        REBATE_TYPE.NONE,

      rate: 0,

      amount: 0,

      rawAmount: 0,

      capped: false,

      capAmount: 0

    };

  }


  const rebateStats =
    dailyStats.rebate;


  const calculation =
    calculateRebate({

      validBet:
        rebateStats.validBet,

      netProfit:
        rebateStats.netProfit

    });


  return {

    exists: true,

    date,

    alreadyProcessed:
      rebateStats.processed,

    validBet:
      rebateStats.validBet,

    netProfit:
      rebateStats.netProfit,

    ...calculation

  };

}


/*
========================================
處理指定日期反水

真正執行：

1. 讀取每日統計
2. 檢查是否已處理
3. 計算反水
4. 加入錢包
5. 標記 processed

注意：
同一天只能成功處理一次。
========================================
*/

export function processRebateForDate(
  date
) {

  const dailyStats =
    getDailyStats(
      date
    );


  /*
  沒有當日統計
  */

  if (!dailyStats) {

    return {

      success: false,

      reason:
        "no-statistics",

      date,

      eligible: false,

      amount: 0

    };

  }


  /*
  已經處理過
  */

  if (
    dailyStats
      .rebate
      .processed
  ) {

    return {

      success: false,

      reason:
        "already-processed",

      date,

      eligible: false,

      amount:
        dailyStats
          .rebate
          .amount
          ??
          0,

      type:
        dailyStats
          .rebate
          .type
          ??
          null,

      rate:
        dailyStats
          .rebate
          .rate
          ??
          0

    };

  }


  const validBet =
    dailyStats
      .rebate
      .validBet;


  const netProfit =
    dailyStats
      .rebate
      .netProfit;


  const calculation =
    calculateRebate({

      validBet,

      netProfit

    });


  /*
  ================================
  不符合反水資格

  即使沒有獎勵，
  也必須標記 processed。

  否則每次登入都會
  一直重複檢查同一天。
  ================================
  */

  if (
    !calculation.eligible
  ) {

    markRebateProcessed(

      date,

      {

        amount: 0,

        rate:
          calculation.rate,

        type:
          calculation.type
          ===
          REBATE_TYPE.NONE

          ? null

          : calculation.type

      }

    );


    return {

      success: true,

      reason:
        "not-eligible",

      date,

      eligible: false,

      validBet,

      netProfit,

      ...calculation

    };

  }


  /*
  ================================
  發放反水
  ================================
  */

  const balanceAdded =
    addBalance(
      calculation.amount
    );


  /*
  玩家資料不存在等異常情況。

  此時不能標記 processed，
  否則會造成獎勵沒入帳，
  但系統認為已領取。
  */

  if (
    !balanceAdded
  ) {

    return {

      success: false,

      reason:
        "wallet-error",

      date,

      eligible: true,

      validBet,

      netProfit,

      ...calculation

    };

  }


  /*
  ================================
  標記已處理
  ================================
  */

  const marked =
    markRebateProcessed(

      date,

      {

        amount:
          calculation.amount,

        rate:
          calculation.rate,

        type:
          calculation.type

      }

    );


  /*
  理論上不應發生。

  如果 mark 失敗，
  可能造成重複發放風險。

  正式版本可以再加
  transaction system 處理。
  */

  if (!marked) {

    console.error(
      "反水已發放，但統計標記失敗：",
      date
    );

  }


  return {

    success: true,

    reason:
      "rebate-paid",

    date,

    eligible: true,

    validBet,

    netProfit,

    ...calculation

  };

}


/*
========================================
處理昨日反水

首頁登入時主要呼叫這個。

例如今天：
2026-08-17

它會處理：
2026-08-16
========================================
*/

export function processYesterdayRebate() {

  const today =
    getLocalDateString();


  const yesterday =
    getPreviousDateString(
      today
    );


  return processRebateForDate(
    yesterday
  );

}
