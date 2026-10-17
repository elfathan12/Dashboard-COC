import type { Transaction } from "./types";

/** Stable key used by the API: prefers the UUID, falls back to the sheet row. */
export function transactionKey(transaction: Pick<Transaction, "id" | "row">): string {
  return transaction.id ?? `row-${transaction.row}`;
}

export function isSold(transaction: Pick<Transaction, "status">): boolean {
  return transaction.status === "sold";
}
