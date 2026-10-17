import { NextResponse } from "next/server";
import { ensureAuth, errorResponse, isAuthFailure } from "@/lib/api-helpers";
import { getTransactions } from "@/lib/sheets";
import { computeDashboardStats } from "@/lib/stats";

export async function GET() {
  const auth = await ensureAuth();
  if (isAuthFailure(auth)) return auth;

  try {
    const { transactions } = await getTransactions();
    const stats = computeDashboardStats(transactions);
    return NextResponse.json({ stats });
  } catch (error) {
    return errorResponse(error, "Gagal menghitung statistik dashboard");
  }
}
