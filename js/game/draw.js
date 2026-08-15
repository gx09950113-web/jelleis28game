/*
========================================
28 GAME LAB
draw.js

負責：
- 產生 3 個 0～9 的開獎號碼
- 不負責大小单双判定
- 不負責回本判定
- 不負責下注結算
========================================
*/


/*
========================================
產生單一 0～9 隨機數
========================================
*/

function randomDigit() {

  /*
    優先使用 crypto.getRandomValues()

    對純前端遊戲來說，
    比 Math.random() 更適合作為隨機來源。
  */

  if (
    typeof crypto !== "undefined"
    &&
    crypto.getRandomValues
  ) {

    const array =
      new Uint32Array(1);

    crypto.getRandomValues(
      array
    );


    /*
      避免單純 % 10 造成非常輕微的 modulo bias。

      Uint32 最大範圍：
      0 ～ 4294967295

      先排除不能被 10 整除的尾端區間。
    */

    const limit =
      Math.floor(
        0x100000000 / 10
      ) * 10;


    let value =
      array[0];


    while (
      value >= limit
    ) {

      crypto.getRandomValues(
        array
      );

      value =
        array[0];

    }


    return value % 10;

  }


  /*
    舊瀏覽器 fallback
  */

  return Math.floor(
    Math.random() * 10
  );

}


/*
========================================
產生一組開獎號碼
========================================
*/

export function drawNumbers() {

  return [
    randomDigit(),
    randomDigit(),
    randomDigit()
  ];

}


/*
========================================
建立完整開獎資料
========================================
*/

export function createDraw() {

  const numbers =
    drawNumbers();


  const sum =
    numbers.reduce(
      (total, number) =>
        total + number,
      0
    );


  return {

    numbers,

    sum,

    createdAt:
      Date.now()

  };

}


/*
========================================
指定開獎結果

只供：
- 開發
- 測試
- 教學模式

正式隨機開獎不要使用這個函式。
========================================
*/

export function createFixedDraw(
  numbers
) {

  if (
    !Array.isArray(numbers)
    ||
    numbers.length !== 3
  ) {

    throw new Error(
      "開獎結果必須包含 3 個號碼。"
    );

  }


  const valid =
    numbers.every(
      number =>
        Number.isInteger(number)
        &&
        number >= 0
        &&
        number <= 9
    );


  if (!valid) {

    throw new Error(
      "每個開獎號碼必須為 0～9 的整數。"
    );

  }


  const copiedNumbers =
    [...numbers];


  const sum =
    copiedNumbers.reduce(
      (total, number) =>
        total + number,
      0
    );


  return {

    numbers:
      copiedNumbers,

    sum,

    createdAt:
      Date.now(),

    fixed:
      true

  };

}
