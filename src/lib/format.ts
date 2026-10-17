const idrFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("id-ID", {
  maximumFractionDigits: 0,
});

export function formatRupiah(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "Rp0";
  return idrFormatter.format(value);
}

export function formatRupiahCompact(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "Rp0";
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `Rp${(value / 1_000_000_000).toFixed(1)} M`;
  if (abs >= 1_000_000) return `Rp${(value / 1_000_000).toFixed(1)} jt`;
  if (abs >= 1_000) return `Rp${(value / 1_000).toFixed(0)} rb`;
  return idrFormatter.format(value);
}

export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "0";
  return numberFormatter.format(value);
}

/** Parse a spreadsheet currency/number value into a number or null. */
export function parseNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;

  let str = String(value).trim();
  if (!str) return null;

  const negative = /^\(.*\)$/.test(str) || str.startsWith("-");
  str = str.replace(/[^0-9.,-]/g, "");

  if (!str) return null;

  const hasDot = str.includes(".");
  const hasComma = str.includes(",");

  if (hasDot && hasComma) {
    // Assume the last separator is the decimal separator
    if (str.lastIndexOf(",") > str.lastIndexOf(".")) {
      str = str.replace(/\./g, "").replace(",", ".");
    } else {
      str = str.replace(/,/g, "");
    }
  } else if (hasDot) {
    // "1.500.000" -> thousands separator ; "1.5" -> decimal
    const parts = str.split(".");
    const looksLikeThousands = parts.length > 1 && parts.slice(1).every((p) => p.length === 3);
    str = looksLikeThousands ? parts.join("") : str;
  } else if (hasComma) {
    // "1.500,50" handled above; "1500,5" -> decimal
    const parts = str.split(",");
    const looksLikeThousands = parts.length > 1 && parts.slice(1).every((p) => p.length === 3);
    str = looksLikeThousands ? parts.join("") : str.replace(",", ".");
  }

  const parsed = Number(str);
  if (!Number.isFinite(parsed)) return null;
  return negative ? -Math.abs(parsed) : parsed;
}

export function initials(text: string): string {
  return text
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}
