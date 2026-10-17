import { format, parseISO, isValid, differenceInCalendarDays } from "date-fns";
import { id as localeID } from "date-fns/locale";

export const JAKARTA_TZ = "Asia/Jakarta";

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
    return isValid(value) ? toISODate(value) : null;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    // Google Sheets serial date (days since 1899-12-30)
    if (value > 20000 && value < 90000) {
      const ms = Math.round((value - 25569) * 86400 * 1000);
      const d = new Date(ms);
      return isValid(d) ? toISODate(d, true) : null;
    }
    return null;
  }

  const str = String(value).trim();
  if (!str) return null;

  // yyyy-mm-dd or yyyy/mm/dd
  let m = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (m) {
    return buildISO(Number(m[1]), Number(m[2]), Number(m[3]));
  }

  // dd-mm-yyyy or dd/mm/yyyy or dd.mm.yyyy (Indonesian convention)
  m = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/);
  if (m) {
    let year = Number(m[3]);
    if (year < 100) year += 2000;
    return buildISO(year, Number(m[2]), Number(m[1]));
  }

  // "17 Oktober 2026" style
  const parsed = new Date(str);
  if (isValid(parsed)) return toISODate(parsed, true);

  return null;
}

function buildISO(year: number, month: number, day: number): string | null {
  if (!year || !month || !day) return null;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

function toISODate(date: Date, utc = false): string {
  if (utc) return date.toISOString().slice(0, 10);
  const d = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
  return d.toISOString().slice(0, 10);
}

export function formatTanggalID(iso: string | null | undefined, short = false): string {
  if (!iso) return "-";
  const date = parseISO(iso);
  if (!isValid(date)) return "-";
  const months = short ? MONTHS_ID_SHORT : MONTHS_ID;
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatTanggalIDCompact(iso: string | null | undefined): string {
  if (!iso) return "-";
  const date = parseISO(iso);
  if (!isValid(date)) return "-";
  return format(date, "dd MMM yyyy", { locale: localeID });
}

export function bulanIndonesia(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = parseISO(iso);
  if (!isValid(date)) return "";
  return MONTHS_ID[date.getMonth()];
}

export function monthKey(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = parseISO(iso);
  if (!isValid(date)) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function formatMonthKey(key: string, short = true): string {
  const [year, month] = key.split("-");
  const idx = Number(month) - 1;
  const months = short ? MONTHS_ID_SHORT : MONTHS_ID;
  if (idx < 0 || idx > 11) return key;
  return `${months[idx]} ${year}`;
}

export function yearOf(iso: string | null | undefined): string {
  if (!iso) return "";
  return iso.slice(0, 4);
}

/** Number of days between two ISO dates (end - start). Returns null if either is invalid. */
export function daysBetween(
  startISO: string | null | undefined,
  endISO: string | null | undefined,
): number | null {
  if (!startISO || !endISO) return null;
  const start = parseISO(startISO);
  const end = parseISO(endISO);
  if (!isValid(start) || !isValid(end)) return null;
  return differenceInCalendarDays(end, start);
}
