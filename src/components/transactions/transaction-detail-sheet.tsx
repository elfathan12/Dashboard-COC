"use client";

import { Pencil, Trash, TrendingUp, PackageOpen, Hash, CalendarDays } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatRupiah } from "@/lib/format";
import { daysBetween, formatTanggalID } from "@/lib/date";
import type { Transaction } from "@/lib/types";
import { cn } from "@/lib/utils";

interface TransactionDetailSheetProps {
  transaction: Transaction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (transaction: Transaction) => void;
  onSell?: (transaction: Transaction) => void;
  onDelete?: (transaction: Transaction) => void;
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-right text-sm font-medium">{value}</span>
    </div>
  );
}

export function TransactionDetailSheet({
  transaction,
  open,
  onOpenChange,
  onEdit,
  onSell,
  onDelete,
}: TransactionDetailSheetProps) {
  if (!transaction) return null;

  const sold = transaction.status === "sold";
  const profit = (transaction.hargaJual ?? 0) - (transaction.hargaModal ?? 0);
  const margin =
    transaction.hargaModal && transaction.hargaModal > 0
      ? profit / transaction.hargaModal
      : 0;
  const hasEstimasi = !sold && transaction.estimasiHargaJual !== null;
  const potensi = hasEstimasi
    ? (transaction.estimasiHargaJual ?? 0) - (transaction.hargaModal ?? 0)
    : 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 overflow-y-auto sm:max-w-md">
        <SheetHeader className="border-b">
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={cn(
                "border-transparent",
                sold ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400",
              )}
            >
              {sold ? "Terjual" : "Belum Laku"}
            </Badge>
            <Badge variant="outline" className="border-violet-500/20 bg-violet-500/10 text-violet-300">
              TH{transaction.th.replace(/\D/g, "")}
            </Badge>
          </div>
          <SheetTitle className="mt-1.5 text-base leading-snug">{transaction.deskripsi}</SheetTitle>
          <SheetDescription className="flex items-center gap-1.5 text-xs">
            <Hash className="size-3" />
            {transaction.id ?? "belum ada ID"} · Baris {transaction.row}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 p-4">
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">
                  {sold ? "Keuntungan" : hasEstimasi ? "Potensi Profit" : "Modal Tertahan"}
                </p>
                <p
                  className={cn(
                    "text-xl font-semibold tabular-nums",
                    sold
                      ? profit >= 0
                        ? "text-emerald-400"
                        : "text-rose-400"
                      : hasEstimasi
                        ? potensi >= 0
                          ? "text-violet-400"
                          : "text-rose-400"
                        : "text-amber-400",
                  )}
                >
                  {sold
                    ? formatRupiah(profit)
                    : hasEstimasi
                      ? formatRupiah(potensi)
                      : formatRupiah(transaction.hargaModal)}
                </p>
              </div>
              <div
                className={cn(
                  "flex size-11 items-center justify-center rounded-xl",
                  sold ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400",
                )}
              >
                {sold ? <TrendingUp className="size-5" /> : <PackageOpen className="size-5" />}
              </div>
            </div>
            {sold && margin !== 0 && (
              <p className="mt-1 text-xs text-muted-foreground">
                Margin {(margin * 100).toFixed(1)}%
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-white/5 px-4 py-1">
            <DetailRow label="No. Penjualan" value={transaction.noPenjualan || "-"} />
            <Separator className="opacity-50" />
            <DetailRow label="Harga Modal" value={formatRupiah(transaction.hargaModal)} />
            <Separator className="opacity-50" />
            <DetailRow
              label="Harga Jual"
              value={transaction.hargaJual ? formatRupiah(transaction.hargaJual) : "-"}
            />
            <Separator className="opacity-50" />
            <DetailRow
              label="Estimasi Harga Jual"
              value={transaction.estimasiHargaJual ? formatRupiah(transaction.estimasiHargaJual) : "-"}
            />
            <Separator className="opacity-50" />
            <DetailRow
              label="Keuntungan"
              value={
                sold ? (
                  <span className={profit >= 0 ? "text-emerald-400" : "text-rose-400"}>
                    {formatRupiah(profit)}
                  </span>
                ) : (
                  "-"
                )
              }
            />
          </div>

          <div className="rounded-2xl border border-white/5 px-4 py-1">
            <DetailRow
              label="Tanggal Beli"
              value={
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="size-3.5 text-muted-foreground" />
                  {formatTanggalID(transaction.tanggalBeli)}
                </span>
              }
            />
            <Separator className="opacity-50" />
            <DetailRow
              label="Tanggal Jual"
              value={
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="size-3.5 text-muted-foreground" />
                  {formatTanggalID(transaction.tanggalJual)}
                </span>
              }
            />
            <Separator className="opacity-50" />
            <DetailRow label="Bulan" value={transaction.bulan || "-"} />
            <Separator className="opacity-50" />
            <DetailRow
              label="Lama Kepemilikan"
              value={
                daysBetween(transaction.tanggalBeli, transaction.tanggalJual) !== null
                  ? `${daysBetween(transaction.tanggalBeli, transaction.tanggalJual)} hari`
                  : "-"
              }
            />
          </div>
        </div>

        <div className="mt-auto flex flex-col gap-2 border-t p-4">
          {!sold && onSell && (
            <Button className="h-10 w-full" onClick={() => onSell(transaction)}>
              <TrendingUp className="size-4" />
              Tandai Terjual
            </Button>
          )}
          <div className="flex gap-2">
            {onEdit && (
              <Button variant="outline" className="h-10 flex-1" onClick={() => onEdit(transaction)}>
                <Pencil className="size-4" />
                Edit
              </Button>
            )}
            {onDelete && (
              <Button
                variant="outline"
                className="h-10 flex-1 text-destructive hover:text-destructive"
                onClick={() => onDelete(transaction)}
              >
                <Trash className="size-4" />
                Hapus
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
