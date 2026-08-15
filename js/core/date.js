export function getLocalDateString(
  date = new Date()
) {
  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(2, "0");

  const day =
    String(
      date.getDate()
    ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function parseLocalDate(
  dateString
) {
  const [
    year,
    month,
    day
  ] =
    dateString
      .split("-")
      .map(Number);

  return new Date(
    year,
    month - 1,
    day
  );
}

export function getDayDifference(
  oldDateString,
  newDateString
) {
  const oldDate =
    parseLocalDate(
      oldDateString
    );

  const newDate =
    parseLocalDate(
      newDateString
    );

  return Math.round(
    (
      newDate - oldDate
    )
    /
    86400000
  );
}
