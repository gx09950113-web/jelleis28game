/*
========================================
28 GAME LAB
game/draw-history.js

負責：
- 保存所有開獎結果
- 不論玩家是否下注都會保存
- 各倍場獨立期號
- 各倍場近 N 期
- 跨倍場開獎歷史
- 查詢指定期號

不負責：
- 玩家下注
- 玩家結算
- 玩家盈虧
- 反水
- 每日統計

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


/*
========================================
Storage Key
========================================
*/

const DRAW_HISTORY_KEY =
  "drawHistory";


/*
========================================
支援房間
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
每個房間最多保存多少期

純前端 localStorage 空間有限。

500 期 × 4 房間
對朋友體驗用途已經足夠。
========================================
*/

const MAX_HISTORY_PER_ROOM =
  500;


/*
========================================
建立房間空白開獎資料
========================================
*/

function createEmptyRoomHistory() {

  return {

    /*
    開獎紀錄

    舊 → 新
    */

    rounds: [],


    /*
    下一個流水號

    注意：
    每一個房間都有自己的流水。
    */

    nextSequence: 1

  };

}


/*
========================================
建立整體空白資料
========================================
*/

function createEmptyDrawHistory() {

  return {

    rooms: {

      "1.8":
        createEmptyRoomHistory(),

      "2.0":
        createEmptyRoomHistory(),

      "2.8":
        createEmptyRoomHistory(),

      "3.2":
        createEmptyRoomHistory()

    },


    createdAt:
      Date.now(),


    updatedAt:
      Date.now()

  };

}


/*
========================================
舊資料／損壞資料相容
========================================
*/

function normalizeDrawHistory(
  history
) {

  if (
    !history
    ||
    typeof history
    !==
    "object"
  ) {

    return createEmptyDrawHistory();

  }


  if (
    !history.rooms
    ||
    typeof history.rooms
    !==
    "object"
  ) {

    history.rooms = {};

  }


  for (
    const roomId
    of ROOM_IDS
  ) {

    if (
      !history.rooms[
        roomId
      ]
    ) {

      history.rooms[
        roomId
      ] =
        createEmptyRoomHistory();

    }


    const roomHistory =
      history.rooms[
        roomId
      ];


    if (
      !Array.isArray(
        roomHistory.rounds
      )
    ) {

      roomHistory.rounds =
        [];

    }


    /*
    如果 nextSequence 不存在，
    依現有資料往後補。
    */

    if (
      !Number.isInteger(
        roomHistory.nextSequence
      )
      ||
      roomHistory.nextSequence
      <
      1
    ) {

      let maxSequence = 0;


      for (
        const round
        of roomHistory.rounds
      ) {

        if (
          Number.isInteger(
            round.sequence
          )
          &&
          round.sequence
          >
          maxSequence
        ) {

          maxSequence =
            round.sequence;

        }

      }


      roomHistory.nextSequence =
        maxSequence + 1;

    }

  }


  if (
    !Number.isFinite(
      history.createdAt
    )
  ) {

    history.createdAt =
      Date.now();

  }


  return history;

}


/*
========================================
讀取全部開獎歷史
========================================
*/

export function getDrawHistory() {

  const history =
    getStorage(
      DRAW_HISTORY_KEY
    );


  return normalizeDrawHistory(
    history
  );

}


/*
========================================
保存全部開獎歷史
========================================
*/

function saveDrawHistory(
  history
) {

  history.updatedAt =
    Date.now();


  setStorage(
    DRAW_HISTORY_KEY,
    history
  );

}


/*
========================================
驗證房間
========================================
*/

function validateRoomId(
  roomId
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

}


/*
========================================
驗證開獎結果
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
      "開獎結果必須包含三個號碼。"
    );

  }


  for (
    const number
    of drawResult.numbers
  ) {

    if (
      !Number.isInteger(
        number
      )
      ||
      number < 0
      ||
      number > 9
    ) {

      throw new Error(
        "開獎號碼必須為 0～9 的整數。"
      );

    }

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

}


/*
========================================
房間代碼

用於期號。

1.8 → 18
2.0 → 20
2.8 → 28
3.2 → 32
========================================
*/

function getRoomCode(
  roomId
) {

  return roomId.replace(
    ".",
    ""
  );

}


/*
========================================
建立期號

例如：

房間：
2.8

日期：
2026-08-16

流水：
37

→ 28-20260816-000037

這裡每個房間自己的流水獨立。
========================================
*/

function createIssue(
  roomId,
  date,
  sequence
) {

  const roomCode =
    getRoomCode(
      roomId
    );


  const dateCode =
    date.replaceAll(
      "-",
      ""
    );


  const sequenceCode =
    String(
      sequence
    )
      .padStart(
        6,
        "0"
      );


  return (
    `${roomCode}-`
    +
    `${dateCode}-`
    +
    `${sequenceCode}`
  );

}


/*
========================================
建立開獎紀錄
========================================
*/

function createDrawRecord(
  roomId,
  drawResult,
  sequence
) {

  const date =
    getLocalDateString();


  return {

    /*
    ====================================
    期號
    ====================================
    */

    issue:
      createIssue(
        roomId,
        date,
        sequence
      ),


    sequence,


    roomId,


    date,


    /*
    ====================================
    開獎結果
    ====================================
    */

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
      ),


    /*
    ====================================
    時間
    ====================================
    */

    drawnAt:
      Date.now()

  };

}


/*
========================================
記錄一次開獎

這是最重要的函式。

不論玩家：
- 有下注
- 沒下注
- 輸
- 贏
- 回本

只要 executeDraw() 發生一次，
就呼叫這個函式。
========================================
*/

export function recordDraw(
  roomId,
  drawResult
) {

  validateRoomId(
    roomId
  );


  validateDrawResult(
    drawResult
  );


  const history =
    getDrawHistory();


  const roomHistory =
    history.rooms[
      roomId
    ];


  const sequence =
    roomHistory
      .nextSequence;


  const record =
    createDrawRecord(
      roomId,
      drawResult,
      sequence
    );


  /*
  加入歷史
  */

  roomHistory.rounds.push(
    record
  );


  /*
  下一期
  */

  roomHistory.nextSequence +=
    1;


  /*
  限制 localStorage 大小
  */

  if (
    roomHistory.rounds.length
    >
    MAX_HISTORY_PER_ROOM
  ) {

    roomHistory.rounds =
      roomHistory.rounds.slice(
        -MAX_HISTORY_PER_ROOM
      );

  }


  saveDrawHistory(
    history
  );


  return record;

}


/*
========================================
取得某房間全部開獎

回傳順序：
最新 → 最舊
========================================
*/

export function getRoomDrawHistory(
  roomId
) {

  validateRoomId(
    roomId
  );


  const history =
    getDrawHistory();


  const rounds =
    history
      .rooms[
        roomId
      ]
      .rounds;


  return [
    ...rounds
  ]
    .sort(
      (
        first,
        second
      ) =>
        (
          second.drawnAt
          ??
          0
        )
        -
        (
          first.drawnAt
          ??
          0
        )
    );

}


/*
========================================
取得某房間最近 N 期

這就是遊戲頁
「近 10 期」
真正應該使用的函式。

例如：

getRecentDraws(
  "2.8",
  10
)
========================================
*/

export function getRecentDraws(
  roomId,
  limit = 10
) {

  validateRoomId(
    roomId
  );


  const safeLimit =
    Number.isInteger(
      limit
    )
    &&
    limit > 0

    ? limit

    : 10;


  return getRoomDrawHistory(
    roomId
  )
    .slice(
      0,
      safeLimit
    );

}


/*
========================================
取得所有房間全部開獎

回傳：
最新 → 最舊
========================================
*/

export function getAllDraws() {

  const history =
    getDrawHistory();


  const allDraws =
    [];


  for (
    const roomId
    of ROOM_IDS
  ) {

    allDraws.push(
      ...history
        .rooms[
          roomId
        ]
        .rounds
    );

  }


  return allDraws.sort(
    (
      first,
      second
    ) =>
      (
        second.drawnAt
        ??
        0
      )
      -
      (
        first.drawnAt
        ??
        0
      )
  );

}


/*
========================================
依期號找開獎
========================================
*/

export function getDrawByIssue(
  issue
) {

  if (!issue) {

    return null;

  }


  return (
    getAllDraws()
      .find(
        draw =>
          draw.issue
          ===
          issue
      )
    ??
    null
  );

}


/*
========================================
取得某房間總開獎期數
========================================
*/

export function getRoomDrawCount(
  roomId
) {

  validateRoomId(
    roomId
  );


  const history =
    getDrawHistory();


  return history
    .rooms[
      roomId
    ]
    .rounds
    .length;

}


/*
========================================
清除某房間開獎歷史

主要供開發測試。
========================================
*/

export function clearRoomDrawHistory(
  roomId
) {

  validateRoomId(
    roomId
  );


  const history =
    getDrawHistory();


  history.rooms[
    roomId
  ] =
    createEmptyRoomHistory();


  saveDrawHistory(
    history
  );


  return true;

}


/*
========================================
清除全部開獎歷史

主要供：
- 開發
- 測試
========================================
*/

export function clearAllDrawHistory() {

  setStorage(
    DRAW_HISTORY_KEY,
    createEmptyDrawHistory()
  );


  return true;

}
