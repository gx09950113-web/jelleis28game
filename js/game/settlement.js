/*
========================================
28 GAME LAB
settlement.js

負責：
- 判斷特殊回本
- 判斷下注輸贏
- 計算返還金額
- 計算單局淨盈虧

不負責：
- 開獎
- 產生下注
- 實際修改 localStorage
========================================
*/

import {
  ROOM_CONFIG
}
from "../config/rooms.js";


/*
========================================
結算狀態
========================================
*/

export const BET_RESULT = {

  WIN: "win",

  LOSE: "lose",

  REFUND: "refund"

};


/*
========================================
取得房間設定
========================================
*/

function getRoom(
  roomId
) {

  const room =
    ROOM_CONFIG[
      roomId
    ];


  if (!room) {

    throw new Error(
      `不存在的倍場：${roomId}`
    );

  }


  return room;

}


/*
========================================
檢查特殊回本

drawResult 必須是
rules.js 的 analyzeDraw()
回傳結果。
========================================
*/

export function shouldRefund(
  roomId,
  drawResult
) {

  const room =
    getRoom(
      roomId
    );


  const rules =
    room.refundRules;


  if (!rules) {

    return false;

  }


  /*
  包含 0
  */

  if (
    rules.hasZero
    &&
    drawResult.hasZero
  ) {

    return true;

  }


  /*
  對子
  */

  if (
    rules.pair
    &&
    drawResult.isPair
  ) {

    return true;

  }


  /*
  豹子
  */

  if (
    rules.leopard
    &&
    drawResult.isLeopard
  ) {

    return true;

  }


  /*
  和值 13 / 14
  */

  if (
    rules.sum13or14
    &&
    drawResult.isMiddleSum
  ) {

    return true;

  }


  return false;

}


/*
========================================
取得回本原因

主要給 UI 顯示。
========================================
*/

export function getRefundReasons(
  roomId,
  drawResult
) {

  const room =
    getRoom(
      roomId
    );


  const rules =
    room.refundRules;


  const reasons = [];


  if (!rules) {

    return reasons;

  }


  if (
    rules.hasZero
    &&
    drawResult.hasZero
  ) {

    reasons.push(
      "has-zero"
    );

  }


  if (
    rules.pair
    &&
    drawResult.isPair
  ) {

    reasons.push(
      "pair"
    );

  }


  if (
    rules.leopard
    &&
    drawResult.isLeopard
  ) {

    reasons.push(
      "leopard"
    );

  }


  if (
    rules.sum13or14
    &&
    drawResult.isMiddleSum
  ) {

    reasons.push(
      "sum-13-14"
    );

  }


  return reasons;

}


/*
========================================
判斷下注是否命中
========================================
*/

export function isWinningBet(
  betType,
  drawResult
) {

  switch (
    betType
  ) {

    case "big":

      return (
        drawResult.size
        ===
        "big"
      );


    case "small":

      return (
        drawResult.size
        ===
        "small"
      );


    case "odd":

      return (
        drawResult.parity
        ===
        "odd"
      );


    case "even":

      return (
        drawResult.parity
        ===
        "even"
      );


    case "big-odd":

      return (
        drawResult.sizeParity
        ===
        "big-odd"
      );


    case "big-even":

      return (
        drawResult.sizeParity
        ===
        "big-even"
      );


    case "small-odd":

      return (
        drawResult.sizeParity
        ===
        "small-odd"
      );


    case "small-even":

      return (
        drawResult.sizeParity
        ===
        "small-even"
      );


    default:

      throw new Error(
        `未知下注類型：${betType}`
      );

  }

}


/*
========================================
計算倍率返還

目前使用：

下注額 × room.multiplier

例如：

2.8倍場
下注 100

中獎返還：
100 × 2.8
= 280

本金包含在 280 裡。
========================================
*/

export function calculatePayout(
  amount,
  multiplier
) {

  /*
    因為下注額目前規定為
    10 的倍數，
    正常情況不會產生小數。

    Math.round 可以順便避免
    JS 浮點誤差，例如
    100 * 2.8
    出現極小誤差。
  */

  return Math.round(
    amount
    *
    multiplier
  );

}


/*
========================================
結算單筆下注
========================================
*/

export function settleBet(
  bet,
  drawResult
) {

  const room =
    getRoom(
      bet.roomId
    );


  /*
  1.
  先判斷回本。

  回本優先級最高。
  */

  if (
    shouldRefund(
      bet.roomId,
      drawResult
    )
  ) {

    return {

      betId:
        bet.id,

      roomId:
        bet.roomId,

      type:
        bet.type,

      amount:
        bet.amount,

      result:
        BET_RESULT.REFUND,

      payout:
        bet.amount,

      /*
      本金已在下注時扣掉。

      REFUND 返還同額，
      所以淨盈虧 = 0。
      */

      netProfit: 0,

      refundReasons:
        getRefundReasons(
          bet.roomId,
          drawResult
        )

    };

  }


  /*
  2.
  正常判斷輸贏
  */

  const win =
    isWinningBet(
      bet.type,
      drawResult
    );


  /*
  中獎
  */

  if (win) {

    const payout =
      calculatePayout(
        bet.amount,
        room.multiplier
      );


    return {

      betId:
        bet.id,

      roomId:
        bet.roomId,

      type:
        bet.type,

      amount:
        bet.amount,

      result:
        BET_RESULT.WIN,

      payout,

      /*
      payout 包含本金，
      所以真正淨盈利：

      payout - bet amount
      */

      netProfit:
        payout
        -
        bet.amount,

      refundReasons: []

    };

  }


  /*
  未中
  */

  return {

    betId:
      bet.id,

    roomId:
      bet.roomId,

    type:
      bet.type,

    amount:
      bet.amount,

    result:
      BET_RESULT.LOSE,

    payout: 0,

    netProfit:
      -bet.amount,

    refundReasons: []

  };

}


/*
========================================
結算整個 Bet Slip
========================================
*/

export function settleBetSlip(
  betSlip,
  drawResult
) {

  const settlements =
    betSlip.bets.map(
      bet =>
        settleBet(
          bet,
          drawResult
        )
    );


  /*
  所有返還金額
  */

  const totalPayout =
    settlements.reduce(
      (
        total,
        settlement
      ) =>
        total
        +
        settlement.payout,

      0
    );


  /*
  所有下注金額
  */

  const totalBet =
    settlements.reduce(
      (
        total,
        settlement
      ) =>
        total
        +
        settlement.amount,

      0
    );


  /*
  整局淨盈虧

  注意：

  因為下注本金在下注時
  已經扣除，

  所以這裡直接使用
  每筆 settlement 的
  netProfit 相加。
  */

  const netProfit =
    settlements.reduce(
      (
        total,
        settlement
      ) =>
        total
        +
        settlement.netProfit,

      0
    );


  /*
  統計 WIN / LOSE / REFUND
  */

  const winCount =
    settlements.filter(
      settlement =>
        settlement.result
        ===
        BET_RESULT.WIN
    ).length;


  const loseCount =
    settlements.filter(
      settlement =>
        settlement.result
        ===
        BET_RESULT.LOSE
    ).length;


  const refundCount =
    settlements.filter(
      settlement =>
        settlement.result
        ===
        BET_RESULT.REFUND
    ).length;


  return {

    roomId:
      betSlip.roomId,

    settlements,

    totalBet,

    totalPayout,

    netProfit,

    winCount,

    loseCount,

    refundCount,

    settledAt:
      Date.now()

  };

}
