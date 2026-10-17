import { NextResponse } from "next/server";
import { ensureAuth, errorResponse, isAuthFailure } from "@/lib/api-helpers";
import {
  deleteTransaction,
  getTransactionById,
  getTransactionByRow,
  updateTransaction,
} from "@/lib/sheets";
import { transactionInputSchema } from "@/lib/schemas";
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

export async function GET(_request: Request, ctx: RouteParams) {
  const auth = await ensureAuth();
  if (isAuthFailure(auth)) return auth;

  try {
    const { id } = await ctx.params;
    const transaction = await resolveTransaction(id);
    if (!transaction) {
      return NextResponse.json({ error: "Transaksi tidak ditemukan" }, { status: 404 });
    }
    return NextResponse.json({ transaction });
  } catch (error) {
    return errorResponse(error, "Gagal memuat detail transaksi");
  }
}

export async function PUT(request: Request, ctx: RouteParams) {
  const auth = await ensureAuth();
  if (isAuthFailure(auth)) return auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Format permintaan tidak valid" }, { status: 400 });
  }

  const parsed = transactionInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Data tidak valid", issues: parsed.error.issues },
      { status: 422 },
    );
  }

  try {
    const { id } = await ctx.params;
    const existing = await resolveTransaction(id);
    if (!existing) {
      return NextResponse.json({ error: "Transaksi tidak ditemukan" }, { status: 404 });
    }

    const transaction = await updateTransaction(
      existing.row,
      {
        th: parsed.data.th,
        deskripsi: parsed.data.deskripsi,
        tanggalBeli: parsed.data.tanggalBeli,
        tanggalJual: parsed.data.tanggalJual,
        hargaModal: parsed.data.hargaModal,
        hargaJual: parsed.data.hargaJual,
        estimasiHargaJual: parsed.data.estimasiHargaJual,
      },
      existing.id,
    );

    return NextResponse.json({ transaction });
  } catch (error) {
    return errorResponse(error, "Gagal memperbarui transaksi");
  }
}

export async function DELETE(_request: Request, ctx: RouteParams) {
  const auth = await ensureAuth();
  if (isAuthFailure(auth)) return auth;

  try {
    const { id } = await ctx.params;
    const existing = await resolveTransaction(id);
    if (!existing) {
      return NextResponse.json({ error: "Transaksi tidak ditemukan" }, { status: 404 });
    }

    await deleteTransaction(existing.row);
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error, "Gagal menghapus transaksi");
  }
}
