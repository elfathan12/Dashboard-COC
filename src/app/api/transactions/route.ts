import { NextResponse } from "next/server";
import { ensureAuth, errorResponse, isAuthFailure } from "@/lib/api-helpers";
import { createTransaction, getTransactions } from "@/lib/sheets";
import { computeDashboardStats, sortByTanggalBeliAsc } from "@/lib/stats";
import { transactionInputSchema } from "@/lib/schemas";

export async function GET(request: Request) {
  const auth = await ensureAuth();
  if (isAuthFailure(auth)) return auth;

  try {
    const { transactions } = await getTransactions();
    const url = new URL(request.url);
    const withStats = url.searchParams.get("stats") === "1";

    const ordered = sortByTanggalBeliAsc(transactions);

    return NextResponse.json({
      transactions: ordered,
      total: ordered.length,
      ...(withStats ? { stats: computeDashboardStats(transactions) } : {}),
    });
  } catch (error) {
    return errorResponse(error, "Gagal memuat data dari Google Sheets");
  }
}

export async function POST(request: Request) {
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
    const transaction = await createTransaction({
      th: parsed.data.th,
      deskripsi: parsed.data.deskripsi,
      tanggalBeli: parsed.data.tanggalBeli,
      tanggalJual: parsed.data.tanggalJual,
      hargaModal: parsed.data.hargaModal,
      hargaJual: parsed.data.hargaJual,
      estimasiHargaJual: parsed.data.estimasiHargaJual,
    });

    return NextResponse.json({ transaction }, { status: 201 });
  } catch (error) {
    return errorResponse(error, "Gagal menyimpan transaksi ke Google Sheets");
  }
}
