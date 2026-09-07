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
