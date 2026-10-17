import { NextResponse } from "next/server";
import { getSession } from "./auth";
import { SheetsConfigError } from "./sheets";
import type { SessionPayload } from "./session";

export async function ensureAuth(): Promise<SessionPayload | NextResponse> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Sesi tidak valid. Silakan login kembali." }, { status: 401 });
  }
  return session;
}

export function isAuthFailure(value: SessionPayload | NextResponse): value is NextResponse {
  return value instanceof NextResponse;
}

export function errorResponse(error: unknown, fallback = "Terjadi kesalahan pada server") {
  if (error instanceof SheetsConfigError) {
    return NextResponse.json(
      { error: error.message, code: "SHEETS_NOT_CONFIGURED" },
      { status: 503 },
    );
  }

  const detail = error instanceof Error ? error.message : String(error);
  console.error("[JB-COC API]", error);

  const isGoogleAuth = /invalid_grant|unauthorized|permission|caller does not have/i.test(detail);

  return NextResponse.json(
    {
      error: isGoogleAuth
        ? "Akses Google Sheets ditolak. Pastikan spreadsheet sudah di-share ke service account."
        : fallback,
      detail,
    },
    { status: isGoogleAuth ? 403 : 500 },
  );
}
