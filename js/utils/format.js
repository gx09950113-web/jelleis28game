export function formatNumber(
  number
) {
  return Number(number)
    .toLocaleString(
      "zh-TW"
    );
}


export function formatPercent(
  rate
) {
  return `${
    rate * 100
  }%`;
}
