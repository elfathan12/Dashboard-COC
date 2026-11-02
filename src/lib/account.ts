export const MOBILE_LEGENDS = "Mobile Legends";

const MOBILE_LEGENDS_ALIASES = new Set([
  "mobilelegends",
  "mobilelegend",
  "ml",
  "mlbb",
]);

const ML_RANKS: Array<{ label: string; pattern: RegExp }> = [
  { label: "Mythic Immortal", pattern: /mythic\s*immortal|immortal/i },
  { label: "Mythic Glory", pattern: /mythic\s*glory|glory/i },
  { label: "Mythic Honor", pattern: /mythic\s*honor|honor/i },
  { label: "Mythic", pattern: /mythic/i },
  { label: "Legend", pattern: /legend/i },
  { label: "Epic", pattern: /epic/i },
  { label: "Grandmaster", pattern: /grand\s*master|grandmaster/i },
  { label: "Master", pattern: /master/i },
  { label: "Elite", pattern: /elite/i },
  { label: "Warrior", pattern: /warrior/i },
];

export const COC_TH_OPTIONS = Array.from({ length: 18 }, (_, index) => {
  const value = String(index + 1);
  return { value, label: `TH${value}` };
});

export const ACCOUNT_TYPE_OPTIONS = [
  ...COC_TH_OPTIONS,
  { value: MOBILE_LEGENDS, label: MOBILE_LEGENDS },
];

export const ACCOUNT_FILTER_OPTIONS = [
  { value: "all", label: "Semua Game" },
  { value: "ml", label: MOBILE_LEGENDS },
  ...COC_TH_OPTIONS.map((option) => ({ value: `th${option.value}`, label: option.label })),
];

export type AccountFilter =
  | { kind: "all" }
  | { kind: "ml" }
  | { kind: "th"; value: number };

export type DistributionMode = "type" | "ml" | "th";

function compact(value: string | null | undefined): string {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

export function isMobileLegends(value: string | null | undefined): boolean {
  return MOBILE_LEGENDS_ALIASES.has(compact(value));
}

export function townHallNumber(value: string | null | undefined): number | null {
  if (isMobileLegends(value)) return null;
  const digits = String(value ?? "").replace(/\D/g, "");
  if (!digits) return null;
  const num = Number(digits);
  return Number.isInteger(num) && num >= 1 && num <= 18 ? num : null;
}

export function isCocAccount(value: string | null | undefined): boolean {
  return townHallNumber(value) !== null;
}

export function normalizeAccountValue(value: string): string {
  const trimmed = String(value ?? "").trim();
  if (isMobileLegends(trimmed)) return MOBILE_LEGENDS;
  const num = townHallNumber(trimmed);
  return num !== null ? String(num) : trimmed;
}

export function accountDisplayLabel(value: string | null | undefined): string {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return "-";
  if (isMobileLegends(trimmed)) return MOBILE_LEGENDS;
  const num = townHallNumber(trimmed);
  return num !== null ? `TH${num}` : trimmed;
}

export function accountTypeLabel(value: string | null | undefined): string {
  return isMobileLegends(value) ? MOBILE_LEGENDS : "COC";
}

export function accountSortValue(value: string | null | undefined): number {
  const num = townHallNumber(value);
  if (num !== null) return num;
  if (isMobileLegends(value)) return 1000;
  return 999;
}

export function parseAccountFilter(raw: string | null | undefined): AccountFilter {
  const value = String(raw ?? "").trim().toLowerCase();
  if (!value || value === "all") return { kind: "all" };
  if (value === "ml" || value === "mobile-legends" || isMobileLegends(value)) {
    return { kind: "ml" };
  }
  const match = value.match(/^(?:th[-_ ]?)?(\d{1,2})$/);
  if (match) {
    const num = Number(match[1]);
    if (num >= 1 && num <= 18) return { kind: "th", value: num };
  }
  return { kind: "all" };
}

export function matchesAccountFilter(th: string | null | undefined, filter: AccountFilter): boolean {
  if (filter.kind === "all") return true;
  if (filter.kind === "ml") return isMobileLegends(th);
  return townHallNumber(th) === filter.value;
}

export function distributionModeForFilter(filter: AccountFilter): DistributionMode {
  if (filter.kind === "ml") return "ml";
  if (filter.kind === "th") return "th";
  return "type";
}

export function mlSpecLabel(description: string | null | undefined): string {
  const text = String(description ?? "").trim();
  if (!text) return "Tanpa Deskripsi";

  for (const rank of ML_RANKS) {
    if (rank.pattern.test(text)) return rank.label;
  }

  if (/all\s*hero|full\s*hero|semua\s*hero|hero\s*lengkap/i.test(text)) {
    return "Hero Lengkap";
  }

  return "Spesifikasi Lain";
}

export function accountDistributionLabel(
  transaction: { th: string; deskripsi: string },
  mode: DistributionMode,
): string {
  if (mode === "type") return accountTypeLabel(transaction.th);
  if (mode === "ml") {
    return isMobileLegends(transaction.th)
      ? mlSpecLabel(transaction.deskripsi)
      : accountDisplayLabel(transaction.th);
  }
  return accountDisplayLabel(transaction.th);
}
