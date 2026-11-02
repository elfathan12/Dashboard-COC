import { NextResponse } from "next/server";
import { ensureAuth, errorResponse, isAuthFailure } from "@/lib/api-helpers";
import { getTransactions } from "@/lib/sheets";
import {
  availablePeriodKeys,
  computeDashboardStats,
  filterTransactions,
} from "@/lib/stats";
import {
  distributionModeForFilter,
  parseAccountFilter,
} from "@/lib/account";

function parsePeriod(raw: string | null): string | null {
  if (!raw || raw === "all") return null;
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(raw) ? raw : null;
}

export async function GET(request: Request) {
  const auth = await ensureAuth();
  if (isAuthFailure(auth)) return auth;

  try {
    const { transactions } = await getTransactions();
    const url = new URL(request.url);
    const accountFilter = parseAccountFilter(url.searchParams.get("account"));
    const period = parsePeriod(url.searchParams.get("period"));
    const filtered = filterTransactions(transactions, accountFilter, period);
    const stats = computeDashboardStats(filtered, {
      distributionMode: distributionModeForFilter(accountFilter),
    });

    return NextResponse.json({
      stats,
      periods: availablePeriodKeys(transactions),
    });
  } catch (error) {
    return errorResponse(error, "Gagal menghitung statistik dashboard");
  }
}
