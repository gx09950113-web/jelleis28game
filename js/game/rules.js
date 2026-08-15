/*
========================================
28 GAME LAB
rules.js

負責分析開獎結果。

本檔案只判斷「結果是什麼」，
不處理：

- 倍場
- 賠率
- 玩家下注
- 中獎
- 未中
- 回本

例如：
0 + 8 + 9 = 17

本檔案只會告訴其他模組：

- 和值 17
- 大
- 單
- 包含 0
- 非對子
- 非豹子

是否因為包含 0 而回本，
由 settlement.js 根據房間規則決定。
========================================
*/


/*
========================================
和值範圍
========================================
*/

export const SUM_MIN = 0;

export const SUM_MAX = 27;


/*
========================================
大小分界

0 ～ 13 = 小
14 ～ 27 = 大
========================================
*/

export const SIZE_RULE = {

  SMALL_MAX: 13,

  BIG_MIN: 14

};


/*
========================================
驗證開獎資料
========================================
*/

export function validateNumbers(
  numbers
) {

  if (
    !Array.isArray(numbers)
  ) {

    return false;

  }


  if (
    numbers.length !== 3
  ) {

    return false;

  }


  return numbers.every(
    number =>
      Number.isInteger(number)
      &&
      number >= 0
      &&
      number <= 9
  );

}


/*
========================================
計算和值
========================================
*/

export function calculateSum(
  numbers
) {

  if (
    !validateNumbers(numbers)
  ) {

    throw new Error(
      "無效的開獎號碼。"
    );

  }


  return numbers.reduce(
    (total, number) =>
      total + number,
    0
  );

}


/*
========================================
大小判定

0～13：small
14～27：big
========================================
*/

export function getSize(
  sum
) {

  if (
    !Number.isInteger(sum)
    ||
    sum < SUM_MIN
    ||
    sum > SUM_MAX
  ) {

    throw new Error(
      "和值必須為 0～27 的整數。"
    );

  }


  if (
    sum <=
    SIZE_RULE.SMALL_MAX
  ) {

    return "small";

  }


  return "big";

}


/*
========================================
單雙判定
========================================
*/

export function getParity(
  sum
) {

  if (
    !Number.isInteger(sum)
    ||
    sum < SUM_MIN
    ||
    sum > SUM_MAX
  ) {

    throw new Error(
      "和值必須為 0～27 的整數。"
    );

  }


  return (
    sum % 2 === 0
  )
    ? "even"
    : "odd";

}


/*
========================================
是否包含 0
========================================
*/

export function hasZero(
  numbers
) {

  return numbers.includes(0);

}


/*
========================================
豹子

三個號碼完全相同。

例如：
7 7 7
4 4 4
0 0 0
========================================
*/

export function isLeopard(
  numbers
) {

  if (
    !validateNumbers(numbers)
  ) {

    throw new Error(
      "無效的開獎號碼。"
    );

  }


  const [
    first,
    second,
    third
  ] =
    numbers;


  return (
    first === second
    &&
    second === third
  );

}


/*
========================================
對子

這裡定義為：

「剛好兩個相同」

豹子不算 pair，
因為豹子另外分類。

例如：

4 4 9 → true
4 9 4 → true
9 4 4 → true

4 4 4 → false
========================================
*/

export function isPair(
  numbers
) {

  if (
    !validateNumbers(numbers)
  ) {

    throw new Error(
      "無效的開獎號碼。"
    );

  }


  if (
    isLeopard(numbers)
  ) {

    return false;

  }


  const [
    first,
    second,
    third
  ] =
    numbers;


  return (
    first === second
    ||
    first === third
    ||
    second === third
  );

}


/*
========================================
13 / 14 特殊和值
========================================
*/

export function isMiddleSum(
  sum
) {

  return (
    sum === 13
    ||
    sum === 14
  );

}


/*
========================================
大小单双組合
========================================
*/

export function getSizeParity(
  size,
  parity
) {

  return `${size}-${parity}`;

}


/*
結果可能為：

small-odd
small-even
big-odd
big-even
*/


/*
========================================
完整分析
========================================
*/

export function analyzeDraw(
  draw
) {

  if (
    !draw
    ||
    !validateNumbers(
      draw.numbers
    )
  ) {

    throw new Error(
      "無效的開獎資料。"
    );

  }


  const numbers =
    [...draw.numbers];


  /*
    不完全信任 draw.sum，
    重新由號碼計算一次。

    避免資料遭修改後
    numbers 與 sum 不一致。
  */

  const sum =
    calculateSum(
      numbers
    );


  const size =
    getSize(sum);


  const parity =
    getParity(sum);


  const zero =
    hasZero(numbers);


  const leopard =
    isLeopard(numbers);


  const pair =
    isPair(numbers);


  const middleSum =
    isMiddleSum(sum);


  return {

    /*
    原始資料
    */

    numbers,

    sum,


    /*
    基本結果
    */

    size,

    parity,

    sizeParity:
      getSizeParity(
        size,
        parity
      ),


    /*
    特殊組合
    */

    hasZero:
      zero,

    isPair:
      pair,

    isLeopard:
      leopard,

    isMiddleSum:
      middleSum,


    /*
    特殊和值
    */

    isSum13:
      sum === 13,

    isSum14:
      sum === 14,


    /*
    原開獎時間
    */

    createdAt:
      draw.createdAt
      ??
      Date.now()

  };

}
