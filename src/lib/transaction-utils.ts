import { monthKey } from "./date";
import type { Transaction } from "./types";

/** Stable key used by the API: prefers the UUID, falls back to the sheet row. */
export function transactionKey(transaction: Pick<Transaction, "id" | "row">): string {
  return transaction.id ?? `row-${transaction.row}`;
}

export function isSold(transaction: Pick<Transaction, "status">): boolean {
  return transaction.status === "sold";
}

/**
 * Tanggal acuan transaksi: tanggal jual untuk akun terjual, tanggal beli untuk
 * akun yang belum laku.
 */
export function transactionDate(
  transaction: Pick<Transaction, "status" | "tanggalBeli" | "tanggalJual">,
): string | null {
  return transaction.status === "sold"
    ? transaction.tanggalJual ?? transaction.tanggalBeli
    : transaction.tanggalBeli ?? transaction.tanggalJual;
}

export function transactionMonthKey(
  transaction: Pick<Transaction, "status" | "tanggalBeli" | "tanggalJual">,
): string {
  return monthKey(transactionDate(transaction));
}
