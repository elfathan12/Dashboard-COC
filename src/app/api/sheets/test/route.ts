import { NextResponse } from "next/server";
import { ensureAuth, errorResponse, isAuthFailure } from "@/lib/api-helpers";
import { migrateTransactionIds, testConnection } from "@/lib/sheets";

export async function GET() {
  const auth = await ensureAuth();
  if (isAuthFailure(auth)) return auth;

  try {
    const info = await testConnection();
    return NextResponse.json(info);
  } catch (error) {
    return errorResponse(error, "Gagal menguji koneksi Google Sheets");
  }
}

export async function POST() {
  const auth = await ensureAuth();
  if (isAuthFailure(auth)) return auth;

  try {
    const result = await migrateTransactionIds();
    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error, "Gagal menjalankan migrasi ID transaksi");
  }
}
