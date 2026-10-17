import { NextResponse } from "next/server";
import { ensureAuth, errorResponse, isAuthFailure } from "@/lib/api-helpers";
import { getTransactionById, getTransactionByRow, markAsSold } from "@/lib/sheets";
import { sellInputSchema } from "@/lib/schemas";
import type { Transaction } from "@/lib/types";

async function resolveTransaction(key: string): Promise<Transaction | null> {
  if (key.startsWith("row-")) {
    const row = Number(key.slice(4));
    if (!Number.isFinite(row)) return null;
    return getTransactionByRow(row);
  }
  return getTransactionById(key);
}

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(request: Request, ctx: RouteParams) {
  const auth = await ensureAuth();
  if (isAuthFailure(auth)) return auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Format permintaan tidak valid" }, { status: 400 });
  }

  const parsed = sellInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Data tidak valid" },
      { status: 422 },
    );
  }

  try {
    const { id } = await ctx.params;
    const existing = await resolveTransaction(id);
    if (!existing) {
      return NextResponse.json({ error: "Transaksi tidak ditemukan" }, { status: 404 });
    }

    if (existing.status === "sold") {
      return NextResponse.json({ error: "Akun ini sudah ditandai terjual" }, { status: 409 });
    }

    const transaction = await markAsSold(
      existing.row,
      parsed.data.tanggalJual,
      parsed.data.hargaJual,
      existing.id,
    );

    return NextResponse.json({ transaction });
  } catch (error) {
    return errorResponse(error, "Gagal menandai akun sebagai terjual");
  }
}
