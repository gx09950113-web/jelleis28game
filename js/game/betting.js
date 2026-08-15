/*
========================================
28 GAME LAB
betting.js

負責：
- 定義可下注項目
- 建立下注
- 驗證下注
- 管理本局下注
- 計算本局總下注額

不負責：
- 開獎
- 判斷輸贏
- 回本
- 實際加減玩家餘額
========================================
*/


/*
========================================
下注類型
========================================
*/

export const BET_TYPES = {

  BIG: "big",
  SMALL: "small",

  ODD: "odd",
  EVEN: "even",

  BIG_ODD: "big-odd",
  BIG_EVEN: "big-even",

  SMALL_ODD: "small-odd",
  SMALL_EVEN: "small-even"

};


/*
========================================
所有允許下注項目
========================================
*/

export const VALID_BET_TYPES =
  Object.values(
    BET_TYPES
  );


/*
========================================
下注顯示名稱
========================================
*/

export const BET_LABELS = {

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
下注基本設定

之後如果不同倍場
有不同最低／最高下注，
可以再移到 rooms.js。
========================================
*/

export const BET_CONFIG = {

  minBet: 10,

  maxBet: 10000,

  betStep: 10

};


/*
========================================
驗證下注類型
========================================
*/

export function isValidBetType(
  type
) {

  return VALID_BET_TYPES
    .includes(type);

}


/*
========================================
驗證下注金額
========================================
*/

export function isValidBetAmount(
  amount
) {

  if (
    !Number.isInteger(amount)
  ) {

    return false;

  }


  if (
    amount
    <
    BET_CONFIG.minBet
  ) {

    return false;

  }


  if (
    amount
    >
    BET_CONFIG.maxBet
  ) {

    return false;

  }


  if (
    amount
    %
    BET_CONFIG.betStep
    !==
    0
  ) {

    return false;

  }


  return true;

}


/*
========================================
建立下注 ID
========================================
*/

function createBetId() {

  if (
    typeof crypto
    !==
    "undefined"
    &&
    crypto.randomUUID
  ) {

    return crypto.randomUUID();

  }


  return (
    Date.now().toString(36)
    +
    "-"
    +
    Math.random()
      .toString(36)
      .slice(2)
  );

}


/*
========================================
建立單筆下注
========================================
*/

export function createBet({
  roomId,
  type,
  amount
}) {

  if (!roomId) {

    throw new Error(
      "下注必須指定倍場。"
    );

  }


  if (
    !isValidBetType(type)
  ) {

    throw new Error(
      `無效的下注類型：${type}`
    );

  }


  if (
    !isValidBetAmount(amount)
  ) {

    throw new Error(
      `下注金額必須為 ${BET_CONFIG.minBet}～${BET_CONFIG.maxBet}，且為 ${BET_CONFIG.betStep} 的倍數。`
    );

  }


  return {

    id:
      createBetId(),

    roomId,

    type,

    amount,

    createdAt:
      Date.now(),

    status:
      "pending"

  };

}


/*
========================================
建立本局下注容器
========================================
*/

export function createBetSlip(
  roomId
) {

  return {

    roomId,

    bets: [],

    totalAmount: 0,

    createdAt:
      Date.now(),

    locked: false

  };

}


/*
========================================
加入下注
========================================
*/

export function addBet(
  betSlip,
  type,
  amount
) {

  if (
    betSlip.locked
  ) {

    throw new Error(
      "本局已停止下注。"
    );

  }


  const bet =
    createBet({

      roomId:
        betSlip.roomId,

      type,

      amount

    });


  betSlip.bets.push(
    bet
  );


  betSlip.totalAmount +=
    bet.amount;


  return bet;

}


/*
========================================
移除單筆下注
========================================
*/

export function removeBet(
  betSlip,
  betId
) {

  if (
    betSlip.locked
  ) {

    throw new Error(
      "本局已停止下注。"
    );

  }


  const index =
    betSlip.bets
      .findIndex(
        bet =>
          bet.id === betId
      );


  if (
    index === -1
  ) {

    return false;

  }


  const [
    removed
  ] =
    betSlip.bets.splice(
      index,
      1
    );


  betSlip.totalAmount -=
    removed.amount;


  return true;

}


/*
========================================
清空下注
========================================
*/

export function clearBets(
  betSlip
) {

  if (
    betSlip.locked
  ) {

    throw new Error(
      "本局已停止下注。"
    );

  }


  betSlip.bets = [];

  betSlip.totalAmount = 0;

}


/*
========================================
停止下注
========================================
*/

export function lockBetSlip(
  betSlip
) {

  betSlip.locked = true;

  return betSlip;

}


/*
========================================
本局是否有下注
========================================
*/

export function hasBets(
  betSlip
) {

  return (
    betSlip.bets.length > 0
  );

}


/*
========================================
取得某下注類型總額

例如：
玩家分三次押大
100 + 200 + 500

會回傳 800
========================================
*/

export function getBetAmountByType(
  betSlip,
  type
) {

  return betSlip.bets
    .filter(
      bet =>
        bet.type === type
    )
    .reduce(
      (
        total,
        bet
      ) =>
        total
        +
        bet.amount,

      0
    );

}


/*
========================================
合併相同類型下注

方便 UI 顯示。

輸入：
大 100
大 200
單 500

輸出：
{
  big: 300,
  odd: 500
}
========================================
*/

export function summarizeBets(
  betSlip
) {

  const summary = {};


  for (
    const bet
    of betSlip.bets
  ) {

    if (
      !summary[
        bet.type
      ]
    ) {

      summary[
        bet.type
      ] = 0;

    }


    summary[
      bet.type
    ] +=
      bet.amount;

  }


  return summary;

}
