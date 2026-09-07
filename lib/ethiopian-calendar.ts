// Gregorian <-> Ethiopian (Ge'ez) calendar conversion, via Julian Day Number.
// Epoch offset is for the "Amete Mihret" (A.M.) era used in civil Ethiopian dates.
const JD_EPOCH_OFFSET_AMETE_MIHRET = 1723856;

export const ETHIOPIAN_MONTH_NAMES_AM = [
  "መስከረም",
  "ጥቅምት",
  "ኅዳር",
  "ታኅሳስ",
  "ጥር",
  "የካቲት",
  "መጋቢት",
  "ሚያዝያ",
  "ግንቦት",
  "ሰኔ",
  "ሐምሌ",
  "ነሐሴ",
  "ጳጉሜን",
];

export const ETHIOPIAN_WEEKDAY_NAMES_AM = [
  "እሑድ",
  "ሰኞ",
  "ማክሰኞ",
  "ረቡዕ",
  "ሐሙስ",
  "ዓርብ",
  "ቅዳሜ",
];

export type EthiopianDate = {
  year: number;
  month: number;
  day: number;
};

function gregorianToJDN(year: number, month: number, day: number) {
  let y = year;
  let m = month;
  if (m <= 2) {
    y -= 1;
    m += 12;
  }
  const a = Math.floor(y / 100);
  const b = 2 - a + Math.floor(a / 4);
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + b - 1524;
}

function ethiopianToJDN(year: number, month: number, day: number) {
  return JD_EPOCH_OFFSET_AMETE_MIHRET + 365 * year + Math.floor(year / 4) + 30 * (month - 1) + (day - 1);
}

function jdnToGregorian(jdn: number): { year: number; month: number; day: number } {
  const a = jdn + 32044;
  const b = Math.floor((4 * a + 3) / 146097);
  const c = a - Math.floor((146097 * b) / 4);
  const d = Math.floor((4 * c + 3) / 1461);
  const e = c - Math.floor((1461 * d) / 4);
  const m = Math.floor((5 * e + 2) / 153);
  const day = e - Math.floor((153 * m + 2) / 5) + 1;
  const month = m + 3 - 12 * Math.floor(m / 10);
  const year = 100 * b + d - 4800 + Math.floor(m / 10);
  return { year, month, day };
}

/** A year is leap (Pagume has 6 days) when it precedes a Gregorian leap year. */
export function isEthiopianLeapYear(year: number) {
  return year % 4 === 3;
}

export function daysInEthiopianMonth(year: number, month: number) {
  if (month < 13) return 30;
  return isEthiopianLeapYear(year) ? 6 : 5;
}

/** Converts an Ethiopian calendar date to its Gregorian equivalent (local midnight). */
export function fromEthiopianDate(year: number, month: number, day: number): Date {
  const { year: gy, month: gm, day: gd } = jdnToGregorian(ethiopianToJDN(year, month, day));
  return new Date(gy, gm - 1, gd);
}

export function toEthiopianDate(date: Date): EthiopianDate {
  const jdn = gregorianToJDN(date.getFullYear(), date.getMonth() + 1, date.getDate());
  const r = (((jdn - JD_EPOCH_OFFSET_AMETE_MIHRET) % 1461) + 1461) % 1461;
  const n = (r % 365) + 365 * Math.floor(r / 1460);
  const year =
    4 * Math.floor((jdn - JD_EPOCH_OFFSET_AMETE_MIHRET) / 1461) +
    Math.floor(r / 365) -
    Math.floor(r / 1460);
  const month = Math.floor(n / 30) + 1;
  const day = (n % 30) + 1;
  return { year, month, day };
}

export function formatEthiopianDate(date: Date) {
  const { year, month, day } = toEthiopianDate(date);
  const weekday = ETHIOPIAN_WEEKDAY_NAMES_AM[date.getDay()];
  const monthName = ETHIOPIAN_MONTH_NAMES_AM[month - 1];
  return `${weekday}፣ ${monthName} ${day} ቀን ${year}`;
}
