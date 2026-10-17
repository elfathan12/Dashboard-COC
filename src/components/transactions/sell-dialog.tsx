"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CalendarDays, CircleDollarSign } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CurrencyInput } from "@/components/currency-input";
import { apiFetch, ApiRequestError } from "@/lib/client-api";
import { formatRupiah } from "@/lib/format";
import { transactionKey } from "@/lib/transaction-utils";
import { sellInputSchema } from "@/lib/schemas";
import { todayJakarta } from "@/lib/date";
import type { Transaction } from "@/lib/types";
import { cn } from "@/lib/utils";

interface SellDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: Transaction | null;
  onSold?: (transaction: Transaction) => void;
}

export function SellDialog({ open, onOpenChange, transaction, onSold }: SellDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CircleDollarSign className="size-4 text-emerald-400" />
            Tandai Terjual
          </DialogTitle>
          <DialogDescription>
            {transaction
              ? `${transaction.th} · ${transaction.deskripsi}`
              : "Pilih transaksi yang ingin ditandai terjual."}
          </DialogDescription>
        </DialogHeader>

        {transaction && (
          <SellForm
            key={transactionKey(transaction)}
            transaction={transaction}
            onDone={() => onOpenChange(false)}
            onSold={onSold}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function SellForm({
  transaction,
  onDone,
  onSold,
}: {
  transaction: Transaction;
  onDone: () => void;
  onSold?: (transaction: Transaction) => void;
}) {
  const [tanggalJual, setTanggalJual] = useState(transaction.tanggalJual ?? todayJakarta());
  const [hargaJual, setHargaJual] = useState<number | null>(transaction.hargaJual ?? null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const modal = transaction.hargaModal ?? 0;
  const profit = (hargaJual ?? 0) - modal;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const parsed = sellInputSchema.safeParse({ tanggalJual, hargaJual });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Data tidak valid");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const result = await apiFetch<{ transaction: Transaction }>(
        `/api/transactions/${encodeURIComponent(transactionKey(transaction))}/sell`,
        { method: "POST", body: JSON.stringify(parsed.data) },
      );
      toast.success("Akun ditandai terjual", {
        description: `Keuntungan ${formatRupiah(profit)}`,
      });
      onSold?.(result.transaction);
      onDone();
    } catch (err) {
      const message =
        err instanceof ApiRequestError ? err.message : "Gagal menandai akun sebagai terjual";
      setError(message);
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3 text-sm">
        <div>
          <p className="text-xs text-muted-foreground">Harga Modal</p>
          <p className="font-medium tabular-nums">{formatRupiah(modal)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Estimasi Untung</p>
          <p
            className={cn(
              "font-medium tabular-nums",
              hargaJual === null ? "text-muted-foreground" : profit >= 0 ? "text-emerald-400" : "text-rose-400",
            )}
          >
            {hargaJual === null ? "-" : formatRupiah(profit)}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="sell-tanggal">Tanggal Jual</Label>
        <div className="relative">
          <CalendarDays className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="sell-tanggal"
            type="date"
            value={tanggalJual}
            onChange={(event) => setTanggalJual(event.target.value)}
            className="h-10 pl-9"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="sell-harga">Harga Jual *</Label>
        <CurrencyInput
          id="sell-harga"
          value={hargaJual}
          onChange={setHargaJual}
          ariaInvalid={Boolean(error)}
        />
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          className="h-10 flex-1"
          onClick={onDone}
          disabled={submitting}
        >
          Batal
        </Button>
        <Button type="submit" className="h-10 flex-1" disabled={submitting}>
          {submitting ? "Menyimpan..." : "Konfirmasi Terjual"}
        </Button>
      </div>
    </form>
  );
}
