export const JAKARTA_TZ = "Asia/Jakarta";

const SHEETS_EPOCH_UTC = Date.UTC(1899, 11, 30);

const MONTHS_ID = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const MONTHS_ID_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

/** Current date in Asia/Jakarta as yyyy-MM-dd */
export function todayJakarta(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: JAKARTA_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  return parts;
}

/** Normalize any spreadsheet date value into an ISO yyyy-MM-dd string. */
export function parseSheetDate(value: unknown): string | null {
  if (value === null || value === undefined) return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime())
      ? null
      : buildISO(value.getUTCFullYear(), value.getUTCMonth() + 1, value.getUTCDate());
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    // Google Sheets serial dates count whole days from 1899-12-30 (UTC).
    if (value < 0 || value > 2_958_465) return null;
    const date = new Date(SHEETS_EPOCH_UTC + Math.floor(value) * 86_400_000);
    return buildISO(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
  }

  const str = String(value).trim();
  if (!str) return null;

  // ISO date or ISO datetime; use the written calendar date, never local time.
  let m = str.match(/^(\d{4})-(\d{2})-(\d{2})(?:$|T|\s)/);
  if (m) {
    return buildISO(Number(m[1]), Number(m[2]), Number(m[3]));
  }

  m = str.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if (m) {
    return buildISO(Number(m[1]), Number(m[2]), Number(m[3]));
  }

  // Google Sheets locale: MM/DD/YYYY. Use the same interpretation for
  // slash, dot, and hyphen-separated numeric dates to avoid locale guessing.
  m = str.match(/^(\d{1,2})([/. -])(\d{1,2})\2(\d{2,4})$/);
  if (m) {
    let year = Number(m[4]);
    if (year < 100) year += 2000;
    return buildISO(year, Number(m[1]), Number(m[3]));
  }

  const monthNames: Record<string, number> = {
    januari: 1, january: 1, jan: 1,
    februari: 2, february: 2, feb: 2,
    maret: 3, march: 3, mar: 3,
    april: 4, apr: 4,
    mei: 5, may: 5,
    juni: 6, june: 6, jun: 6,
    juli: 7, july: 7, jul: 7,
    agustus: 8, august: 8, agu: 8, aug: 8,
    september: 9, sep: 9,
    oktober: 10, october: 10, okt: 10, oct: 10,
    november: 11, nov: 11,
    desember: 12, december: 12, des: 12, dec: 12,
  };
  const textDate = str.match(/^(\d{1,2})\s+([a-z]+)\s+(\d{4})$/i);
  const englishDate = str.match(/^([a-z]+)\s+(\d{1,2}),?\s+(\d{4})$/i);
  const named = textDate ?? englishDate;
  if (named) {
    const day = Number(textDate ? named[1] : named[2]);
    const monthName = (textDate ? named[2] : named[1]).toLowerCase();
    const year = Number(named[3]);
    const month = monthNames[monthName];
    if (month) return buildISO(year, month, day);
  }

  return null;
}

function buildISO(year: number, month: number, day: number): string | null {
  if (year < 1 || year > 9999 || month < 1 || month > 12 || day < 1 || day > 31) return null;
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  date.setUTCHours(0, 0, 0, 0);
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) return null;
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function isoDateParts(iso: string | null | undefined): [number, number, number] | null {
  if (!iso) return null;
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  return buildISO(year, month, day) ? [year, month, day] : null;
}

/** Convert a validated ISO calendar date to a Google Sheets serial date. */
export function sheetSerialFromISO(iso: string | null | undefined): number | null {
  const parts = isoDateParts(iso);
  if (!parts) return null;
  const [year, month, day] = parts;
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  date.setUTCHours(0, 0, 0, 0);
  return (date.getTime() - SHEETS_EPOCH_UTC) / 86_400_000;
}

/** Format a valid ISO date for a Google Sheets MM/DD/YYYY locale. */
export function sheetDateStringFromISO(iso: string | null | undefined): string | null {
  const parts = isoDateParts(iso);
  if (!parts) return null;
  const [year, month, day] = parts;
  return `${String(month).padStart(2, "0")}/${String(day).padStart(2, "0")}/${year}`;
}

export function formatTanggalID(iso: string | null | undefined, short = false): string {
  void short;
  const parts = isoDateParts(iso);
  if (!parts) return "-";
  const [year, month, day] = parts;
  return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;
}

export function formatTanggalIDCompact(iso: string | null | undefined): string {
  return formatTanggalID(iso);
}

export function bulanIndonesia(iso: string | null | undefined): string {
  const parts = isoDateParts(iso);
  return parts ? MONTHS_ID[parts[1] - 1] : "";
}

export function monthKey(iso: string | null | undefined): string {
  const parts = isoDateParts(iso);
  return parts ? `${parts[0]}-${String(parts[1]).padStart(2, "0")}` : "";
}

export function formatMonthKey(key: string, short = true): string {
  const [year, month] = key.split("-");
  const idx = Number(month) - 1;
  const months = short ? MONTHS_ID_SHORT : MONTHS_ID;
  if (idx < 0 || idx > 11) return key;
  return `${months[idx]} ${year}`;
}

export function yearOf(iso: string | null | undefined): string {
  return isoDateParts(iso)?.[0].toString() ?? "";
}

/** Number of days between two ISO dates (end - start). Returns null if either is invalid. */
export function daysBetween(
  startISO: string | null | undefined,
  endISO: string | null | undefined,
): number | null {
  const start = isoDateParts(startISO);
  const end = isoDateParts(endISO);
  if (!start || !end) return null;
  const startDate = new Date(0);
  startDate.setUTCFullYear(start[0], start[1] - 1, start[2]);
  startDate.setUTCHours(0, 0, 0, 0);
  const endDate = new Date(0);
  endDate.setUTCFullYear(end[0], end[1] - 1, end[2]);
  endDate.setUTCHours(0, 0, 0, 0);
  const startTime = startDate.getTime();
  const endTime = endDate.getTime();
  return (endTime - startTime) / 86_400_000;
}
